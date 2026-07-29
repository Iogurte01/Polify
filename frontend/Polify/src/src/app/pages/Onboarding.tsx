import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, Shield, Award, TrendingUp, Coins, ArrowRight, User } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { AvatarPicker } from "../components/AvatarPicker";
import { profileAvatars } from "../data/mockData";

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
  const { completeOnboarding, selectedAvatar, updateAvatar } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const handleAccept = () => {
    completeOnboarding();
    navigate("/");
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

          {step.isAvatarStep ? (
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

            {isLastStep ? (
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
