/* shared transition helpers + section wrapper */

const base = "transition-[opacity,transform] duration-700 ease-out";
const hidden = "opacity-0 translate-y-8";
const shown = "opacity-100 translate-y-0";

export function reveal(visible: boolean, delay = "") {
  return `${base} ${delay} ${visible ? shown : hidden}`;
}

export default function Section({
  children,
  className = "",
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  /** Optional CSS gradient string rendered as a full-bleed overlay beneath the content. */
  glow?: string;
}) {
  return (
    <section className={`relative w-full ${className}`}>
      {/* Veil keeps section content readable over the weather canvas.
          Dark mode: semi-transparent black lets weather show through subtly.
          Light mode: near-opaque background covers the dark canvas entirely. */}
      <div className="absolute inset-0 pointer-events-none dark:bg-black/52 bg-background/95 z-[1]" />

      {glow && (
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{ background: glow }}
        />
      )}

      <div className="relative z-[3] mx-auto max-w-[1000px] px-6 py-24 md:py-32">
        {children}
      </div>
    </section>
  );
}
