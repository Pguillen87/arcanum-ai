import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    "Senha deve conter maiúscula, minúscula e número",
  );

const loginSchema = z.object({
  login: z.string().min(1, "Email ou nome de usuário obrigatório"),
  password: passwordSchema,
  rememberMe: z.boolean().optional(),
});

const signupSchema = z
  .object({
    fullName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signInWithGoogle, signUp, user } = useAuth();
  const navigate = useNavigate();
  const loginInputRef = useRef<HTMLInputElement | null>(null);
  const signupNameRef = useRef<HTMLInputElement | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  // Focus inicial acessível
  useEffect(() => {
    if (isLogin) {
      loginInputRef.current?.focus();
    } else {
      signupNameRef.current?.focus();
    }
  }, [isLogin]);

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const onLoginSubmit = async (data: LoginForm) => {
    setAuthError(null);
    // Se "Lembrar senha" estiver marcado, persiste sessão (padrão: true)
    // Se não estiver marcado, usa sessionStorage (limpa ao fechar navegador)
    const { error } = await signIn(data.login, data.password, rememberMe);
    if (!error) {
      navigate('/');
    } else {
      setAuthError(error?.message || "Falha ao entrar");
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setAuthError(error?.message || "Falha ao conectar com Google");
      setIsGoogleLoading(false);
    }
    // Se sucesso, o OAuth redireciona, então não resetamos o loading
  };

  const onSignupSubmit = async (data: SignupForm) => {
    setAuthError(null);
    const { error } = await signUp(data.email, data.password, data.fullName);
    if (!error) {
      navigate('/');
    } else {
      setAuthError(error?.message || "Falha ao criar conta");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Cosmic background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 gradient-aurora" />
        <div
          className="absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-cosmic-pulse gradient-orb"
        />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-cosmic-pulse animate-delay-1-5s gradient-orb"
        />
      </div>

      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded-lg shadow-lg glass-cosmic">
            <WizardHatIcon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            <h2 className="text-lg md:text-xl font-semibold gradient-cosmic bg-clip-text text-transparent">
              Arcanum AI – Laboratório de Transmutação de Conteúdo
            </h2>
          </div>
        </div>

        <CosmicCard glow>
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLogin
                  ? "Abra o Portal para acessar seus portais místicos"
                  : "Comece sua jornada criativa"}
              </p>
            </div>

            {/* Abas para Login/Cadastro */}
            <div className="flex justify-center">
              <Tabs
                value={isLogin ? "login" : "signup"}
                onValueChange={(val) => setIsLogin(val === "login")}
              >
                <TabsList>
                  <TabsTrigger value="login">Abrir o Portal</TabsTrigger>
                  <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Separador visual */}
            <div className="relative">
              <Separator />
            </div>

            {/* Email/Password Form */}
            {isLogin ? (
              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4" aria-label="Formulário de login">
                <div className="space-y-2">
                  <Label htmlFor="login">Email ou Nome de Usuário</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login"
                      type="text"
                      placeholder="seu@email.com ou seu_usuario"
                      className="pl-10"
                      autoComplete="username"
                      aria-invalid={!!loginErrors.login}
                      aria-describedby={loginErrors.login ? "login-input-error" : undefined}
                      ref={loginInputRef}
                      {...registerLogin("login")}
                    />
                  </div>
                  {loginErrors.login && (
                    <p id="login-input-error" className="text-sm text-destructive" aria-live="polite">{loginErrors.login.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Você pode usar seu email ou nome de usuário para fazer login
                  </p>
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
                      autoComplete="current-password"
                      aria-invalid={!!loginErrors.password}
                      aria-describedby={loginErrors.password ? "login-password-error" : undefined}
                      {...registerLogin("password")}
                    />
                  </div>
                  {loginErrors.password && (
                    <p id="login-password-error" className="text-sm text-destructive" aria-live="polite">{loginErrors.password.message}</p>
                  )}
                </div>

                {/* Checkbox Lembrar Senha */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    aria-label="Lembrar senha"
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Lembrar senha
                  </Label>
                </div>

                {/* Ações: botão Entrar ampliado e botão Google abaixo, centralizados */}
                <div className="flex flex-col items-center gap-3">
                  <CosmicButton
                    type="submit"
                    mystical
                    className="w-full h-14 md:h-16 text-lg md:text-xl shadow-sm hover:shadow transition justify-center"
                    disabled={isLoginSubmitting}
                    aria-busy={isLoginSubmitting}
                    aria-label="Abrir o Portal"
                  >
                    {isLoginSubmitting ? "Abrindo o Portal..." : "Abrir o Portal"}
                  </CosmicButton>
                  
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Ou</span>
                    </div>
                  </div>

                  <CosmicButton
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full h-12 shadow-sm hover:shadow transition justify-center gap-2"
                    disabled={isGoogleLoading}
                    aria-busy={isGoogleLoading}
                    aria-label="Entrar com Google"
                    variant="outline"
                  >
                    {isGoogleLoading ? (
                      "Conectando..."
                    ) : (
                      <>
                        <GoogleIcon className="w-5 h-5" aria-hidden="true" />
                        Entrar com Google
                      </>
                    )}
                  </CosmicButton>
                </div>

                {authError && (
                  <p className="text-sm text-destructive mt-2" aria-live="polite">{authError}</p>
                )}
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-4" aria-label="Formulário de cadastro">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      className="pl-10"
                      autoComplete="name"
                      ref={signupNameRef}
                      {...registerSignup("fullName")}
                    />
                  </div>
                  {signupErrors.fullName && (
                    <p className="text-sm text-destructive" aria-live="polite">{signupErrors.fullName.message}</p>
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
                      autoComplete="email"
                      aria-invalid={!!signupErrors.email}
                      aria-describedby={signupErrors.email ? "signup-email-error" : undefined}
                      {...registerSignup("email")}
                    />
                  </div>
                  {signupErrors.email && (
                    <p id="signup-email-error" className="text-sm text-destructive" aria-live="polite">{signupErrors.email.message}</p>
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
                      autoComplete="new-password"
                      aria-invalid={!!signupErrors.password}
                      aria-describedby={signupErrors.password ? "signup-password-error" : undefined}
                      {...registerSignup("password")}
                    />
                  </div>
                  {signupErrors.password && (
                    <p id="signup-password-error" className="text-sm text-destructive" aria-live="polite">{signupErrors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      autoComplete="new-password"
                      aria-invalid={!!signupErrors.confirmPassword}
                      aria-describedby={signupErrors.confirmPassword ? "signup-confirm-error" : undefined}
                      {...registerSignup("confirmPassword")}
                    />
                  </div>
                  {signupErrors.confirmPassword && (
                    <p id="signup-confirm-error" className="text-sm text-destructive" aria-live="polite">{signupErrors.confirmPassword.message}</p>
                  )}
                </div>

                <CosmicButton
                  type="submit"
                  mystical
                  className="w-full shadow-sm hover:shadow transition"
                  disabled={isSignupSubmitting}
                  aria-busy={isSignupSubmitting}
                  aria-label="Criar conta"
                >
                  {isSignupSubmitting ? "Criando conta..." : "Criar conta"}
                </CosmicButton>

                {authError && (
                  <p className="text-sm text-destructive mt-2" aria-live="polite">{authError}</p>
                )}
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
                  : "Já tem uma conta? Abra o Portal"}
              </button>
            </div>
          </div>
        </CosmicCard>
      </div>
    </div>
  );
};

// Ícone simples do Google (G colorido)
const GoogleIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 533.5 544.3"
    className={className}
  >
    <path fill="#EA4335" d="M533.5 278.4c0-18.5-1.5-36.4-4.3-53.7H272v101.6h147.2c-6.4 34.7-25.8 64-55 83.6v69.2h88.9c52 47.9 80.4 118.6 80.4 198.5 0 24-2.7 47.5-8 70.2h0.1c0.1 0 8.9-169.4 8.9-469.4z"/>
    <path fill="#FBBC04" d="M272 544.3c73.8 0 135.8-24.5 181.1-66.6l-88.9-69.2c-24.7 16.6-56.3 26.4-92.2 26.4-70.8 0-130.9-47.7-152.4-111.9H28.1v70.5C73 492.6 164.8 544.3 272 544.3z"/>
    <path fill="#34A853" d="M119.6 322.9c-9.5-27.9-9.5-58.1 0-86l-0.1-70.5H28.1C10.3 204.6 0 239.2 0 275.7s10.3 71.1 28.1 109.3l91.5-62.1z"/>
    <path fill="#4285F4" d="M272 107.7c40.1 0 76.2 13.8 104.7 40.9l78.5-78.5C408.1 24.1 345.9 0 272 0 164.8 0 73 51.7 28.1 135.1l91.5 70.5C141.1 155.4 201.2 107.7 272 107.7z"/>
  </svg>
);

// Ícone simples de chapéu de mago para o cabeçalho
const WizardHatIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    className={className}
    aria-hidden="true"
  >
    {/* Chapéu (triângulo) */}
    <path d="M32 8 L12 44 H52 Z" fill="currentColor" opacity="0.95" />
    {/* Aba do chapéu */}
    <rect x="10" y="44" width="44" height="6" rx="3" fill="currentColor" opacity="0.8" />
    {/* Detalhe estrela */}
    <circle cx="26" cy="26" r="2" fill="#FFD54F" />
    <circle cx="36" cy="22" r="1.8" fill="#4FC3F7" />
    <circle cx="30" cy="30" r="1.6" fill="#81C784" />
  </svg>
);

export default Auth;
