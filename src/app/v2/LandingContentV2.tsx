"use client";

import dynamic from "next/dynamic";
import NavBar from "./landing/NavBar";
import HeroSection from "./landing/HeroSection";

// NavBar and HeroSection are eager. They're above the fold and HeroSection
// holds the LCP element (the H1). Everything below the fold is split into
// async chunks so the initial JS bundle is smaller and first paint lands
// sooner. Each of these sections pulls in framer-motion, so keeping them out
// of the initial chunk is where the FCP win comes from. ssr: true keeps them
// in the streamed HTML so SEO and server-rendered content are unaffected.
const ProjectsSection = dynamic(() => import("./landing/ProjectsSection"), {
  ssr: true,
});
const StatsStrip = dynamic(() => import("./landing/StatsStrip"), { ssr: true });
const ThoughtsPreview = dynamic(() => import("./landing/ThoughtsPreview"), {
  ssr: true,
});
const FooterSection = dynamic(() => import("./landing/FooterSection"), {
  ssr: true,
});

export default function LandingContentV2() {
  return (
    <div className="scroll-smooth bg-background">
      <NavBar authenticated={false} />
      <main>
        <HeroSection />
        <ProjectsSection />
        <StatsStrip />
        <ThoughtsPreview />
      </main>
      <FooterSection />
    </div>
  );
}
