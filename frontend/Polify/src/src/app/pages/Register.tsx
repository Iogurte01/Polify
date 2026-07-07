import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Mail, Lock, User, X } from "lucide-react"; // Adicionado 'X' aqui
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";
import { LoadingActionButton } from "../components/ui/loading-action-button";

export function Register() {
  const { register, login, t } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [lgpdModal, setLgpdModal] = useState(false);

  const sanitizeName = (value: string) => value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const isValidName = (value: string) => /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]*$/.test(value);

  const isValidPhone = (value: string) => /^\(\d{2}\) \d{5}-\d{4}$/.test(value);

  const validate = () => {
    const e: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) e.name = t("auth.error.name");
    else if (!isValidName(trimmedName)) e.name = t("auth.error.nameInvalid");

    if (!trimmedEmail) e.email = t("auth.error.email");
    if (!trimmedPhone) e.phone = t("auth.error.phone");
    else if (!isValidPhone(trimmedPhone)) e.phone = t("auth.error.phoneFormat");

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
      const result = await register(name.trim(), email.trim(), password, phone.trim());

      setLoading(false);

      if (result.success) {
        await login(email.trim(), password);
        toast.success(t("auth.welcome") + "!");
        navigate("/onborading");
      } else {
        if (result.status === 409) {
          setErrors({ email: result.message || t("auth.error.emailInUse") });
        } else {
          setErrors({ form: result.message || t("auth.error.generic") });
        }
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
                  onChange={(e) => { setName(sanitizeName(e.target.value)); setErrors({}); }}
                  placeholder={t("auth.namePlaceholder")}
                  autoComplete="name"
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
                  autoComplete="email"
                  className={`w-full bg-input-background border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${errors.email ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "14px" }}
                />
              </div>
              {errors.email && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.email}</p>}
            </div>

            <div>
              <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>{t("auth.phone")}</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(formatPhone(e.target.value)); setErrors({}); }}
                  placeholder={t("auth.phonePlaceholder")}
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={15}
                  className={`w-full bg-input-background border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${errors.phone ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "14px" }}
                />
              </div>
              {errors.phone && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.phone}</p>}
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
                  autoComplete="new-password"
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
                  autoComplete="new-password"
                  className={`w-full bg-input-background border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${errors.confirmPassword ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "14px" }}
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.confirmPassword}</p>}
            </div>

            {/* AQUI COMEÇA O BLOCO SUBSTITUÍDO (LGPD) */}
            <div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(e) => { setLgpdAccepted(e.target.checked); setErrors({}); }}
                  className="mt-1 accent-[#6366f1]"
                />

                <div className="text-muted-foreground" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  <button
                    type="button"
                    onClick={() => setLgpdModal(true)}
                    className="text-left text-inherit hover:text-[#6366f1] transition-colors"
                  >
                    Li e aceito a Política de Privacidade e os Termos de Uso (LGPD)
                  </button>
                </div>
              </div>

              {errors.lgpd && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.lgpd}</p>}
            </div>
            {/* AQUI TERMINA O BLOCO SUBSTITUÍDO (LGPD) */}

            <LoadingActionButton
              type="submit"
              loading={loading}
              loadingLabel={t("auth.register")}
              className="w-full h-[48px] bg-[#6366f1] hover:bg-[#5558e6]"
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              {t("auth.register")}
            </LoadingActionButton>

            {errors.form && <p className="text-red-500 text-center" style={{ fontSize: "12px" }}>{errors.form}</p>}
          </form>

          <p className="text-center text-muted-foreground mt-6" style={{ fontSize: "13px" }}>
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="text-[#6366f1] hover:text-[#5558e6] transition-colors" style={{ fontWeight: 500 }}>
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </div>

      {/* MODAL DA LGPD ADICIONADO AQUI */}
      {lgpdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-background rounded-xl p-6 w-full max-w-2xl shadow-xl border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Política de Privacidade e Termos de Uso</h3>
              <button 
                onClick={() => setLgpdModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="text-sm text-muted-foreground mb-6 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
              <h4 className="font-semibold text-foreground">1. Coleta de Dados</h4>
              <p>
                Ao criar sua conta na Loxify/Polify, coletamos as informações que você nos fornece 
                diretamente, como seu nome, e-mail e número de telefone.
              </p>
              
              <h4 className="font-semibold text-foreground">2. Uso das Informações</h4>
              <p>
                Utilizamos seus dados exclusivamente para criar e gerenciar sua conta, 
                fornecer o serviço solicitado e nos comunicarmos com você sobre atualizações da plataforma.
              </p>

              <h4 className="font-semibold text-foreground">3. Seus Direitos (LGPD)</h4>
              <p>
                De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem o direito 
                de solicitar o acesso, correção ou exclusão dos seus dados pessoais a qualquer momento.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                onClick={() => setLgpdModal(false)}
                className="px-4 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-lg font-medium transition-colors text-sm"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  setLgpdAccepted(true);
                  setErrors({});
                  setLgpdModal(false);
                }}
                className="px-4 py-2 bg-[#6366f1] text-white hover:bg-[#5558e6] rounded-lg font-medium transition-colors text-sm"
              >
                Aceitar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}