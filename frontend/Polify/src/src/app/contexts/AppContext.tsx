import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  currentUser, surveys as defaultSurveys, tokenHistory as defaultTokenHistory,
  mySurveys as defaultMySurveys, type Survey, type TokenTransaction, type UserProfile,
  type Demographics, type TrustScoreData, type GamificationLevel, getDefaultTrustScore,
  computeStarsFromStructuredRating, gamificationLevels, URL_backend,
} from "../data/mockData";
import translations, { type Lang } from "../i18n/translations";


// ── Types ──
export interface User {
  id?: number;
  nome?: string;
  email: string;
  telefone?: string; 
  phone?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | User | null;
}

interface MySurvey {
  id: string;
  title: string;
  description?: string;
  status: "Ativa" | "Rascunho" | "Encerrada";
  responses: number;
  targetResponses: number;
  segmentation: string;
  estimatedTime?: string;
  tokenReward?: number;
  createdAt: string;
  source?: "created" | "marketplace";
  avgQuality?: number;
  validResponses?: number;
}

interface AppState {
  auth: AuthState;
  tokenBalance: number;
  avgRating: number;
  surveys: Survey[];
  mySurveys: MySurvey[];
  tokenHistory: TokenTransaction[];
  answeredSurveys: string[];
  respondentRatings: Record<string, Record<string, boolean>>;
  demographics: Demographics;
  trustScore: TrustScoreData;
  totalResponses: number;
  xpTotal: number;
  xpLevelId: string;
  xpRange: string;
  xpToNextLevel: number;
  xpProgressPercent: number;
  onboardingComplete: boolean;
  purchasedInsights: string[];
  theme: "light" | "dark";
  lang: Lang;
  filters: {
    category: string;
    state: string;
    city: string;
    time: string;
    reward: string;
  };
  lgpdDeletionStatus: "none" | "pending" | "completed";
}

interface AppContextType extends AppState {
  user: User | null; 
  setUser: (user: User | null) => void; 
  t: (key: string, replacements?: Record<string, string>) => string;
  login: (email: string, password: string) => Promise<boolean>;
  loginGoogle: (accessToken: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; message?: string; status?: number }>;
  logout: () => void;
  fetchForms: () => Promise<boolean>;
  fetchFormDetails: (formId: string) => Promise<{ success: boolean; form?: any; message?: string }>;
  fetchMySurveys: (status?: string, category?: string) => Promise<boolean>;
  createForm: (formData: {
    nome_formulario: string;
    descricao_formulario?: string;
    categoria: string;
    min_respondentes?: number;
    tempo_max_dias?: number;
    pontos_base?: number;
  }) => Promise<{ success: boolean; form?: any; message?: string }>;
  setTheme: (theme: "light" | "dark") => void;
  setLang: (lang: Lang) => void;
  setFilters: (filters: Partial<AppState["filters"]>) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  addTokens: (amount: number, description: string) => Promise<boolean>;
  spendTokens: (amount: number, description: string) => Promise<boolean>;
  answerSurvey: (surveyId: string, responses: Array<{id_perg: number, resposta: string | number | string[]}>) => Promise<{success: boolean, message: string}>;
  publishSurvey: (survey: Omit<MySurvey, "id" | "responses" | "createdAt" | "source" | "avgQuality" | "validResponses">, cost: number, feedSurvey: Omit<Survey, "id">) => boolean;
  deleteSurvey: (id: string) => Promise<boolean>;
  duplicateSurvey: (id: string) => void;
  boostSurvey: (id: string) => Promise<boolean>;
  deleteAccount: () => void;
  changePassword: (currentPass: string, newPass: string) => boolean;
  rateRespondent: (respondentId: string, answers: Record<string, boolean>) => void;
  updateDemographics: (data: Partial<Demographics>) => void;
  completeOnboarding: () => void;
  purchaseInsight: (id: string, price: number) => Promise<boolean>;
  addMarketplaceSurvey: (title: string, id: string) => void;
  requestDataDeletion: () => void;
  downloadUserData: () => void;
  userLevel: GamificationLevel;
}

const defaultFilters = { category: "", state: "", city: "", time: "", reward: "" };

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ── Provider ──
export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = localStorage.getItem("polify_auth");
    if (stored) { try { return JSON.parse(stored); } catch { /* noop */ } }
    return { isAuthenticated: false, user: null };
  });

  const setUser = useCallback((newUser: User | null) => {
    setAuth(prev => {
      const updatedAuth = { ...prev, user: newUser };
      localStorage.setItem("polify_auth", JSON.stringify(updatedAuth));
      return updatedAuth;
    });
  }, []);

  const [tokenBalance, setTokenBalance] = useState(() => {
    const v = localStorage.getItem("polify_tokens");
    return v ? Number(v) : currentUser.tokenBalance;
  });

  const [avgRating, setAvgRating] = useState(() => {
    const v = localStorage.getItem("polify_avgRating");
    return v ? Number(v) : 4.4;
  });

  const [surveys, setSurveys] = useState<Survey[]>(() => {
    const v = localStorage.getItem("polify_surveys");
    if (v) try { return JSON.parse(v); } catch { /* noop */ }
    return defaultSurveys;
  });

  const [mySurveysList, setMySurveysList] = useState<MySurvey[]>(() => {
    const v = localStorage.getItem("polify_mySurveys");
    if (v) try { return JSON.parse(v); } catch { /* noop */ }
    return defaultMySurveys.map(s => ({ ...s, source: "created" as const, avgQuality: 4.2, validResponses: Math.round(s.responses * 0.85) }));
  });

  const [tokenHistoryList, setTokenHistory] = useState<TokenTransaction[]>(() => {
    const v = localStorage.getItem("polify_tokenHistory");
    if (v) try { return JSON.parse(v); } catch { /* noop */ }
    return defaultTokenHistory;
  });

  const [answeredSurveys, setAnsweredSurveys] = useState<string[]>(() => {
    const v = localStorage.getItem("polify_answered");
    if (v) try { return JSON.parse(v); } catch { /* noop */ }
    return [];
  });

  const [respondentRatings, setRespondentRatings] = useState<Record<string, Record<string, boolean>>>(() => {
    const v = localStorage.getItem("polify_respondentRatings");
    if (v) try { return JSON.parse(v); } catch { /* noop */ }
    return {};
  });

  const [demographics, setDemographics] = useState<Demographics>(() => {
    const v = localStorage.getItem("polify_demographics");
    if (v) try { return JSON.parse(v); } catch { /* noop */ }
    return currentUser.demographics;
  });

  const [trustScore, setTrustScore] = useState<TrustScoreData>(() => {
    const v = localStorage.getItem("polify_trustScore");
    if (v) try { return JSON.parse(v); } catch { /* noop */ }
    return getDefaultTrustScore();
  });

  const [totalResponses, setTotalResponses] = useState(() => {
    const v = localStorage.getItem("polify_totalResponses");
    return v ? Number(v) : 156;
  });

  const [xpTotal, setXpTotal] = useState(() => {
    const v = localStorage.getItem("polify_xpTotal");
    return v ? Number(v) : 0;
  });

  const [xpLevelId, setXpLevelId] = useState(() => {
    return localStorage.getItem("polify_xpLevelId") || "iniciante";
  });

  const [xpRange, setXpRange] = useState(() => {
    return localStorage.getItem("polify_xpRange") || "0-99 XP";
  });

  const [xpToNextLevel, setXpToNextLevel] = useState(() => {
    const v = localStorage.getItem("polify_xpToNextLevel");
    return v ? Number(v) : 100;
  });

  const [xpProgressPercent, setXpProgressPercent] = useState(() => {
    const v = localStorage.getItem("polify_xpProgressPercent");
    return v ? Number(v) : 0;
  });

  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    return localStorage.getItem("polify_onboarding") === "true";
  });

  const [purchasedInsights, setPurchasedInsights] = useState<string[]>(() => {
    const v = localStorage.getItem("polify_purchasedInsights");
    if (v) try { return JSON.parse(v); } catch { /* noop */ }
    return [];
  });

  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("polify_theme") as "light" | "dark") || "light";
  });

  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("polify_lang") as Lang) || "pt-BR";
  });

  const [filters, setFiltersState] = useState<AppState["filters"]>(() => {
    const v = localStorage.getItem("polify_filters");
    if (v) try { return JSON.parse(v); } catch { /* noop */ }
    return defaultFilters;
  });

  const [lgpdDeletionStatus, setLgpdDeletionStatus] = useState<"none" | "pending" | "completed">(() => {
    return (localStorage.getItem("polify_lgpdDeletion") as "none" | "pending" | "completed") || "none";
  });

  // Persist to localStorage
  useEffect(() => { localStorage.setItem("polify_auth", JSON.stringify(auth)); }, [auth]);
  useEffect(() => { localStorage.setItem("polify_tokens", String(tokenBalance)); }, [tokenBalance]);
  useEffect(() => { localStorage.setItem("polify_avgRating", String(avgRating)); }, [avgRating]);
  useEffect(() => { localStorage.setItem("polify_surveys", JSON.stringify(surveys)); }, [surveys]);
  useEffect(() => { localStorage.setItem("polify_mySurveys", JSON.stringify(mySurveysList)); }, [mySurveysList]);
  useEffect(() => { localStorage.setItem("polify_tokenHistory", JSON.stringify(tokenHistoryList)); }, [tokenHistoryList]);
  useEffect(() => { localStorage.setItem("polify_answered", JSON.stringify(answeredSurveys)); }, [answeredSurveys]);
  useEffect(() => { localStorage.setItem("polify_respondentRatings", JSON.stringify(respondentRatings)); }, [respondentRatings]);
  useEffect(() => { localStorage.setItem("polify_demographics", JSON.stringify(demographics)); }, [demographics]);
  useEffect(() => { localStorage.setItem("polify_trustScore", JSON.stringify(trustScore)); }, [trustScore]);
  useEffect(() => { localStorage.setItem("polify_totalResponses", String(totalResponses)); }, [totalResponses]);
  useEffect(() => { localStorage.setItem("polify_xpTotal", String(xpTotal)); }, [xpTotal]);
  useEffect(() => { localStorage.setItem("polify_xpLevelId", xpLevelId); }, [xpLevelId]);
  useEffect(() => { localStorage.setItem("polify_xpRange", xpRange); }, [xpRange]);
  useEffect(() => { localStorage.setItem("polify_xpToNextLevel", String(xpToNextLevel)); }, [xpToNextLevel]);
  useEffect(() => { localStorage.setItem("polify_xpProgressPercent", String(xpProgressPercent)); }, [xpProgressPercent]);
  useEffect(() => { localStorage.setItem("polify_onboarding", String(onboardingComplete)); }, [onboardingComplete]);
  useEffect(() => { localStorage.setItem("polify_purchasedInsights", JSON.stringify(purchasedInsights)); }, [purchasedInsights]);
  useEffect(() => { localStorage.setItem("polify_filters", JSON.stringify(filters)); }, [filters]);
  useEffect(() => { localStorage.setItem("polify_lgpdDeletion", lgpdDeletionStatus); }, [lgpdDeletionStatus]);

  useEffect(() => {
    localStorage.setItem("polify_theme", theme);
    if (theme === "dark") { document.documentElement.classList.add("dark"); }
    else { document.documentElement.classList.remove("dark"); }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("polify_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Translation
  const t = useCallback((key: string, replacements?: Record<string, string>) => {
    let str = translations[lang]?.[key] || translations["pt-BR"]?.[key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  }, [lang]);

  // Calculate if a survey is trending based on progress and response count
  // Trending if: responses >= 40% of target AND responses >= 3
  const calculateTrending = (responses: number, targetResponses: number): boolean => {
    const progressPercent = (responses / targetResponses) * 100;
    return progressPercent >= 40 && responses >= 3;
  };

  const fetchUserProgress = useCallback(async (userId: number) => {
    try {
      const response = await fetch(`${URL_backend}/api/users/${userId}/progress`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (data.success && data.progress) {
        setXpTotal(data.progress.xp_total || 0);
        setXpLevelId(data.progress.level_id || "iniciante");
        setXpRange(data.progress.faixa_atual || "0-99 XP");
        setXpToNextLevel(data.progress.xp_para_proximo_nivel ?? 0);
        setXpProgressPercent(data.progress.progress_percent ?? 0);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Erro ao buscar progresso do usuário:", error);
      return false;
    }
  }, []);

  // Fetch forms from backend
  const fetchForms = useCallback(async () => {
    try {
      const response = await fetch(`${URL_backend}/api/forms`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (data.success) {
        // Transform backend data to match frontend Survey type
        const transformedSurveys: Survey[] = data.forms.map((form: any) => ({
          id: form.id.toString(),
          title: form.nome_formulario,
          category: form.categoria,
          description: form.descricao_formulario || "",
          tokenReward: form.pontos_base || 0,
          estimatedTime: `${Math.max(5, Math.floor(form.total_questions * 2))} min`, // Estimate based on questions
          responses: form.responses || 0, // Real response count from backend
          targetResponses: form.min_respondentes || 50,
          status: "Ativa",
          eligible: true,
          trending: calculateTrending(form.responses || 0, form.min_respondentes || 50),
          boosted: Math.random() > 0.8, // Random boosted
          segmentation: "Geral",
          creator: form.criador_nome,
          createdAt: new Date(form.created_at).toLocaleDateString('pt-BR')
        }));

        setSurveys(transformedSurveys);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Erro ao buscar formulários:", error);
      return false;
    }
  }, []);

  // Fetch form details from backend
  const fetchFormDetails = useCallback(async (formId: string) => {
    try {
      const response = await fetch(`${URL_backend}/api/forms/${formId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, form: data.form };
      }

      return { success: false, message: data.message || "Erro ao buscar detalhes do formulário" };
    } catch (error) {
      console.error("Erro ao buscar detalhes do formulário:", error);
      return { success: false, message: "Erro ao conectar com o servidor" };
    }
  }, []);

  // Fetch user's surveys from backend
  const fetchMySurveys = useCallback(async (status?: string, category?: string) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (category) params.append('categoria', category);
      // Send current user ID to backend for proper data isolation
      // Priority: 1) auth.user.id (real logged user), 2) currentUser.id (fallback)
      const userId = auth.user?.id || currentUser.id;
      params.append('user_id', String(userId));
      console.log('Fetching surveys for user_id:', userId); // Debug log
      
      const response = await fetch(`${URL_backend}/api/my-surveys?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (data.success) {
        // Transform backend data to match frontend MySurvey type (accept both portuguese and english keys)
        const transformedSurveys: MySurvey[] = data.surveys.map((survey: any) => ({
          id: String(survey.id),
          title: survey.title || survey.nome_formulario || "",
          category: survey.category || survey.categoria || "",
          description: survey.description || survey.descricao_formulario || "",
          tokenReward: survey.tokenReward ?? survey.pontos_base ?? 0,
          estimatedTime: `${Math.max(5, Math.floor((survey.total_questions || 0) * 2))} min`,
          responses: survey.responses ?? survey.total_responses ?? 0,
          targetResponses: survey.targetResponses ?? survey.min_respondentes ?? 50,
          status: survey.status || (survey.is_active ? "Ativa" : "Encerrada"),
          eligible: true,
          trending: calculateTrending(survey.responses ?? survey.total_responses ?? 0, survey.targetResponses ?? survey.min_respondentes ?? 50),
          boosted: Math.random() > 0.8,
          segmentation: survey.segmentation || "Geral",
          createdAt: new Date(survey.createdAt || survey.created_at).toLocaleDateString('pt-BR'),
          source: survey.source || "created",
          avgQuality: null,
          validResponses: null
        }));

        setMySurveysList(transformedSurveys.map(s => ({ ...s, source: "created" as const, avgQuality: 4.2, validResponses: Math.round(s.responses * 0.85) })));
        return true;
      }

      return false;
    } catch (error) {
      console.error("Erro ao buscar minhas pesquisas:", error);
      return false;
    }
  }, [auth.user?.id]);

  // Create form in backend
  const createForm = useCallback(async (formData: {
    nome_formulario: string;
    descricao_formulario?: string;
    categoria: string;
    min_respondentes?: number;
    tempo_max_dias?: number;
    pontos_base?: number;
  }) => {
    try {
      const response = await fetch(`${URL_backend}/api/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          id_criador: auth.user?.id || currentUser.id, // Use logged-in user ID with same fallback as fetchMySurveys
          min_respondentes: formData.min_respondentes || 50,
          tempo_max_dias: formData.tempo_max_dias || 30,
          pontos_base: formData.pontos_base || 10
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh forms list to include the new form
        await fetchForms();
        return { success: true, form: data.form };
      }

      return { success: false, message: data.message || "Erro ao criar formulário" };
    } catch (error) {
      console.error("Erro ao criar formulário:", error);
      
      // Log detalhado para diagnóstico
      if (error instanceof Response) {
        console.error("Status:", error.status);
        console.error("StatusText:", error.statusText);
      } else if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      // Manter mensagem amigável para o usuário
      let userMessage = "Erro ao conectar com o servidor";
      if (error instanceof Response && error.status === 404) {
        userMessage = "Serviço indisponível. Tente novamente.";
      } else if (error instanceof Error && error.message.includes("Failed to fetch")) {
        userMessage = "Erro de conexão. Verifique sua internet.";
      }
      
      return { success: false, message: userMessage };
    }
  }, [auth.user?.id, fetchForms]);

  // Auth
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${URL_backend}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (data.success) {
        const authData = {
          isAuthenticated: true,
          user: data.user
        };

        setAuth(authData);
        localStorage.setItem("polify_auth", JSON.stringify(authData));

        return true;
      }

      return false;
    } catch (error) {
      console.error("Erro no login:", error);
      return false;
    }
  };

 const loginGoogle = useCallback(async (accessToken: string): Promise<boolean> => {
  try {
    const response = await fetch(`${URL_backend}/api/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: accessToken,
      }),
    });

    const data = await response.json();

    if (data.success) {
      const authData = {
        isAuthenticated: true,
        user: data.user,
      };

      setAuth(authData);
      localStorage.setItem("polify_auth", JSON.stringify(authData));

      return true;
    }

    return false;
  } catch (error) {
    console.error("Erro no login com Google:", error);
    return false;
  }
}, []);

  const register = async (name: string, email: string, password: string, phone: string): Promise<{ success: boolean; message?: string; status?: number }> => {
    try {
      const response = await fetch(`${URL_backend}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
        }),
      });

      const data = await response.json();
      return {
        success: Boolean(data.success),
        message: data.message || (response.ok ? "Cadastro realizado com sucesso" : "Erro ao criar usuário"),
        status: response.status,
      };
    } catch (error) {
      console.error("Erro no registro:", error);
      return { success: false, message: "Erro ao conectar com o servidor" };
    }
  };

  const logout = useCallback(() => {
    setAuth({ isAuthenticated: false, user: null });
    setTokenBalance(0);
    setAvgRating(0);
    setAnsweredSurveys([]);
    setMySurveysList([]);
    setSurveys(defaultSurveys);
    setTokenHistory([]);
    setRespondentRatings({});
    setDemographics(currentUser.demographics);
    setTrustScore(getDefaultTrustScore());
    setTotalResponses(0);
    setXpTotal(0);
    setXpLevelId("iniciante");
    setXpRange("0-99 XP");
    setXpToNextLevel(100);
    setXpProgressPercent(0);
    setOnboardingComplete(false);
    setPurchasedInsights([]);
    setFiltersState(defaultFilters);
    setLgpdDeletionStatus("none");
    const keys = [
      "polify_auth", "polify_tokens", "polify_avgRating", "polify_answered",
      "polify_mySurveys", "polify_surveys", "polify_tokenHistory", "polify_respondentRatings",
      "polify_demographics", "polify_trustScore", "polify_totalResponses", "polify_xpTotal",
      "polify_xpLevelId", "polify_xpRange", "polify_xpToNextLevel", "polify_xpProgressPercent",
      "polify_onboarding",
      "polify_purchasedInsights", "polify_filters", "polify_lgpdDeletion",
    ];
    keys.forEach(k => localStorage.removeItem(k));
  }, []);

  const setTheme = useCallback((t: "light" | "dark") => setThemeState(t), []);
  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const setFilters = useCallback((partial: Partial<AppState["filters"]>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  }, []);
  const clearFilters = useCallback(() => setFiltersState(defaultFilters), []);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Tokens
  const addTokens = useCallback(async (amount: number, description: string): Promise<boolean> => {
    const userId = auth.user?.id || currentUser.id;

    try {
      const response = await fetch(`${URL_backend}/api/wallet/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount, reason: description })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error("Erro ao creditar tokens:", data.message);
        return false;
      }

      setTokenBalance(data.balance);
      setTokenHistory(prev => [{
        id: `t${Date.now()}`, type: "earned", amount, description,
        date: new Date().toISOString().split("T")[0],
      }, ...prev]);
      return true;
    } catch (error) {
      console.error("Erro ao creditar tokens:", error);
      return false;
    }
  }, [auth.user?.id]);

  const spendTokens = useCallback(async (amount: number, description: string): Promise<boolean> => {
    const userId = auth.user?.id || currentUser.id;

    try {
      const response = await fetch(`${URL_backend}/api/wallet/debit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount, reason: description })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error("Erro ao debitar tokens:", data.message);
        return false;
      }

      setTokenBalance(data.balance);
      setTokenHistory(prev => [{
        id: `t${Date.now()}`, type: "spent", amount, description,
        date: new Date().toISOString().split("T")[0],
      }, ...prev]);
      return true;
    } catch (error) {
      console.error("Erro ao debitar tokens:", error);
      return false;
    }
  }, [auth.user?.id]);

  // Survey answering
  const answerSurvey = useCallback(async (surveyId: string, responses: Array<{id_perg: number, resposta: string | number | string[]}>) => {
    try {
      // Obter ID do usuário logado
      const userId = auth.user?.id || currentUser.id;
      
      const response = await fetch(`${URL_backend}/api/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id_user: userId,
          survey_id: surveyId,
          responses: responses
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.xp_total !== undefined) setXpTotal(data.xp_total);
        if (data.level_id) setXpLevelId(data.level_id);
        if (data.faixa_atual) setXpRange(data.faixa_atual);
        if (data.xp_para_proximo_nivel !== undefined) setXpToNextLevel(data.xp_para_proximo_nivel);
        if (data.progress_percent !== undefined) setXpProgressPercent(data.progress_percent);

        // Atualizar estado local apenas se backend salvar com sucesso
        setAnsweredSurveys(prev => [...prev, surveyId]);
        setSurveys(prev => prev.map(s =>
          s.id === surveyId ? { ...s, responses: s.responses + 1 } : s
        ));
        setTotalResponses(prev => prev + 1);
        
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Erro ao salvar respostas" };
      }
    } catch (error) {
      console.error("Erro ao salvar respostas:", error);
      return { success: false, message: "Erro ao conectar com o servidor" };
    }
  }, [auth.user?.id]);

  const userLevel = gamificationLevels.find(level => level.id === xpLevelId) || gamificationLevels[0];

  useEffect(() => {
    const userId = auth.user?.id;

    if (!userId) {
      setXpTotal(0);
      setXpLevelId("iniciante");
      setXpRange("0-99 XP");
      setXpToNextLevel(100);
      setXpProgressPercent(0);
      return;
    }

    fetchUserProgress(userId);
  }, [auth.user?.id, fetchUserProgress]);

  // Publish survey
  const publishSurvey = useCallback((survey: Omit<MySurvey, "id" | "responses" | "createdAt" | "source" | "avgQuality" | "validResponses">, cost: number, feedSurvey: Omit<Survey, "id">): boolean => {
    if (tokenBalance < cost) return false;
    const id = `ms${Date.now()}`;
    const newMySurvey: MySurvey = {
      ...survey, id, responses: 0,
      createdAt: new Date().toISOString().split("T")[0],
      source: "created", avgQuality: 0, validResponses: 0,
    };
    setMySurveysList(prev => [newMySurvey, ...prev]);
    const newFeedSurvey: Survey = { ...feedSurvey, id: `s${Date.now()}` };
    setSurveys(prev => [newFeedSurvey, ...prev]);
    spendTokens(cost, `Publicou: ${survey.title}`);
    return true;
  }, [tokenBalance, spendTokens]);

  const deleteSurvey = useCallback(async (id: string) => {
  try {
    const response = await fetch(`${URL_backend}/api/forms/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (data.success) {
      // Only remove from state after successful backend deletion
      setMySurveysList(prev => prev.filter(s => s.id !== id));
      return true;
    } else {
      console.error("Erro ao deletar formulário:", data.message);
      return false;
    }
  } catch (error) {
    console.error("Erro ao conectar com o servidor:", error);
    return false;
  }
}, []);

  const duplicateSurvey = useCallback((id: string) => {
    setMySurveysList(prev => {
      const original = prev.find(s => s.id === id);
      if (!original) return prev;
      return [{
        ...original, id: `ms${Date.now()}`, title: `${original.title} (cópia)`,
        status: "Rascunho" as const, responses: 0,
        createdAt: new Date().toISOString().split("T")[0],
        source: "created", avgQuality: 0, validResponses: 0,
      }, ...prev];
    });
  }, []);

  const boostSurvey = useCallback(async (id: string): Promise<boolean> => {
    const survey = mySurveysList.find(s => s.id === id);
    if (!survey || survey.responses < 20) return false;
    return await spendTokens(10, `Boost: ${survey.title}`);
  }, [mySurveysList, spendTokens]);

  const deleteAccount = useCallback(() => {
    localStorage.clear();
    setAuth({ isAuthenticated: false, user: null });
  }, []);

  const changePassword = useCallback((currentPass: string, newPass: string): boolean => {
    if (currentPass.length < 6 || newPass.length < 6) return false;
    return true;
  }, []);

  // Rate respondent with structured questions
  const rateRespondent = useCallback((respondentId: string, answers: Record<string, boolean>) => {
    setRespondentRatings(prev => ({ ...prev, [respondentId]: answers }));
    // Update avg rating based on all ratings
    const stars = computeStarsFromStructuredRating(answers);
    setAvgRating(prev => {
      const total = Object.keys(respondentRatings).length;
      return total > 0 ? Math.round(((prev * total + stars) / (total + 1)) * 10) / 10 : stars;
    });
  }, [respondentRatings]);

  // Demographics
  const updateDemographics = useCallback((data: Partial<Demographics>) => {
    setDemographics(prev => ({ ...prev, ...data }));
  }, []);

  // Onboarding
  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
  }, []);

  // Purchase insight
  const purchaseInsight = useCallback(async (id: string, price: number): Promise<boolean> => {
    const success = await spendTokens(price, `Insight Polify: compra`);
    if (success) {
      setPurchasedInsights(prev => [...prev, id]);
    }
    return success;
  }, [spendTokens]);

  // Add marketplace survey to my surveys
  const addMarketplaceSurvey = useCallback((title: string, id: string) => {
    setMySurveysList(prev => [{
      id: `mkp_${id}`, title, status: "Encerrada" as const,
      responses: 0, targetResponses: 0, segmentation: "Marketplace",
      createdAt: new Date().toISOString().split("T")[0],
      source: "marketplace", avgQuality: 4.5, validResponses: 0,
    }, ...prev]);
  }, []);

  // LGPD
  const requestDataDeletion = useCallback(() => { setLgpdDeletionStatus("pending"); }, []);

  const downloadUserData = useCallback(() => {
    const userData = {
      profile: auth.user, avgRating, tokenBalance, answeredSurveys,
      demographics, trustScore, totalResponses,
      xpTotal, xpLevelId, xpRange, xpToNextLevel, xpProgressPercent,
      tokenHistory: tokenHistoryList, mySurveys: mySurveysList,
      respondentRatings, exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `polify-meus-dados-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [auth.user, avgRating, tokenBalance, answeredSurveys, demographics, trustScore, totalResponses, tokenHistoryList, mySurveysList, respondentRatings]);

  const value: AppContextType = {
    user: auth.user as User | null,
    setUser,
    auth, tokenBalance, avgRating, surveys, mySurveys: mySurveysList,
    tokenHistory: tokenHistoryList, answeredSurveys, respondentRatings,
    demographics, trustScore, totalResponses, xpTotal, xpLevelId, xpRange, xpToNextLevel, xpProgressPercent,
    onboardingComplete, purchasedInsights,
    theme, lang, filters, lgpdDeletionStatus,
    t, login, loginGoogle, register, logout, fetchForms, fetchFormDetails, fetchMySurveys, createForm,
    setTheme, setLang, setFilters, clearFilters, activeFilterCount,
    addTokens, spendTokens, answerSurvey, publishSurvey,
    deleteSurvey, duplicateSurvey, boostSurvey,
    deleteAccount, changePassword, rateRespondent,
    updateDemographics, completeOnboarding, purchaseInsight, addMarketplaceSurvey,
    requestDataDeletion, downloadUserData, userLevel,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}