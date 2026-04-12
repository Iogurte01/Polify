import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Hub } from "./pages/Hub";
import { CreateSurvey } from "./pages/CreateSurvey";
import { MySurveys } from "./pages/MySurveys";
import { Carteira } from "./pages/Carteira";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { AnswerSurvey } from "./pages/AnswerSurvey";
import { ViewResponses } from "./pages/ViewResponses";
import { Marketplace } from "./pages/Marketplace";
import { Onboarding } from "./pages/Onboarding";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/cadastro",
    Component: Register,
  },
  {
    path: "/esqueci-senha",
    Component: ForgotPassword,
  },
  {
    path: "/onboarding",
    Component: Onboarding,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Hub },
      { path: "criar-pesquisa", Component: CreateSurvey },
      { path: "minhas-pesquisas", Component: MySurveys },
      { path: "carteira", Component: Carteira },
      { path: "tokens", Component: Carteira },
      { path: "perfil", Component: Profile },
      { path: "configuracoes", Component: Settings },
      { path: "responder/:id", Component: AnswerSurvey },
      { path: "respostas/:id", Component: ViewResponses },
      { path: "marketplace", Component: Marketplace },
      { path: "*", Component: Hub },
    ],
  },
]);
