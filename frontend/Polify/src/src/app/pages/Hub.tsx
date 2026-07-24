import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Coins, PlusCircle, Clock, Users, Target, Sparkles, CheckCircle2, XCircle,
  Filter, X, Check, Search, TrendingUp, ArrowUpRight, Store, FolderOpen, Flame,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { categories, brazilianStates, type Survey } from "../data/mockData";
import { CityAutocomplete } from "../components/CityAutocomplete";

const timeOptions = ["< 5 min", "5–10 min", "10–15 min", "> 15 min"];
const rewardOptions = ["5+ tokens", "8+ tokens", "10+ tokens", "15+ tokens"];

export function Hub() {
  const navigate = useNavigate();
  const {
    surveys, tokenBalance, answeredSurveys, xpTotal, xpRange, xpToNextLevel, xpProgressPercent, userLevel,
    filters, setFilters, clearFilters, activeFilterCount, t, fetchForms,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load forms from backend on component mount
  useEffect(() => {
    const loadForms = async () => {
      try {
        setLoading(true);
        setError("");
        const success = await fetchForms();
        if (!success) {
          setError("Não foi possível carregar os formulários. Usando dados locais.");
        }
      } catch (err) {
        setError("Erro ao conectar com o servidor. Usando dados locais.");
        console.error("Error loading forms:", err);
      } finally {
        setLoading(false);
      }
    };

    loadForms();
  }, [fetchForms]);

  const hasFilters = Object.values(filters).some(Boolean);
  const allCategories = ["Todas", ...categories];

  const toggleCategory = (category: string) => {
    if (category === "Todas") {
      setActiveCategories([]);
      return;
    }

    setActiveCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

const filteredSurveys = surveys.filter((s) => {
    // 1. Status ativo
    if (s.status !== "Ativa") return false;

    // 2. Barra de pesquisa (Filtra por título)
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // 3. Filtro de Categoria (Dropdown ou Chips)
    if (filters.category && s.category !== filters.category) return false;

    // 4. Filtro de Estado
    if (filters.state) {
      if (s.state && s.state !== filters.state) return false;
      // Se a pesquisa não tem estado definido, tratamos como Geral/Nacional, então ela passa
    }

    // 5. Filtro de Cidade
    if (filters.city) {
      if (s.city && !s.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    }

    // 6. Filtro de Tempo Estimado
    if (filters.time) {
      const timeValue = parseInt(s.estimatedTime?.replace(/\D/g, "") || "0");
      
      if (filters.time === "< 5 min" && timeValue >= 5) return false;
      if (filters.time === "5–10 min" && (timeValue < 5 || timeValue > 10)) return false;
      if (filters.time === "10–15 min" && (timeValue < 10 || timeValue > 15)) return false;
      if (filters.time === "> 15 min" && timeValue <= 15) return false;
    }

    // 7. Filtro de Recompensa
    if (filters.reward) {
      const rewardValue = s.tokenReward || 0;
      
      if (filters.reward === "5+ tokens" && rewardValue < 5) return false;
      if (filters.reward === "8+ tokens" && rewardValue < 8) return false;
      if (filters.reward === "10+ tokens" && rewardValue < 10) return false;
      if (filters.reward === "15+ tokens" && rewardValue < 15) return false;
    }

    return true;
  });

  const trendingSurveys = surveys.filter((s) => s.status === "Ativa" && s.trending).slice(0, 3);

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground">HUB</h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "14px" }}>
            {t("home.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#6366f1]/10 flex items-center justify-center">
                <Coins size={16} className="text-[#6366f1]" />
              </div>
              <div>
                <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Carteira</p>
                <p className="text-foreground" style={{ fontSize: "16px", fontWeight: 600 }}>{tokenBalance}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${userLevel.color}15` }}>
                <span style={{ fontSize: "14px" }}>{userLevel.icon === "compass" ? "🧭" : userLevel.icon === "handshake" ? "🤝" : userLevel.icon === "award" ? "🏆" : userLevel.icon === "shield-check" ? "🛡" : "👑"}</span>
              </div>
              <div>
                <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Nível</p>
                <p className="text-foreground" style={{ fontSize: "13px", fontWeight: 600 }}>{userLevel.name}</p>
                <p className="text-muted-foreground" style={{ fontSize: "11px" }}>
                  {xpTotal} XP · {xpRange} · {xpToNextLevel} XP restantes
                </p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-[#6366f1] transition-all" style={{ width: `${Math.min(100, Math.max(0, xpProgressPercent))}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/criar-pesquisa")}
          className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e6] text-white px-5 py-2.5 rounded-xl transition-colors"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <PlusCircle size={16} />
          {t("home.createSurvey")}
        </button>
        <button
          onClick={() => navigate("/marketplace")}
          className="flex items-center gap-2 bg-card border border-border text-foreground px-5 py-2.5 rounded-xl hover:bg-secondary transition-colors hidden"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <Store size={16} />
          Marketplace
        </button>
        <button
          onClick={() => navigate("/minhas-pesquisas")}
          className="flex items-center gap-2 bg-card border border-border text-foreground px-5 py-2.5 rounded-xl hover:bg-secondary transition-colors"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <FolderOpen size={16} />
          {t("nav.mySurveys")}
        </button>
      </div>

{/* Search Bar Única */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("explore.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
          style={{ fontSize: "14px" }}
        />
      </div>

      {/* Chips de Filtros Ativos (só aparecem se houver algo filtrado) + Botão de Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {hasFilters && (
          <>
            {filters.category && (
              <span className="flex items-center gap-1.5 bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] px-3 py-1.5 rounded-lg" style={{ fontSize: "12px", fontWeight: 500 }}>
                Categoria: {filters.category} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setFilters({ category: "" })} />
              </span>
            )}
            {filters.state && (
              <span className="flex items-center gap-1.5 bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] px-3 py-1.5 rounded-lg" style={{ fontSize: "12px", fontWeight: 500 }}>
                Estado: {filters.state} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setFilters({ state: "", city: "" })} />
              </span>
            )}
            {filters.city && (
              <span className="flex items-center gap-1.5 bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] px-3 py-1.5 rounded-lg" style={{ fontSize: "12px", fontWeight: 500 }}>
                Cidade: {filters.city} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setFilters({ city: "" })} />
              </span>
            )}
            {filters.time && (
              <span className="flex items-center gap-1.5 bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] px-3 py-1.5 rounded-lg" style={{ fontSize: "12px", fontWeight: 500 }}>
                <Clock size={12} /> {filters.time} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setFilters({ time: "" })} />
              </span>
            )}
            {filters.reward && (
              <span className="flex items-center gap-1.5 bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] px-3 py-1.5 rounded-lg" style={{ fontSize: "12px", fontWeight: 500 }}>
                <Coins size={12} /> {filters.reward} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setFilters({ reward: "" })} />
              </span>
            )}
            <button onClick={clearFilters} className="text-muted-foreground hover:text-foreground underline ml-1" style={{ fontSize: "12px" }}>
              Limpar todos
            </button>
          </>
        )}

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border transition-colors ${
            showFilters || hasFilters
              ? "border-[#6366f1] bg-[#6366f1]/5 text-[#6366f1]"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
          style={{ fontSize: "12px", fontWeight: 500 }}
        >
          <Filter size={13} />
          {t("home.filters")}
          {activeFilterCount > 0 && (
            <span className="bg-[#6366f1] text-white px-1.5 py-0.5 rounded-full" style={{ fontSize: "10px", fontWeight: 600 }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
         <div className="bg-card border border-border rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>
              {t("home.filters")} — {filteredSurveys.length} {t("home.results")}
            </span>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-[#6366f1] hover:text-[#5558e6] transition-colors" style={{ fontSize: "12px", fontWeight: 500 }}>
                <X size={12} /> {t("home.clearFilters")}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <FilterSelect label={t("home.category")} value={filters.category} onChange={(v) => setFilters({ category: v })} options={[...categories]} />
            <div className="min-w-[140px]">
              <select value={filters.state} onChange={(e) => setFilters({ state: e.target.value, city: "" })} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground appearance-none cursor-pointer" style={{ fontSize: "13px" }}>
                <option value="">{t("home.state")}</option>
                {brazilianStates.map((s) => (<option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>))}
              </select>
            </div>
            <div className="min-w-[160px]">
              <CityAutocomplete stateUf={filters.state} value={filters.city} onChange={(city) => setFilters({ city })} placeholder={t("home.city")} />
            </div>
            <FilterSelect label={t("home.time")} value={filters.time} onChange={(v) => setFilters({ time: v })} options={timeOptions} />
            <FilterSelect label={t("home.reward")} value={filters.reward} onChange={(v) => setFilters({ reward: v })} options={rewardOptions} />
          </div>
        </div>
      )}

      {/* Trending Section */}
      {!searchQuery && activeCategories.length === 0 && trendingSurveys.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={16} className="text-[#f97316]" />
            <h2 style={{ fontSize: "16px", fontWeight: 600 }}>Pesquisas em Tendência</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {trendingSurveys.map((survey) => {
              const answered = answeredSurveys.includes(survey.id);
              return (
                <button
                  key={survey.id}
                  onClick={() => !answered && survey.eligible ? navigate(`/responder/${survey.id}`) : undefined}
                  className="bg-gradient-to-br from-[#312e81]/5 to-[#6366f1]/5 dark:from-[#312e81]/20 dark:to-[#6366f1]/20 border border-[#6366f1]/20 rounded-xl p-4 hover:shadow-md transition-shadow text-left relative"
                >
                  {answered && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[#6366f1]" style={{ fontSize: "10px", fontWeight: 600 }}>
                      <Check size={10} /> Respondida
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-[#f97316]" />
                      <span className="text-[#f97316]" style={{ fontSize: "11px", fontWeight: 600 }}>Em Tendência</span>
                    </div>
                    {survey.trendGrowth && (
                      <span className="flex items-center gap-0.5 bg-[#f97316]/10 text-[#f97316] px-2 py-0.5 rounded-full" style={{ fontSize: "10px", fontWeight: 600 }}>
                        <ArrowUpRight size={10} /> {survey.trendGrowth} esta semana
                      </span>
                    )}
                  </div>
                  <span className="bg-[#6366f1]/10 text-[#6366f1] px-2 py-0.5 rounded-md inline-block mb-2" style={{ fontSize: "10px", fontWeight: 600 }}>
                    {survey.category}
                  </span>
                  <h4 className="text-foreground mb-2" style={{ fontSize: "14px" }}>{survey.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6366f1]" style={{ fontSize: "12px", fontWeight: 500 }}>
                      {survey.tokenReward} tokens
                    </span>
                    <span className="text-muted-foreground" style={{ fontSize: "11px" }}>
                      {survey.estimatedTime}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin"></div>
            <span style={{ fontSize: "14px" }}>Carregando formulários...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <XCircle size={16} />
            <span style={{ fontSize: "13px" }}>{error}</span>
          </div>
        </div>
      )}

      {/* Survey Cards */}
      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredSurveys.map((survey) => (
            <SurveyCard key={survey.id} survey={survey} answered={answeredSurveys.includes(survey.id)} t={t} navigate={navigate} />
          ))}
        </div>
      )}

      {!loading && filteredSurveys.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground" style={{ fontSize: "14px" }}>{t("explore.noResults")}</p>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="bg-input-background border border-border rounded-lg px-3 py-2 text-foreground appearance-none cursor-pointer min-w-[140px] disabled:opacity-40" style={{ fontSize: "13px" }}>
      <option value="">{label}</option>
      {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
    </select>
  );
}

function SurveyCard({ survey, answered, t, navigate }: { survey: Survey; answered: boolean; t: (k: string) => string; navigate: (p: string) => void }) {
  const progressPercent = Math.round((survey.responses / survey.targetResponses) * 100);

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow relative group">
      {survey.trending && (
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#f97316]/10 text-[#f97316] px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 600 }}>
          <TrendingUp size={11} />
          Em Tendência
        </div>
      )}
      {!survey.trending && survey.boosted && (
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#92400e] dark:text-[#fbbf24] px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 600 }}>
          <Sparkles size={11} />
          {t("home.featured")}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="bg-[#6366f1]/10 text-[#6366f1] px-2.5 py-1 rounded-md" style={{ fontSize: "11px", fontWeight: 600 }}>
          {survey.category}
        </span>
        {answered && (
          <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1" style={{ fontSize: "10px", fontWeight: 600 }}>
            <Check size={10} /> Respondida
          </span>
        )}
      </div>

      <h3 className="text-foreground mb-3 pr-20" style={{ fontSize: "15px" }}>{survey.title}</h3>

      <div className="flex flex-wrap items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "12px" }}>
          <Clock size={13} /> {survey.estimatedTime}
        </span>
        <span className="flex items-center gap-1.5 text-[#6366f1]" style={{ fontSize: "12px", fontWeight: 500 }}>
          <Coins size={13} /> {survey.tokenReward} tokens
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "12px" }}>
          <Users size={13} /> {survey.responses} {t("home.responses")}
        </span>
      </div>

      <div className="w-full bg-secondary rounded-full h-1.5 mb-3">
        <div className="bg-[#6366f1] h-1.5 rounded-full transition-all" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        <Target size={12} className="text-muted-foreground" />
        <span className="text-muted-foreground" style={{ fontSize: "12px" }}>{survey.segmentation}</span>
      </div>

      <div className="flex items-center justify-between">
        {answered ? (
          <span className="flex items-center gap-1.5 text-emerald-600" style={{ fontSize: "12px", fontWeight: 500 }}>
            <Check size={14} /> Respondida
          </span>
        ) : survey.eligible ? (
          <span className="flex items-center gap-1.5 text-emerald-600" style={{ fontSize: "12px", fontWeight: 500 }}>
            <CheckCircle2 size={14} /> {t("home.eligible")}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-red-500" style={{ fontSize: "12px", fontWeight: 500 }}>
            <XCircle size={14} /> {t("home.notEligible")}
          </span>
        )}
        <button
          className={`px-4 py-2 rounded-lg transition-colors ${
            answered ? "bg-secondary text-muted-foreground cursor-not-allowed"
            : survey.eligible ? "bg-[#6366f1] hover:bg-[#5558e6] text-white"
            : "bg-secondary text-muted-foreground cursor-not-allowed"
          }`}
          style={{ fontSize: "13px", fontWeight: 500 }}
          disabled={!survey.eligible || answered}
          onClick={() => navigate(`/responder/${survey.id}`)}
        >
          {answered ? "Respondida" : t("home.respond")}
        </button>
      </div>
    </div>
  );
}
