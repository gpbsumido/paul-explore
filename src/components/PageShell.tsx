import { type ReactNode } from "react";
import AmbientBackground from "@/components/AmbientBackground";

type Props = {
  /** Primary aurora colour. Defaults to the landing's violet. */
  colorA?: string;
  /** Secondary aurora colour. Defaults to the landing's sky blue. */
  colorB?: string;
  /** Extra classes for the root surface (e.g. "font-sans"). */
  className?: string;
  children: ReactNode;
};

/**
 * The standard page shell for the app's look: a full-height surface with the
 * shared {@link AmbientBackground} behind a z-10 content layer. Pages render
 * their PageHeader and content as children and pick an accent via colorA/colorB.
 *
 * A plain server component (it just renders the client AmbientBackground), so it
 * works in both server and client pages. Full-bleed layouts that manage their
 * own height/overflow (e.g. /work-portfolio) wrap AmbientBackground directly
 * instead of using this.
 */
export default function PageShell({
  colorA,
  colorB,
  className,
  children,
}: Props) {
  return (
    <div
      className={`relative min-h-dvh bg-background${className ? ` ${className}` : ""}`}
    >
      <AmbientBackground colorA={colorA} colorB={colorB} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
