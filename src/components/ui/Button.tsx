import { type ComponentPropsWithRef, type ReactNode } from "react";
import { Button as PaulButton } from "@paul-portfolio/react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
  href?: string;
}

/**
 * App-level Button backed by @paul-portfolio/react.
 * Preserves the existing API so all call sites keep working.
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  href,
  ref,
  ...rest
}: ButtonProps) {
  const shared = { ref, variant, size, loading, disabled, className } as const;

  if (href) {
    return (
      <PaulButton {...shared} href={href}>
        {children}
      </PaulButton>
    );
  }

  return (
    <PaulButton {...shared} {...rest}>
      {children}
    </PaulButton>
  );
}
