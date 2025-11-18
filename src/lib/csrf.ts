import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_TOKEN_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Gera um token CSRF único e seguro
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Define o token CSRF no cookie
 */
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 horas
    path: "/",
  });

  return token;
}

/**
 * Obtém o token CSRF do cookie
 */
export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_NAME)?.value;
}

/**
 * Valida o token CSRF enviado no request
 */
export async function validateCSRFToken(
  requestToken: string | null | undefined
): Promise<boolean> {
  if (!requestToken) {
    return false;
  }

  const cookieToken = await getCSRFToken();

  if (!cookieToken) {
    return false;
  }

  // Comparação segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(requestToken)
  );
}

/**
 * Middleware para validar CSRF em requisições POST/PUT/DELETE
 */
export async function requireCSRF(request: Request): Promise<void> {
  const method = request.method;

  // Apenas valida em métodos de modificação
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return;
  }

  const token = request.headers.get(CSRF_HEADER_NAME);
  const isValid = await validateCSRFToken(token);

  if (!isValid) {
    throw new Error("CSRF token inválido ou ausente");
  }
}

/**
 * Hook para obter o token CSRF para usar em formulários
 */
export async function getCSRFTokenForForm(): Promise<string> {
  let token = await getCSRFToken();

  if (!token) {
    token = await setCSRFToken();
  }

  return token;
}
