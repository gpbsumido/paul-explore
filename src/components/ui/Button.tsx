import { type ComponentPropsWithRef, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={[
        "inline-flex items-center justify-center font-medium",
        "transition-colors cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "xs" && "px-3 py-1 text-[11px] rounded-md gap-1",
        size === "sm" && "h-8 px-4 text-sm rounded-md gap-1.5",
        size === "md" && "h-10 px-5 text-sm rounded-lg gap-2",
        size === "lg" && "h-12 px-8 text-base rounded-lg gap-2.5",
        variant === "primary" &&
          "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
        variant === "secondary" &&
          "bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800",
        variant === "outline" &&
          "border border-border bg-transparent text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
        variant === "ghost" &&
          "bg-transparent text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
        loading && "cursor-wait",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
