import { type RefObject } from "react";
import { useInView } from "./useInView";
import Section, { reveal } from "./Section";

function FeatureCard({
  icon,
  title,
  description,
  visible,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  visible: boolean;
  delay: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 ${reveal(visible, delay)}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100" />
      <div className="relative z-10">
        <span className="text-3xl">{icon}</span>
        <h3 className="mt-3 text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  const [ref, visible] = useInView();

  return (
    <Section className="bg-neutral-950 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950">
      <div ref={ref as RefObject<HTMLDivElement>}>
        <h2
          className={`text-center text-3xl font-bold tracking-tight md:text-4xl ${reveal(visible)}`}
        >
          What I Built
        </h2>
        <p
          className={`mx-auto mt-3 max-w-lg text-center text-neutral-400 dark:text-neutral-600 ${reveal(visible, "delay-100")}`}
        >
          Three pillars powering this project — authentication, design, and
          live data.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon="🔐"
            title="Auth & Security"
            description="Auth0 integration with CSP headers, proxy middleware, and protected routes."
            visible={visible}
            delay="delay-100"
          />
          <FeatureCard
            icon="🎨"
            title="Design System"
            description="Token-driven palette, theme toggling, and reusable components."
            visible={visible}
            delay="delay-200"
          />
          <FeatureCard
            icon="🏀"
            title="NBA Stats"
            description="Live player stats via API proxy with batch loading and error handling."
            visible={visible}
            delay="delay-300"
          />
        </div>
      </div>
    </Section>
  );
}
