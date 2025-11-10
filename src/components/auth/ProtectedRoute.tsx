import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setShowTimeout(true);
      }, 10000); // 10 segundos
      return () => clearTimeout(timeout);
    } else {
      setShowTimeout(false);
    }
  }, [loading]);

  // Bypass de autenticação para e2e de UI (apenas em ambiente de teste)
  if (import.meta.env.VITE_TEST_AUTH_BYPASS === 'true') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          {showTimeout && (
            <div className="mt-4">
              <p className="text-muted-foreground mb-2">
                Carregamento está demorando mais que o esperado...
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-primary hover:underline"
              >
                Recarregar página
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
