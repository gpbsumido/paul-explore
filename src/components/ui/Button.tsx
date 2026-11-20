import { type ComponentPropsWithRef, type ReactNode } from "react";
import { Button as PaulButton } from "@paul-portfolio/react";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

type BaseButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
};

type ButtonAsButton = BaseButtonProps &
  Omit<ComponentPropsWithRef<"button">, keyof BaseButtonProps> & {
    href?: undefined;
  };

type ButtonAsLink = BaseButtonProps &
  Omit<ComponentPropsWithRef<"a">, keyof BaseButtonProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * App-level Button backed by @paul-portfolio/react.
 * Preserves the existing API so all call sites keep working.
 *
 * With an href it renders a link and takes link props. Everything else passes
 * straight through to the DS Button, which already handles both shapes, so
 * there is no branch here that can quietly drop an aria-label or an onClick.
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  ...rest
}: ButtonProps) {
  return <PaulButton variant={variant} size={size} loading={loading} {...rest} />;
}
