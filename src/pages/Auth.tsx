import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, User, Sparkles, MoonStar, Atom, Zap, FileText, Mic, Video, Wand2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RuneIcon } from "@/components/cosmic/RuneIcon";

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
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center auth-container">
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
          <div className="inline-flex flex-col items-center gap-3 px-6 py-5 rounded-lg shadow-lg glass-cosmic relative group">
            {/* Glow effect ao redor do ícone */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400/20 via-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            
            <div className="relative z-10">
              <WizardHatIcon className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-primary animate-rune-pulse mb-3 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
            </div>
            
            <h1 className="relative inline-block z-10">
              <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-[length:200%_100%] bg-clip-text text-transparent text-3xl md:text-4xl font-bold animate-shine">
                Arcanum AI
              </span>
              <span className="block text-sm md:text-base text-muted-foreground mt-1">
                Laboratório de Transmutação de Conteúdo
              </span>
            </h1>
          </div>
        </div>

        <CosmicCard glow className="relative">
          {/* Runas decorativas nos cantos */}
          <div className="absolute -top-2 -left-2 z-10">
            <RuneIcon icon={Sparkles} size="sm" animated />
          </div>
          <div className="absolute -top-2 -right-2 z-10">
            <RuneIcon icon={MoonStar} size="sm" animated />
          </div>
          <div className="absolute -bottom-2 -left-2 z-10">
            <RuneIcon icon={Atom} size="sm" animated />
          </div>
          <div className="absolute -bottom-2 -right-2 z-10">
            <RuneIcon icon={Zap} size="sm" animated />
          </div>
          
          <div className="space-y-6 relative z-0">
            <div className="text-center space-y-4">
              <div className="space-y-3 md:space-y-4">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-purple-400 via-pink-400 to-yellow-400 bg-[length:200%_100%] bg-clip-text text-transparent animate-shine tracking-tight leading-[1.1] px-2">
                  {isLogin ? "Crie 10x mais conteúdo sem perder sua voz única" : "Inicie sua jornada arcana"}
                </h2>
                <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto leading-relaxed px-4 font-medium">
                  {isLogin
                    ? "Transforme um único texto, áudio ou vídeo em posts, newsletters, resumos e vídeos curtos. A magia da IA preserva seu estilo enquanto multiplica sua produtividade."
                    : "Entre no portal da transmutação e descubra o poder da criação digital"}
                </p>
              </div>

              {/* Recursos principais - Grid visual */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6 max-w-md mx-auto">
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg glass-cosmic border border-primary/20 hover:border-primary/40 transition-all">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  <span className="text-xs md:text-sm text-center font-medium">Texto → Posts</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg glass-cosmic border border-primary/20 hover:border-primary/40 transition-all">
                  <Mic className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  <span className="text-xs md:text-sm text-center font-medium">Áudio → Transcrição</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg glass-cosmic border border-primary/20 hover:border-primary/40 transition-all">
                  <Video className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  <span className="text-xs md:text-sm text-center font-medium">Vídeo → Cortes</span>
                </div>
              </div>
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
              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4 transition-opacity duration-300" aria-label="Formulário de login">
                <div className="space-y-2">
                  <Label htmlFor="login">Email ou Nome de Usuário</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login"
                      type="text"
                      placeholder="seu@email.com ou seu_usuario"
                      className="pl-10 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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
                      className="pl-10 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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

                {/* Ações: botão Entrar e botão Google abaixo, centralizados */}
                <div className="flex flex-col items-center gap-3">
                  <CosmicButton
                    type="submit"
                    mystical
                    className="relative overflow-hidden group w-full h-12 text-base shadow-sm hover:shadow transition justify-center cosmic-button-glow"
                    disabled={isLoginSubmitting}
                    aria-busy={isLoginSubmitting}
                    aria-label="Abrir o Portal"
                  >
                    {/* Glow effect interno - shimmer */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    
                    {/* Conteúdo */}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isLoginSubmitting ? (
                        <>
                          <RuneIcon icon={Sparkles} size="sm" />
                          <span>Abrindo o Portal...</span>
                        </>
                      ) : (
                        <>
                          <RuneIcon icon={Sparkles} size="sm" />
                          <span>Abrir o Portal</span>
                        </>
                      )}
                    </span>
                    
                    {/* Brilho nas bordas */}
                    <div className="absolute inset-0 rounded-full border-2 border-primary/50 group-hover:border-primary transition-all opacity-0 group-hover:opacity-100 pointer-events-none" />
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
              <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-4 transition-opacity duration-300" aria-label="Formulário de cadastro">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      className="pl-10 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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
                      className="pl-10 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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
                      className="pl-10 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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
                      className="pl-10 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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
                  className="relative overflow-hidden group w-full shadow-sm hover:shadow transition cosmic-button-glow"
                  disabled={isSignupSubmitting}
                  aria-busy={isSignupSubmitting}
                  aria-label="Criar conta"
                >
                  {/* Glow effect interno - shimmer */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  
                  {/* Conteúdo */}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSignupSubmitting ? (
                      <>
                        <RuneIcon icon={Sparkles} size="sm" />
                        <span>Criando conta...</span>
                      </>
                    ) : (
                      <>
                        <RuneIcon icon={Sparkles} size="sm" />
                        <span>Criar conta</span>
                      </>
                    )}
                  </span>
                  
                  {/* Brilho nas bordas */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/50 group-hover:border-primary transition-all opacity-0 group-hover:opacity-100 pointer-events-none" />
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
                  ? "Não tem uma conta? Inicie sua jornada arcana"
                  : "Já tem uma conta? Abra o Portal"}
              </button>
            </div>
          </div>
        </CosmicCard>
      </div>

      {/* Rodapé */}
      <footer className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-sm text-muted-foreground">
          Desenvolvido com <span className="text-primary">✨</span> por{" "}
          <span className="font-semibold gradient-cosmic bg-clip-text text-transparent">
            Guillen Ia
          </span>
        </p>
      </footer>
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

// Ícone melhorado do chapéu de mago - maior e mais impactante
const WizardHatIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    className={className}
    aria-hidden="true"
  >
    <defs>
      {/* Gradiente dourado/violeta para o chapéu */}
      <linearGradient id="hat-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(270, 70%, 60%)" />
        <stop offset="50%" stopColor="hsl(45, 90%, 60%)" />
        <stop offset="100%" stopColor="hsl(270, 70%, 60%)" />
      </linearGradient>
      {/* Glow filter */}
      <filter id="hat-glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Chapéu (triângulo) com gradiente */}
    <path 
      d="M32 8 L12 44 H52 Z" 
      fill="url(#hat-gradient)" 
      opacity="0.95"
      filter="url(#hat-glow)"
    />
    
    {/* Aba do chapéu */}
    <rect 
      x="10" 
      y="44" 
      width="44" 
      height="6" 
      rx="3" 
      fill="url(#hat-gradient)" 
      opacity="0.8"
    />
    
    {/* Estrelas brilhantes melhoradas */}
    <circle cx="26" cy="26" r="2.5" fill="#FFD54F" opacity="0.9">
      <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="36" cy="22" r="2" fill="#4FC3F7" opacity="0.9">
      <animate attributeName="opacity" values="0.9;1;0.9" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="30" cy="30" r="2" fill="#81C784" opacity="0.9">
      <animate attributeName="opacity" values="0.9;1;0.9" dur="2.2s" repeatCount="indefinite" />
    </circle>
    
    {/* Partículas mágicas adicionais */}
    <circle cx="20" cy="20" r="1" fill="#FFD54F" opacity="0.6">
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="44" cy="18" r="1" fill="#CE93D8" opacity="0.6">
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.8s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export default Auth;
