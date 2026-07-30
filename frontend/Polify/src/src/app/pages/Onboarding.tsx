import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, Shield, Award, TrendingUp, Coins, ArrowRight, User, UserCircle } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { AvatarPicker } from "../components/AvatarPicker";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { profileAvatars, brazilianStates } from "../data/mockData";
import { toast } from "sonner";

const steps = [
  {
    icon: Coins,
    title: "Como funciona a Polify",
    points: [
      "Tokens são sua moeda dentro da plataforma",
      "Você responde pesquisas e ganha tokens",
      "Você pode publicar e comprar pesquisas usando tokens",
    ],
  },
  {
    icon: Shield,
    title: "Como usamos seus dados",
    points: [
      "Dados usados de forma agregada e anonimizada",
      "Podem gerar relatórios proprietários (Insights Polify)",
      "Nunca vendemos dados individuais",
      "Conformidade total com a LGPD",
    ],
  },
  {
    icon: Award,
    title: "Sistema de Qualidade",
    points: [
      "Avaliação estruturada com perguntas objetivas",
      "Peso estatístico garante dados confiáveis",
      "Controle automático contra respostas de baixa qualidade",
      "Respostas ruins não entram nos relatórios",
    ],
  },
  {
    icon: TrendingUp,
    title: "Gamificação e Níveis",
    points: [
      "Progrida de Explorador a Respondente Premium",
      "Níveis mais altos ganham multiplicadores de tokens",
      "Conquiste badges e destaque na comunidade",
    ],
  },
  {
    icon: UserCircle,
    title: "Perfil Demográfico",
    points: [
      "Complete seu perfil para receber pesquisas mais relevantes",
      "Dados ajudam na segmentação de pesquisas",
      "Informações são usadas de forma agregada",
      "Você pode alterar esses dados a qualquer momento",
    ],
    isDemographicsStep: true,
  },
  {
    icon: User,
    title: "Personalização",
    points: [
      "Cada usuário possui um perfil personalizável",
      "Escolha seu avatar para se destacar na comunidade",
      "Seu avatar será exibido na sidebar e no perfil",
      "Você pode alterar seu avatar a qualquer momento",
    ],
    isAvatarStep: true,
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding, selectedAvatar, updateAvatar, updateDemographics } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [demographicsData, setDemographicsData] = useState({
    age: "",
    gender: "",
    city: "",
    state: "",
    education: "",
    income: ""
  });

  const handleAccept = async () => {
    const success = await completeOnboarding();
    if (success) {
      toast.success("Onboarding concluído!");
      navigate("/");
    } else {
      toast.error("Erro ao concluir onboarding. Tente novamente.");
    }
  };

  const handleSaveDemographics = async () => {
    const success = await updateDemographics(demographicsData);
    if (success === true) {
      toast.success("Perfil demográfico salvo com sucesso!");
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error("Erro ao salvar perfil demográfico");
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[560px]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg bg-[#6366f1] flex items-center justify-center">
            <span className="text-white" style={{ fontSize: "16px", fontWeight: 700 }}>P</span>
          </div>
          <span className="text-foreground tracking-tight" style={{ fontSize: "24px", fontWeight: 700 }}>Polify</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= currentStep ? "bg-[#6366f1]" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Step Card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="w-14 h-14 rounded-xl bg-[#6366f1]/10 flex items-center justify-center mb-5">
            <step.icon size={28} className="text-[#6366f1]" />
          </div>

          <h2 className="text-foreground mb-4" style={{ fontSize: "20px", fontWeight: 600 }}>
            {step.title}
          </h2>

          {step.isDemographicsStep ? (
            <div className="mb-8">
              <div className="space-y-4">
                <div>
                  <label className="text-foreground text-sm font-medium mb-1.5 block">Idade</label>
                  <input
                    type="number"
                    value={demographicsData.age}
                    onChange={(e) => setDemographicsData({ ...demographicsData, age: e.target.value })}
                    placeholder="Sua idade"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                    style={{ fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label className="text-foreground text-sm font-medium mb-1.5 block">Gênero</label>
                  <select
                    value={demographicsData.gender}
                    onChange={(e) => setDemographicsData({ ...demographicsData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                    style={{ fontSize: "14px" }}
                  >
                    <option value="">Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground text-sm font-medium mb-1.5 block">Estado</label>
                    <select
                      value={demographicsData.state}
                      onChange={(e) => setDemographicsData({ ...demographicsData, state: e.target.value, city: "" })}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                      style={{ fontSize: "14px" }}
                    >
                      <option value="">Selecione</option>
                      {brazilianStates.map(s => (
                        <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-foreground text-sm font-medium mb-1.5 block">Cidade</label>
                    <CityAutocomplete
                      stateUf={demographicsData.state}
                      value={demographicsData.city}
                      onChange={(city) => setDemographicsData({ ...demographicsData, city })}
                      placeholder="Buscar cidade..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-foreground text-sm font-medium mb-1.5 block">Escolaridade</label>
                  <select
                    value={demographicsData.education}
                    onChange={(e) => setDemographicsData({ ...demographicsData, education: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                    style={{ fontSize: "14px" }}
                  >
                    <option value="">Selecione</option>
                    <option value="Fundamental Incompleto">Fundamental Incompleto</option>
                    <option value="Fundamental Completo">Fundamental Completo</option>
                    <option value="Médio Incompleto">Médio Incompleto</option>
                    <option value="Médio Completo">Médio Completo</option>
                    <option value="Superior Incompleto">Superior Incompleto</option>
                    <option value="Superior Completo">Superior Completo</option>
                    <option value="Pós-graduação">Pós-graduação</option>
                    <option value="Mestrado">Mestrado</option>
                    <option value="Doutorado">Doutorado</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
                <div>
                  <label className="text-foreground text-sm font-medium mb-1.5 block">Renda</label>
                  <select
                    value={demographicsData.income}
                    onChange={(e) => setDemographicsData({ ...demographicsData, income: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                    style={{ fontSize: "14px" }}
                  >
                    <option value="">Selecione</option>
                    <option value="Até R$ 1.000">Até R$ 1.000</option>
                    <option value="R$ 1.001 a R$ 2.000">R$ 1.001 a R$ 2.000</option>
                    <option value="R$ 2.001 a R$ 3.000">R$ 2.001 a R$ 3.000</option>
                    <option value="R$ 3.001 a R$ 5.000">R$ 3.001 a R$ 5.000</option>
                    <option value="R$ 5.001 a R$ 10.000">R$ 5.001 a R$ 10.000</option>
                    <option value="Acima de R$ 10.000">Acima de R$ 10.000</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3 mt-6">
                {step.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#6366f1] flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : step.isAvatarStep ? (
            <div className="mb-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={profileAvatars.find((a) => a.id === selectedAvatar)?.imagePath || "/avatars/default.png"}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#6366f1]/20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/avatars/default.png";
                    }}
                  />
                </div>
                <button
                  onClick={() => setAvatarModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#5558e6] text-white transition-colors"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  Alterar avatar
                </button>
              </div>
              <div className="space-y-3 mt-6">
                {step.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#6366f1] flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {step.points.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-[#6366f1] flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                style={{ fontSize: "14px", fontWeight: 500 }}
              >
                Voltar
              </button>
            ) : (
              <div />
            )}

            {step.isDemographicsStep ? (
              <button
                onClick={handleSaveDemographics}
                className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e6] text-white px-6 py-2.5 rounded-xl transition-colors"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                <CheckCircle size={16} />
                Salvar e continuar
              </button>
            ) : isLastStep ? (
              <button
                onClick={handleAccept}
                className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e6] text-white px-6 py-2.5 rounded-xl transition-colors"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                <CheckCircle size={16} />
                Entendi e concordo
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e6] text-white px-6 py-2.5 rounded-xl transition-colors"
                style={{ fontSize: "14px", fontWeight: 500 }}
              >
                Próximo
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        {avatarModalOpen && (
          <AvatarPicker
            selectedAvatar={selectedAvatar}
            onSelect={(avatarId) => {
              updateAvatar(avatarId);
              setAvatarModalOpen(false);
            }}
            onClose={() => setAvatarModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
