import { useState } from "react";
import { useNavigate } from "react-router";
import {
  PlusCircle, Trash2, ChevronDown, Calculator, Target,
  Clock, Send, ArrowUp, ArrowDown, X,
} from "lucide-react";
import { categories, brazilianStates, URL_backend } from "../data/mockData";
import { useApp } from "../contexts/AppContext";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { toast } from "sonner";

type QuestionType = "multiple" | "open" | "scale" | "checkbox";
const MAX_CHARS = 200;

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

const COST_PER_QUESTION_TYPE: Record<QuestionType, number> = {
  multiple: 10,
  open: 50,
  scale: 10,
  checkbox: 10,
};

const REWARD_PER_QUESTION_TYPE: Record<QuestionType, number> = {
  multiple: 1,
  open: 5,
  scale: 1,
  checkbox: 1,
};

const TIME_PER_QUESTION_TYPE: Record<QuestionType, number> = {
  multiple: 0.5,
  open: 1,
  scale: 0.5,
  checkbox: 0.5,
};

export function CreateSurvey() {
  const navigate = useNavigate();
  const { tokenBalance, createForm, spendTokens, t } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q1", type: "multiple", text: "", options: ["Opção 1", "Opção 2", "Opção 3"] },
  ]);
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
    if (questions.length > 1) {
      if (window.confirm("Tem certeza que deseja excluir esta pergunta?")) {
        setQuestions(questions.filter((q) => q.id !== id));
      }
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    setQuestions(newQuestions);
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

  const validQuestions = questions.filter((question) => question.text.trim());
  const estimatedMinutes = Math.max(1, validQuestions.reduce((sum, q) => sum + TIME_PER_QUESTION_TYPE[q.type], 0));
  const estimatedTime = `${estimatedMinutes} min`;
  const totalTokens = validQuestions.reduce((sum, q) => sum + COST_PER_QUESTION_TYPE[q.type], 0);
  const respondentReward = validQuestions.reduce((sum, q) => sum + REWARD_PER_QUESTION_TYPE[q.type], 0);
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
      const questionsToPersist = questions.filter((question) => question.text.trim());
      const formResult = await createForm({
        nome_formulario: title,
        descricao_formulario: description || undefined,
        categoria: selectedCategory,
        min_respondentes: 200,
        tempo_max_dias: 30,
        pontos_base: totalTokens,
        pontos_recompensa: respondentReward,
        tempo_estimado: estimatedTime
      });

      if (!formResult.success) {
        setErrors({ submit: formResult.message || "Erro ao criar formulário" });
        toast.error(formResult.message || "Erro ao criar formulário");
        return;
      }

      const formId = formResult.form.id;
      let questionsSaved = true;
      
      for (let i = 0; i < questionsToPersist.length; i++) {
        const question = questionsToPersist[i];
        const backendTipagem = question.type === "multiple" ? "multiple_choice" : question.type === "checkbox" ? "checkbox" : question.type === "scale" ? "rating" : "text";
        const alternativa = question.type === "multiple" || question.type === "checkbox"
          ? question.options.map((option) => option.trim()).filter((option) => option.length > 0)
          : [];
        
        try {
          const response = await fetch(`${URL_backend}/api/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_form: formId, num_pergunta: i + 1, pergunta: question.text, alternativa, tipagem: backendTipagem })
          });
          const result = await response.json();
          if (!result.success) { questionsSaved = false; break; }
        } catch { questionsSaved = false; break; }
      }

      if (questionsSaved) {
        const debitSuccess = await spendTokens(totalTokens, `Publicou: ${title}`);
        if (!debitSuccess) {
          setErrors({ submit: t("create.error.balance") });
          toast.error(t("create.error.balance"));
          return;
        }
        toast.success(t("create.success"));
        setShowConfirm(false);
        navigate("/");
      } else {
        setErrors({ submit: "Erro ao salvar perguntas" });
        toast.error("Erro ao salvar perguntas");
      }
    } catch {
      setErrors({ submit: "Erro ao conectar com o servidor" });
      toast.error("Erro ao conectar com o servidor");
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
              </div>
            </div>
          </div>

          {questions.map((question, index) => (
            <div key={question.id} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>{t("create.question")} {index + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button disabled={index === 0} onClick={() => moveQuestion(index, 'up')} className="p-1.5 text-muted-foreground hover:text-[#6366f1] disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button disabled={index === questions.length - 1} onClick={() => moveQuestion(index, 'down')} className="p-1.5 text-muted-foreground hover:text-[#6366f1] disabled:opacity-30"><ArrowDown size={14} /></button>
                  <select value={question.type} onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })} className="bg-input-background border border-border rounded-lg px-3 py-1.5 text-foreground appearance-none cursor-pointer ml-2" style={{ fontSize: "12px" }}>
                    {Object.entries(questionTypeLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                  </select>
                  <button onClick={() => removeQuestion(question.id)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-md"><Trash2 size={14} /></button>
                </div>
              </div>
              
              <div className="relative">
                <textarea
                  value={question.text}
                  maxLength={MAX_CHARS}
                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                  onInput={(e) => {
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = (e.currentTarget.scrollHeight) + 'px';
                  }}
                  placeholder="Digite sua pergunta..."
                  className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground mb-1 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] overflow-hidden resize-none"
                  style={{ fontSize: "14px", minHeight: "44px" }}
                />
                <span className={`text-right block ${question.text.length >= MAX_CHARS * 0.9 ? 'text-red-500' : 'text-muted-foreground'}`} style={{ fontSize: "11px" }}>
                  {question.text.length} / {MAX_CHARS}
                </span>
              </div>

              {(question.type === "multiple" || question.type === "checkbox") && (
                <div className="space-y-2 mt-2">
                  {question.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <div className={`w-4 h-4 border-2 border-[#c7c9d4] ${question.type === "multiple" ? "rounded-full" : "rounded"} flex-shrink-0`} />
                      <input type="text" value={opt} onChange={(e) => updateOption(question.id, optIdx, e.target.value)} className="flex-1 bg-transparent border-b border-border px-2 py-1 text-foreground" style={{ fontSize: "13px" }} />
                      <button onClick={() => removeOption(question.id, optIdx)} className="text-muted-foreground hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                  ))}
                  <button onClick={() => addOption(question.id)} className="text-[#6366f1] text-xs font-medium flex items-center gap-1 mt-2"><PlusCircle size={12} /> {t("create.addOption")}</button>
                </div>
              )}
            </div>
          ))}
          <button onClick={addQuestion} className="w-full border-2 border-dashed border-border rounded-xl py-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-[#6366f1] hover:border-[#6366f1]/40 transition-colors" style={{ fontSize: "14px", fontWeight: 500 }}><PlusCircle size={18} />{t("create.addQuestion")}</button>
        </div>

        {/* Lado Direito */}
        <div className="w-[340px] space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-8">
            <h3 className="text-foreground mb-4 flex items-center gap-2" style={{ fontSize: "15px" }}><Target size={16} />{t("create.segmentation")}</h3>
            <div className="space-y-3">
              <SegSelect label={t("home.state")} value={segState} onChange={(v) => { setSegState(v); setSegCity(""); }} options={brazilianStates.map(s => `${s.uf} - ${s.name}`)} />
              <div className="space-y-1">
                <label className="text-muted-foreground block" style={{ fontSize: "12px", fontWeight: 500 }}>{t("home.city")}</label>
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
                <span className="text-muted-foreground">Custo</span>
                <span className={validQuestions.length > 0 && tokenBalance >= totalTokens ? "text-[#6366f1]" : validQuestions.length > 0 ? "text-red-500" : "text-muted-foreground"} style={{ fontWeight: 600 }}>{validQuestions.length > 0 ? `${totalTokens} tokens` : "..."}</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: "13px" }}>
                <span className="text-muted-foreground">Recompensa</span>
                <span className={validQuestions.length > 0 ? "text-emerald-600" : "text-muted-foreground"} style={{ fontWeight: 500 }}>{validQuestions.length > 0 ? `${respondentReward} tokens` : "..."}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: "13px" }}><Target size={13} /> Alcance</span><span className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>~{estimatedReach} pessoas</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: "13px" }}><Clock size={13} /> Tempo</span><span className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>{estimatedTime}</span></div>
            </div>
          </div>
          
          <button onClick={handlePublish} disabled={isSubmitting} className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
             {isSubmitting ? "Criando..." : <><Send size={16} />{t("create.publish")}</>}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[400px]">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-foreground">Confirmar</h3>
                <button onClick={() => setShowConfirm(false)}><X size={18}/></button>
             </div>
            <p className="text-muted-foreground mb-6">Deseja publicar?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirm(false)} disabled={isSubmitting} className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Cancelar</button>
              <button onClick={confirmPublish} disabled={isSubmitting} className="bg-[#6366f1] text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[104px]">{isSubmitting ? "..." : "Confirmar"}</button>
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