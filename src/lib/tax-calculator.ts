/**
 * 💰 CALCULADORA DE IMPOSTOS BRASILEIROS
 * 
 * Calcula ICMS, PIS, COFINS conforme legislação brasileira
 * 
 * REFERÊNCIAS LEGAIS:
 * - ICMS: Varia por estado (18% padrão, mas pode ser 7%, 12%, etc)
 * - PIS: 1.65% (regime não-cumulativo)
 * - COFINS: 7.6% (regime não-cumulativo)
 * - IPI: Varia por NCM
 */

// Tabela de ICMS por estado (alíquota interna)
const ICMS_POR_ESTADO: Record<string, number> = {
  AC: 17, // Acre
  AL: 18, // Alagoas
  AP: 18, // Amapá
  AM: 18, // Amazonas
  BA: 18, // Bahia
  CE: 18, // Ceará
  DF: 18, // Distrito Federal
  ES: 17, // Espírito Santo
  GO: 17, // Goiás
  MA: 18, // Maranhão
  MT: 17, // Mato Grosso
  MS: 17, // Mato Grosso do Sul
  MG: 18, // Minas Gerais
  PA: 17, // Pará
  PB: 18, // Paraíba
  PR: 18, // Paraná
  PE: 18, // Pernambuco
  PI: 18, // Piauí
  RJ: 20, // Rio de Janeiro (maior alíquota)
  RN: 18, // Rio Grande do Norte
  RS: 18, // Rio Grande do Sul
  RO: 17.5, // Rondônia
  RR: 17, // Roraima
  SC: 17, // Santa Catarina
  SP: 18, // São Paulo
  SE: 18, // Sergipe
  TO: 18, // Tocantins
};

// Regime tributário (simplificado)
const PIS_ALIQUOTA = 1.65; // %
const COFINS_ALIQUOTA = 7.6; // %

export interface TaxCalculation {
  valorBase: number; // Valor do produto
  icms: {
    aliquota: number; // % (ex: 18)
    valor: number; // R$ calculado
  };
  pis: {
    aliquota: number;
    valor: number;
  };
  cofins: {
    aliquota: number;
    valor: number;
  };
  totalImpostos: number; // Soma de todos
  valorComImpostos: number; // Valor final
}

/**
 * Calcula impostos sobre um produto
 */
export function calculateTaxes(
  valorBase: number,
  estadoDestino: string
): TaxCalculation {
  // Normaliza estado (uppercase)
  const uf = estadoDestino.toUpperCase();

  // Busca alíquota de ICMS do estado
  const icmsAliquota = ICMS_POR_ESTADO[uf] || 18; // Padrão 18%

  // Calcula cada imposto
  const icmsValor = (valorBase * icmsAliquota) / 100;
  const pisValor = (valorBase * PIS_ALIQUOTA) / 100;
  const cofinsValor = (valorBase * COFINS_ALIQUOTA) / 100;

  const totalImpostos = icmsValor + pisValor + cofinsValor;
  const valorComImpostos = valorBase + totalImpostos;

  return {
    valorBase,
    icms: {
      aliquota: icmsAliquota,
      valor: icmsValor,
    },
    pis: {
      aliquota: PIS_ALIQUOTA,
      valor: pisValor,
    },
    cofins: {
      aliquota: COFINS_ALIQUOTA,
      valor: cofinsValor,
    },
    totalImpostos,
    valorComImpostos,
  };
}

/**
 * Valida CPF (algoritmo oficial)
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, "");

  // Verifica tamanho
  if (cleanCPF.length !== 11) return false;

  // CPFs conhecidos como inválidos
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;

  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

/**
 * Valida CNPJ (algoritmo oficial)
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  // Verifica tamanho
  if (cleanCNPJ.length !== 14) return false;

  // CNPJs conhecidos como inválidos
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Valida primeiro dígito verificador
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Valida segundo dígito verificador
  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Formata CPF: 123.456.789-00
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata CNPJ: 12.345.678/0001-00
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, "");
  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
}
