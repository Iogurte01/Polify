import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./utils";

type LoadingActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

export function LoadingActionButton({
  loading = false,
  loadingLabel,
  children,
  className,
  disabled,
  type = "button",
  style,
  ...props
}: LoadingActionButtonProps) {
  const loadingStyle = loading
    ? {
        backgroundImage: "linear-gradient(120deg, #4f46e5 0%, #6366f1 32%, #7c3aed 68%, #6366f1 100%)",
      }
    : undefined;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-live="polite"
      className={cn(
        "polify-loading-button relative inline-flex items-center justify-center overflow-hidden rounded-xl text-white transition-colors disabled:opacity-60 disabled:pointer-events-none",
        loading &&
          "polify-loading-button--loading bg-[linear-gradient(120deg,#4f46e5_0%,#6366f1_32%,#7c3aed_68%,#6366f1_100%)] bg-[length:200%_200%] animate-[polify-loading-gradient-shift_4s_ease-in-out_infinite] motion-reduce:bg-[length:100%_100%] motion-reduce:animate-none motion-reduce:transition-none",
        className,
      )}
      style={{ ...style, ...loadingStyle }}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-1.5" aria-hidden="true">
          <span
            className="polify-loading-button__dot h-2 w-2 rounded-full bg-white animate-[polify-typing-dot_1.05s_ease-in-out_infinite] motion-reduce:animate-none"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="polify-loading-button__dot h-2 w-2 rounded-full bg-white animate-[polify-typing-dot_1.05s_ease-in-out_infinite] motion-reduce:animate-none"
            style={{ animationDelay: "0.16s" }}
          />
          <span
            className="polify-loading-button__dot h-2 w-2 rounded-full bg-white animate-[polify-typing-dot_1.05s_ease-in-out_infinite] motion-reduce:animate-none"
            style={{ animationDelay: "0.32s" }}
          />
        </span>
      ) : (
        children
      )}

      <span className="sr-only">{loadingLabel || String(children)}</span>
    </button>
  );
}