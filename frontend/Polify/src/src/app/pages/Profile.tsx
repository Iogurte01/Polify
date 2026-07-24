import { useState } from "react";
import { useNavigate } from "react-router";
import {
  User, CheckCircle, Award, BarChart3, Edit3, Save, X,
  MessageSquare, LogOut, Trash2, ShieldCheck, Target, GraduationCap, MapPin, Trophy,
  Download, AlertTriangle, Shield, Compass, Crown, Handshake,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { currentUser, brazilianStates, gamificationLevels } from "../data/mockData";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { toast } from "sonner";

const badgeIcons: Record<string, React.ReactNode> = {
  trophy: <Trophy size={16} className="text-[#6366f1]" />,
  check: <ShieldCheck size={16} className="text-[#6366f1]" />,
  chart: <BarChart3 size={16} className="text-[#6366f1]" />,
  graduation: <GraduationCap size={16} className="text-muted-foreground" />,
  target: <Target size={16} className="text-[#6366f1]" />,
  map: <MapPin size={16} className="text-muted-foreground" />,
};

const levelIcons: Record<string, React.ReactNode> = {
  compass: <Compass size={16} />,
  handshake: <Handshake size={16} />,
  award: <Award size={16} />,
  "shield-check": <ShieldCheck size={16} />,
  crown: <Crown size={16} />,
};

export function Profile() {
  const navigate = useNavigate();
  const { auth, surveys, mySurveys, answeredSurveys, demographics, updateDemographics, xpTotal, xpRange, xpToNextLevel, xpProgressPercent, userLevel, logout, deleteAccount, downloadUserData, requestDataDeletion, lgpdDeletionStatus, t } = useApp();
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({ ...demographics });
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletionConfirmModal, setDeletionConfirmModal] = useState(false);

  const activeSurveysCount = surveys.filter((survey) => survey.status === "Ativa").length;
  const completionRate = activeSurveysCount > 0
    ? Math.round((answeredSurveys.length / activeSurveysCount) * 100)
    : 0;

  const handleStartEditing = () => { setEditDraft({ ...demographics }); setEditing(true); };
  const handleSave = () => { updateDemographics(editDraft); setEditing(false); toast.success(t("profile.savedSuccess")); };
  const handleCancel = () => { setEditDraft({ ...demographics }); setEditing(false); };
  const handleLogout = () => { logout(); navigate("/login"); };
  const handleDeleteAccount = async () => { if (deleteConfirm !== "EXCLUIR") return; await deleteAccount(); toast.success(t("profile.deleteSuccess")); navigate("/login"); };
  const handleDownloadData = () => { downloadUserData(); toast.success("Dados exportados com sucesso!"); };
  const handleRequestDeletion = async () => { await requestDataDeletion(); toast.success("Solicitação de exclusão enviada!"); setDeletionConfirmModal(false); };

  const userInitials = auth.user?.name ? auth.user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "U";

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-foreground">{t("profile.title")}</h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "14px" }}>{t("profile.subtitle")}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
          <LogOut size={15} /> {t("nav.logout")}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Profile Card */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white" style={{ fontSize: "22px", fontWeight: 600 }}>
                {userInitials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-foreground">{auth.user?.name || currentUser.name}</h2>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 600, backgroundColor: `${userLevel.color}15`, color: userLevel.color }}>
                    {levelIcons[userLevel.icon]} {userLevel.name}
                  </span>
                </div>
                <p className="text-muted-foreground" style={{ fontSize: "13px" }}>{auth.user?.email || currentUser.email}</p>
                <p className="text-muted-foreground mt-2" style={{ fontSize: "12px" }}>
                  {xpTotal} XP acumulado · {xpRange}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground" style={{ fontSize: "11px" }}>Progresso para o próximo nível</span>
                    <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{xpToNextLevel} XP restantes</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-[#6366f1] transition-all" style={{ width: `${Math.min(100, Math.max(0, xpProgressPercent))}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {currentUser.badges.filter((b) => b.earned).map((badge) => (
                    <span key={badge.name} className="bg-[#6366f1]/10 text-[#6366f1] px-2.5 py-1 rounded-md flex items-center gap-1.5 group relative" style={{ fontSize: "11px", fontWeight: 500 }}>
                      {badgeIcons[badge.icon] || badge.icon} {badge.name}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{badge.tooltip}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<CheckCircle size={16} className="text-emerald-600" />} label={t("profile.completionRate")} value={`${completionRate}%`} color="text-emerald-600" />
            <StatCard icon={<MessageSquare size={16} className="text-[#8b5cf6]" />} label="Respostas" value={`${answeredSurveys.length}`} color="text-[#8b5cf6]" />
          </div>

          {/* Gamification Levels */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-foreground mb-4 flex items-center gap-2" style={{ fontSize: "15px" }}>
              <Award size={16} /> Níveis de Gamificação
            </h3>
            <div className="space-y-2">
              {gamificationLevels.map((level) => {
                const isCurrentLevel = level.id === userLevel.id;
                const isUnlocked = xpTotal >= level.minXp;
                return (
                  <div key={level.id} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${isCurrentLevel ? "bg-[#6366f1]/5 border border-[#6366f1]/20" : isUnlocked ? "bg-secondary/50" : "opacity-40"}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${level.color}15`, color: level.color }}>
                      {levelIcons[level.icon]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>{level.name}</p>
                        {isCurrentLevel && <span className="bg-[#6366f1] text-white px-1.5 py-0.5 rounded" style={{ fontSize: "9px", fontWeight: 600 }}>ATUAL</span>}
                      </div>
                      <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{level.minXp}+ XP · x{level.tokenMultiplier.toFixed(1)} tokens</p>
                    </div>
                    {isUnlocked && <CheckCircle size={16} className="text-emerald-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Survey History */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-foreground mb-4 flex items-center gap-2" style={{ fontSize: "15px" }}>
              <BarChart3 size={16} />{t("profile.history")}
            </h3>
            <div className="space-y-2">
              {mySurveys.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>{s.title}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{s.createdAt}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md ${s.status === "Ativa" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" : s.status === "Rascunho" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`} style={{ fontSize: "11px", fontWeight: 500 }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground flex items-center gap-2" style={{ fontSize: "15px" }}>
                <User size={16} />{t("profile.demographics")}
              </h3>
              <button onClick={() => editing ? handleSave() : handleStartEditing()} className="text-[#6366f1] hover:text-[#5558e6] transition-colors">
                {editing ? <Save size={16} /> : <Edit3 size={16} />}
              </button>
            </div>
            <div className="space-y-3">
              <DemoField label="Idade" value={editing ? editDraft.age : demographics.age} editing={editing} options={["18–24", "25–30", "31–40", "41–50", "51–60", "60+"]} onChange={(v) => setEditDraft({ ...editDraft, age: v })} />
              <DemoField label="Gênero" value={editing ? editDraft.gender : demographics.gender} editing={editing} options={["Feminino", "Masculino", "Não-binário", "Prefiro não informar"]} onChange={(v) => setEditDraft({ ...editDraft, gender: v })} />
              <div>
                <label className="text-muted-foreground block mb-1" style={{ fontSize: "11px", fontWeight: 500 }}>Estado</label>
                {editing ? (
                  <select value={editDraft.state} onChange={(e) => setEditDraft({ ...editDraft, state: e.target.value, city: "" })} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground appearance-none cursor-pointer" style={{ fontSize: "13px" }}>
                    <option value="">Selecionar</option>
                    {brazilianStates.map(s => <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>)}
                  </select>
                ) : (
                  <p className="text-foreground" style={{ fontSize: "13px" }}>{brazilianStates.find(s => s.uf === demographics.state)?.name || demographics.state}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground block mb-1" style={{ fontSize: "11px", fontWeight: 500 }}>Cidade</label>
                {editing ? (
                  <CityAutocomplete stateUf={editDraft.state} value={editDraft.city} onChange={(city) => setEditDraft({ ...editDraft, city })} placeholder="Buscar cidade..." />
                ) : (
                  <p className="text-foreground" style={{ fontSize: "13px" }}>{demographics.city}</p>
                )}
              </div>
              <DemoField label="Escolaridade" value={editing ? editDraft.education : demographics.education} editing={editing} options={["Ensino Médio", "Graduação", "Pós-graduação", "Mestrado/Doutorado"]} onChange={(v) => setEditDraft({ ...editDraft, education: v })} />
              <DemoField label="Renda" value={editing ? editDraft.income : demographics.income} editing={editing} options={["Até R$ 2.000", "R$ 2.000–5.000", "R$ 5.000–10.000", "Acima de R$ 10.000"]} onChange={(v) => setEditDraft({ ...editDraft, income: v })} />
            </div>
            {editing && (
              <div className="flex gap-2 mt-4">
                <button onClick={handleSave} className="flex-1 bg-[#6366f1] hover:bg-[#5558e6] text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}><Save size={14} />{t("profile.save")}</button>
                <button onClick={handleCancel} className="px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"><X size={14} /></button>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-foreground mb-4 flex items-center gap-2" style={{ fontSize: "15px" }}><Award size={16} />{t("profile.badges")}</h3>
            <div className="grid grid-cols-2 gap-2">
              {currentUser.badges.map((badge) => (
                <div key={badge.name} className={`p-3 rounded-lg border text-center relative group ${badge.earned ? "border-[#6366f1]/30 bg-[#6366f1]/5" : "border-border opacity-40"}`}>
                  <div className="flex justify-center mb-1">{badgeIcons[badge.icon]}</div>
                  <p className={`${badge.earned ? "text-foreground" : "text-muted-foreground"} truncate`} style={{ fontSize: "11px", fontWeight: 500 }}>{badge.name}</p>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{badge.tooltip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LGPD */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-foreground mb-3 flex items-center gap-2" style={{ fontSize: "15px" }}><Shield size={16} className="text-[#6366f1]" /> LGPD</h3>
            <div className="space-y-2">
              <button onClick={handleDownloadData} className="w-full flex items-center gap-2 bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20 px-4 py-2.5 rounded-lg transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}><Download size={14} /> Baixar meus dados</button>
              <button onClick={() => setDeletionConfirmModal(true)} className="w-full flex items-center gap-2 border border-red-300 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-4 py-2.5 rounded-lg transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}><Trash2 size={14} /> Solicitar exclusão de dados</button>
              {lgpdDeletionStatus !== "none" && (
                <div className={`rounded-lg p-3 flex items-center gap-2 ${lgpdDeletionStatus === "pending" ? "bg-amber-50 dark:bg-amber-950/20" : "bg-emerald-50 dark:bg-emerald-950/20"}`}>
                  {lgpdDeletionStatus === "pending" ? <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" /> : <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />}
                  <p style={{ fontSize: "11px" }} className={lgpdDeletionStatus === "pending" ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}>
                    {lgpdDeletionStatus === "pending" ? "Exclusão em análise (15 dias)" : "Exclusão concluída"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-card border border-border rounded-xl p-5">
            <button onClick={() => setDeleteModal(true)} className="w-full flex items-center justify-center gap-2 border border-red-300 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-4 py-2.5 rounded-lg transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
              <Trash2 size={14} /> {t("profile.deleteAccount")}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {deletionConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[420px] max-w-[90vw]">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle size={18} className="text-red-500" /><h3 className="text-foreground" style={{ fontSize: "16px", fontWeight: 600 }}>Solicitar exclusão de dados</h3></div>
            <p className="text-muted-foreground mb-4" style={{ fontSize: "13px" }}>Ao solicitar a exclusão, seus dados pessoais serão removidos em até 15 dias úteis, conforme previsto pela LGPD. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletionConfirmModal(false)} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>{t("general.cancel")}</button>
              <button onClick={handleRequestDeletion} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>Confirmar solicitação</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[420px] max-w-[90vw]">
            <h3 className="text-red-500 mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>{t("profile.deleteAccount")}</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: "13px" }}>{t("profile.deleteConfirm")}</p>
            <div>
              <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>{t("profile.deleteType")}</label>
              <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="EXCLUIR" className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400" style={{ fontSize: "14px" }} />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setDeleteModal(false); setDeleteConfirm(""); }} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>{t("general.cancel")}</button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirm !== "EXCLUIR"} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-40" style={{ fontSize: "13px", fontWeight: 500 }}>{t("general.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="mb-2">{icon}</div>
      <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{label}</p>
      <p className={`${color} mt-0.5`} style={{ fontSize: "18px", fontWeight: 600 }}>{value}</p>
    </div>
  );
}

function DemoField({ label, value, editing, options, onChange }: { label: string; value: string; editing: boolean; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-muted-foreground block mb-1" style={{ fontSize: "11px", fontWeight: 500 }}>{label}</label>
      {editing ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground appearance-none cursor-pointer" style={{ fontSize: "13px" }}>
          {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
        </select>
      ) : (
        <p className="text-foreground" style={{ fontSize: "13px" }}>{value}</p>
      )}
    </div>
  );
}
