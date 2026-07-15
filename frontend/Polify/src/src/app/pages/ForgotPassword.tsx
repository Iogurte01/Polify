import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, Lock, X } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { URL_backend } from "../data/mockData";

export function ForgotPassword() {
  const { t } = useApp();
  const navigate = useNavigate();
  
  // Estados para o fluxo de e-mail
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados para a validação do código
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [validating, setValidating] = useState(false);

  // Estados para o Modal e nova senha
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);

  // 1. Envio do E-mail
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t("auth.error.email"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${URL_backend}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSent(true);
      } else {
        setError(data.message || "Erro ao processar solicitação");
      }
    } catch (error) {
      console.error("Erro ao solicitar recuperação de senha:", error);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  // 2. Validação do Código
  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setCodeError("O código deve ter 6 dígitos.");
      return;
    }

    setValidating(true);
    setCodeError("");

    try {
      const response = await fetch(`${URL_backend}/api/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Código inválido");
      }
      
      setIsModalOpen(true); 
    } catch (err: any) {
      setCodeError(err.message || "Código inválido ou expirado.");
    } finally {
      setValidating(false);
    }
  };

  // 3. Atualização da Senha (Modal)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetError("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setResetting(true);
    setResetError("");

    try {
      const response = await fetch(`${URL_backend}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(), 
          code: code, 
          newPassword: newPassword 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
         throw new Error(data.message || "Erro ao salvar senha");
      }

      alert("Senha redefinida com sucesso!");
      setIsModalOpen(false);
      navigate("/login"); 
    } catch (err: any) {
      setResetError(err.message || "Erro ao tentar atualizar a senha.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative">
      <div className="w-full max-w-[400px]">
        
        {/* Cabeçalho do Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
            <span className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>P</span>
          </div>
          <span className="text-foreground tracking-tight" style={{ fontSize: "20px", fontWeight: 700 }}>Polify</span>
        </div>

        {sent ? (
          // --- ESTADO 2: E-MAIL ENVIADO E INPUT DE CÓDIGO ---
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h1 className="text-foreground mb-2" style={{ fontSize: "22px" }}>{t("auth.resetSent")}</h1>
            <p className="text-muted-foreground mb-6" style={{ fontSize: "14px" }}>
              Verifique sua caixa de entrada para redefinir sua senha.
            </p>

            <form onSubmit={handleValidateCode} className="space-y-4 text-left bg-input-background p-4 rounded-xl border border-border">
              <div>
                <label className="text-foreground mb-1.5 block font-medium" style={{ fontSize: "13px" }}>
                  Código de Verificação
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    // Aceitar apenas números
                    setCode(e.target.value.replace(/\D/g, ""));
                    setCodeError("");
                  }}
                  placeholder="000000"
                  className={`w-full bg-background border rounded-lg px-4 py-3 text-center tracking-[0.5em] text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all ${codeError ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "20px" }}
                />
                {codeError && <p className="text-red-500 mt-1.5 text-center" style={{ fontSize: "12px" }}>{codeError}</p>}
              </div>
              <button
                type="submit"
                disabled={validating || code.length < 6}
                className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                {validating ? "Verificando..." : "Validar Código"}
              </button>
            </form>

            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[#6366f1] hover:text-[#5558e6] transition-colors"
                style={{ fontSize: "14px", fontWeight: 500 }}
              >
                <ArrowLeft size={16} />
                {t("auth.backToLogin")}
              </Link>
            </div>
          </div>
        ) : (
          // --- ESTADO 1: INSERIR E-MAIL ---
          <>
            <h1 className="text-foreground mb-1" style={{ fontSize: "22px" }}>{t("auth.forgotPassword")}</h1>
            <p className="text-muted-foreground mb-6" style={{ fontSize: "14px" }}>
              {t("auth.resetDesc")}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>{t("auth.email")}</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="seu@email.com"
                    className={`w-full bg-input-background border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${error ? "border-red-400" : "border-border"}`}
                    style={{ fontSize: "14px" }}
                  />
                </div>
                {error && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                {loading ? "Enviando..." : t("auth.resetPassword")}
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-[#6366f1] hover:text-[#5558e6] transition-colors"
                style={{ fontSize: "13px" }}
              >
                <ArrowLeft size={14} />
                {t("auth.backToLogin")}
              </Link>
            </div>
          </>
        )}
      </div>

      {/* --- ESTADO 3: MODAL DE NOVA SENHA --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
          <div className="bg-background w-full max-w-[400px] rounded-2xl p-6 shadow-2xl relative border border-border">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-foreground mb-1" style={{ fontSize: "20px", fontWeight: 600 }}>Criar nova senha</h2>
            <p className="text-muted-foreground mb-6" style={{ fontSize: "14px" }}>
              Crie uma senha forte e segura para a sua conta.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>Nova Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setResetError(""); }}
                    placeholder="••••••••"
                    className="w-full bg-input-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setResetError(""); }}
                    placeholder="••••••••"
                    className="w-full bg-input-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
                    style={{ fontSize: "14px" }}
                  />
                </div>
                {resetError && <p className="text-red-500 mt-1.5" style={{ fontSize: "12px" }}>{resetError}</p>}
              </div>

              <button
                type="submit"
                disabled={resetting || !newPassword || !confirmPassword}
                className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                {resetting ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}