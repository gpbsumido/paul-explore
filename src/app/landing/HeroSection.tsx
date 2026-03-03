import dynamic from "next/dynamic";
import AuthButton from "@/components/AuthButton";
import ThemeToggle from "@/components/ThemeToggle";

// Three.js touches window/canvas immediately on import so it has to be
// client-only. ssr:false keeps it out of the server render entirely.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

// Applied to each hero text element so they fade up on load.
const heroReveal =
  "opacity-0 translate-y-8 animate-[hero-fade-in_0.7s_ease-out_forwards]";

export default function HeroSection() {
  return (
    <>
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 8px var(--color-primary-400); }
          50%       { box-shadow: 0 0 24px var(--color-primary-400); }
        }
        @keyframes hero-fade-in {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        {/* 3D wireframe shapes in the background, pointer events off so
            they don't interfere with any clicks on the hero content. */}
        <HeroScene />

        {/* Soft color blobs that were here before, layered above the canvas
            but still below the text. They blend nicely with the wireframes. */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary-500/10 blur-3xl" />

        <h1
          className={`${heroReveal} [animation-delay:100ms] relative z-10 text-5xl font-bold tracking-tight text-foreground md:text-7xl`}
        >
          Paul Sumido Portfolio
        </h1>
        <p
          className={`${heroReveal} [animation-delay:300ms] relative z-10 mt-4 max-w-md text-lg text-muted md:text-xl`}
        >
          A playground where I can test different styles and functionality.
        </p>
        <AuthButton
          loggedIn={false}
          className="opacity-0 translate-y-8 relative z-10 mt-8 inline-flex items-center rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background hover:opacity-90"
          style={{
            animation:
              "hero-fade-in 0.7s ease-out 0.5s forwards, glow-pulse 3s ease-in-out 1.2s infinite",
          }}
        />
      </section>
    </>
  );
}
