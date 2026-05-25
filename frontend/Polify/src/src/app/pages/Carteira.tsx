import { useState } from "react";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Info, ShoppingCart, CheckCircle, Shield, AlertCircle, X,
} from "lucide-react";
import { tokenPackages } from "../data/mockData";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";

export function Carteira() {
  const { tokenBalance, tokenHistory, addTokens, auth, userLevel, t } = useApp();
  const [showBetaWarning, setShowBetaWarning] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [showReasonForm, setShowReasonForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const totalEarned = tokenHistory.filter((tx) => tx.type === "earned").reduce((acc, tx) => acc + tx.amount, 0);
  const totalSpent = tokenHistory.filter((tx) => tx.type === "spent").reduce((acc, tx) => acc + tx.amount, 0);

  const handleBuyClick = () => {
    setShowBetaWarning(true);
  };

  const handleBetaWarningClose = () => {
    setShowBetaWarning(false);
    setShowPlanSelection(true);
  };

  const handleSelectPlan = (pkgId: string) => {
    setSelectedPlan(pkgId);
    setShowPlanSelection(false);
    setShowReasonForm(true);
    setReason("");
  };

  const handleSubmitIntention = async () => {
    if (!selectedPlan || !reason.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const pkg = tokenPackages.find(p => p.id === selectedPlan);
    if (!pkg) return;

    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/purchase-intentions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: auth.user?.id,
          selected_plan: pkg.name,
          reason: reason.trim(),
          tokens_amount: pkg.tokens,
          price: pkg.price
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add tokens to balance (frontend update)
        addTokens(pkg.tokens, `Compra fictícia: ${pkg.name} (${pkg.tokens} tokens)`);
        
        toast.success(`Intenção registrada! +${pkg.tokens} tokens adicionados`);
        
        // Reset state
        setShowReasonForm(false);
        setSelectedPlan(null);
        setReason("");
      } else {
        toast.error(data.message || "Erro ao registrar intenção");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowReasonForm(false);
    setSelectedPlan(null);
    setReason("");
    setShowPlanSelection(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-foreground">Carteira</h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "14px" }}>Gerencie seu saldo e acompanhe suas transações</p>
        </div>
        <button onClick={handleBuyClick} className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e6] text-white px-5 py-3 rounded-xl transition-colors" style={{ fontSize: "14px", fontWeight: 500 }}>
          <ShoppingCart size={16} /> Comprar Tokens
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#312e81] to-[#4338ca] rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={18} className="opacity-80" />
            <span style={{ fontSize: "13px", opacity: 0.8 }}>Saldo Atual</span>
          </div>
          <p style={{ fontSize: "36px", fontWeight: 700 }}>{tokenBalance}</p>
          <p style={{ fontSize: "12px", opacity: 0.7 }} className="mt-1">tokens disponíveis</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <span className="text-muted-foreground" style={{ fontSize: "13px" }}>Total Ganho</span>
          </div>
          <p className="text-emerald-600" style={{ fontSize: "28px", fontWeight: 600 }}>+{totalEarned}</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>respondendo pesquisas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <TrendingDown size={16} className="text-red-500" />
            </div>
            <span className="text-muted-foreground" style={{ fontSize: "13px" }}>Total Gasto</span>
          </div>
          <p className="text-red-500" style={{ fontSize: "28px", fontWeight: 600 }}>-{totalSpent}</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>publicando pesquisas</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Transaction History */}
        <div className="col-span-2 bg-card border border-border rounded-xl">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-foreground" style={{ fontSize: "15px" }}>Extrato Detalhado</h3>
          </div>
          <div className="divide-y divide-border">
            {tokenHistory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground" style={{ fontSize: "13px" }}>Nenhuma transação ainda.</p>
              </div>
            )}
            {tokenHistory.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "earned" ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
                    {tx.type === "earned" ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownRight size={14} className="text-red-500" />}
                  </div>
                  <div>
                    <p className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>{tx.description}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{tx.date}</p>
                  </div>
                </div>
                <span className={tx.type === "earned" ? "text-emerald-600" : "text-red-500"} style={{ fontSize: "14px", fontWeight: 600 }}>
                  {tx.type === "earned" ? "+" : "-"}{tx.amount} tokens
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-foreground mb-3 flex items-center gap-2" style={{ fontSize: "15px" }}>
              <Info size={15} /> Como funcionam
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowUpRight size={12} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>Ganhar</p>
                  <p className="text-muted-foreground" style={{ fontSize: "12px" }}>1 token por minuto ao responder pesquisas</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowDownRight size={12} className="text-red-500" />
                </div>
                <div>
                  <p className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>Gastar</p>
                  <p className="text-muted-foreground" style={{ fontSize: "12px" }}>5 tokens por minuto ao publicar pesquisas</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield size={12} className="text-[#6366f1]" />
                </div>
                <div>
                  <p className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>Multiplicador</p>
                  <p className="text-muted-foreground" style={{ fontSize: "12px" }}>Nível {userLevel.name}: x{userLevel.tokenMultiplier.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#6366f1]/5 to-[#8b5cf6]/5 dark:from-[#6366f1]/10 dark:to-[#8b5cf6]/10 border border-[#6366f1]/20 rounded-xl p-5">
            <p className="text-[#6366f1]" style={{ fontSize: "13px", fontWeight: 600 }}>Dica</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>Suba de nível respondendo pesquisas com qualidade para ganhar multiplicadores maiores.</p>
          </div>
        </div>
      </div>

      {/* Beta Warning Modal */}
      {showBetaWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-8 w-[520px] max-w-[90vw]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <h3 className="text-foreground" style={{ fontSize: "18px", fontWeight: 600 }}>Compra em Fase Beta</h3>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <p className="text-amber-900 dark:text-amber-100" style={{ fontSize: "14px", lineHeight: "1.6 " }}>
                Esta é uma compra fictícia utilizada apenas para testes internos e pesquisas de comportamento durante a fase beta da plataforma.
              </p>
            </div>
            <p className="text-muted-foreground mb-6" style={{ fontSize: "13px" }}>
              Você não será cobrado. Os tokens são adicionados ao seu saldo para fins de teste e avaliação do sistema.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBetaWarning(false)}
                className="px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Voltar
              </button>
              <button
                onClick={handleBetaWarningClose}
                className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-4 py-2.5 rounded-lg transition-colors"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selection Modal */}
      {showPlanSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-[600px] max-w-[90vw]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-foreground" style={{ fontSize: "18px", fontWeight: 600 }}>Escolha um Plano</h3>
              <button
                onClick={() => setShowPlanSelection(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-muted-foreground mb-6" style={{ fontSize: "13px" }}>Saldo atual: <span className="font-semibold text-foreground">{tokenBalance} tokens</span></p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {tokenPackages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => handleSelectPlan(pkg.id)}
                  className={`relative border rounded-xl p-4 text-left transition-all hover:border-[#6366f1]/50 ${
                    selectedPlan === pkg.id ? "border-[#6366f1] bg-[#6366f1]/5 shadow-sm" : "border-border hover:shadow-sm"
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 right-3 bg-[#6366f1] text-white px-2.5 py-0.5 rounded-full" style={{ fontSize: "10px", fontWeight: 600 }}>
                      Mais popular
                    </span>
                  )}
                  <p className="text-foreground" style={{ fontSize: "15px", fontWeight: 600 }}>{pkg.name}</p>
                  <p className="text-[#6366f1] mt-2" style={{ fontSize: "24px", fontWeight: 700 }}>{pkg.tokens}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "12px" }}>tokens</p>
                  <div className="border-t border-border mt-3 pt-3">
                    <p className="text-foreground" style={{ fontSize: "14px", fontWeight: 600 }}>{pkg.price}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPlanSelection(false)}
                className="px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reason Form Modal */}
      {showReasonForm && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-[520px] max-w-[90vw]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-foreground" style={{ fontSize: "18px", fontWeight: 600 }}>Registrar Intenção</h3>
              <button
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-secondary rounded-lg">
              <p className="text-muted-foreground" style={{ fontSize: "12px" }}>Plano selecionado</p>
              <p className="text-foreground mt-1" style={{ fontSize: "16px", fontWeight: 600 }}>
                {tokenPackages.find(p => p.id === selectedPlan)?.name} • {tokenPackages.find(p => p.id === selectedPlan)?.tokens} tokens
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-foreground mb-3" style={{ fontSize: "14px", fontWeight: 500 }}>
                Por que você escolheu esse plano?
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: melhor custo-benefício, quantidade ideal, teste da plataforma…"
                className="w-full bg-input-background border border-border rounded-lg px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] resize-none"
                style={{ fontSize: "13px", minHeight: "100px" }}
              />
              <p className="text-muted-foreground mt-2" style={{ fontSize: "12px" }}>
                {reason.length}/500 caracteres
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Voltar
              </button>
              <button
                onClick={handleSubmitIntention}
                disabled={!reason.trim() || isLoading}
                className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Registrar intenção
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
