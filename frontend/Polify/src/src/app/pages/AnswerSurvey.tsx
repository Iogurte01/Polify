import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Clock, Coins, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";

// Mock questions for surveys
const surveyQuestions = [
  { id: "sq1", text: "Como você avalia sua experiência com este tema?", type: "scale" as const },
  { id: "sq2", text: "Qual opção melhor descreve sua opinião?", type: "multiple" as const, options: ["Concordo totalmente", "Concordo parcialmente", "Neutro", "Discordo parcialmente", "Discordo totalmente"] },
  { id: "sq3", text: "Com que frequência você interage com este assunto?", type: "multiple" as const, options: ["Diariamente", "Semanalmente", "Mensalmente", "Raramente", "Nunca"] },
  { id: "sq4", text: "Descreva brevemente sua perspectiva:", type: "open" as const },
  { id: "sq5", text: "Recomendaria participar desta pesquisa a outros?", type: "multiple" as const, options: ["Sim, com certeza", "Provavelmente sim", "Talvez", "Provavelmente não", "Não"] },
];

export function AnswerSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { answeredSurveys, answerSurvey, addTokens, t, fetchFormDetails } = useApp();
  
  const [formDetails, setFormDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadFormDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const result = await fetchFormDetails(id);
        if (result.success) {
          setFormDetails(result.form);
        } else {
          console.error("Failed to load form details:", result.message);
        }
      } catch (error) {
        console.error("Error loading form details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFormDetails();
  }, [id, fetchFormDetails]);

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-8 py-16 text-center">
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando formulário...</p>
      </div>
    );
  }

  if (!formDetails) {
    return (
      <div className="max-w-[800px] mx-auto px-8 py-16 text-center">
        <AlertCircle size={40} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Formulário não encontrado.</p>
        <button onClick={() => navigate("/")} className="mt-4 text-[#6366f1] hover:text-[#5558e6]">
          {t("general.back")}
        </button>
      </div>
    );
  }

  const alreadyAnswered = answeredSurveys.includes(formDetails.id.toString());
  const isEligible = true; // For now, assume all are eligible

  if (alreadyAnswered) {
    return (
      <div className="max-w-[800px] mx-auto px-8 py-16 text-center">
        <CheckCircle size={40} className="mx-auto text-emerald-600 mb-3" />
        <h2 className="text-foreground mb-2">{t("answer.alreadyAnswered")}</h2>
        <button onClick={() => navigate("/")} className="mt-4 text-[#6366f1] hover:text-[#5558e6]">
          {t("general.back")}
        </button>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="max-w-[800px] mx-auto px-8 py-16 text-center">
        <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
        <h2 className="text-foreground mb-2">{t("answer.notEligible")}</h2>
        <button onClick={() => navigate("/")} className="mt-4 text-[#6366f1] hover:text-[#5558e6]">
          {t("general.back")}
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-[800px] mx-auto px-8 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-foreground mb-2">{t("answer.success")}</h2>
        <p className="text-[#6366f1] mb-6" style={{ fontSize: "18px", fontWeight: 600 }}>
          {t("answer.tokensEarned", { tokens: String(formDetails.pontos_base || 10) })}
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-6 py-2.5 rounded-xl transition-colors"
        >
          {t("general.back")}
        </button>
      </div>
    );
  }

  const handleSubmit = async () => {
    try {
      // Coletar respostas do estado answers
      const responsesArray = formDetails.questions?.map((question: any) => ({
        id_perg: question.id_perg,
        resposta: answers[question.id_perg.toString()] || ""
      })).filter((resp: any) => resp.resposta.trim() !== "") || [];

      if (responsesArray.length === 0) {
        toast.error("Por favor, responda pelo menos uma pergunta");
        return;
      }

      // Enviar respostas para o backend
      const result = await answerSurvey(formDetails.id.toString(), responsesArray);

      if (result.success) {
        addTokens(formDetails.pontos_base || 10, `Respondeu: ${formDetails.nome_formulario}`);
        toast.success(t("answer.tokensEarned", { tokens: String(formDetails.pontos_base || 10) }));
        setShowConfirm(false);
        setSubmitted(true);
      } else {
        toast.error(result.message || "Erro ao salvar respostas");
      }
    } catch (error) {
      console.error("Erro ao enviar respostas:", error);
      toast.error("Erro ao conectar com o servidor");
    }
  };

  const q = formDetails.questions?.[currentQ] || surveyQuestions[currentQ];

  if (!started) {
    const estimatedMinutes = Math.max(5, (formDetails.questions?.length || 5) * 2);
    return (
      <div className="max-w-[800px] mx-auto px-8 py-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} />
          {t("general.back")}
        </button>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h1 className="text-foreground mb-3" style={{ fontSize: "20px", fontWeight: 600 }}>{formDetails.nome_formulario}</h1>
          {formDetails.descricao_formulario && (
            <p className="text-muted-foreground mb-4">{formDetails.descricao_formulario}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              {estimatedMinutes} min
            </div>
            <div className="flex items-center gap-1.5">
              <Coins size={14} />
              {formDetails.pontos_base || 10} tokens
            </div>
            <div className="flex items-center gap-1.5">
              <span>{formDetails.questions?.length || 0} perguntas</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-foreground mb-4" style={{ fontSize: "16px", fontWeight: 600 }}>Sobre esta pesquisa</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoria</span>
              <span className="text-foreground">{formDetails.categoria}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criado por</span>
              <span className="text-foreground">{formDetails.criador_nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Respondentes necessários</span>
              <span className="text-foreground">{formDetails.min_respondentes || 50}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white py-3.5 rounded-xl transition-colors mt-6"
          style={{ fontSize: "14px", fontWeight: 600 }}
        >
          Começar pesquisa
        </button>
      </div>
    );
  }

  // Main question answering interface
  return (
    <div className="max-w-[800px] mx-auto px-8 py-8">
      <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} />
        {t("general.back")}
      </button>

      <div className="bg-card border border-border rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <span className="bg-[#6366f1]/10 text-[#6366f1] px-2.5 py-1 rounded-md" style={{ fontSize: "11px", fontWeight: 600 }}>
            {formDetails.categoria}
          </span>
          <span className="text-muted-foreground" style={{ fontSize: "13px" }}>
            Pergunta {currentQ + 1} de {formDetails.questions?.length || 1}
          </span>
        </div>

        <h1 className="text-foreground mb-6" style={{ fontSize: "20px" }}>
          {formDetails.nome_formulario}
        </h1>

        {/* Question display */}
        {q && (
          <div className="mb-8">
            <h2 className="text-foreground mb-6" style={{ fontSize: "18px", fontWeight: 600 }}>
              {q.pergunta || q.text}
            </h2>

            {/* Question type rendering */}
            {q.tipagem === 'multiple_choice' && q.alternativa && (
              <div className="space-y-3">
                {q.alternativa.split(',').map((opt: string, idx: number) => (
                  <label key={idx} className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                    <input
                      type="radio"
                      name={`question-${q.id_perg}`}
                      value={opt.trim()}
                      onChange={(e) => setAnswers({ ...answers, [q.id_perg.toString()]: e.target.value })}
                      className="w-4 h-4 text-[#6366f1]"
                    />
                    <span className="text-foreground">{opt.trim()}</span>
                  </label>
                ))}
              </div>
            )}

            {q.tipagem === 'text' && (
              <textarea
                placeholder="Digite sua resposta aqui..."
                className="w-full bg-input-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none"
                rows={4}
                onChange={(e) => setAnswers({ ...answers, [q.id_perg.toString()]: e.target.value })}
              />
            )}

            {/* Fallback for mock questions */}
            {!q.tipagem && q.type === 'multiple' && q.options && (
              <div className="space-y-3">
                {q.options.map((opt: string, idx: number) => (
                  <label key={idx} className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={opt}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-4 h-4 text-[#6366f1]"
                    />
                    <span className="text-foreground">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {!q.tipagem && q.type === 'open' && (
              <textarea
                placeholder="Digite sua resposta aqui..."
                className="w-full bg-input-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none"
                rows={4}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
            )}

            {!q.tipagem && q.type === 'scale' && (
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={num}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-4 h-4 text-[#6366f1]"
                    />
                    <span className="w-10 h-10 rounded-lg border-2 border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
                      {num}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {currentQ < (formDetails.questions?.length - 1 || 0) ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              className="px-4 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#5558e6] transition-colors"
            >
              Próxima
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Finalizar
            </button>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[400px] max-w-[90vw]">
            <h3 className="text-foreground mb-2" style={{ fontSize: "16px" }}>Confirmar envio</h3>
            <p className="text-muted-foreground mb-6" style={{ fontSize: "13px" }}>
              Tem certeza que deseja enviar suas respostas?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Enviar respostas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
