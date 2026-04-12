import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";

export function Login() {
  const { login, loginGoogle, t } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = t("auth.error.email");
    if (!password) e.password = t("auth.error.password");
    else if (password.length < 6) e.password = t("auth.error.passwordMin");
    setErrors(e);
    return Object.keys(e).length === 0;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(async () => {
    const success = await login(email, password);
      setLoading(false);
      if (success) {
        toast.success(t("auth.welcome") + "!");
        navigate("/hub");
      } else {
        setErrors({ form: t("auth.error.invalid") });
      }
    }, 600);
  };

  const handleGoogle = () => {
    setLoading(true);
    setTimeout(async () => {
      const success = await login(email, password);
      setLoading(false);

      if (success) {
        toast.success(t("auth.welcome") + "!");
        navigate("/");
      } else {
        setErrors({ form: t("auth.error.invalid") });
  }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[480px] bg-[#0f0d2e] flex-col justify-center px-12">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#6366f1] flex items-center justify-center">
            <span className="text-white" style={{ fontSize: "16px", fontWeight: 700 }}>P</span>
          </div>
          <span className="text-white tracking-tight" style={{ fontSize: "24px", fontWeight: 700 }}>Polify</span>
        </div>
        <h2 className="text-white mb-3" style={{ fontSize: "28px", fontWeight: 600 }}>
          {t("auth.welcome")}
        </h2>
        <p className="text-[#9395b8]" style={{ fontSize: "15px", lineHeight: 1.6 }}>
          {t("auth.welcomeSub")}
        </p>
        <div className="mt-10 space-y-4">
          {[
            "Comunidade qualificada de respondentes",
            "Sistema de tokens e avaliação por estrelas",
            "Dados segmentados e confiáveis",
            "Conformidade total com LGPD",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-[#c7c9e0]" style={{ fontSize: "14px" }}>
              <div className="w-5 h-5 rounded-full bg-[#6366f1]/20 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
              <span className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>P</span>
            </div>
            <span className="text-foreground tracking-tight" style={{ fontSize: "20px", fontWeight: 700 }}>Polify</span>
          </div>

          <h1 className="text-foreground mb-1" style={{ fontSize: "22px" }}>{t("auth.login")}</h1>
          <p className="text-muted-foreground mb-6" style={{ fontSize: "14px" }}>
            {t("auth.welcomeSub")}
          </p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-card border border-border text-foreground py-2.5 rounded-xl hover:bg-secondary transition-colors mb-4"
            style={{ fontSize: "14px", fontWeight: 500 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" fill="#FBBC05"/>
              <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {t("auth.loginGoogle")}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground" style={{ fontSize: "12px" }}>ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-lg" style={{ fontSize: "13px" }}>
                {errors.form}
              </div>
            )}

            <div>
              <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>{t("auth.email")}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                  placeholder="seu@email.com"
                  className={`w-full bg-input-background border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${errors.email ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "14px" }}
                />
              </div>
              {errors.email && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.email}</p>}
            </div>

            <div>
              <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>{t("auth.password")}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                  placeholder="••••••••"
                  className={`w-full bg-input-background border rounded-lg pl-10 pr-10 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${errors.password ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "14px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/esqueci-senha" className="text-[#6366f1] hover:text-[#5558e6] transition-colors" style={{ fontSize: "13px" }}>
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white py-3 rounded-xl transition-colors disabled:opacity-60"
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              {loading ? "..." : t("auth.login")}
            </button>
          </form>

          <p className="text-center text-muted-foreground mt-6" style={{ fontSize: "13px" }}>
            {t("auth.noAccount")}{" "}
            <Link to="/cadastro" className="text-[#6366f1] hover:text-[#5558e6] transition-colors" style={{ fontWeight: 500 }}>
              {t("auth.register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}