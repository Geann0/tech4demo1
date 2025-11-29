/**
 * Gera um código único para o pedido
 * Formato: ORD-YYYYMM-##### (ex: ORD-202511-00001)
 */
export function generateOrderCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year_month = `${year}${month}`;
  
  // Gera um número aleatório de 5 dígitos para garantir unicidade
  const randomNum = Math.floor(Math.random() * 100000);
  const paddedNum = String(randomNum).padStart(5, '0');
  
  return `ORD-${year_month}-${paddedNum}`;
}

/**
 * Gera um código de rastreamento único
 * Formato: TRACKING-#########
 */
export function generateTrackingCode(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  const code = String(timestamp + random).padStart(12, '0');
  return `TRACK-${code}`;
}
