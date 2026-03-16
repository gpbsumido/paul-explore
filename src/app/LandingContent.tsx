"use client";

import HeroSection from "./landing/HeroSection";
import FeaturesSection from "./landing/FeaturesSection";
import AuthSection from "./landing/AuthSection";
import DesignSection from "./landing/DesignSection";
import NbaSection from "./landing/NbaSection";
import TcgSection from "./landing/TcgSection";
import CalendarSection from "./landing/CalendarSection";
import GraphQLSection from "./landing/GraphQLSection";
import VitalsSection from "./landing/VitalsSection";
import FooterSection from "./landing/FooterSection";

/** Hairline gradient divider — fades from transparent to white/8 and back. */
function Divider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
  );
}

export default function LandingContent() {
  return (
    <div className="bg-black">
      <HeroSection />
      <Divider />
      <FeaturesSection />
      <Divider />
      <AuthSection />
      <Divider />
      <DesignSection />
      <Divider />
      <NbaSection />
      <Divider />
      <TcgSection />
      <Divider />
      <CalendarSection />
      <Divider />
      <GraphQLSection />
      <Divider />
      <VitalsSection />
      <Divider />
      <FooterSection />
    </div>
  );
}
