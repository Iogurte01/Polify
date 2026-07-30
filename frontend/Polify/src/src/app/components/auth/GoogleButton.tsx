import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useApp } from "../../contexts/AppContext";
import { Loader2 } from "lucide-react";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export default function GoogleButton({
  className,
  children,
}: Props) {
  const navigate = useNavigate();
  const { loginGoogle } = useApp();
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    flow: "auth-code",

    onSuccess: async (codeResponse) => {
      console.log("Google respondeu:", codeResponse);
      setLoading(true);

      try {
        const success = await loginGoogle(codeResponse.code);

        console.log("Resultado loginGoogle:", success);

        if (success) {
          toast.success("Login realizado!");
          navigate("/");
        } else {
          toast.error("Erro ao entrar com Google");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao entrar com Google");
      } finally {
        setLoading(false);
      }
    },

    onError: () => {
      toast.error("Falha ao entrar com Google");
      setLoading(false);
    },
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={loading}
      className={className}
      style={{ position: "relative" }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
          <Loader2 className="animate-spin text-[#6366f1]" size={20} />
        </div>
      )}
      <span style={{ opacity: loading ? 0.5 : 1 }}>
        {children}
      </span>
    </button>
  );
}