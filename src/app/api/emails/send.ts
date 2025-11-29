import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface EmailRequest {
  type: "confirmation" | "order" | "tracking" | "shipment" | "partner_sale";
  email: string;
  data: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { type, email, data } = body;

    if (!type || !email) {
      return NextResponse.json(
        { error: "Missing type or email" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "confirmation":
        result = await sendConfirmationEmail(email, data);
        break;
      case "order":
        result = await sendOrderEmail(email, data);
        break;
      case "tracking":
        result = await sendTrackingEmail(email, data);
        break;
      case "shipment":
        result = await sendShipmentEmail(email, data);
        break;
      case "partner_sale":
        result = await sendPartnerSaleEmail(email, data);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown email type" },
          { status: 400 }
        );
    }

    // Log email no banco
    try {
      await supabase
        .from("email_logs")
        .insert({
          type,
          recipient: email,
          status: "sent",
          message_id: (result as any)?.id || (result as any)?.email_id,
        });
    } catch (err) {
      console.error("Email log error:", err);
    }

    return NextResponse.json({
      success: true,
      message_id: (result as any)?.id || (result as any)?.email_id,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

async function sendConfirmationEmail(email: string, data: any) {
  const { verificationToken, userName } = data;

  return await resend.emails.send({
    from: "noreply@tech4loop.com",
    to: email,
    subject: "Confirme seu email - Tech4Loop",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bem-vindo ao Tech4Loop! 🎉</h1>
        
        <p>Olá ${userName || "usuário"},</p>
        
        <p>Obrigado por se cadastrar na Tech4Loop! Para começar a fazer compras, confirme seu email clicando no botão abaixo:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirmar Email
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px;">
          Ou acesse o link: ${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          Tech4Loop - Plataforma de E-commerce<br>
          Este email foi enviado por segurança. Se você não se cadastrou, ignore este email.
        </p>
      </div>
    `,
  });
}

async function sendOrderEmail(email: string, data: any) {
  const { orderId, userName, items, totalAmount, orderDate } = data;

  const itemsHtml = items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(item.price / 100).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return await resend.emails.send({
    from: "pedidos@tech4loop.com",
    to: email,
    subject: `Pedido #${orderId} confirmado! - Tech4Loop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Pedido Confirmado ✓</h1>
        
        <p>Olá ${userName},</p>
        
        <p>Seu pedido foi confirmado com sucesso!</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>ID do Pedido:</strong> #${orderId}</p>
          <p><strong>Data:</strong> ${new Date(orderDate).toLocaleDateString("pt-BR")}</p>
          <p><strong>Total:</strong> R$ ${(totalAmount / 100).toFixed(2)}</p>
        </div>
        
        <h3>Itens do Pedido:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="padding: 10px; text-align: left;">Produto</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Preço</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/pedidos/${orderId}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Acompanhar Pedido
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          Você receberá um email de rastreamento assim que o pedido for despachado.
        </p>
      </div>
    `,
  });
}

async function sendTrackingEmail(email: string, data: any) {
  const { orderId, trackingNumber, carrier, estimatedDelivery } = data;

  return await resend.emails.send({
    from: "rastreamento@tech4loop.com",
    to: email,
    subject: `Seu pedido foi despachado! - Tech4Loop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Pedido em Trânsito 📦</h1>
        
        <p>Seu pedido saiu da nossa base e está a caminho!</p>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Código de Rastreamento:</strong> ${trackingNumber}</p>
          <p><strong>Transportadora:</strong> ${carrier}</p>
          <p><strong>Entrega Estimada:</strong> ${estimatedDelivery}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/rastreamento?code=${trackingNumber}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Rastrear Pedido
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px;">
          Você também pode rastrear através do site da ${carrier} com o código: <strong>${trackingNumber}</strong>
        </p>
      </div>
    `,
  });
}

async function sendShipmentEmail(email: string, data: any) {
  const { orderId, trackingNumber, estimatedDelivery } = data;

  return await resend.emails.send({
    from: "entrega@tech4loop.com",
    to: email,
    subject: `Seu pedido foi entregue! - Tech4Loop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">Pedido Entregue! 🎉</h1>
        
        <p>Seu pedido chegou com segurança! Esperamos que você aproveite sua compra.</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Pedido #:</strong> ${orderId}</p>
          <p><strong>Data de Entrega:</strong> ${estimatedDelivery}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/avaliacoes/${orderId}" 
             style="background-color: #ffc107; color: black; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Avaliar Compra
          </a>
        </div>
      </div>
    `,
  });
}

async function sendPartnerSaleEmail(email: string, data: any) {
  const { partnerName, saleAmount, commission, orderId } = data;

  return await resend.emails.send({
    from: "parceiros@tech4loop.com",
    to: email,
    subject: `Nova venda registrada - Tech4Loop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Nova Venda! 💰</h1>
        
        <p>Olá ${partnerName},</p>
        
        <p>Uma venda dos seus produtos foi realizada!</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Pedido #:</strong> ${orderId}</p>
          <p><strong>Valor:</strong> R$ ${(saleAmount / 100).toFixed(2)}</p>
          <p><strong>Sua Comissão:</strong> R$ ${(commission / 100).toFixed(2)}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard-parceiro" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Ver Dashboard
          </a>
        </div>
      </div>
    `,
  });
}
