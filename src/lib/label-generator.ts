// ================================================================
// GERADOR DE ETIQUETAS E DOCUMENTOS DE ENVIO
// ================================================================
// Gera PDFs para: Etiqueta de Envio, Romaneio, DANFE

import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import QRCode from "qrcode";

// ================================================================
// TIPOS
// ================================================================

export interface ShippingLabelData {
  orderId: string;
  orderCode: string;
  trackingCode: string;

  // Remetente (Vendedor)
  senderName: string;
  senderAddress: string;
  senderCity: string;
  senderState: string;
  senderZip: string;
  senderPhone?: string;

  // Destinatário (Cliente)
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientZip: string;
  recipientPhone?: string;

  // Detalhes do Pacote
  weight?: number; // kg
  dimensions?: {
    length: number; // cm
    width: number;
    height: number;
  };

  // Transportadora
  carrierName?: string;
  carrierService?: string;

  // Data de postagem
  shippingDate: Date;
}

export interface PackingSlipData {
  orderId: string;
  orderCode: string;
  orderDate: Date;

  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientZip: string;

  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    price: number;
  }>;

  totalAmount: number;
  paymentMethod: string;
}

// ================================================================
// ETIQUETA DE ENVIO (10x15cm - Padrão Correios)
// ================================================================

/**
 * Gera etiqueta de envio no formato 10x15cm
 * Contém: código de barras, QR code, endereços, tracking
 */
export async function generateShippingLabel(
  data: ShippingLabelData
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Tamanho da etiqueta: 10x15cm = 283x425 pontos (72 DPI)
      const doc = new PDFDocument({
        size: [283, 425],
        margin: 10,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ============== CABEÇALHO ==============
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("ETIQUETA DE ENVIO", { align: "center" });

      doc
        .fontSize(8)
        .font("Helvetica")
        .text(data.carrierName || "Correios", { align: "center" });

      doc.moveDown(0.5);

      // ============== CÓDIGO DE BARRAS (Tracking) ==============
      try {
        const barcodeBuffer = await bwipjs.toBuffer({
          bcid: "code128",
          text: data.trackingCode,
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: "center",
        });

        doc.image(barcodeBuffer, {
          fit: [250, 50],
          align: "center",
        });
      } catch (err) {
        console.error("Erro ao gerar código de barras:", err);
      }

      doc.moveDown(0.5);

      // ============== QR CODE (Rastreamento Online) ==============
      const trackingUrl = `https://tech4loop.com/rastreamento/${data.orderId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
        width: 80,
        margin: 1,
      });

      const qrBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");
      doc.image(qrBuffer, doc.x + 90, doc.y, { width: 80 });

      doc.moveDown(6);

      // ============== REMETENTE ==============
      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .text("REMETENTE:", { underline: true });

      doc.font("Helvetica").fontSize(7).text(data.senderName, { width: 260 });

      doc.text(
        `${data.senderAddress}, ${data.senderCity} - ${data.senderState}`,
        { width: 260 }
      );

      doc.text(`CEP: ${data.senderZip}`, { width: 260 });

      if (data.senderPhone) {
        doc.text(`Tel: ${data.senderPhone}`, { width: 260 });
      }

      doc.moveDown(0.5);

      // ============== DESTINATÁRIO ==============
      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .text("DESTINATÁRIO:", { underline: true });

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(data.recipientName, { width: 260 });

      doc
        .font("Helvetica")
        .fontSize(7)
        .text(
          `${data.recipientAddress}, ${data.recipientCity} - ${data.recipientState}`,
          { width: 260 }
        );

      doc.text(`CEP: ${data.recipientZip}`, { width: 260 });

      if (data.recipientPhone) {
        doc.text(`Tel: ${data.recipientPhone}`, { width: 260 });
      }

      doc.moveDown(0.5);

      // ============== DETALHES DO PACOTE ==============
      if (data.weight || data.dimensions) {
        doc
          .fontSize(6)
          .font("Helvetica-Bold")
          .text("DETALHES DO PACOTE:", { underline: true });

        doc.font("Helvetica");

        if (data.weight) {
          doc.text(`Peso: ${data.weight.toFixed(2)} kg`);
        }

        if (data.dimensions) {
          doc.text(
            `Dimensões: ${data.dimensions.length}x${data.dimensions.width}x${data.dimensions.height} cm`
          );
        }
      }

      // ============== RODAPÉ ==============
      doc
        .fontSize(6)
        .text(
          `Pedido: ${data.orderCode} | Data: ${data.shippingDate.toLocaleDateString("pt-BR")}`,
          { align: "center" }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ================================================================
// ROMANEIO (Lista de Produtos para Conferência)
// ================================================================

/**
 * Gera romaneio (packing slip) para o vendedor conferir itens
 * Formato A4
 */
export async function generatePackingSlip(
  data: PackingSlipData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ============== CABEÇALHO ==============
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("ROMANEIO DE COLETA", { align: "center" });

      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`Pedido: ${data.orderCode}`, { align: "center" });

      doc.text(
        `Data: ${data.orderDate.toLocaleDateString("pt-BR")} ${data.orderDate.toLocaleTimeString("pt-BR")}`,
        { align: "center" }
      );

      doc.moveDown(2);

      // ============== INFORMAÇÕES DO DESTINATÁRIO ==============
      doc.fontSize(14).font("Helvetica-Bold").text("DESTINATÁRIO:");

      doc.fontSize(11).font("Helvetica").text(data.recipientName);

      doc.text(`${data.recipientAddress}`);
      doc.text(`${data.recipientCity} - ${data.recipientState}`);
      doc.text(`CEP: ${data.recipientZip}`);

      doc.moveDown(2);

      // ============== LISTA DE PRODUTOS ==============
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("PRODUTOS PARA CONFERÊNCIA:");

      doc.moveDown(1);

      // Cabeçalho da tabela
      const tableTop = doc.y;
      const colWidths = {
        item: 250,
        sku: 80,
        qty: 50,
        price: 80,
      };

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Item", 50, tableTop, { width: colWidths.item })
        .text("SKU", 300, tableTop, { width: colWidths.sku })
        .text("Qtd", 380, tableTop, { width: colWidths.qty })
        .text("Preço", 430, tableTop, {
          width: colWidths.price,
          align: "right",
        });

      // Linha separadora
      doc
        .moveTo(50, doc.y + 5)
        .lineTo(550, doc.y + 5)
        .stroke();

      doc.moveDown(0.5);

      // Linhas da tabela
      doc.font("Helvetica").fontSize(10);

      data.items.forEach((item, index) => {
        const y = doc.y;

        doc.text(item.name, 50, y, { width: colWidths.item });
        doc.text(item.sku || "-", 300, y, { width: colWidths.sku });
        doc.text(item.quantity.toString(), 380, y, { width: colWidths.qty });
        doc.text(`R$ ${item.price.toFixed(2)}`, 430, y, {
          width: colWidths.price,
          align: "right",
        });

        doc.moveDown(1);

        // Linha separadora entre itens
        if (index < data.items.length - 1) {
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        }
      });

      // ============== TOTAL ==============
      doc.moveDown(1);

      doc.fontSize(12).font("Helvetica-Bold").text("TOTAL:", 380, doc.y);

      doc.text(`R$ ${data.totalAmount.toFixed(2)}`, 430, doc.y - 15, {
        align: "right",
      });

      doc.moveDown(2);

      // ============== INSTRUÇÕES ==============
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("INSTRUÇÕES:", { underline: true });

      doc.fontSize(9).text("1. Confira todos os itens antes de embalar");
      doc.text("2. Embale com cuidado para evitar danos");
      doc.text("3. Cole a etiqueta de envio na parte externa");
      doc.text("4. Inclua a Nota Fiscal (DANFE) dentro do pacote");
      doc.text("5. Poste no prazo de 3 dias úteis");

      doc.moveDown(2);

      // ============== ASSINATURA ==============
      doc.fontSize(10).text("_________________________________________");
      doc.text("Assinatura do Responsável");

      doc.moveDown(1);

      doc
        .fontSize(8)
        .fillColor("gray")
        .text(
          `Forma de Pagamento: ${data.paymentMethod} | Gerado em: ${new Date().toLocaleString("pt-BR")}`,
          { align: "center" }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ================================================================
// ETIQUETA PEQUENA PARA DENTRO DO PACOTE (Opcional)
// ================================================================

/**
 * Gera etiqueta pequena para colar dentro do pacote
 * Tamanho: 5x7cm
 */
export async function generateInsideLabel(
  orderCode: string,
  recipientName: string,
  trackingUrl: string
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Tamanho: 5x7cm = 142x198 pontos
      const doc = new PDFDocument({
        size: [142, 198],
        margin: 8,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Logo/Título
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Tech4Loop", { align: "center" });

      doc
        .fontSize(8)
        .font("Helvetica")
        .text("Obrigado pela compra!", { align: "center" });

      doc.moveDown(0.5);

      // QR Code para rastreamento
      const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
        width: 100,
        margin: 1,
      });

      const qrBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");
      doc.image(qrBuffer, 21, doc.y, { width: 100 });

      doc.moveDown(7);

      // Informações
      doc.fontSize(7).text(`Pedido: ${orderCode}`, { align: "center" });

      doc
        .fontSize(6)
        .text(`Cliente: ${recipientName}`, { align: "center", width: 126 });

      doc.moveDown(0.5);

      doc
        .fontSize(6)
        .fillColor("gray")
        .text("Rastreie seu pedido:", { align: "center" });

      doc.fontSize(5).text("tech4loop.com/rastreamento", { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ================================================================
// FUNÇÃO HELPER: GERAR TODOS OS DOCUMENTOS
// ================================================================

export interface OrderDocumentsData {
  order: ShippingLabelData & PackingSlipData;
  includeInsideLabel?: boolean;
}

/**
 * Gera todos os documentos necessários para envio
 */
export async function generateAllOrderDocuments(
  data: OrderDocumentsData
): Promise<{
  shippingLabel: Buffer;
  packingSlip: Buffer;
  insideLabel?: Buffer;
}> {
  const [shippingLabel, packingSlip, insideLabel] = await Promise.all([
    generateShippingLabel(data.order),
    generatePackingSlip(data.order),
    data.includeInsideLabel
      ? generateInsideLabel(
          data.order.orderCode,
          data.order.recipientName,
          `https://tech4loop.com/rastreamento/${data.order.orderId}`
        )
      : Promise.resolve(undefined),
  ]);

  return {
    shippingLabel,
    packingSlip,
    insideLabel,
  };
}
