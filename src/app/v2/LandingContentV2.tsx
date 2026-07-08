"use client";

import NavBar from "./landing/NavBar";
import HeroSection from "./landing/HeroSection";
import ProjectsSection from "./landing/ProjectsSection";
import StatsStrip from "./landing/StatsStrip";
import ThoughtsPreview from "./landing/ThoughtsPreview";
import FooterSection from "./landing/FooterSection";

export default function LandingContentV2() {
  return (
    <div className="scroll-smooth bg-background">
      <NavBar authenticated={false} />
      <HeroSection />
      <ProjectsSection />
      <StatsStrip />
      <ThoughtsPreview />
      <FooterSection />
    </div>
  );
}
