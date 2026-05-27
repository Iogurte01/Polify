export const URL_backend = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

export const categories = [
  "Pesquisa de Mercado",
  "Acadêmica",
  "Moda",
  "Tecnologia",
  "Saúde",
  "Comportamento do Consumidor",
  "Estudos Regionais",
  "Startups",
  "Entretenimento",
  "Alimentação",
  "Beleza e Cosméticos",
  "Educação",
  "Finanças",
  "Sustentabilidade",
  "Cultura",
] as const;

export const brazilianStates = [
  { uf: "AC", name: "Acre" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" },
  { uf: "BA", name: "Bahia" },
  { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espírito Santo" },
  { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Pará" },
  { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" },
] as const;

export const citiesByState: Record<string, string[]> = {
  AC: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"],
  AL: ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "Penedo"],
  AP: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"],
  AM: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tefé"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Lauro de Freitas", "Juazeiro", "Ilhéus", "Jequié", "Barreiras"],
  CE: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu"],
  DF: ["Brasília", "Ceilândia", "Taguatinga", "Samambaia", "Plano Piloto", "Gama", "Águas Claras"],
  ES: ["Vitória", "Vila Velha", "Serra", "Cariacica", "Cachoeiro de Itapemirim", "Linhares", "São Mateus", "Colatina"],
  GO: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade"],
  MA: ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó", "Paço do Lumiar", "Açailândia"],
  MT: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Cáceres", "Sorriso", "Lucas do Rio Verde"],
  MS: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Naviraí", "Nova Andradina", "Aquidauana"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga", "Sete Lagoas", "Divinópolis", "Santa Luzia", "Poços de Caldas", "Patos de Minas", "Teófilo Otoni", "Pouso Alegre", "Barbacena", "Varginha"],
  PA: ["Belém", "Ananindeua", "Santarém", "Marabá", "Castanhal", "Parauapebas", "Abaetetuba", "Cametá", "Marituba"],
  PB: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cajazeiras", "Cabedelo"],
  PR: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá", "Araucária", "Toledo", "Apucarana", "Campo Largo"],
  PE: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Garanhuns", "Vitória de Santo Antão"],
  PI: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Campo Maior", "Barras"],
  RJ: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "São João de Meriti", "Campos dos Goytacazes", "Petrópolis", "Volta Redonda", "Magé", "Itaboraí", "Macaé", "Cabo Frio", "Angra dos Reis", "Teresópolis"],
  RN: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba", "Ceará-Mirim", "Caicó", "Açu"],
  RS: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande", "Alvorada", "Passo Fundo", "Sapucaia do Sul", "Cachoeirinha", "Santa Cruz do Sul", "Uruguaiana", "Bento Gonçalves"],
  RO: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Rolim de Moura", "Guajará-Mirim"],
  RR: ["Boa Vista", "Rorainópolis", "Caracaraí", "Alto Alegre", "Pacaraima"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó", "Criciúma", "Itajaí", "Jaraguá do Sul", "Lages", "Palhoça", "Balneário Camboriú", "Brusque", "Tubarão", "São Bento do Sul"],
  SP: ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "São José dos Campos", "Osasco", "Ribeirão Preto", "Sorocaba", "Mauá", "São José do Rio Preto", "Santos", "Mogi das Cruzes", "Diadema", "Jundiaí", "Piracicaba", "Carapicuíba", "Bauru", "Itaquaquecetuba", "São Vicente", "Franca", "Guarujá", "Taubaté", "Praia Grande", "Limeira", "Suzano", "Taboão da Serra", "Sumaré", "Barueri", "Embu das Artes", "Indaiatuba", "Marília", "Araraquara", "Presidente Prudente", "Jacareí", "Americana", "Cotia"],
  SE: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão", "Estância", "Tobias Barreto"],
  TO: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins", "Colinas do Tocantins"],
};

export const ageRanges = [
  "18–24",
  "25–30",
  "31–40",
  "41–50",
  "51–60",
  "60+",
] as const;

export const genders = ["Todos", "Feminino", "Masculino", "Não-binário"] as const;

// ── Gamification Levels ──
export interface GamificationLevel {
  id: string;
  name: string;
  minXp: number;
  tokenMultiplier: number;
  color: string;
  icon: string;
}

export const gamificationLevels: GamificationLevel[] = [
  { id: "iniciante", name: "Iniciante", minXp: 0, tokenMultiplier: 1.0, color: "#6b7280", icon: "compass" },
  { id: "explorador", name: "Explorador", minXp: 100, tokenMultiplier: 1.1, color: "#3b82f6", icon: "handshake" },
  { id: "colaborador", name: "Colaborador", minXp: 200, tokenMultiplier: 1.2, color: "#8b5cf6", icon: "award" },
  { id: "especialista", name: "Especialista", minXp: 300, tokenMultiplier: 1.3, color: "#6366f1", icon: "shield-check" },
  { id: "analista_verificado", name: "Analista Verificado", minXp: 500, tokenMultiplier: 1.5, color: "#f59e0b", icon: "crown" },
];

export function getUserLevel(xpTotal: number): GamificationLevel {
  let level = gamificationLevels[0];
  for (const l of gamificationLevels) {
    if (xpTotal >= l.minXp) level = l;
  }
  return level;
}

// ── Structured Rating Questions ──
export const ratingQuestions = [
  { id: "coherent", text: "A resposta foi coerente?", positive: true },
  { id: "complete", text: "Foi completa?", positive: true },
  { id: "attentive", text: "Demonstrou atenção?", positive: true },
  { id: "automatic", text: "Pareceu automática?", positive: false },
  { id: "value", text: "Agregou valor?", positive: true },
];

export function computeStarsFromStructuredRating(answers: Record<string, boolean>): number {
  let score = 0;
  let total = 0;
  for (const q of ratingQuestions) {
    const answer = answers[q.id];
    if (answer !== undefined) {
      total++;
      if (q.positive) {
        score += answer ? 1 : 0;
      } else {
        score += answer ? 0 : 1;
      }
    }
  }
  if (total === 0) return 3;
  return Math.max(1, Math.round((score / total) * 5));
}

// ── Quality Weight System ──
export type QualityTier = "high" | "medium" | "low" | "very_low";

export const qualityWeights: Record<QualityTier, { weight: number; label: string; color: string }> = {
  high: { weight: 1.0, label: "Alta Qualidade", color: "#10b981" },
  medium: { weight: 0.7, label: "Qualidade Média", color: "#f59e0b" },
  low: { weight: 0.3, label: "Baixa Qualidade", color: "#f97316" },
  very_low: { weight: 0, label: "Descartada", color: "#ef4444" },
};

export function getQualityTier(avgStars: number): QualityTier {
  if (avgStars >= 4) return "high";
  if (avgStars >= 3) return "medium";
  if (avgStars >= 2) return "low";
  return "very_low";
}

// ── Trust Score (Anti-Spam) ──
export interface TrustScoreData {
  score: number; // 0–100
  penalties: number;
  tempBans: number;
  isBanned: boolean;
  tokenMultiplier: number;
}

export function getDefaultTrustScore(): TrustScoreData {
  return { score: 95, penalties: 0, tempBans: 0, isBanned: false, tokenMultiplier: 1.0 };
}

export function getTrustLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Excelente", color: "#10b981" };
  if (score >= 60) return { label: "Bom", color: "#3b82f6" };
  if (score >= 40) return { label: "Atenção", color: "#f59e0b" };
  return { label: "Crítico", color: "#ef4444" };
}

// ── Survey Interface ──
export interface Survey {
  id: string;
  title: string;
  category: string;
  estimatedTime: string;
  tokenReward: number;
  responses: number;
  targetResponses: number;
  segmentation: string;
  eligible: boolean;
  boosted: boolean;
  status: "Ativa" | "Rascunho" | "Encerrada";
  createdAt: string;
  author: string;
  state?: string;
  city?: string;
  trending?: boolean;
  trendGrowth?: string;
}

export const surveys: Survey[] = [
  {
    id: "1",
    title: "Percepção de marcas de cosméticos naturais no Vale do Paraíba",
    category: "Beleza e Cosméticos",
    estimatedTime: "8 min",
    tokenReward: 8,
    responses: 142,
    targetResponses: 200,
    segmentation: "Mulheres 18–30, SP",
    eligible: true,
    boosted: true,
    status: "Ativa",
    createdAt: "2026-02-15",
    author: "Instituto Beleza Consciente",
    state: "SP",
    city: "São José dos Campos",
    trending: true,
    trendGrowth: "+42%",
  },
  {
    id: "2",
    title: "Hábitos de consumo de tecnologia em jovens universitários",
    category: "Tecnologia",
    estimatedTime: "12 min",
    tokenReward: 12,
    responses: 89,
    targetResponses: 300,
    segmentation: "18–24, Universitários",
    eligible: true,
    boosted: false,
    status: "Ativa",
    createdAt: "2026-02-12",
    author: "UNICAMP – Dep. Eng. Computação",
    state: "SP",
    city: "Campinas",
    trending: true,
    trendGrowth: "+28%",
  },
  {
    id: "3",
    title: "Satisfação com serviços de saúde pública regional",
    category: "Saúde",
    estimatedTime: "10 min",
    tokenReward: 10,
    responses: 256,
    targetResponses: 500,
    segmentation: "Todas as idades, SP",
    eligible: false,
    boosted: false,
    status: "Ativa",
    createdAt: "2026-02-10",
    author: "Secretaria Municipal de Saúde",
    state: "SP",
    city: "São Paulo",
  },
  {
    id: "4",
    title: "Tendências de moda sustentável entre Millennials",
    category: "Moda",
    estimatedTime: "6 min",
    tokenReward: 6,
    responses: 178,
    targetResponses: 250,
    segmentation: "25–40, Feminino",
    eligible: true,
    boosted: true,
    status: "Ativa",
    createdAt: "2026-02-08",
    author: "Fashion Lab São Paulo",
    state: "RJ",
    city: "Rio de Janeiro",
    trending: true,
    trendGrowth: "+19%",
  },
  {
    id: "5",
    title: "Impacto do trabalho remoto na produtividade de startups",
    category: "Startups",
    estimatedTime: "15 min",
    tokenReward: 15,
    responses: 67,
    targetResponses: 150,
    segmentation: "25–50, Profissionais de TI",
    eligible: true,
    boosted: false,
    status: "Ativa",
    createdAt: "2026-02-05",
    author: "Startup Valley Research",
    state: "MG",
    city: "Belo Horizonte",
  },
  {
    id: "6",
    title: "Comportamento de compra online durante promoções",
    category: "Comportamento do Consumidor",
    estimatedTime: "7 min",
    tokenReward: 7,
    responses: 320,
    targetResponses: 400,
    segmentation: "Todas as idades, Nacional",
    eligible: true,
    boosted: false,
    status: "Ativa",
    createdAt: "2026-02-03",
    author: "E-Commerce Brasil",
    state: "SP",
    city: "São Paulo",
  },
  {
    id: "7",
    title: "Análise de mobilidade urbana no interior de SP",
    category: "Estudos Regionais",
    estimatedTime: "9 min",
    tokenReward: 9,
    responses: 95,
    targetResponses: 200,
    segmentation: "18–60, Interior de SP",
    eligible: false,
    boosted: false,
    status: "Ativa",
    createdAt: "2026-02-01",
    author: "UNESP – Planejamento Urbano",
    state: "SP",
    city: "Bauru",
  },
  {
    id: "8",
    title: "Perfil acadêmico e expectativas de carreira pós-graduação",
    category: "Acadêmica",
    estimatedTime: "11 min",
    tokenReward: 11,
    responses: 410,
    targetResponses: 500,
    segmentation: "22–35, Pós-graduandos",
    eligible: true,
    boosted: false,
    status: "Ativa",
    createdAt: "2026-01-28",
    author: "CAPES – Ministério da Educação",
    state: "DF",
    city: "Brasília",
  },
];

export interface TokenTransaction {
  id: string;
  type: "earned" | "spent";
  amount: number;
  description: string;
  date: string;
}

export const tokenHistory: TokenTransaction[] = [
  { id: "t1", type: "earned", amount: 8, description: "Respondeu: Percepção de marcas de cosméticos", date: "2026-02-17" },
  { id: "t2", type: "spent", amount: 60, description: "Publicou: Hábitos de consumo digital", date: "2026-02-16" },
  { id: "t3", type: "earned", amount: 7, description: "Respondeu: Comportamento de compra online", date: "2026-02-15" },
  { id: "t4", type: "earned", amount: 15, description: "Respondeu: Impacto do trabalho remoto", date: "2026-02-14" },
  { id: "t5", type: "spent", amount: 40, description: "Publicou: Satisfação com delivery", date: "2026-02-13" },
  { id: "t6", type: "earned", amount: 9, description: "Respondeu: Mobilidade urbana", date: "2026-02-12" },
  { id: "t7", type: "earned", amount: 6, description: "Respondeu: Tendências de moda sustentável", date: "2026-02-11" },
  { id: "t8", type: "spent", amount: 75, description: "Publicou: Pesquisa de mercado B2B", date: "2026-02-10" },
  { id: "t9", type: "earned", amount: 7, description: "Respondeu: Hábitos alimentares", date: "2026-02-09" },
  { id: "t10", type: "earned", amount: 4, description: "Bônus de nível semanal", date: "2026-02-08" },
];

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string;
  reputationScore: number;
  completionRate: number;
  totalResponses: number;
  totalCreated: number;
  tokenBalance: number;
  badges: { name: string; icon: string; earned: boolean; tooltip: string }[];
  demographics: {
    age: string;
    gender: string;
    state: string;
    city: string;
    education: string;
    income: string;
  };
  ratings: { stars: number; count: number }[];
}

export type Demographics = UserProfile["demographics"];

export const currentUser: UserProfile = {
  id: 3,
  name: "Mariana Silva",
  email: "mariana@polify.com",
  avatar: "",
  reputationScore: 87,
  completionRate: 94,
  totalResponses: 156,
  totalCreated: 12,
  tokenBalance: 248,
  badges: [
    { name: "Top Respondente", icon: "trophy", earned: true, tooltip: "Respondeu mais de 100 pesquisas com qualidade" },
    { name: "Verificado", icon: "check", earned: true, tooltip: "Identidade verificada na plataforma" },
    { name: "Pesquisador", icon: "chart", earned: true, tooltip: "Criou pelo menos 10 pesquisas" },
    { name: "Mentor", icon: "graduation", earned: false, tooltip: "Ajude 50 novos usuários para desbloquear" },
    { name: "100 Respostas", icon: "target", earned: true, tooltip: "Completou 100 respostas com sucesso" },
    { name: "Especialista", icon: "map", earned: false, tooltip: "Responda 50 pesquisas da sua região" },
  ],
  demographics: {
    age: "25–30",
    gender: "Feminino",
    state: "SP",
    city: "São José dos Campos",
    education: "Pós-graduação",
    income: "R$ 5.000 – R$ 10.000",
  },
  ratings: [
    { stars: 5, count: 89 },
    { stars: 4, count: 42 },
    { stars: 3, count: 15 },
    { stars: 2, count: 6 },
    { stars: 1, count: 2 },
  ],
};

export const mySurveys = [
  {
    id: "ms1",
    title: "Hábitos de consumo digital na Geração Z",
    status: "Ativa" as const,
    responses: 87,
    targetResponses: 150,
    segmentation: "18–24, Nacional",
    createdAt: "2026-02-10",
  },
  {
    id: "ms2",
    title: "Preferências de delivery de alimentos saudáveis",
    status: "Ativa" as const,
    responses: 234,
    targetResponses: 300,
    segmentation: "25–40, SP",
    createdAt: "2026-01-28",
  },
  {
    id: "ms3",
    title: "Percepção sobre fintechs no Brasil",
    status: "Encerrada" as const,
    responses: 500,
    targetResponses: 500,
    segmentation: "Todas as idades, Nacional",
    createdAt: "2026-01-15",
  },
  {
    id: "ms4",
    title: "Expectativas salariais em Tecnologia",
    status: "Rascunho" as const,
    responses: 0,
    targetResponses: 200,
    segmentation: "25–40, Profissionais de TI",
    createdAt: "2026-02-18",
  },
  {
    id: "ms5",
    title: "Satisfação com transporte público regional",
    status: "Encerrada" as const,
    responses: 312,
    targetResponses: 350,
    segmentation: "Todas as idades, SP",
    createdAt: "2025-12-20",
  },
];

export const insightsData = {
  categoryDistribution: [
    { name: "Pesquisa de Mercado", value: 28 },
    { name: "Tecnologia", value: 22 },
    { name: "Saúde", value: 15 },
    { name: "Acadêmica", value: 12 },
    { name: "Comportamento", value: 10 },
    { name: "Moda", value: 8 },
    { name: "Outros", value: 5 },
  ],
  regionalTrends: [
    { region: "SP Capital", pesquisas: 145, respondentes: 3200 },
    { region: "V. Paraíba", pesquisas: 89, respondentes: 1800 },
    { region: "Campinas", pesquisas: 67, respondentes: 1400 },
    { region: "Rio de Janeiro", pesquisas: 56, respondentes: 1200 },
    { region: "BH", pesquisas: 42, respondentes: 890 },
    { region: "Curitiba", pesquisas: 38, respondentes: 760 },
  ],
  trendingTopics: [
    { topic: "Cosméticos – Vale do Paraíba", growth: "+34%", surveys: 12 },
    { topic: "IA e Trabalho – Nacional", growth: "+28%", surveys: 8 },
    { topic: "Saúde Mental – Universitários", growth: "+22%", surveys: 15 },
    { topic: "Fintechs – Classe C", growth: "+19%", surveys: 6 },
    { topic: "Moda Sustentável – Millennials", growth: "+15%", surveys: 9 },
  ],
  monthlyActivity: [
    { month: "Set", pesquisas: 42, respostas: 1250 },
    { month: "Out", pesquisas: 55, respostas: 1680 },
    { month: "Nov", pesquisas: 48, respostas: 1420 },
    { month: "Dez", pesquisas: 38, respostas: 1100 },
    { month: "Jan", pesquisas: 62, respostas: 1890 },
    { month: "Fev", pesquisas: 51, respostas: 1560 },
  ],
};

// ── Polify Insights (Proprietary Reports) ──
export const polifyInsights = [
  {
    id: "pi1",
    title: "Tendências de Consumo Digital 2026",
    description: "Análise proprietária baseada em 12.000+ respostas sobre hábitos de consumo online no Brasil.",
    category: "Comportamento do Consumidor",
    dataPoints: 12400,
    lastUpdated: "2026-02-20",
    badge: "Dados Verificados",
    price: 80,
  },
  {
    id: "pi2",
    title: "Mapa de Saúde Mental Universitária – Sudeste",
    description: "Relatório consolidado de 8 pesquisas acadêmicas com base anonimizada de 5.600 respondentes.",
    category: "Saúde",
    dataPoints: 5600,
    lastUpdated: "2026-02-18",
    badge: "Base Consolidada",
    price: 65,
  },
  {
    id: "pi3",
    title: "Perfil do Consumidor de Fintechs – Classes C/D",
    description: "Análise proprietária sobre adoção de serviços financeiros digitais por classes emergentes.",
    category: "Finanças",
    dataPoints: 8900,
    lastUpdated: "2026-02-15",
    badge: "Análise Proprietária",
    price: 95,
  },
  {
    id: "pi4",
    title: "Cosméticos Naturais – Demanda Regional SP",
    description: "Insights de mercado baseados na demanda crescente por cosméticos naturais no interior de São Paulo.",
    category: "Beleza e Cosméticos",
    dataPoints: 3200,
    lastUpdated: "2026-02-12",
    badge: "Dados Verificados",
    price: 55,
  },
];

export const reportData = {
  surveyTitle: "Percepção de marcas de cosméticos naturais no Vale do Paraíba",
  totalResponses: 142,
  averageTime: "7:32",
  completionRate: 89,
  demographics: {
    gender: [
      { name: "Feminino", value: 78 },
      { name: "Masculino", value: 18 },
      { name: "Não-binário", value: 4 },
    ],
    age: [
      { name: "18–24", value: 45 },
      { name: "25–30", value: 35 },
      { name: "31–40", value: 15 },
      { name: "41+", value: 5 },
    ],
    education: [
      { name: "Ensino Médio", value: 20 },
      { name: "Graduação", value: 45 },
      { name: "Pós-graduação", value: 30 },
      { name: "Outros", value: 5 },
    ],
  },
  questions: [
    {
      id: "q1",
      question: "Com que frequência você compra cosméticos naturais?",
      type: "multiple",
      data: [
        { option: "Semanalmente", count: 18 },
        { option: "Quinzenalmente", count: 34 },
        { option: "Mensalmente", count: 52 },
        { option: "Raramente", count: 28 },
        { option: "Nunca comprei", count: 10 },
      ],
    },
    {
      id: "q2",
      question: "Qual fator mais influencia sua decisão de compra?",
      type: "multiple",
      data: [
        { option: "Preço", count: 42 },
        { option: "Ingredientes naturais", count: 58 },
        { option: "Marca reconhecida", count: 22 },
        { option: "Recomendação", count: 12 },
        { option: "Embalagem sustentável", count: 8 },
      ],
    },
    {
      id: "q3",
      question: "De 1 a 5, qual sua satisfação com as opções disponíveis na região?",
      type: "scale",
      data: [
        { option: "1", count: 8 },
        { option: "2", count: 15 },
        { option: "3", count: 38 },
        { option: "4", count: 52 },
        { option: "5", count: 29 },
      ],
    },
  ],
};

export const marketplaceSurveys = [
  {
    id: "mk1",
    title: "Comportamento do consumidor brasileiro no e-commerce 2026",
    category: "Comportamento do Consumidor",
    state: "Nacional",
    city: "",
    responses: 1250,
    quality: 4.8,
    price: 45,
    segmentation: "18-60, Classes A/B/C",
    description: "Análise completa do comportamento de compra online do consumidor brasileiro com segmentação demográfica detalhada.",
  },
  {
    id: "mk2",
    title: "Tendências de alimentação saudável em grandes centros",
    category: "Alimentação",
    state: "SP",
    city: "São Paulo",
    responses: 890,
    quality: 4.6,
    price: 35,
    segmentation: "25-40, Classe A/B",
    description: "Pesquisa sobre hábitos alimentares, preferências orgânicas e disposição de gasto em alimentação saudável.",
  },
  {
    id: "mk3",
    title: "Percepção de startups fintechs pela Geração Z",
    category: "Finanças",
    state: "Nacional",
    city: "",
    responses: 2100,
    quality: 4.9,
    price: 60,
    segmentation: "18-25, Universitários",
    description: "Estudo aprofundado sobre como jovens de 18-25 anos percebem e usam serviços financeiros digitais.",
  },
  {
    id: "mk4",
    title: "Impacto ambiental e consciência sustentável corporativa",
    category: "Sustentabilidade",
    state: "MG",
    city: "Belo Horizonte",
    responses: 670,
    quality: 4.5,
    price: 30,
    segmentation: "Profissionais 30-50",
    description: "Pesquisa B2B sobre práticas sustentáveis e ESG em empresas de médio e grande porte.",
  },
  {
    id: "mk5",
    title: "Entretenimento digital e streaming na América Latina",
    category: "Entretenimento",
    state: "Nacional",
    city: "",
    responses: 3400,
    quality: 4.7,
    price: 55,
    segmentation: "16-35, Todas as classes",
    description: "Análise do consumo de conteúdo digital, plataformas preferidas e comportamento de assinatura.",
  },
  {
    id: "mk6",
    title: "Saúde mental e bem-estar no ambiente de trabalho remoto",
    category: "Saúde",
    state: "RJ",
    city: "Rio de Janeiro",
    responses: 780,
    quality: 4.4,
    price: 40,
    segmentation: "25-45, CLT e PJ",
    description: "Pesquisa sobre impactos do home office na saúde mental, produtividade e qualidade de vida dos trabalhadores.",
  },
];

// Mock respondents for rating
export interface MockRespondent {
  id: string;
  name: string;
  avgRating: number;
  totalRatings: number;
  completedAt: string;
  qualityTier?: QualityTier;
}

export const mockRespondents: Record<string, MockRespondent[]> = {
  ms1: [
    { id: "r1", name: "Lucas M.", avgRating: 4.5, totalRatings: 23, completedAt: "2026-02-17", qualityTier: "high" },
    { id: "r2", name: "Ana P.", avgRating: 4.8, totalRatings: 45, completedAt: "2026-02-17", qualityTier: "high" },
    { id: "r3", name: "Carlos S.", avgRating: 3.2, totalRatings: 8, completedAt: "2026-02-16", qualityTier: "medium" },
    { id: "r4", name: "Juliana R.", avgRating: 4.9, totalRatings: 67, completedAt: "2026-02-16", qualityTier: "high" },
    { id: "r5", name: "Pedro H.", avgRating: 4.1, totalRatings: 15, completedAt: "2026-02-15", qualityTier: "high" },
  ],
  ms2: [
    { id: "r6", name: "Fernanda L.", avgRating: 4.7, totalRatings: 32, completedAt: "2026-02-18", qualityTier: "high" },
    { id: "r7", name: "Rafael T.", avgRating: 3.9, totalRatings: 12, completedAt: "2026-02-17", qualityTier: "medium" },
    { id: "r8", name: "Beatriz O.", avgRating: 4.3, totalRatings: 28, completedAt: "2026-02-17", qualityTier: "high" },
    { id: "r9", name: "Diego F.", avgRating: 2.8, totalRatings: 5, completedAt: "2026-02-16", qualityTier: "low" },
    { id: "r10", name: "Camila N.", avgRating: 4.6, totalRatings: 41, completedAt: "2026-02-15", qualityTier: "high" },
  ],
  ms3: [
    { id: "r11", name: "Thiago V.", avgRating: 4.4, totalRatings: 19, completedAt: "2026-01-20", qualityTier: "high" },
    { id: "r12", name: "Marina C.", avgRating: 4.9, totalRatings: 56, completedAt: "2026-01-19", qualityTier: "high" },
    { id: "r13", name: "Roberto A.", avgRating: 3.5, totalRatings: 10, completedAt: "2026-01-18", qualityTier: "medium" },
  ],
};

export const tokenPackages = [
  { id: "pkg1", name: "Starter", tokens: 50, price: "R$ 29,90", popular: false },
  { id: "pkg2", name: "Growth", tokens: 150, price: "R$ 69,90", popular: true },
  { id: "pkg3", name: "Business", tokens: 400, price: "R$ 149,90", popular: false },
  { id: "pkg4", name: "Enterprise", tokens: 1000, price: "R$ 299,90", popular: false },
];
