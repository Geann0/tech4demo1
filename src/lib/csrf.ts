/**
 * 🔒 PROTEÇÃO CSRF (Cross-Site Request Forgery)
 * 
 * Previne ataques onde um site malicioso força o navegador do usuário
 * a fazer requisições não autorizadas para nosso site.
 * 
 * COMO FUNCIONA:
 * 1. Servidor gera token aleatório e salva no cookie
 * 2. Cliente envia token no header da requisição
 * 3. Servidor compara token do cookie com token do header
 * 4. Se não bater, rejeita requisição
 */

import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Gera token CSRF seguro
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Salva token CSRF no cookie
 */
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 horas
    path: "/",
  });

  return token;
}

/**
 * Valida token CSRF
 */
export async function validateCSRFToken(
  requestToken: string | null
): Promise<boolean> {
  if (!requestToken) {
    console.error("❌ CSRF: Token não fornecido");
    return false;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    console.error("❌ CSRF: Token não encontrado no cookie");
    return false;
  }

  // Comparação segura (evita timing attacks)
  const isValid = crypto.timingSafeEqual(
    Buffer.from(requestToken),
    Buffer.from(cookieToken)
  );

  if (!isValid) {
    console.error("❌ CSRF: Token inválido");
  }

  return isValid;
}

/**
 * Middleware para validar CSRF em Server Actions
 */
export async function validateCSRF(
  headers: Headers
): Promise<{ valid: boolean; error?: string }> {
  const token = headers.get(CSRF_HEADER_NAME);

  if (!token) {
    return {
      valid: false,
      error: "CSRF token não fornecido",
    };
  }

  const isValid = await validateCSRFToken(token);

  if (!isValid) {
    return {
      valid: false,
      error: "CSRF token inválido",
    };
  }

  return { valid: true };
}

/**
 * Hook para componentes client (retorna token para enviar no form)
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = await setCSRFToken();
  }

  return token;
}
