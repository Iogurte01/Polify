import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard, PlusCircle, FolderOpen, Wallet, User, Settings, Shield, LogOut,
  Store, ChevronDown,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";

export function Sidebar() {
  const { auth, tokenBalance, userLevel, logout, t } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: "/criar-pesquisa", icon: PlusCircle, label: t("nav.create"), highlight: true },
    { to: "/", icon: LayoutDashboard, label: "HUB" },
    { to: "/minhas-pesquisas", icon: FolderOpen, label: t("nav.mySurveys") },
    { to: "/carteira", icon: Wallet, label: "Carteira" },
    { to: "/marketplace", icon: Store, label: t("nav.marketplace") },
    { to: "/perfil", icon: User, label: t("nav.profile") },
    { to: "/configuracoes", icon: Settings, label: t("nav.settings") },
  ];

  const userName =
    auth.user && "name" in auth.user
      ? auth.user.name
      : auth.user?.nome;

  const userInitials = userName
    ? userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";
    
  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="w-[240px] min-w-[240px] h-screen bg-sidebar flex flex-col sticky top-0">
      <div className="px-6 py-6 flex items-center gap-2.5">
        <img
          src="/logo_loxify.png"
          alt="Polify"
          className="w-8 h-8 object-contain"
        />
        <span className="text-white tracking-tight" style={{ fontSize: "20px", fontWeight: 700 }}>Polify</span>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                item.highlight && !isActive
                  ? "bg-[#6366f1] text-white hover:bg-[#5558e6]"
                  : isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:text-white hover:bg-sidebar-accent/60"
              } ${item.to === "/marketplace" ? "hidden" : ""} ${
                item.to === "/criar-pesquisa" ? "mb-3" : "" // <-- AQUI: Adiciona o espaço extra
              }`
            }
            style={{ fontSize: "14px", fontWeight: 500 }}
          >
            <item.icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 mx-3 mb-3 py-3 rounded-lg bg-sidebar-accent/80 border border-sidebar-border">
        <div className="flex items-center gap-2 text-[#6366f1]" style={{ fontSize: "11px", fontWeight: 600 }}>
          <Shield size={13} />
          <span>{t("general.lgpdCompliant")}</span>
        </div>
        <p className="text-[#6b6b8a] mt-1" style={{ fontSize: "10px", lineHeight: "1.4" }}>
          {t("general.lgpdDesc")}
        </p>
      </div>

      <div className="px-4 py-4 border-t border-sidebar-border relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-3 w-full text-left">
          <div className="w-9 h-9 rounded-full bg-[#6366f1] flex items-center justify-center text-white flex-shrink-0" style={{ fontSize: "13px", fontWeight: 600 }}>
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white truncate" style={{ fontSize: "13px", fontWeight: 500 }}>{userName || "User"}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[#a78bfa] flex items-center gap-1" style={{ fontSize: "11px" }}>
                <Wallet size={10} /> {tokenBalance}
              </span>
              <span style={{ fontSize: "10px", color: userLevel.color }}>
                {userLevel.name}
              </span>
            </div>
          </div>
          <ChevronDown size={14} className={`text-sidebar-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
            <button onClick={() => { setMenuOpen(false); navigate("/perfil"); }} className="w-full text-left px-3 py-2 hover:bg-secondary flex items-center gap-2 text-foreground transition-colors" style={{ fontSize: "13px" }}>
              <User size={14} /> {t("nav.profile")}
            </button>
            <button onClick={() => { setMenuOpen(false); navigate("/configuracoes"); }} className="w-full text-left px-3 py-2 hover:bg-secondary flex items-center gap-2 text-foreground transition-colors" style={{ fontSize: "13px" }}>
              <Settings size={14} /> {t("nav.settings")}
            </button>
            <div className="border-t border-border my-1" />
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 text-red-500 transition-colors" style={{ fontSize: "13px" }}>
              <LogOut size={14} /> {t("nav.logout")}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}