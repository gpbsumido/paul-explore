"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HeaderMenu from "@/components/HeaderMenu";

type NavBarProps = {
  authenticated: boolean;
};

export default function NavBar({ authenticated }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-background/80 border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-foreground"
        >
          paul-explore
        </Link>

        {authenticated ? (
          <HeaderMenu showSettings showLogout />
        ) : (
          <a
            href="/auth/login"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Log in
          </a>
        )}
      </div>
    </nav>
  );
}
