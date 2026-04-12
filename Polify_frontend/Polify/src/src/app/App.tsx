import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider } from "./contexts/AppContext";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          },
        }}
      />
    </AppProvider>
  );
}
