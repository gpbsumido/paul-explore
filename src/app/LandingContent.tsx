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
import KetsupSection from "./landing/KetsupSection";
import WeatherCanvas from "./landing/WeatherCanvas";
import { WeatherProvider } from "@/contexts/WeatherContext";

export default function LandingContent() {
  return (
    <WeatherProvider>
      <div className="bg-black">
        {/* Fixed full-screen weather effect canvas — sits behind all sections */}
        <WeatherCanvas className="fixed inset-0 z-0 pointer-events-none" />
        <HeroSection />
        <FeaturesSection />
        <AuthSection />
        <DesignSection />
        <NbaSection />
        <TcgSection />
        <CalendarSection />
        <GraphQLSection />
        <VitalsSection />
        <KetsupSection />
        <FooterSection />
      </div>
    </WeatherProvider>
  );
}
