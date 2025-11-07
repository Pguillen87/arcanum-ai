import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  fullName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { signInWithGoogle, signInWithEmail, signUp, user } = useAuth();
  const navigate = useNavigate();

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const onLoginSubmit = async (data: LoginForm) => {
    const { error } = await signInWithEmail(data.email, data.password);
    if (!error) {
      navigate('/');
    }
  };

  const onSignupSubmit = async (data: SignupForm) => {
    const { error } = await signUp(data.email, data.password, data.fullName);
    if (!error) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Cosmic background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "var(--gradient-aurora)" }} />
        <div
          className="absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-cosmic-pulse"
          style={{ background: "var(--gradient-orb)" }}
        />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-cosmic-pulse"
          style={{ background: "var(--gradient-orb)", animationDelay: "1.5s" }}
        />
      </div>

      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-cosmic bg-clip-text text-transparent">
            Arcanum.AI
          </h1>
          <p className="text-muted-foreground">Portal de Transmutação Criativa</p>
        </div>

        <CosmicCard glow>
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLogin
                  ? "Entre para acessar seus portais místicos"
                  : "Comece sua jornada criativa"}
              </p>
            </div>

            {/* Google OAuth Button */}
            <CosmicButton
              mystical
              className="w-full"
              onClick={signInWithGoogle}
              type="button"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Continuar com Google
            </CosmicButton>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                ou
              </span>
            </div>

            {/* Email/Password Form */}
            {isLogin ? (
              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      {...registerLogin("email")}
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-sm text-destructive">{loginErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...registerLogin("password")}
                    />
                  </div>
                  {loginErrors.password && (
                    <p className="text-sm text-destructive">{loginErrors.password.message}</p>
                  )}
                </div>

                <CosmicButton
                  type="submit"
                  className="w-full"
                  disabled={isLoginSubmitting}
                >
                  {isLoginSubmitting ? "Entrando..." : "Entrar"}
                </CosmicButton>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      className="pl-10"
                      {...registerSignup("fullName")}
                    />
                  </div>
                  {signupErrors.fullName && (
                    <p className="text-sm text-destructive">{signupErrors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      {...registerSignup("email")}
                    />
                  </div>
                  {signupErrors.email && (
                    <p className="text-sm text-destructive">{signupErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...registerSignup("password")}
                    />
                  </div>
                  {signupErrors.password && (
                    <p className="text-sm text-destructive">{signupErrors.password.message}</p>
                  )}
                </div>

                <CosmicButton
                  type="submit"
                  className="w-full"
                  disabled={isSignupSubmitting}
                >
                  {isSignupSubmitting ? "Criando conta..." : "Criar conta"}
                </CosmicButton>
              </form>
            )}

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin
                  ? "Não tem uma conta? Cadastre-se"
                  : "Já tem uma conta? Faça login"}
              </button>
            </div>
          </div>
        </CosmicCard>
      </div>
    </div>
  );
};

export default Auth;
