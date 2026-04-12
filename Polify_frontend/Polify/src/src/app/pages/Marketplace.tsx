import { useState } from "react";
import { Star, Users, MapPin, Tag, Eye, ShoppingCart, Send, CheckCircle, TrendingUp, Lightbulb, BarChart3, Database, Shield, Lock, ArrowUpRight } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { marketplaceSurveys, polifyInsights, categories, brazilianStates } from "../data/mockData";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { toast } from "sonner";

type Tab = "pesquisas" | "solicitar" | "insights";

export function Marketplace() {
  const { t, tokenBalance, spendTokens, purchasedInsights, purchaseInsight, addMarketplaceSurvey } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("pesquisas");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<string[]>([]);

  const [customSubmitted, setCustomSubmitted] = useState(false);
  const [customForm, setCustomForm] = useState({
    objective: "", audience: "", state: "", city: "", deadline: "", budget: "", category: "",
  });
  const [customErrors, setCustomErrors] = useState<Record<string, boolean>>({});

  const handleBuy = (id: string) => {
    const survey = marketplaceSurveys.find(s => s.id === id);
    if (!survey) return;
    const success = spendTokens(survey.price, `Comprou: ${survey.title}`);
    if (success) {
      setPurchased(prev => [...prev, id]);
      addMarketplaceSurvey(survey.title, id);
      toast.success(t("marketplace.purchaseSuccess"));
    } else {
      toast.error(t("create.error.balance"));
    }
    setConfirmId(null);
  };

  const handleBuyInsight = (id: string, price: number) => {
    const success = purchaseInsight(id, price);
    if (success) {
      toast.success("Insight adquirido com sucesso!");
    } else {
      toast.error(t("create.error.balance"));
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!customForm.objective.trim()) newErrors.objective = true;
    if (!customForm.audience.trim()) newErrors.audience = true;
    if (!customForm.category) newErrors.category = true;
    if (Object.keys(newErrors).length > 0) { setCustomErrors(newErrors); return; }
    toast.success(t("custom.success"));
    setCustomSubmitted(true);
  };

  const previewSurvey = marketplaceSurveys.find(s => s.id === previewId);

  const tabs = [
    { key: "pesquisas" as Tab, label: "Pesquisas Prontas", icon: ShoppingCart },
    { key: "solicitar" as Tab, label: t("custom.title"), icon: Send },
    { key: "insights" as Tab, label: "Insights Polify", icon: BarChart3 },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      <div className="mb-6">
        <h1 className="text-foreground">{t("marketplace.title")}</h1>
        <p className="text-muted-foreground mt-1" style={{ fontSize: "14px" }}>{t("marketplace.subtitle")}</p>
      </div>

      <div className="flex gap-1 mb-6 bg-secondary rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors flex-1 justify-center ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            style={{ fontSize: "13px", fontWeight: 500 }}>
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Pesquisas Prontas */}
      {activeTab === "pesquisas" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {marketplaceSurveys.map(survey => {
            const isPurchased = purchased.includes(survey.id);
            const stateLabel = brazilianStates.find(s => s.uf === survey.state)?.name || survey.state;
            return (
              <div key={survey.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="bg-[#6366f1]/10 text-[#6366f1] px-2.5 py-1 rounded-md" style={{ fontSize: "11px", fontWeight: 600 }}>{survey.category}</span>
                  {survey.segmentation && (<span className="bg-secondary text-muted-foreground px-2 py-0.5 rounded-md" style={{ fontSize: "10px" }}>{survey.segmentation}</span>)}
                </div>
                <h3 className="text-foreground mb-2" style={{ fontSize: "15px" }}>{survey.title}</h3>
                <p className="text-muted-foreground mb-4" style={{ fontSize: "12px", lineHeight: 1.5 }}>{survey.description}</p>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "12px" }}><MapPin size={12} /> {stateLabel}{survey.city ? `, ${survey.city}` : ""}</span>
                  <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "12px" }}><Users size={12} /> {survey.responses} respostas</span>
                  <span className="flex items-center gap-1 text-[#f59e0b]" style={{ fontSize: "12px", fontWeight: 500 }}><Star size={12} className="fill-[#f59e0b]" /> {survey.quality}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Tag size={14} className="text-[#6366f1]" />
                    <span className="text-[#6366f1]" style={{ fontSize: "16px", fontWeight: 600 }}>{survey.price} tokens</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPreviewId(survey.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "12px", fontWeight: 500 }}>
                      <Eye size={13} /> {t("marketplace.preview")}
                    </button>
                    {isPurchased ? (
                      <span className="flex items-center gap-1 text-emerald-600 px-3 py-2" style={{ fontSize: "12px", fontWeight: 500 }}><CheckCircle size={13} /> Adquirida</span>
                    ) : (
                      <button onClick={() => setConfirmId(survey.id)} className="flex items-center gap-1.5 bg-[#6366f1] hover:bg-[#5558e6] text-white px-3 py-2 rounded-lg transition-colors" style={{ fontSize: "12px", fontWeight: 500 }}>
                        <ShoppingCart size={13} /> {t("marketplace.buy")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Solicitar */}
      {activeTab === "solicitar" && (
        <div className="max-w-[800px]">
          {customSubmitted ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-foreground mb-2">{t("custom.success")}</h2>
              <button onClick={() => { setCustomSubmitted(false); setCustomForm({ objective: "", audience: "", state: "", city: "", deadline: "", budget: "", category: "" }); }}
                className="mt-4 bg-[#6366f1] hover:bg-[#5558e6] text-white px-6 py-2.5 rounded-xl transition-colors" style={{ fontSize: "14px", fontWeight: 500 }}>
                Nova solicitação
              </button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6" style={{ fontSize: "14px" }}>{t("custom.subtitle")}</p>
              <form onSubmit={handleCustomSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
                <FormField label={t("custom.objective")} error={customErrors.objective}>
                  <textarea value={customForm.objective} onChange={(e) => { setCustomForm({ ...customForm, objective: e.target.value }); setCustomErrors({}); }} rows={3}
                    className={`w-full bg-input-background border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] resize-none ${customErrors.objective ? "border-red-400" : "border-border"}`}
                    style={{ fontSize: "14px" }} placeholder="Descreva o objetivo da sua pesquisa..." />
                </FormField>
                <FormField label={t("custom.audience")} error={customErrors.audience}>
                  <input value={customForm.audience} onChange={(e) => { setCustomForm({ ...customForm, audience: e.target.value }); setCustomErrors({}); }}
                    className={`w-full bg-input-background border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${customErrors.audience ? "border-red-400" : "border-border"}`}
                    style={{ fontSize: "14px" }} placeholder="Ex: Mulheres 25-35, classe A/B, Grande São Paulo" />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label={t("custom.state")}>
                    <select value={customForm.state} onChange={(e) => setCustomForm({ ...customForm, state: e.target.value, city: "" })} className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-foreground appearance-none cursor-pointer" style={{ fontSize: "14px" }}>
                      <option value="">Selecionar</option>
                      {brazilianStates.map(s => <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label={t("home.city")}>
                    <CityAutocomplete stateUf={customForm.state} value={customForm.city} onChange={(city) => setCustomForm({ ...customForm, city })} placeholder="Buscar cidade..." className="px-4 py-2.5" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label={t("custom.deadline")}>
                    <input type="date" value={customForm.deadline} onChange={(e) => setCustomForm({ ...customForm, deadline: e.target.value })}
                      className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" style={{ fontSize: "14px" }} />
                  </FormField>
                  <FormField label={t("custom.budget")}>
                    <input type="number" value={customForm.budget} onChange={(e) => setCustomForm({ ...customForm, budget: e.target.value })}
                      className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" style={{ fontSize: "14px" }} placeholder="Ex: 100" />
                  </FormField>
                </div>
                <FormField label={t("custom.category")} error={customErrors.category}>
                  <select value={customForm.category} onChange={(e) => { setCustomForm({ ...customForm, category: e.target.value }); setCustomErrors({}); }}
                    className={`w-full bg-input-background border rounded-lg px-4 py-2.5 text-foreground appearance-none cursor-pointer ${customErrors.category ? "border-red-400" : "border-border"}`} style={{ fontSize: "14px" }}>
                    <option value="">Selecionar categoria</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <button type="submit" className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors" style={{ fontSize: "14px", fontWeight: 600 }}>
                  <Send size={16} /> {t("custom.submit")}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Tab: Insights Polify */}
      {activeTab === "insights" && (
        <div>
          {/* Header banner */}
          <div className="bg-gradient-to-r from-[#312e81] to-[#4338ca] rounded-xl p-6 text-white mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Database size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Insights Polify</h3>
                <p className="mt-1" style={{ fontSize: "13px", opacity: 0.85, lineHeight: "1.6" }}>
                  Relatórios proprietários baseados na nossa base de dados agregada e anonimizada.
                  Análises verificadas com milhares de data points.
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 500 }}>
                    <Shield size={12} /> Dados Verificados
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 500 }}>
                    <Database size={12} /> Base Consolidada
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 500 }}>
                    <Lock size={12} /> LGPD Compliant
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {polifyInsights.map(insight => {
              const isPurchased = purchasedInsights.includes(insight.id);
              return (
                <div key={insight.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-[#6366f1]/10 text-[#6366f1] px-2.5 py-1 rounded-md" style={{ fontSize: "11px", fontWeight: 600 }}>{insight.category}</span>
                    <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 600 }}>{insight.badge}</span>
                  </div>
                  <h3 className="text-foreground mb-2" style={{ fontSize: "15px" }}>{insight.title}</h3>
                  <p className="text-muted-foreground mb-4" style={{ fontSize: "12px", lineHeight: 1.5 }}>{insight.description}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "12px" }}>
                      <Database size={12} /> {insight.dataPoints.toLocaleString()} data points
                    </span>
                    <span className="text-muted-foreground" style={{ fontSize: "11px" }}>
                      Atualizado: {insight.lastUpdated}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Tag size={14} className="text-[#6366f1]" />
                      <span className="text-[#6366f1]" style={{ fontSize: "16px", fontWeight: 600 }}>{insight.price} tokens</span>
                    </div>
                    {isPurchased ? (
                      <span className="flex items-center gap-1 text-emerald-600" style={{ fontSize: "12px", fontWeight: 500 }}>
                        <CheckCircle size={13} /> Adquirido
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuyInsight(insight.id, insight.price)}
                        className="flex items-center gap-1.5 bg-[#6366f1] hover:bg-[#5558e6] text-white px-4 py-2 rounded-lg transition-colors"
                        style={{ fontSize: "12px", fontWeight: 500 }}
                      >
                        <ArrowUpRight size={13} /> Adquirir Insight
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-2 px-1">
            <div className="w-5 h-5 rounded bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0 mt-0.5"><span style={{ fontSize: "10px" }}>🔒</span></div>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>
              Todos os insights são baseados em dados agregados e anonimizados, em conformidade com a LGPD. Nenhum dado individual é exposto.
            </p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewSurvey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[500px] max-w-[90vw] max-h-[80vh] overflow-auto">
            <span className="bg-[#6366f1]/10 text-[#6366f1] px-2.5 py-1 rounded-md" style={{ fontSize: "11px", fontWeight: 600 }}>{previewSurvey.category}</span>
            <h3 className="text-foreground mt-3 mb-3" style={{ fontSize: "17px" }}>{previewSurvey.title}</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: "13px", lineHeight: 1.6 }}>{previewSurvey.description}</p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between" style={{ fontSize: "13px" }}><span className="text-muted-foreground">{t("home.state")}</span><span className="text-foreground">{previewSurvey.state}{previewSurvey.city ? `, ${previewSurvey.city}` : ""}</span></div>
              <div className="flex justify-between" style={{ fontSize: "13px" }}><span className="text-muted-foreground">{t("home.responses")}</span><span className="text-foreground">{previewSurvey.responses}</span></div>
              <div className="flex justify-between" style={{ fontSize: "13px" }}><span className="text-muted-foreground">Segmentação</span><span className="text-foreground">{previewSurvey.segmentation}</span></div>
              <div className="flex justify-between" style={{ fontSize: "13px" }}><span className="text-muted-foreground">Qualidade</span><span className="flex items-center gap-1 text-[#f59e0b]"><Star size={12} className="fill-[#f59e0b]" /> {previewSurvey.quality}</span></div>
              <div className="flex justify-between" style={{ fontSize: "13px" }}><span className="text-muted-foreground">Preço</span><span className="text-[#6366f1]" style={{ fontWeight: 600 }}>{previewSurvey.price} tokens</span></div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPreviewId(null)} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>{t("general.close")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Purchase */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[400px] max-w-[90vw]">
            <h3 className="text-foreground mb-2" style={{ fontSize: "16px" }}>{t("marketplace.purchaseConfirm")}</h3>
            <p className="text-muted-foreground mb-1" style={{ fontSize: "13px" }}>Custo: {marketplaceSurveys.find(s => s.id === confirmId)?.price} tokens</p>
            <p className="text-muted-foreground mb-6" style={{ fontSize: "13px" }}>Saldo atual: {tokenBalance} tokens</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>{t("general.cancel")}</button>
              <button onClick={() => handleBuy(confirmId)} className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-4 py-2 rounded-lg transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>{t("general.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={`block mb-1.5 ${error ? "text-red-500" : "text-foreground"}`} style={{ fontSize: "13px" }}>{label}</label>
      {children}
    </div>
  );
}
