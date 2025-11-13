import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Observability } from '@/lib/observability';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logging detalhado
    console.error('[ErrorBoundary] Erro capturado:', {
      error,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorInfo,
    });
    
    // Rastrear erro na observabilidade
    try {
      Observability.trackError(error);
    } catch (err) {
      console.error('[ErrorBoundary] Erro ao rastrear erro:', err);
    }

    // Salvar errorInfo no state para exibição
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-cosmic p-6 rounded-lg border border-destructive/30">
            <h2 className="text-2xl font-bold mb-4 text-destructive">
              Algo deu errado
            </h2>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro ao carregar a aplicação. Por favor, tente novamente.
            </p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Detalhes do erro
                </summary>
                <div className="mt-2 space-y-2">
                  <pre className="text-xs bg-destructive/10 p-2 rounded overflow-auto max-h-40">
                    {String(this.state.error?.message || this.state.error?.toString() || 'Erro desconhecido')}
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        Stack do componente
                      </summary>
                      <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-40 mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

