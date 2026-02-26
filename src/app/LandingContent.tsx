"use client";

import HeroSection from "./landing/HeroSection";
import FeaturesSection from "./landing/FeaturesSection";
import AuthSection from "./landing/AuthSection";
import DesignSection from "./landing/DesignSection";
import NbaSection from "./landing/NbaSection";
import TcgSection from "./landing/TcgSection";
import CalendarSection from "./landing/CalendarSection";
import GraphQLSection from "./landing/GraphQLSection";
import FooterSection from "./landing/FooterSection";

export default function LandingContent() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <AuthSection />
      <DesignSection />
      <NbaSection />
      <TcgSection />
      <CalendarSection />
      <GraphQLSection />
      <FooterSection />
    </>
  );
}
