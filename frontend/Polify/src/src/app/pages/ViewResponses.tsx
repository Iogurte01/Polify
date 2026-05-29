import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Users, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { URL_backend } from "../data/mockData";

const normalizeStoredValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
};

const normalizeOptions = (value: unknown): string[] => {
  const parsed = normalizeStoredValue(value);

  if (Array.isArray(parsed)) {
    return parsed.map((item) => String(item).trim()).filter((item) => item.length > 0);
  }

  if (typeof parsed === "string") {
    return parsed ? [parsed] : [];
  }

  if (parsed === null || parsed === undefined) {
    return [];
  }

  return [String(parsed).trim()].filter((item) => item.length > 0);
};

export function ViewResponses() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, auth } = useApp();
  
  const [surveyDetails, setSurveyDetails] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const renderAnswerValue = (question: any) => {
    const responseValue = normalizeStoredValue(question.resposta);

    if (question.tipagem === "checkbox") {
      const values = normalizeOptions(responseValue);
      return (
        <div className="flex flex-wrap gap-2">
          {values.map((value: string) => (
            <span key={value} className="px-3 py-1 rounded-full bg-[#6366f1]/10 text-[#6366f1] text-sm">
              {value}
            </span>
          ))}
        </div>
      );
    }

    if (question.tipagem === "multiple_choice") {
      return (
        <span className="inline-flex px-3 py-1 rounded-full bg-secondary text-foreground text-sm">
          {String(responseValue)}
        </span>
      );
    }

    if (question.tipagem === "rating" || question.tipagem === "number") {
      return (
        <span className="inline-flex px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
          {String(responseValue)}
        </span>
      );
    }

    return <p className="text-muted-foreground">{String(responseValue)}</p>;
  };

  useEffect(() => {
    const loadSurveyResponses = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Buscar detalhes da pesquisa
        const formResponse = await fetch(`${URL_backend}/api/forms/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        const formData = await formResponse.json();
        
        if (!formData.success) {
          setError(formData.message || "Pesquisa não encontrada");
          return;
        }
        
        // Validar se o usuário é o dono
        const userId = auth.user?.id || 3; // Fallback para currentUser.id
        if (formData.form.id_criador !== userId) {
          setError("Você não tem permissão para visualizar as respostas desta pesquisa");
          return;
        }
        
        setSurveyDetails(formData.form);
        
        // Buscar respostas da pesquisa
        const responsesResponse = await fetch(`${URL_backend}/api/surveys/${id}/responses?user_id=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        const responsesData = await responsesResponse.json();
        
        if (responsesData.success) {
          setResponses(responsesData.responses || []);
        } else {
          console.warn("No responses found or error:", responsesData.message);
          setResponses([]);
        }
        
      } catch (error) {
        console.error("Error loading survey responses:", error);
        setError("Erro ao carregar respostas");
      } finally {
        setLoading(false);
      }
    };

    loadSurveyResponses();
  }, [id, auth.user?.id]);

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-8 py-16 text-center">
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando respostas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1000px] mx-auto px-8 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-foreground text-xl font-semibold mb-2">Erro</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <button
          onClick={() => navigate("/minhas-pesquisas")}
          className="px-4 py-2 bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-lg transition-colors"
        >
          Voltar para Minhas Pesquisas
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/minhas-pesquisas")}
            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-foreground" style={{ fontSize: "20px" }}>
              Respostas da Pesquisa
            </h1>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "13px" }}>
              {surveyDetails?.nome_formulario || "Carregando..."}
            </p>
          </div>
        </div>
      </div>

      {/* Survey Info */}
      {surveyDetails && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-foreground font-semibold mb-4">Informações da Pesquisa</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6366f1]/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#6366f1]" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total de Respostas</p>
                <p className="text-foreground font-semibold">{responses.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8b5cf6]/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total de Perguntas</p>
                <p className="text-foreground font-semibold">{surveyDetails.total_questions || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <p className="text-foreground font-semibold">
                  {surveyDetails.is_active ? "Ativa" : "Rascunho"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responses */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-foreground font-semibold">Respostas Recebidas</h2>
        </div>
        
        {responses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-foreground text-lg font-semibold mb-2">
              Nenhuma resposta ainda
            </h3>
            <p className="text-muted-foreground mb-4">
              Esta pesquisa ainda não recebeu respostas dos participantes.
            </p>
            <p className="text-muted-foreground text-sm">
              Compartilhe sua pesquisa para começar a receber respostas!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {responses.map((response, index) => (
              <div key={response.id || index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-foreground font-medium">
                      Resposta #{index + 1}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Respondido em: {response.created_at ? 
                        new Date(response.created_at).toLocaleDateString('pt-BR') : 
                        'Data não disponível'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-emerald-600 text-sm">Recebida</span>
                  </div>
                </div>
                
                {/* Response Content */}
                <div className="space-y-4">
                  {response.questions && response.questions.map((q: any) => (
                    <div key={q.id_perg} className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-foreground font-medium mb-2">{q.pergunta}</p>
                      {renderAnswerValue(q)}
                    </div>
                  ))}
                  
                  {!response.questions && response.resposta && (
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-muted-foreground">{response.resposta}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
