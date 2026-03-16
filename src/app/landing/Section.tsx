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
  /** Optional CSS gradient string rendered as a full-bleed overlay beneath the content.
   *  Used for faint pastel radial glows that bleed through the section background. */
  glow?: string;
}) {
  return (
    <section className={`relative w-full ${className}`}>
      {glow && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: glow }}
        />
      )}
      <div className="relative mx-auto max-w-[1000px] px-6 py-24 md:py-32">
        {children}
      </div>
    </section>
  );
}
