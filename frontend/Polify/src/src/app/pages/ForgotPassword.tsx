import { useState } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { URL_backend } from "../data/mockData";

export function ForgotPassword() {
  const { t } = useApp();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim()
        })
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
            <span className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>P</span>
          </div>
          <span className="text-foreground tracking-tight" style={{ fontSize: "20px", fontWeight: 700 }}>Polify</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h1 className="text-foreground mb-2" style={{ fontSize: "22px" }}>{t("auth.resetSent")}</h1>
            <p className="text-muted-foreground mb-6" style={{ fontSize: "14px" }}>
              {t("auth.resetDesc")}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[#6366f1] hover:text-[#5558e6] transition-colors"
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              <ArrowLeft size={16} />
              {t("auth.backToLogin")}
            </Link>
          </div>
        ) : (
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
    </div>
  );
}
