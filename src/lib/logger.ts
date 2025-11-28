import winston from "winston";
import { isServer } from "./utils";

// Determinar o nível de log baseado no ambiente
const logLevel =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === "development" ? "debug" : "info");

// Configurar transportes do Winston
const transports: winston.transport[] = [
  // Console transport - sempre ativo
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, message, ...rest }) => {
        const meta = Object.keys(rest).length
          ? JSON.stringify(rest, null, 2)
          : "";
        return `${timestamp} [${level}]: ${message} ${meta}`;
      })
    ),
  }),
];

// Adicionar arquivo de logs no servidor apenas
if (isServer() && process.env.NODE_ENV === "production") {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Criar instância do logger
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.json(),
  transports,
});

/**
 * Logga informações gerais
 */
export function logInfo(message: string, meta?: Record<string, any>) {
  logger.info(message, meta);
}

/**
 * Logga erros
 */
export function logError(
  message: string,
  error?: Error | string,
  meta?: Record<string, any>
) {
  const errorMeta = {
    ...meta,
    ...(error instanceof Error && {
      errorMessage: error.message,
      errorStack: error.stack,
    }),
  };
  logger.error(message, errorMeta);
}

/**
 * Logga avisos
 */
export function logWarn(message: string, meta?: Record<string, any>) {
  logger.warn(message, meta);
}

/**
 * Logga informações de debug
 */
export function logDebug(message: string, meta?: Record<string, any>) {
  logger.debug(message, meta);
}

/**
 * Middleware de logging para API routes (Next.js)
 */
export function createApiLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const originalSend = res.send;

    res.send = function (data: any) {
      const duration = Date.now() - start;
      logInfo("API Request", {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      });
      originalSend.call(this, data);
    };

    next();
  };
}

export default logger;
