import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useApp } from "../../contexts/AppContext";

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

  const login = useGoogleLogin({
    flow: "auth-code",

    onSuccess: async (codeResponse) => {
      console.log("Google respondeu:", codeResponse);

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
      }
    },

    onError: () => {
      toast.error("Falha ao entrar com Google");
    },
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      className={className}
    >
      {children}
    </button>
  );
}