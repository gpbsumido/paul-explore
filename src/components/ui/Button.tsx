import { type ComponentPropsWithRef, type ReactNode } from "react";
import { Button as PaulButton } from "@paul/react";

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
 * App-level Button backed by @paul/react.
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
  return (
    <PaulButton
      ref={ref}
      variant={variant}
      size={size}
      loading={loading}
      disabled={disabled}
      className={className}
      href={href}
      {...rest}
    >
      {children}
    </PaulButton>
  );
}
