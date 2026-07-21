import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";

import "./src/styles/fonts.css";
import "./src/styles/theme.css";
import "./src/styles/index.css";
import "./src/styles/tailwind.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
    >
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);