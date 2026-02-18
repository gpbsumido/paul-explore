import { type RefObject } from "react";
import AuthButton from "@/components/AuthButton";
import { useInView } from "./useInView";
import { reveal } from "./Section";

export default function FooterSection() {
  const [ref, visible] = useInView();

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden bg-background px-6 py-32 text-center">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-secondary-500/10 blur-3xl" />

      <div ref={ref as RefObject<HTMLDivElement>}>
        <h2
          className={`text-4xl font-bold tracking-tight text-foreground md:text-5xl ${reveal(visible)}`}
        >
          Ready to explore?
        </h2>
        <p
          className={`mt-4 text-lg text-muted ${reveal(visible, "delay-100")}`}
        >
          Log in and see everything in action.
        </p>
        <div className={`mt-8 ${reveal(visible, "delay-200")}`}>
          <AuthButton
            loggedIn={false}
            className="inline-flex items-center rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background hover:opacity-90"
          />
        </div>
      </div>
    </section>
  );
}
