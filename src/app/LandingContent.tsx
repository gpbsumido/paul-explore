"use client";

import dynamic from "next/dynamic";
import HeroSection from "./landing/HeroSection";
import WeatherCanvas from "./landing/WeatherCanvas";
import { WeatherProvider } from "@/contexts/WeatherContext";

// HeroSection is eager — it contains the LCP element (the H1).
// Everything below the fold is split into async chunks so the initial JS
// bundle is smaller and the LCP paint can happen sooner.

const FeaturesSection = dynamic(() => import("./landing/FeaturesSection"), {
  ssr: true,
});
const AuthSection = dynamic(() => import("./landing/AuthSection"), {
  ssr: true,
});
const DesignSection = dynamic(() => import("./landing/DesignSection"), {
  ssr: true,
});
const NbaSection = dynamic(() => import("./landing/NbaSection"), { ssr: true });
const TcgSection = dynamic(() => import("./landing/TcgSection"), { ssr: true });
const CalendarSection = dynamic(() => import("./landing/CalendarSection"), {
  ssr: true,
});
const GraphQLSection = dynamic(() => import("./landing/GraphQLSection"), {
  ssr: true,
});
const VitalsSection = dynamic(() => import("./landing/VitalsSection"), {
  ssr: true,
});
const KetsupSection = dynamic(() => import("./landing/KetsupSection"), {
  ssr: true,
});
const FooterSection = dynamic(() => import("./landing/FooterSection"), {
  ssr: true,
});

export default function LandingContent() {
  return (
    <WeatherProvider>
      <div className="bg-background">
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
