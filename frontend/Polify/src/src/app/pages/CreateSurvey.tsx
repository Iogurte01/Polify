import { useState } from "react";
import { useNavigate } from "react-router";
import {
  PlusCircle,
  Trash2,
  GripVertical,
  ChevronDown,
  Calculator,
  Target,
  Clock,
  Zap,
  Lock,
  Send,
  Info,
} from "lucide-react";
import { categories, brazilianStates } from "../data/mockData";
import { useApp } from "../contexts/AppContext";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { toast } from "sonner";

type QuestionType = "multiple" | "open" | "scale" | "checkbox";

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
}

const questionTypeLabels: Record<QuestionType, string> = {
  multiple: "Múltipla Escolha",
  open: "Aberta",
  scale: "Escala",
  checkbox: "Checkbox",
};

export function CreateSurvey() {
  const navigate = useNavigate();
  const { tokenBalance, createForm, t } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q1", type: "multiple", text: "", options: ["Opção 1", "Opção 2", "Opção 3"] },
  ]);
  const [includeDemographics, setIncludeDemographics] = useState(true);
  const [segState, setSegState] = useState("");
  const [segCity, setSegCity] = useState("");
  const [segAge, setSegAge] = useState("");
  const [segGender, setSegGender] = useState("");
  const [segEducation, setSegEducation] = useState("");
  const [segIncome, setSegIncome] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { id: `q${Date.now()}`, type: "multiple", text: "", options: ["Opção 1", "Opção 2"] }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map((q) => q.id === questionId ? { ...q, options: [...q.options, `Opção ${q.options.length + 1}`] } : q));
  };

  const removeOption = (questionId: string, index: number) => {
    setQuestions(questions.map((q) => q.id === questionId ? { ...q, options: q.options.filter((_, i) => i !== index) } : q));
  };

  const updateOption = (questionId: string, index: number, value: string) => {
    setQuestions(questions.map((q) => q.id === questionId ? { ...q, options: q.options.map((o, i) => (i === index ? value : o)) } : q));
  };

  const estimatedMinutes = Math.max(3, questions.length * 2 + (includeDemographics ? 2 : 0));
  const estimatedTime = `${estimatedMinutes} min`;
  const totalTokens = estimatedMinutes * 5;
  const respondentReward = estimatedMinutes;

  const estimatedReach = segState ? 450 : 1200;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = t("create.error.title");
    if (!selectedCategory) e.category = t("create.error.category");
    if (!questions.some(q => q.text.trim())) e.questions = t("create.error.questions");
    if (tokenBalance < totalTokens) e.balance = t("create.error.balance");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePublish = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  const confirmPublish = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // First create the form
      const formResult = await createForm({
        nome_formulario: title,
        descricao_formulario: description || undefined,
        categoria: selectedCategory,
        min_respondentes: 200,
        tempo_max_dias: 30,
        pontos_base: totalTokens
      });

      if (!formResult.success) {
        setErrors({ submit: formResult.message || "Erro ao criar formulário" });
        toast.error(formResult.message || "Erro ao criar formulário");
        return;
      }

      // Then save questions to the form
      const formId = formResult.form.id;
      let questionsSaved = true;
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/questions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id_form: formId,
              num_pergunta: i + 1,
              pergunta: question.text,
              alternativa: question.options ? question.options.join(",") : "",
              tipagem: question.type === "multiple" ? "multiple_choice" : 
                       question.type === "open" ? "text" : 
                       question.type === "scale" ? "rating" : "text"
            })
          });

          const result = await response.json();
          if (!result.success) {
            questionsSaved = false;
            break;
          }
        } catch (error) {
          questionsSaved = false;
          break;
        }
      }

      if (questionsSaved) {
        toast.success(t("create.success"));
        setShowConfirm(false);
        navigate("/"); // Redirect to Hub page
      } else {
        setErrors({ submit: "Formulário criado, mas erro ao salvar perguntas" });
        toast.error("Formulário criado, mas erro ao salvar perguntas");
      }
    } catch (error) {
      const errorMessage = "Erro ao conectar com o servidor";
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-foreground">{t("create.title")}</h1>
        <p className="text-muted-foreground mt-1" style={{ fontSize: "14px" }}>{t("create.subtitle")}</p>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-foreground mb-4" style={{ fontSize: "15px" }}>{t("create.basicInfo")}</h3>
            <div className="space-y-4">
              <div>
                <label className={`mb-1.5 block ${errors.title ? "text-red-500" : "text-foreground"}`} style={{ fontSize: "13px" }}>{t("create.surveyTitle")}</label>
                <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setErrors({}); }} placeholder="Ex: Percepção de marcas de cosméticos naturais" className={`w-full bg-input-background border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${errors.title ? "border-red-400" : "border-border"}`} style={{ fontSize: "14px" }} />
                {errors.title && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.title}</p>}
              </div>
              <div>
                <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>{t("create.description")}</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição da pesquisa..." rows={3} className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] resize-none" style={{ fontSize: "14px" }} />
              </div>
              <div>
                <label className={`mb-1.5 block ${errors.category ? "text-red-500" : "text-foreground"}`} style={{ fontSize: "13px" }}>{t("create.category")}</label>
                <div className="relative">
                  <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setErrors({}); }} className={`w-full bg-input-background border rounded-lg px-4 py-2.5 text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${errors.category ? "border-red-400" : "border-border"}`} style={{ fontSize: "14px" }}>
                    <option value="">{t("create.selectCategory")}</option>
                    {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {errors.category && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.category}</p>}
              </div>
            </div>
          </div>

          {errors.questions && <p className="text-red-500 px-1" style={{ fontSize: "12px" }}>{errors.questions}</p>}
          {questions.map((question, index) => (
            <div key={question.id} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-muted-foreground cursor-grab" />
                  <span className="text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>{t("create.question")} {index + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select value={question.type} onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })} className="bg-input-background border border-border rounded-lg px-3 py-1.5 text-foreground appearance-none cursor-pointer pr-8" style={{ fontSize: "12px" }}>
                      {Object.entries(questionTypeLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  <button onClick={() => removeQuestion(question.id)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={14} /></button>
                </div>
              </div>
              <input type="text" value={question.text} onChange={(e) => updateQuestion(question.id, { text: e.target.value })} placeholder="Digite sua pergunta..." className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" style={{ fontSize: "14px" }} />
              {(question.type === "multiple" || question.type === "checkbox") && (
                <div className="space-y-2">
                  {question.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <div className={`w-4 h-4 border-2 border-[#c7c9d4] dark:border-[#3d3b60] ${question.type === "multiple" ? "rounded-full" : "rounded"} flex-shrink-0`} />
                      <input type="text" value={opt} onChange={(e) => updateOption(question.id, optIdx, e.target.value)} className="flex-1 bg-transparent border-b border-border px-2 py-1 text-foreground focus:outline-none focus:border-[#6366f1]" style={{ fontSize: "13px" }} />
                      {question.options.length > 2 && (<button onClick={() => removeOption(question.id, optIdx)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={12} /></button>)}
                    </div>
                  ))}
                  <button onClick={() => addOption(question.id)} className="text-[#6366f1] hover:text-[#5558e6] flex items-center gap-1 mt-2 transition-colors" style={{ fontSize: "12px", fontWeight: 500 }}><PlusCircle size={12} />{t("create.addOption")}</button>
                </div>
              )}
              {question.type === "scale" && (
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (<div key={n} className="w-10 h-10 rounded-lg border-2 border-[#c7c9d4] dark:border-[#3d3b60] flex items-center justify-center text-muted-foreground" style={{ fontSize: "13px" }}>{n}</div>))}
                </div>
              )}
              {question.type === "open" && (<div className="bg-input-background rounded-lg px-4 py-3 text-muted-foreground" style={{ fontSize: "13px" }}>Campo de texto livre para o respondente...</div>)}
            </div>
          ))}
          <button onClick={addQuestion} className="w-full border-2 border-dashed border-border rounded-xl py-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-[#6366f1] hover:border-[#6366f1]/40 transition-colors" style={{ fontSize: "14px", fontWeight: 500 }}><PlusCircle size={18} />{t("create.addQuestion")}</button>
          <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
            <div>
              <h4 className="text-foreground" style={{ fontSize: "14px" }}>{t("create.demographics")}</h4>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "12px" }}>{t("create.demographicsSub")}</p>
            </div>
            <button onClick={() => setIncludeDemographics(!includeDemographics)} className={`w-11 h-6 rounded-full transition-colors relative ${includeDemographics ? "bg-[#6366f1]" : "bg-switch-background"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${includeDemographics ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
            </button>
          </div>
        </div>

        <div className="w-[340px] space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-8">
            <h3 className="text-foreground mb-4 flex items-center gap-2" style={{ fontSize: "15px" }}><Target size={16} />{t("create.segmentation")}</h3>
            <div className="space-y-3">
              <SegSelect label={t("home.state")} value={segState} onChange={(v) => { setSegState(v); setSegCity(""); }} options={brazilianStates.map(s => `${s.uf} - ${s.name}`)} />
              <div>
                <label className="text-muted-foreground mb-1 block" style={{ fontSize: "12px", fontWeight: 500 }}>{t("home.city")}</label>
                <CityAutocomplete stateUf={segState.split(" - ")[0]} value={segCity} onChange={setSegCity} placeholder="Buscar cidade..." />
              </div>
              <SegSelect label={t("home.ageRange")} value={segAge} onChange={setSegAge} options={["18–24", "25–30", "31–40", "41–50", "51–60", "60+"]} />
              <SegSelect label={t("home.gender")} value={segGender} onChange={setSegGender} options={["Feminino", "Masculino", "Não-binário", "Todos"]} />
              <SegSelect label="Escolaridade" value={segEducation} onChange={setSegEducation} options={["Ensino Médio", "Graduação", "Pós-graduação", "Mestrado/Doutorado"]} />
              <SegSelect label="Renda" value={segIncome} onChange={setSegIncome} options={["Até R$ 2.000", "R$ 2.000–5.000", "R$ 5.000–10.000", "Acima de R$ 10.000"]} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-foreground mb-4 flex items-center gap-2" style={{ fontSize: "15px" }}><Calculator size={16} />{t("create.estimatedCost")}</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between" style={{ fontSize: "13px" }}>
                <span className="text-muted-foreground">Custo de publicação</span>
                <span className={tokenBalance >= totalTokens ? "text-[#6366f1]" : "text-red-500"} style={{ fontWeight: 600 }}>{totalTokens} tokens</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: "13px" }}>
                <span className="text-muted-foreground">Recompensa por resposta</span>
                <span className="text-emerald-600" style={{ fontWeight: 500 }}>{respondentReward} tokens</span>
              </div>
              {tokenBalance < totalTokens && (<p className="text-red-500" style={{ fontSize: "11px" }}>{t("create.error.balance")} ({t("home.balance")}: {tokenBalance})</p>)}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: "13px" }}><Target size={13} /> {t("create.estimatedReach")}</span><span className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>~{estimatedReach} {t("general.people")}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: "13px" }}><Clock size={13} /> {t("create.averageTime")}</span><span className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>{estimatedTime}</span></div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 opacity-60">
            <div className="flex items-center gap-2 mb-2"><Zap size={16} className="text-[#f59e0b]" /><h3 className="text-foreground" style={{ fontSize: "15px" }}>{t("create.boost")}</h3><Lock size={12} className="text-muted-foreground ml-auto" /></div>
            <p className="text-muted-foreground" style={{ fontSize: "12px" }}>{t("create.boostLocked")}</p>
          </div>

          {errors.balance && <p className="text-red-500 px-1" style={{ fontSize: "12px" }}>{errors.balance}</p>}
          {errors.submit && <p className="text-red-500 px-1" style={{ fontSize: "12px" }}>{errors.submit}</p>}

          <button 
            onClick={handlePublish} 
            disabled={isSubmitting}
            className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            style={{ fontSize: "14px", fontWeight: 600 }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Criando formulário...
              </>
            ) : (
              <>
                <Send size={16} />
                {t("create.publish")}
              </>
            )}
          </button>
          <div className="flex items-start gap-1.5 px-1"><Info size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" /><p className="text-muted-foreground" style={{ fontSize: "11px" }}>{t("create.publishNote", { cost: String(totalTokens) })}</p></div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[400px] max-w-[90vw]">
            <h3 className="text-foreground mb-2" style={{ fontSize: "16px" }}>{t("create.confirmTitle")}</h3>
            <p className="text-muted-foreground mb-6" style={{ fontSize: "13px" }}>{t("create.confirmMsg", { cost: String(totalTokens) })}</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirm(false)} 
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                {t("general.cancel")}
              </button>
              <button 
                onClick={confirmPublish} 
                disabled={isSubmitting}
                className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Criando...
                  </>
                ) : (
                  t("general.confirm")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SegSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-muted-foreground mb-1 block" style={{ fontSize: "12px", fontWeight: 500 }}>{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground appearance-none cursor-pointer" style={{ fontSize: "13px" }}>
          <option value="">Todos</option>
          {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}