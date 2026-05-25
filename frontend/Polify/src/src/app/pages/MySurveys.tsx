import { useNavigate } from "react-router";
import {
  FolderOpen, MoreHorizontal, BarChart3, Trash2, PlusCircle, Zap, Star, Copy,
  Download, FileText, Users, Clock, CheckCircle, ArrowLeft, ShoppingCart, Shield, Coins,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { reportData, mockRespondents, ratingQuestions, computeStarsFromStructuredRating } from "../data/mockData";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";

const statusColors: Record<string, { bg: string; text: string }> = {
  Ativa: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400" },
  Rascunho: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400" },
  Encerrada: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
};

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#4f46e5", "#c4b5fd"];

type ViewTab = "created" | "marketplace";

export function MySurveys() {
  const navigate = useNavigate();
  const { mySurveys, deleteSurvey, duplicateSurvey, boostSurvey, respondentRatings, rateRespondent, theme, t, fetchMySurveys } = useApp();
  const [searchQuery] = useState("");
  const [statusFilter] = useState("Todas");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [boostModal, setBoostModal] = useState<string | null>(null);
  const [rateModal, setRateModal] = useState<string | null>(null);
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("created");
  const [loading, setLoading] = useState(true);

  // Fetch user's surveys on component mount
  useEffect(() => {
    const loadSurveys = async () => {
      try {
        setLoading(true);
        await fetchMySurveys();
      } catch (error) {
        console.error("Error loading surveys:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSurveys();
  }, [fetchMySurveys]);

  const createdSurveys = mySurveys.filter(s => s.source !== "marketplace");
  const marketplaceSurveys = mySurveys.filter(s => s.source === "marketplace");
  const currentList = activeTab === "created" ? createdSurveys : marketplaceSurveys;

  const filtered = currentList.filter((s) => {
    const matchesSearch = (s.title ?? '').toLowerCase().includes((searchQuery ?? '').toLowerCase());
    const matchesStatus = statusFilter === "Todas" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-8 py-16 text-center">
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando suas pesquisas...</p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    const success = await deleteSurvey(id);
    if (success) {
      toast.success(t("mySurveys.deleteSuccess"));
      setDeleteConfirmId(null);
    } else {
      toast.error(t("mySurveys.deleteError"));
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateSurvey(id);
    toast.success(t("mySurveys.duplicateSuccess"));
  };

  const handleBoost = (id: string) => {
    const survey = mySurveys.find(s => s.id === id);
    if (!survey) return;
    if (survey.responses < 20) { toast.error(t("boost.locked")); setBoostModal(null); return; }
    const success = boostSurvey(id);
    if (success) { toast.success(t("boost.success")); } else { toast.error(t("create.error.balance")); }
    setBoostModal(null);
  };

  const handleExportCSV = () => {
    const csvContent = [
      "Pergunta,Opção,Respostas",
      ...reportData.questions.flatMap(q => q.data.map(d => `"${q.question}","${d.option}",${d.count}`))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "relatorio-polify.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const survey = mySurveys.find(s => s.id === reportModal);
      const title = survey?.title || reportData.surveyTitle;
      doc.setFillColor(49, 46, 129); doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text("Polify - Relatório", 14, 15);
      doc.setFontSize(10); doc.text(new Date().toLocaleDateString("pt-BR"), 14, 22);
      doc.setTextColor(30, 30, 30); doc.setFontSize(14); doc.text(title, 14, 42);
      doc.setFontSize(10);
      doc.text(`Total de Respostas: ${reportData.totalResponses}`, 14, 54);
      doc.text(`Tempo Médio: ${reportData.averageTime}`, 14, 60);
      doc.text(`Taxa de Conclusão: ${reportData.completionRate}%`, 14, 66);
      doc.setFontSize(12); doc.text("Dados Demográficos", 14, 78);
      autoTable(doc, {
        startY: 82, head: [["Gênero", "%"]],
        body: reportData.demographics.gender.map(g => [g.name, `${g.value}%`]),
        theme: "grid", headStyles: { fillColor: [99, 102, 241] }, margin: { left: 14 }, tableWidth: 80,
      });
      const afterDemo = (doc as any).lastAutoTable.finalY + 10;
      reportData.questions.forEach((q, idx) => {
        const startY = afterDemo + idx * 50;
        if (startY > 250) doc.addPage();
        const actualY = startY > 250 ? 20 : startY;
        doc.setFontSize(11); doc.text(`${idx + 1}. ${q.question}`, 14, actualY);
        autoTable(doc, {
          startY: actualY + 4, head: [["Opção", "Respostas", "%"]],
          body: q.data.map(d => { const total = q.data.reduce((acc, item) => acc + item.count, 0); return [d.option, String(d.count), `${Math.round((d.count / total) * 100)}%`]; }),
          theme: "grid", headStyles: { fillColor: [99, 102, 241] }, margin: { left: 14 }, tableWidth: 160,
        });
      });
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
        doc.text("Este relatório contém apenas dados agregados e anonimizados (LGPD).", 14, 285);
        doc.text(`Página ${i} de ${pageCount}`, 180, 285);
      }
      doc.save(`relatorio-polify-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch { toast.error("Erro ao gerar PDF"); }
  };

  const chartColors = {
    grid: theme === "dark" ? "#2d2b50" : "#e2e4ec",
    tick: theme === "dark" ? "#8b8da8" : "#6b6b8a",
    tooltipBg: theme === "dark" ? "#1a1830" : "#fff",
    tooltipBorder: theme === "dark" ? "#2d2b50" : "#e2e4ec",
  };

  // Report view
  if (reportModal) {
    const survey = mySurveys.find(s => s.id === reportModal);
    return (
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setReportModal(null)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ArrowLeft size={16} /></button>
            <div>
              <h1 className="text-foreground" style={{ fontSize: "20px" }}>{t("report.title")}</h1>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "13px" }}>{survey?.title || reportData.surveyTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2.5 rounded-lg hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}><FileText size={14} />{t("report.exportCSV")}</button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e6] text-white px-4 py-2.5 rounded-lg transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}><Download size={14} />{t("report.exportPDF")}</button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricCard icon={<Users size={16} className="text-[#6366f1]" />} label={t("report.totalResponses")} value={String(survey?.responses || reportData.totalResponses)} />
          <MetricCard icon={<Clock size={16} className="text-[#8b5cf6]" />} label={t("report.avgTime")} value={reportData.averageTime} />
          <MetricCard icon={<CheckCircle size={16} className="text-emerald-600" />} label={t("report.completionRate")} value={`${reportData.completionRate}%`} />
          <MetricCard icon={<BarChart3 size={16} className="text-[#f59e0b]" />} label={t("report.questions")} value={reportData.questions.length.toString()} />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <DemoPie title="Gênero" data={reportData.demographics.gender} theme={theme} />
          <DemoPie title="Faixa Etária" data={reportData.demographics.age} theme={theme} />
          <DemoPie title="Escolaridade" data={reportData.demographics.education} theme={theme} />
        </div>
        <div className="space-y-4">
          <h2 className="text-foreground" style={{ fontSize: "16px" }}>{t("report.questionResponses")}</h2>
          {reportData.questions.map((q) => (
            <div key={q.id} className="bg-card border border-border rounded-xl p-6">
              <span className="bg-[#6366f1]/10 text-[#6366f1] px-2 py-0.5 rounded-md" style={{ fontSize: "11px", fontWeight: 500 }}>
                {q.type === "multiple" ? "Múltipla Escolha" : q.type === "scale" ? "Escala" : "Aberta"}
              </span>
              <h3 className="text-foreground mb-4 mt-2" style={{ fontSize: "15px" }}>{q.question}</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={q.data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: chartColors.tick }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="option" tick={{ fontSize: 12, fill: chartColors.tick }} axisLine={false} tickLine={false} width={140} />
                    <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-secondary border border-border rounded-xl p-4 flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0"><span style={{ fontSize: "12px" }}>🔒</span></div>
          <div>
            <p className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>{t("report.lgpd")}</p>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "12px" }}>{t("report.lgpdDesc")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Structured Rating Modal
  if (rateModal) {
    const respondents = mockRespondents[rateModal] || [];
    return <StructuredRatingView
      respondents={respondents}
      respondentRatings={respondentRatings}
      rateRespondent={rateRespondent}
      onBack={() => setRateModal(null)}
      t={t}
    />;
  }

  // Stats for current tab
  const activeCount = currentList.filter(s => s.status === "Ativa").length;

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-foreground">{t("mySurveys.title")}</h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "14px" }}>{t("mySurveys.subtitle")}</p>
        </div>
        <button onClick={() => navigate("/criar-pesquisa")} className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e6] text-white px-5 py-3 rounded-xl transition-colors" style={{ fontSize: "14px", fontWeight: 500 }}>
          <PlusCircle size={16} />{t("mySurveys.new")}
        </button>
      </div>

      {/* Tabs: Created vs Marketplace */}
      <div className="flex gap-1 mb-6 bg-secondary rounded-xl p-1">
        <button
          onClick={() => setActiveTab("created")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors flex-1 justify-center ${activeTab === "created" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <FolderOpen size={15} /> Criadas por mim ({createdSurveys.length})
        </button>
        <button
          onClick={() => setActiveTab("marketplace")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors flex-1 justify-center ${activeTab === "marketplace" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          <ShoppingCart size={15} /> Compradas ({marketplaceSurveys.length})
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground" style={{ fontSize: "12px" }}>Total de Pesquisas</p>
          <p className="text-foreground mt-1" style={{ fontSize: "24px", fontWeight: 600 }}>{currentList.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground" style={{ fontSize: "12px" }}>{activeTab === "created" ? "Ativas" : "Disponíveis"}</p>
          <p className="text-emerald-600 mt-1" style={{ fontSize: "24px", fontWeight: 600 }}>{activeCount}</p>
        </div>
      </div>

      {/* Survey Cards with Response Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((survey) => (
          <div key={survey.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:shadow-xl hover:border-[#6366f1]/50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusColors[survey.status]}`}>
                  {survey.status}
                </span>
                <span className="text-muted-foreground ml-2" style={{ fontSize: "11px" }}>
                  {survey.responses} {t("mySurveys.responses")} • {survey.targetResponses} {t("mySurveys.target")}
                </span>
              </div>
              <button
                onClick={() => navigate(`/respostas/${survey.id}`)}
                className="px-3 py-2 bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-lg transition-colors text-sm"
              >
                {t("mySurveys.viewResponses")}
              </button>
            </div>

            <div>
              <h3 className="text-foreground font-medium" style={{ fontSize: "16px" }}>{survey.title}</h3>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "13px" }}>{survey.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {survey.segmentation}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {survey.estimatedTime}
                </span>
                <span className="flex items-center gap-1">
                  <Coins size={14} />
                  {survey.tokenReward} tokens
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">{t("mySurveys.responses")}: {survey.responses}</span>
                <button
                  onClick={() => navigate(`/respostas/${survey.id}`)}
                  className="text-[#6366f1] hover:text-[#5558e6] text-sm font-medium"
                >
                  {t("mySurveys.viewDetails")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>Título</th>
              <th className="text-left px-5 py-3 text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>Status</th>
              <th className="text-left px-5 py-3 text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>Progresso</th>
              <th className="text-left px-5 py-3 text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>Data</th>
              <th className="px-5 py-3" style={{ width: "80px" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((survey) => {
              const progress = Math.round((survey.responses / Math.max(survey.targetResponses, 1)) * 100);
              const colors = statusColors[survey.status] || statusColors.Encerrada;
              const quality = survey.avgQuality || 0;

              return (
                <tr key={survey.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-foreground" style={{ fontSize: "14px", fontWeight: 500 }}>{survey.title}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {survey.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-secondary rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-[#6366f1] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className="text-muted-foreground text-xs" style={{ fontSize: "11px" }}>{progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-muted-foreground" style={{ fontSize: "13px" }}>{survey.createdAt || '-'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 hover:bg-secondary rounded-md transition-colors">
                          <MoreHorizontal size={14} className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setReportModal(survey.id)} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "13px" }}>
                          <BarChart3 size={14} /> {t("mySurveys.report")}
                        </DropdownMenuItem>
                        {survey.source !== "marketplace" && (
                          <DropdownMenuItem onClick={() => handleDuplicate(survey.id)} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "13px" }}>
                            <Copy size={14} /> {t("mySurveys.duplicate")}
                          </DropdownMenuItem>
                        )}
                        {survey.status === "Ativa" && survey.source !== "marketplace" && (
                          <>
                            <DropdownMenuItem onClick={() => setRateModal(survey.id)} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "13px" }}>
                              <Star size={14} /> {t("mySurveys.rate")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setBoostModal(survey.id)} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "13px" }}>
                              <Zap size={14} /> {t("mySurveys.boost")}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteConfirmId(survey.id)} variant="destructive" className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "13px" }}>
                          <Trash2 size={14} /> {t("mySurveys.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FolderOpen size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground" style={{ fontSize: "14px" }}>{t("mySurveys.noResults")}</p>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[400px] max-w-[90vw]">
            <h3 className="text-foreground mb-2" style={{ fontSize: "16px" }}>{t("mySurveys.deleteConfirm")}</h3>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>{t("general.cancel")}</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>{t("general.delete")}</button>
            </div>
          </div>
        </div>
      )}

      {boostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[420px] max-w-[90vw]">
            <div className="flex items-center gap-2 mb-3"><Zap size={18} className="text-[#f59e0b]" /><h3 className="text-foreground" style={{ fontSize: "16px" }}>{t("boost.title")}</h3></div>
            <div className="bg-[#f59e0b]/10 dark:bg-[#f59e0b]/5 rounded-lg p-3 mb-3"><p className="text-foreground" style={{ fontSize: "12px" }}>{t("boost.rule")}</p></div>
            <p className="text-muted-foreground mb-1" style={{ fontSize: "13px" }}>{t("boost.cost")}</p>
            <p className="text-muted-foreground mb-4" style={{ fontSize: "12px" }}>Respostas: {mySurveys.find(s => s.id === boostModal)?.responses || 0}/20 mínimo</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setBoostModal(null)} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>{t("general.cancel")}</button>
              <button onClick={() => handleBoost(boostModal)} className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-4 py-2 rounded-lg transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>{t("general.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Structured Rating Component ──
function StructuredRatingView({ respondents, respondentRatings, rateRespondent, onBack, t }: {
  respondents: any[];
  respondentRatings: Record<string, Record<string, boolean>>;
  rateRespondent: (id: string, answers: Record<string, boolean>) => void;
  onBack: () => void;
  t: (k: string) => string;
}) {
  const navigate = useNavigate();
  const [activeRespondent, setActiveRespondent] = useState<string | null>(null);
  const [ratingAnswers, setRatingAnswers] = useState<Record<string, boolean>>({});

  const handleSubmitRating = (respondentId: string) => {
    if (Object.keys(ratingAnswers).length < ratingQuestions.length) {
      toast.error("Responda todas as perguntas antes de enviar.");
      return;
    }
    rateRespondent(respondentId, ratingAnswers);
    const stars = computeStarsFromStructuredRating(ratingAnswers);
    toast.success(`Avaliação enviada: ${stars} estrelas`);
    setActiveRespondent(null);
    setRatingAnswers({});
  };

  return (
    <div className="max-w-[900px] mx-auto px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ArrowLeft size={16} /></button>
        <div>
          <h1 className="text-foreground" style={{ fontSize: "20px" }}>Avaliar Respostas</h1>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: "13px" }}>Avaliação estruturada de qualidade</p>
        </div>
      </div>

      {activeRespondent ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-foreground mb-4" style={{ fontSize: "16px", fontWeight: 600 }}>
            Avaliar: {respondents.find(r => r.id === activeRespondent)?.name}
          </h3>
          <div className="space-y-4 mb-6">
            {ratingQuestions.map((q) => (
              <div key={q.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <p className="text-foreground" style={{ fontSize: "14px" }}>{q.text}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRatingAnswers({ ...ratingAnswers, [q.id]: true })}
                    className={`px-4 py-1.5 rounded-lg transition-colors ${ratingAnswers[q.id] === true ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                    style={{ fontSize: "13px", fontWeight: 500 }}
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setRatingAnswers({ ...ratingAnswers, [q.id]: false })}
                    className={`px-4 py-1.5 rounded-lg transition-colors ${ratingAnswers[q.id] === false ? "bg-red-500 text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                    style={{ fontSize: "13px", fontWeight: 500 }}
                  >
                    Não
                  </button>
                </div>
              </div>
            ))}
          </div>
          {Object.keys(ratingAnswers).length === ratingQuestions.length && (
            <div className="bg-[#6366f1]/5 border border-[#6366f1]/20 rounded-lg p-3 mb-4">
              <p className="text-[#6366f1]" style={{ fontSize: "13px", fontWeight: 500 }}>
                Resultado: {computeStarsFromStructuredRating(ratingAnswers)} estrelas
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setActiveRespondent(null); setRatingAnswers({}); }} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>Cancelar</button>
            <button onClick={() => handleSubmitRating(activeRespondent)} className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-4 py-2 rounded-lg transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>Enviar Avaliação</button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>Respondente</th>
                <th className="text-left px-5 py-3 text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>Média</th>
                <th className="text-left px-5 py-3 text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>Completou em</th>
                <th className="text-center px-5 py-3 text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {respondents.map((resp) => {
                const hasRated = !!respondentRatings[resp.id];
                const stars = hasRated ? computeStarsFromStructuredRating(respondentRatings[resp.id]) : 0;
                return (
                  <tr key={resp.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusColors[resp.status]}`}>
                            {resp.status}
                          </span>
                          <span className="text-muted-foreground ml-2" style={{ fontSize: "11px" }}>
                            {resp.responses} {t("mySurveys.responses")} • {resp.targetResponses} {t("mySurveys.target")}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/respostas/${resp.id}`)}
                          className="px-3 py-2 bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-lg transition-colors text-sm"
                        >
                          {t("mySurveys.viewResponses")}
                        </button>
                      </div>

                      <div>
                        <h3 className="text-foreground font-medium" style={{ fontSize: "16px" }}>{resp.title}</h3>
                        <p className="text-muted-foreground mt-1" style={{ fontSize: "13px" }}>{resp.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {resp.segmentation}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {resp.estimatedTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Coins size={14} />
                            {resp.tokenReward} tokens
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">{t("mySurveys.responses")}: {resp.responses}</span>
                          <button
                            onClick={() => navigate(`/respostas/${resp.id}`)}
                            className="text-[#6366f1] hover:text-[#5558e6] text-sm font-medium"
                          >
                            {t("mySurveys.viewDetails")}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-[#f59e0b] fill-[#f59e0b]" />
                        <span className="text-foreground" style={{ fontSize: "13px" }}>{resp.avgRating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className="text-muted-foreground" style={{ fontSize: "13px" }}>{resp.completedAt}</span></td>
                    <td className="px-5 py-4 text-center">
                      {hasRated ? (
                        <span className="flex items-center gap-1 justify-center text-emerald-600" style={{ fontSize: "12px", fontWeight: 500 }}>
                          <CheckCircle size={14} /> {stars}★ avaliado
                        </span>
                      ) : (
                        <button
                          onClick={() => { setActiveRespondent(resp.id); setRatingAnswers({}); }}
                          className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-3 py-1.5 rounded-lg transition-colors"
                          style={{ fontSize: "12px", fontWeight: 500 }}
                        >
                          Avaliar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {respondents.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground" style={{ fontSize: "13px" }}>Nenhum respondente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-2">{icon}</div>
      <p className="text-muted-foreground" style={{ fontSize: "12px" }}>{label}</p>
      <p className="text-foreground mt-1" style={{ fontSize: "22px", fontWeight: 600 }}>{value}</p>
    </div>
  );
}

function DemoPie({ title, data, theme }: { title: string; data: { name: string; value: number }[]; theme: string }) {
  const tooltipBg = theme === "dark" ? "#1a1830" : "#fff";
  const tooltipBorder = theme === "dark" ? "#2d2b50" : "#e2e4ec";
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h4 className="text-foreground mb-3" style={{ fontSize: "14px" }}>Cruzamento: {title}</h4>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
              {data.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
            </Pie>
            <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }} formatter={(value: any) => [`${value}%`, "Participação"]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{d.name} ({d.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
