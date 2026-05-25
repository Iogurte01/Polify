import { Outlet, Navigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { useApp } from "../contexts/AppContext";

export function Layout() {
  const { auth, onboardingComplete } = useApp();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
