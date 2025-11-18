/**
 * 🧾 INTEGRAÇÃO NF-e (NOTA FISCAL ELETRÔNICA)
 *
 * Requisito legal no Brasil: Todo e-commerce precisa emitir NF-e para cada venda.
 *
 * Provedores suportados:
 * - NFe.io (https://nfe.io)
 * - Bling (https://www.bling.com.br)
 * - Tiny ERP (https://www.tiny.com.br)
 *
 * Fluxo:
 * 1. Pedido aprovado (webhook do Mercado Pago)
 * 2. Emitir NF-e via API
 * 3. Salvar chave NF-e no banco (campo nfe_key)
 * 4. Enviar PDF DANFE por email ao cliente
 */

interface NFEProduct {
  codigo: string;
  descricao: string;
  ncm: string; // Nomenclatura Comum do Mercosul
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface NFECustomer {
  nome: string;
  cpf?: string;
  cnpj?: string;
  email: string;
  telefone: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}

interface NFERequest {
  naturezaOperacao: "Venda de mercadoria"; // Tipo de operação
  produtos: NFEProduct[];
  cliente: NFECustomer;
  valorTotal: number;
  formaPagamento: "Cartão de Crédito" | "PIX" | "Boleto" | "Wallet";
}

interface NFEResponse {
  success: boolean;
  nfeKey?: string; // Chave de acesso (44 dígitos)
  danfeUrl?: string; // URL do PDF da DANFE
  protocolo?: string; // Número do protocolo de autorização
  xml?: string; // XML da NF-e
  error?: string;
}

/**
 * Calcula ICMS baseado no estado de destino
 */
function calculateICMS(
  valorProduto: number,
  estadoOrigem: string = "RO",
  estadoDestino: string
): { aliquota: number; valor: number } {
  // Tabela simplificada de ICMS interestadual (2024)
  const aliquotasICMS: Record<string, number> = {
    // Mesma UF
    SAME: 17.0, // ICMS interno RO = 17%
    // Norte
    AC: 12.0,
    AM: 12.0,
    AP: 12.0,
    PA: 12.0,
    RO: 17.0,
    RR: 12.0,
    TO: 12.0,
    // Nordeste, Sul, Sudeste, Centro-Oeste
    DEFAULT: 12.0, // Alíquota interestadual padrão
  };

  const aliquota =
    estadoOrigem === estadoDestino
      ? aliquotasICMS.SAME
      : aliquotasICMS[estadoDestino] || aliquotasICMS.DEFAULT;

  return {
    aliquota,
    valor: (valorProduto * aliquota) / 100,
  };
}

/**
 * Calcula PIS e COFINS (regime de lucro presumido)
 */
function calculatePISCOFINS(valorProduto: number): {
  pis: number;
  cofins: number;
} {
  return {
    pis: valorProduto * 0.0165, // 1.65%
    cofins: valorProduto * 0.076, // 7.6%
  };
}

/**
 * Valida CPF
 */
function validaCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === parseInt(cpf.charAt(10));
}

/**
 * Valida CNPJ
 */
function validaCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, "");
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cnpj.charAt(12))) return false;

  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return digit === parseInt(cnpj.charAt(13));
}

/**
 * Emitir NF-e usando NFe.io (IMPLEMENTAÇÃO REAL)
 */
export async function emitNFeIO(data: NFERequest): Promise<NFEResponse> {
  const apiKey = process.env.NFE_IO_API_KEY;
  const companyId = process.env.NFE_IO_COMPANY_ID;

  if (!apiKey || !companyId) {
    return {
      success: false,
      error: "NFe.io não configurado (faltam NFE_IO_API_KEY e NFE_IO_COMPANY_ID)",
    };
  }

  // Validar CPF/CNPJ
  const documento = data.cliente.cpf || data.cliente.cnpj;
  if (!documento) {
    return { success: false, error: "CPF ou CNPJ obrigatório" };
  }

  const isValidDoc =
    data.cliente.cpf
      ? validaCPF(data.cliente.cpf)
      : data.cliente.cnpj
        ? validaCNPJ(data.cliente.cnpj)
        : false;

  if (!isValidDoc) {
    return {
      success: false,
      error: `${data.cliente.cpf ? "CPF" : "CNPJ"} inválido`,
    };
  }

  try {
    // Calcular impostos para cada produto
    const itemsWithTaxes = data.produtos.map((produto) => {
      const icms = calculateICMS(
        produto.valorTotal,
        "RO",
        data.cliente.endereco.estado
      );
      const { pis, cofins } = calculatePISCOFINS(produto.valorTotal);

      return {
        description: produto.descricao,
        quantity: produto.quantidade,
        unitValue: produto.valorUnitario,
        totalValue: produto.valorTotal,
        ncm: produto.ncm,
        tax: {
          icms: {
            cst: "00", // Tributado integralmente
            aliquot: icms.aliquota,
            value: icms.valor,
          },
          pis: {
            cst: "01", // Operação tributável
            aliquot: 1.65,
            value: pis,
          },
          cofins: {
            cst: "01",
            aliquot: 7.6,
            value: cofins,
          },
        },
      };
    });

    const payload = {
      borrower: {
        name: data.cliente.nome,
        email: data.cliente.email,
        federalTaxNumber: documento.replace(/\D/g, ""),
        phone: data.cliente.telefone.replace(/\D/g, ""),
        address: {
          street: data.cliente.endereco.logradouro,
          number: data.cliente.endereco.numero,
          additionalInformation: data.cliente.endereco.complemento || "",
          district: data.cliente.endereco.bairro,
          city: {
            name: data.cliente.endereco.cidade,
          },
          state: data.cliente.endereco.estado,
          postalCode: data.cliente.endereco.cep.replace(/\D/g, ""),
        },
      },
      items: itemsWithTaxes,
      nature: data.naturezaOperacao,
      paymentMethod:
        data.formaPagamento === "Cartão de Crédito"
          ? "CREDIT_CARD"
          : data.formaPagamento === "PIX"
            ? "PIX"
            : data.formaPagamento === "Boleto"
              ? "BANK_SLIP"
              : "WALLET",
    };

    console.log("📤 Enviando NF-e para NFe.io:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      `https://api.nfe.io/v1/companies/${companyId}/serviceinvoices`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await response.text();
    console.log("📥 Resposta NFe.io (raw):", responseText);

    if (!response.ok) {
      let errorMessage = "Erro ao emitir NF-e";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error("❌ Erro NFe.io:", errorData);
      } catch {
        console.error("❌ Erro NFe.io (não-JSON):", responseText);
      }

      return { success: false, error: errorMessage };
    }

    const result = JSON.parse(responseText);
    console.log("✅ NF-e emitida com sucesso:", result);

    return {
      success: true,
      nfeKey: result.number || result.id,
      danfeUrl: result.pdfUrl || result.url,
      protocolo: result.verificationCode || result.protocol,
      xml: result.xml,
    };
  } catch (error) {
    console.error("❌ Exceção ao emitir NF-e:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Emitir NF-e usando Bling (IMPLEMENTAÇÃO REAL)
 */
export async function emitBling(data: NFERequest): Promise<NFEResponse> {
  const apiKey = process.env.BLING_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "Bling não configurado (falta BLING_API_KEY)",
    };
  }

  // Validar documento
  const documento = data.cliente.cpf || data.cliente.cnpj;
  if (!documento) {
    return { success: false, error: "CPF ou CNPJ obrigatório" };
  }

  const isValidDoc =
    data.cliente.cpf
      ? validaCPF(data.cliente.cpf)
      : data.cliente.cnpj
        ? validaCNPJ(data.cliente.cnpj)
        : false;

  if (!isValidDoc) {
    return {
      success: false,
      error: `${data.cliente.cpf ? "CPF" : "CNPJ"} inválido`,
    };
  }

  try {
    // Construir XML da nota fiscal para Bling
    const xmlItems = data.produtos
      .map((p) => {
        const icms = calculateICMS(
          p.valorTotal,
          "RO",
          data.cliente.endereco.estado
        );
        const { pis, cofins } = calculatePISCOFINS(p.valorTotal);

        return `
        <item>
          <codigo>${p.codigo}</codigo>
          <descricao>${p.descricao}</descricao>
          <un>UN</un>
          <quantidade>${p.quantidade}</quantidade>
          <valorunidade>${p.valorUnitario.toFixed(2)}</valorunidade>
          <tipo>P</tipo>
          <pesoBruto>${0.5}</pesoBruto>
          <pesoLiquido>${0.5}</pesoLiquido>
          <codigo_ncm>${p.ncm}</codigo_ncm>
          <origem>0</origem>
          <class_fiscal>${p.ncm}</class_fiscal>
          <cest>1704200</cest>
          <gtin></gtin>
          <impostos>
            <icms>
              <situacaotributaria>00</situacaotributaria>
              <aliquota>${icms.aliquota.toFixed(2)}</aliquota>
              <base_calculo>${p.valorTotal.toFixed(2)}</base_calculo>
            </icms>
            <ipi>
              <situacaotributaria>99</situacaotributaria>
            </ipi>
            <pis>
              <situacaotributaria>01</situacaotributaria>
              <aliquota>1.65</aliquota>
              <base_calculo>${p.valorTotal.toFixed(2)}</base_calculo>
            </pis>
            <cofins>
              <situacaotributaria>01</situacaotributaria>
              <aliquota>7.60</aliquota>
              <base_calculo>${p.valorTotal.toFixed(2)}</base_calculo>
            </cofins>
          </impostos>
        </item>`;
      })
      .join("");

    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
      <notafiscal>
        <tipo>E</tipo>
        <naturezaOperacao>${data.naturezaOperacao}</naturezaOperacao>
        <finalidade>1</finalidade>
        <cliente>
          <nome>${data.cliente.nome}</nome>
          <tipoPessoa>${data.cliente.cpf ? "F" : "J"}</tipoPessoa>
          <cpf_cnpj>${documento.replace(/\D/g, "")}</cpf_cnpj>
          <ie></ie>
          <rg></rg>
          <endereco>${data.cliente.endereco.logradouro}</endereco>
          <numero>${data.cliente.endereco.numero}</numero>
          <complemento>${data.cliente.endereco.complemento || ""}</complemento>
          <bairro>${data.cliente.endereco.bairro}</bairro>
          <cep>${data.cliente.endereco.cep.replace(/\D/g, "")}</cep>
          <cidade>${data.cliente.endereco.cidade}</cidade>
          <uf>${data.cliente.endereco.estado}</uf>
          <fone>${data.cliente.telefone.replace(/\D/g, "")}</fone>
          <email>${data.cliente.email}</email>
        </cliente>
        <transporte>
          <transportadora></transportadora>
          <tipo_frete>9</tipo_frete>
          <qtde_volumes>1</qtde_volumes>
        </transporte>
        <itens>${xmlItems}</itens>
        <parcelas>
          <parcela>
            <dias>0</dias>
            <data>${new Date().toISOString().split("T")[0]}</data>
            <vlr>${data.valorTotal.toFixed(2)}</vlr>
            <obs>${data.formaPagamento}</obs>
          </parcela>
        </parcelas>
      </notafiscal>`;

    console.log("📤 Enviando NF-e para Bling:", xmlPayload);

    const formData = new URLSearchParams();
    formData.append("apikey", apiKey);
    formData.append("xml", xmlPayload);

    const response = await fetch(
      "https://bling.com.br/Api/v2/notafiscal/json/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const result = await response.json();
    console.log("📥 Resposta Bling:", result);

    if (result.retorno?.erros) {
      const errorMsg =
        result.retorno.erros[0]?.erro?.msg || "Erro ao emitir NF-e";
      console.error("❌ Erro Bling:", errorMsg);
      return { success: false, error: errorMsg };
    }

    const nf = result.retorno?.notasfiscais?.[0]?.notafiscal;

    if (!nf) {
      return {
        success: false,
        error: "Resposta inválida do Bling (sem nota fiscal)",
      };
    }

    return {
      success: true,
      nfeKey: nf.chaveAcesso,
      danfeUrl: nf.linkDanfe,
      xml: nf.xml,
      protocolo: nf.numero,
    };
  } catch (error) {
    console.error("❌ Exceção ao emitir NF-e (Bling):", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Wrapper genérico - tenta emitir NF-e com o provedor configurado
 */
export async function emitNFe(data: NFERequest): Promise<NFEResponse> {
  const provider = process.env.NFE_PROVIDER || "nfe.io"; // ou 'bling', 'tiny'

  console.log(`📝 Emitindo NF-e via ${provider}...`);

  switch (provider) {
    case "nfe.io":
      return await emitNFeIO(data);
    case "bling":
      return await emitBling(data);
    default:
      return {
        success: false,
        error: `Provedor de NF-e não suportado: ${provider}`,
      };
  }
}

/**
 * Consultar status de uma NF-e emitida
 */
export async function consultNFeStatus(nfeKey: string): Promise<{
  status: "autorizada" | "cancelada" | "pendente" | "rejeitada";
  message?: string;
}> {
  const provider = process.env.NFE_PROVIDER || "nfe.io";

  if (provider === "nfe.io") {
    const apiKey = process.env.NFE_IO_API_KEY;
    const companyId = process.env.NFE_IO_COMPANY_ID;

    try {
      const response = await fetch(
        `https://api.nfe.io/v1/companies/${companyId}/serviceinvoices/${nfeKey}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const data = await response.json();
      return {
        status: data.status === "Issued" ? "autorizada" : "pendente",
        message: data.statusMessage,
      };
    } catch (error) {
      return {
        status: "pendente",
        message: "Erro ao consultar status",
      };
    }
  }

  return {
    status: "pendente",
    message: "Consulta não implementada para este provedor",
  };
}
