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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`w-full ${className}`}>
      <div className="mx-auto max-w-[1000px] px-6 py-24 md:py-32">
        {children}
      </div>
    </section>
  );
}
