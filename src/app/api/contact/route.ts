import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getIdentifier,
  STRICT_RATE_LIMIT,
} from "@/lib/rateLimit";

// DEMO VERSION - Email sending disabled
const supportEmail = "suporte.tech4loop@gmail.com";

export async function POST(req: NextRequest) {
  // Rate limiting
  const identifier = getIdentifier(req);
  const rateLimit = checkRateLimit(identifier, STRICT_RATE_LIMIT);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em alguns minutos." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
          ),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { name, email, phone, message, subject } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando." },
        { status: 400 }
      );
    }

    // Demo mode: Log contact form data instead of sending email
    console.log("Demo: Contact form submission", {
      name,
      email,
      phone,
      subject: subject || "Novo Contato do Site Tech4Loop",
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Demo mode: Contact form submission logged (email not sent)",
    });
  } catch (error) {
    console.error("Erro ao processar contato:", error);
    return NextResponse.json(
      { error: "Erro ao enviar a mensagem." },
      { status: 500 }
    );
  }
}
