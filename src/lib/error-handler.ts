import { NextResponse, NextRequest } from "next/server";
import { logError, logInfo } from "./logger";

/**
 * Interface para resposta padronizada de erros
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

/**
 * Interface para resposta de sucesso
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Tipos de erro da aplicação
 */
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
}

/**
 * Mapeamento de tipos de erro para status HTTP
 */
const errorStatusMap: Record<ErrorType, number> = {
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.BAD_REQUEST]: 400,
  [ErrorType.UNAUTHORIZED]: 401,
  [ErrorType.FORBIDDEN]: 403,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.CONFLICT]: 409,
  [ErrorType.RATE_LIMIT]: 429,
  [ErrorType.INTERNAL_ERROR]: 500,
};

/**
 * Classe customizada para erros da aplicação
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public code: ErrorType = ErrorType.INTERNAL_ERROR,
    public statusCode: number = errorStatusMap[code],
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Cria uma resposta padronizada de sucesso
 */
export function successResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Cria uma resposta padronizada de erro
 */
export function errorResponse(
  message: string,
  code: ErrorType = ErrorType.INTERNAL_ERROR,
  details?: Record<string, any>
): ErrorResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Middleware para tratamento de erros em API routes
 * Uso: await handleAsync(req, res, async () => { ... })
 */
export async function handleAsync(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse<any>>
): Promise<NextResponse<any>> {
  try {
    const response = await handler(req);
    return response;
  } catch (error) {
    logError(
      "API Error",
      error instanceof Error ? error : new Error(String(error)),
      {
        method: req.method,
        url: req.url,
      }
    );

    if (error instanceof AppError) {
      return NextResponse.json(
        errorResponse(error.message, error.code, error.details),
        { status: error.statusCode }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        errorResponse("Invalid JSON", ErrorType.BAD_REQUEST),
        { status: 400 }
      );
    }

    // Erro genérico
    return NextResponse.json(
      errorResponse("An unexpected error occurred", ErrorType.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * Função para validar requisição
 */
export function validateRequest(
  data: unknown,
  schema: (data: any) => boolean
): void {
  if (!schema(data)) {
    throw new AppError("Invalid request data", ErrorType.VALIDATION_ERROR, 400);
  }
}
