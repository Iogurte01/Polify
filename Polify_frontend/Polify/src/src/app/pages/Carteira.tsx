import { useState } from "react";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Info, ShoppingCart, CheckCircle, Shield,
} from "lucide-react";
import { tokenPackages } from "../data/mockData";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";

export function Carteira() {
  const { tokenBalance, tokenHistory, addTokens, userLevel, t } = useApp();
  const [showBuy, setShowBuy] = useState(false);
  const [confirmPkg, setConfirmPkg] = useState<string | null>(null);

  const totalEarned = tokenHistory.filter((tx) => tx.type === "earned").reduce((acc, tx) => acc + tx.amount, 0);
  const totalSpent = tokenHistory.filter((tx) => tx.type === "spent").reduce((acc, tx) => acc + tx.amount, 0);

  const handleBuy = (pkgId: string) => {
    const pkg = tokenPackages.find(p => p.id === pkgId);
    if (!pkg) return;
    addTokens(pkg.tokens, `Comprou pacote: ${pkg.name} (${pkg.tokens} tokens)`);
    toast.success(`Compra realizada! +${pkg.tokens} tokens adicionados`);
    setConfirmPkg(null);
    setShowBuy(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-foreground">Carteira</h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "14px" }}>Gerencie seu saldo e acompanhe suas transações</p>
        </div>
        <button onClick={() => setShowBuy(true)} className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e6] text-white px-5 py-3 rounded-xl transition-colors" style={{ fontSize: "14px", fontWeight: 500 }}>
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

      {/* Buy Tokens Modal */}
      {showBuy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[520px] max-w-[90vw]">
            <h3 className="text-foreground mb-2" style={{ fontSize: "18px" }}>Pacotes de Tokens</h3>
            <p className="text-muted-foreground mb-6" style={{ fontSize: "13px" }}>Saldo atual: {tokenBalance} tokens</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {tokenPackages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => setConfirmPkg(pkg.id)}
                  className={`relative border rounded-xl p-4 text-left transition-colors hover:border-[#6366f1]/50 ${confirmPkg === pkg.id ? "border-[#6366f1] bg-[#6366f1]/5" : "border-border"}`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 right-3 bg-[#6366f1] text-white px-2 py-0.5 rounded-full" style={{ fontSize: "10px", fontWeight: 600 }}>
                      Mais popular
                    </span>
                  )}
                  <p className="text-foreground" style={{ fontSize: "15px", fontWeight: 600 }}>{pkg.name}</p>
                  <p className="text-[#6366f1] mt-1" style={{ fontSize: "20px", fontWeight: 700 }}>{pkg.tokens} tokens</p>
                  <p className="text-muted-foreground mt-1" style={{ fontSize: "13px" }}>{pkg.price}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowBuy(false); setConfirmPkg(null); }} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
                {t("general.cancel")}
              </button>
              <button onClick={() => confirmPkg && handleBuy(confirmPkg)} disabled={!confirmPkg} className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5" style={{ fontSize: "13px", fontWeight: 500 }}>
                <CheckCircle size={14} /> Comprar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
