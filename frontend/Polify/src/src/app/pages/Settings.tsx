import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Settings as SettingsIcon, Bell, Shield, Globe, Moon, Mail, Smartphone, Lock,
  ChevronRight, CheckCircle, Trash2, X, Download, AlertTriangle,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";
import type { Lang } from "../i18n/translations";

interface ToggleSettingProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}

function ToggleSetting({ label, description, enabled, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
      <div>
        <p className="text-foreground" style={{ fontSize: "14px", fontWeight: 500 }}>{label}</p>
        <p className="text-muted-foreground mt-0.5" style={{ fontSize: "12px" }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${enabled ? "bg-[#6366f1]" : "bg-switch-background"}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${enabled ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
      </button>
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  // Adicionamos o 'user' aqui na desestruturação do useApp
  const { user, theme, setTheme, lang, setLang, deleteAccount, changePassword, downloadUserData, requestDataDeletion, lgpdDeletionStatus, t } = useApp();
  const [pushNotif, setPushNotif] = useState(false);
  const [newSurveys, setNewSurveys] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);
  const [showActivity, setShowActivity] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Password change state
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // LGPD deletion confirm
  const [deletionConfirmModal, setDeletionConfirmModal] = useState(false);

  const handleDeleteAccount = () => {
    if (deleteConfirm !== "EXCLUIR") return;
    deleteAccount();
    toast.success(t("profile.deleteSuccess"));
    navigate("/login");
  };

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.current = t("auth.error.password");
    else if (currentPassword.length < 6) errors.current = t("auth.error.passwordMin");
    if (!newPassword) errors.new = t("auth.error.password");
    else if (newPassword.length < 6) errors.new = t("auth.error.passwordMin");
    if (newPassword !== confirmPassword) errors.confirm = t("auth.error.passwordMatch");

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      toast.success("Senha alterada com sucesso!");
      setPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
    } else {
      setPasswordErrors({ current: "Senha atual incorreta" });
    }
  };

  const handleDownloadData = () => {
    downloadUserData();
    toast.success("Dados exportados com sucesso!");
  };

  const handleRequestDeletion = () => {
    requestDataDeletion();
    toast.success("Solicitação de exclusão enviada!");
    setDeletionConfirmModal(false);
  };

  return (
    <div className="max-w-[800px] mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1" style={{ fontSize: "14px" }}>{t("settings.subtitle")}</p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-[#6366f1]" />
            <h3 className="text-foreground" style={{ fontSize: "15px" }}>{t("settings.notifications")}</h3>
          </div>
          <ToggleSetting label={t("settings.pushNotif")} description={t("settings.pushNotifDesc")} enabled={pushNotif} onChange={setPushNotif} />
          <ToggleSetting label={t("settings.newSurveys")} description={t("settings.newSurveysDesc")} enabled={newSurveys} onChange={setNewSurveys} />
        </div>

        {/* Privacy */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-[#6366f1]" />
            <h3 className="text-foreground" style={{ fontSize: "15px" }}>{t("settings.privacy")}</h3>
          </div>
          <ToggleSetting label={t("settings.publicProfile")} description={t("settings.publicProfileDesc")} enabled={profilePublic} onChange={setProfilePublic} />
          <ToggleSetting label={t("settings.showActivity")} description={t("settings.showActivityDesc")} enabled={showActivity} onChange={setShowActivity} />
          <div className="flex items-center justify-between py-3.5 border-b border-border">
            <div>
              <p className="text-foreground" style={{ fontSize: "14px", fontWeight: 500 }}>{t("settings.changePassword")}</p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "12px" }}>{t("settings.updatePasswordInstruction")}</p>
            </div>
            <button onClick={() => setPasswordModal(true)} className="text-[#6366f1] hover:text-[#5558e6] transition-colors"><ChevronRight size={16} /></button>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-foreground" style={{ fontSize: "14px", fontWeight: 500 }}>{t("settings.2fa")}</p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "12px" }}>{t("settings.2faDesc")}</p>
            </div>
            <span className="text-emerald-600 flex items-center gap-1" style={{ fontSize: "12px", fontWeight: 500 }}>
              <CheckCircle size={13} />{t("settings.active")}
            </span>
          </div>
        </div>

        {/* LGPD */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-[#6366f1]" />
            <h3 className="text-foreground" style={{ fontSize: "15px" }}>{t("settings.lgpd")}</h3>
          </div>
          <ToggleSetting label={t("settings.consent")} description={t("settings.consentDesc")} enabled={lgpdConsent} onChange={setLgpdConsent} />
          <ToggleSetting label={t("settings.dataSharing")} description={t("settings.dataSharingDesc")} enabled={dataSharing} onChange={setDataSharing} />
          <div className="mt-3 bg-secondary rounded-lg p-3">
            <p className="text-muted-foreground" style={{ fontSize: "12px", lineHeight: "1.5" }}>{t("settings.lgpdNotice")}</p>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDownloadData}
              className="flex items-center gap-2 bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20 px-4 py-2.5 rounded-lg transition-colors"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              <Download size={14} /> {t("settings.downloadData")}
            </button>
            <button
              onClick={() => setDeletionConfirmModal(true)}
              className="flex items-center gap-2 border border-red-300 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-4 py-2.5 rounded-lg transition-colors"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              <Trash2 size={14} /> {t("settings.deleteData")}
            </button>
          </div>
          {lgpdDeletionStatus !== "none" && (
            <div className={`mt-3 rounded-lg p-3 flex items-center gap-2 ${lgpdDeletionStatus === "pending" ? "bg-amber-50 dark:bg-amber-950/20" : "bg-emerald-50 dark:bg-emerald-950/20"}`}>
              {lgpdDeletionStatus === "pending" ? (
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
              ) : (
                <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
              )}
              <p style={{ fontSize: "12px" }} className={lgpdDeletionStatus === "pending" ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}>
                {lgpdDeletionStatus === "pending"
                  ? "Solicitação de exclusão em análise. Prazo: até 15 dias úteis."
                  : "Exclusão de dados concluída."}
              </p>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon size={16} className="text-[#6366f1]" />
            <h3 className="text-foreground" style={{ fontSize: "15px" }}>{t("settings.preferences")}</h3>
          </div>

          <div className="flex items-center justify-between py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-muted-foreground" />
              <p className="text-foreground" style={{ fontSize: "14px", fontWeight: 500 }}>{t("settings.language")}</p>
            </div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-input-background border border-border rounded-lg px-3 py-1.5 text-foreground appearance-none cursor-pointer"
              style={{ fontSize: "13px" }}
            >
              <option value="pt-BR">Português (BR)</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-2">
              <Moon size={14} className="text-muted-foreground" />
              <div>
                <p className="text-foreground" style={{ fontSize: "14px", fontWeight: 500 }}>{t("settings.darkMode")}</p>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: "12px" }}>{t("settings.darkModeDesc")}</p>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${theme === "dark" ? "bg-[#6366f1]" : "bg-switch-background"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${theme === "dark" ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={16} className="text-[#6366f1]" />
            <h3 className="text-foreground" style={{ fontSize: "15px" }}>{t("settings.account")}</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground" />
                <span className="text-foreground" style={{ fontSize: "13px" }}>
                  {user?.email || "Email não encontrado"}
                </span>
              </div>
              <span className="text-emerald-600 flex items-center gap-1" style={{ fontSize: "11px", fontWeight: 500 }}>
                <CheckCircle size={11} /> {t("settings.verified")}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Smartphone size={14} className="text-muted-foreground" />
                <span className="text-foreground" style={{ fontSize: "13px" }}>
                  {user?.telefone || user?.phone || ""}
                </span>
              </div>
              <span className="text-emerald-600 flex items-center gap-1" style={{ fontSize: "11px", fontWeight: 500 }}>
                <CheckCircle size={11} /> {t("settings.verified")}
              </span>
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-foreground" style={{ fontSize: "15px", fontWeight: 500 }}>{t("settings.deleteAccount")}</h3>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "12px" }}>{t("settings.deleteAccountDesc")}</p>
            </div>
            <button
              onClick={() => setDeleteModal(true)}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              <Trash2 size={14} /> {t("settings.deleteAccount")}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[420px] max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground" style={{ fontSize: "16px", fontWeight: 600 }}>{t("settings.changePassword")}</h3>
              <button onClick={() => { setPasswordModal(false); setPasswordErrors({}); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-foreground block mb-1.5" style={{ fontSize: "13px" }}>Senha atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setPasswordErrors({}); }}
                  className={`w-full bg-input-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${passwordErrors.current ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "14px" }}
                  placeholder="Digite sua senha atual"
                />
                {passwordErrors.current && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{passwordErrors.current}</p>}
              </div>
              <div>
                <label className="text-foreground block mb-1.5" style={{ fontSize: "13px" }}>Nova senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors({}); }}
                  className={`w-full bg-input-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${passwordErrors.new ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "14px" }}
                  placeholder="Mínimo 6 caracteres"
                />
                {passwordErrors.new && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{passwordErrors.new}</p>}
              </div>
              <div>
                <label className="text-foreground block mb-1.5" style={{ fontSize: "13px" }}>Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErrors({}); }}
                  className={`w-full bg-input-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] ${passwordErrors.confirm ? "border-red-400" : "border-border"}`}
                  style={{ fontSize: "14px" }}
                  placeholder="Repita a nova senha"
                />
                {passwordErrors.confirm && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{passwordErrors.confirm}</p>}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setPasswordModal(false); setPasswordErrors({}); }} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
                {t("general.cancel")}
              </button>
              <button
                onClick={handleChangePassword}
                className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-4 py-2 rounded-lg transition-colors"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                {t("general.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LGPD Deletion Confirm Modal */}
      {deletionConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[420px] max-w-[90vw]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-red-500" />
              <h3 className="text-foreground" style={{ fontSize: "16px", fontWeight: 600 }}>{t("settings.deleteData")}</h3>
            </div>
            <p className="text-muted-foreground mb-4" style={{ fontSize: "13px" }}>
              Ao solicitar a exclusão, seus dados pessoais serão removidos em até 15 dias úteis, conforme previsto pela LGPD. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletionConfirmModal(false)} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
                {t("general.cancel")}
              </button>
              <button
                onClick={handleRequestDeletion}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Solicitar exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-[420px] max-w-[90vw]">
            <h3 className="text-red-500 mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>{t("settings.deleteConfirm")}</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: "13px" }}>{t("settings.deleteAccountDesc")}</p>
            <div>
              <label className="text-foreground mb-1.5 block" style={{ fontSize: "13px" }}>{t("settings.deleteType")}</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="EXCLUIR"
                className="w-full bg-input-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400"
                style={{ fontSize: "14px" }}
              />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setDeleteModal(false); setDeleteConfirm(""); }} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
                {t("general.cancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "EXCLUIR"}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                {t("general.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}