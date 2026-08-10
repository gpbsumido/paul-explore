import { type ComponentPropsWithRef, type ReactNode } from "react";
import { Button as PaulButton } from "@paul-portfolio/react";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger";
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
  // Every app button gets a finger-sized minimum on a touch screen. Done here
  // rather than per call site because the small sizes are exactly the ones that
  // were too short, and they are used in dozens of places.
  const shared = {
    ref,
    variant,
    size,
    loading,
    disabled,
    className: className ? `touch-min ${className}` : "touch-min",
  } as const;

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
