"use client";

import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import { spring, instantTransition } from "@/lib/animations";

type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  color: string;
  preview: React.ReactNode;
  thoughtsHref?: string;
  index: number;
  reversed?: boolean;
};

export default function ProjectCard({
  title,
  description,
  href,
  color,
  preview,
  thoughtsHref,
  index,
  reversed = false,
}: ProjectCardProps) {
  const prefersReduced = useReducedMotion();
  const skip = prefersReduced ?? false;

  return (
    <m.div
      className={`group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/50 sm:flex-row ${
        reversed ? "sm:flex-row-reverse" : ""
      }`}
      initial={skip ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={
        skip ? instantTransition : { ...spring.smooth, delay: index * 0.1 }
      }
      whileHover={skip ? {} : { y: -4 }}
    >
      {/* Preview area — 60% on desktop */}
      <div
        className="relative flex min-h-[200px] items-center justify-center rounded-t-2xl p-8 sm:min-h-0 sm:w-[60%] sm:rounded-none"
        style={{ backgroundColor: `${color}0D` }}
      >
        <div className="w-full scale-[0.9] sm:scale-100">{preview}</div>
      </div>

      {/* Text side — 40% on desktop */}
      <div className="flex flex-1 flex-col justify-center gap-4 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        </div>

        <p className="text-base leading-relaxed text-muted">{description}</p>

        <div className="mt-2 flex flex-wrap gap-4">
          <Link
            href={href}
            className="text-sm font-medium text-foreground transition-opacity hover:opacity-70"
          >
            View project →
          </Link>
          {thoughtsHref && (
            <Link
              href={thoughtsHref}
              className="text-sm font-medium text-muted transition-opacity hover:opacity-70"
            >
              Read about it →
            </Link>
          )}
        </div>
      </div>
    </m.div>
  );
}
