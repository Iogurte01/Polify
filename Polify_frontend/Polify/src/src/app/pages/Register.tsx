import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";

export function Register() {
  const { register, login, t } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("auth.error.name");
    if (!email.trim()) e.email = t("auth.error.email");
    if (!password) e.password = t("auth.error.password");
    else if (password.length < 6) e.password = t("auth.error.passwordMin");
    if (password !== confirmPassword) e.confirmPassword = t("auth.error.passwordMatch");
    if (!lgpdAccepted) e.lgpd = t("auth.error.lgpd");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    setTimeout(async () => {
      const success = await register(name, email, password);

      setLoading(false);

      if (success) {
        await login(email, password);
        toast.success(t("auth.welcome") + "!");
        navigate("/onborading");
      } else {
        setErrors({ form: "Erro ao criar conta" });
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
          {t("auth.createAccount")}
        </h2>
        <p className="text-[#9395b8]" style={{ fontSize: "15px", lineHeight: 1.6 }}>
          {t("auth.createSub")}
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
              <span className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>P</span>
            </div>
            <span className="text-foreground tracking-tight" style={{ fontSize: "20px", fontWeight: 700 }}>Polify</span>
          </div>

          <h1 className="text-foreground mb-1" style={{ fontSize: "22px" }}>{t("auth.register")}</h1>
          <p className="text-muted-foreground mb-6" style={{ fontSize: "14px" }}>
            {t("auth.createSub")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>{t("auth.name")}</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors({}); }}
                  placeholder="Seu nome completo"
                  className={`w-full bg-input-background border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${errors.name ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "14px" }}
                />
              </div>
              {errors.name && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.name}</p>}
            </div>

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

            <div>
              <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>{t("auth.confirmPassword")}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}); }}
                  placeholder="••••••••"
                  className={`w-full bg-input-background border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${errors.confirmPassword ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "14px" }}
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(e) => { setLgpdAccepted(e.target.checked); setErrors({}); }}
                  className="mt-1 accent-[#6366f1]"
                />
                <span className={`${errors.lgpd ? "text-red-500" : "text-muted-foreground"}`} style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  {t("auth.lgpdAccept")}
                </span>
              </label>
              {errors.lgpd && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.lgpd}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white py-3 rounded-xl transition-colors disabled:opacity-60"
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              {loading ? "..." : t("auth.register")}
            </button>
          </form>

          <p className="text-center text-muted-foreground mt-6" style={{ fontSize: "13px" }}>
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="text-[#6366f1] hover:text-[#5558e6] transition-colors" style={{ fontWeight: 500 }}>
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}