"use client";

import React, { ReactNode } from "react";
import { logError } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para capturar erros em componentes React
 */
export class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Logar o erro para análise
    logError("ErrorBoundary caught an error", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-600 mb-4">
                Oops! Algo deu errado
              </h1>
              <p className="text-gray-600 mb-6">
                Desculpe, ocorreu um erro inesperado. Por favor, tente
                recarregar a página.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Recarregar Página
              </button>
              {process.env.NODE_ENV === "development" && (
                <details className="mt-6 text-left bg-white p-4 rounded border border-red-200">
                  <summary className="cursor-pointer font-mono text-sm text-red-600">
                    Detalhes do Erro (Dev)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-48">
                    {this.state.error?.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
