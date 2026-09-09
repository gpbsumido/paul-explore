"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, hsl(324 52% 55%))";
const ONLINE = "hsl(150 60% 50%)";
const console_ = "font-mono uppercase tracking-[0.12em]";

const TEMPLATES = ["Patch notes", "Event teaser", "Store blurb"] as const;
type Template = (typeof TEMPLATES)[number];

const OUTPUT: Record<Template, string> = {
  "Patch notes":
    "Season 4 lands today. We rebalanced three heroes, fixed the matchmaking hitch on console, and added a new ranked map. Full notes in game.",
  "Event teaser":
    "Something is stirring in the northern reach. Log in this weekend to find out what, and grab a login bonus while you are there.",
  "Store blurb":
    "The Aurora bundle is here: a legendary skin, matching emote, and 1200 crystals at 30 percent off launch week only.",
};

/** Each voice restyles the base copy so the "post" reads in that character. */
const VOICES = [
  {
    id: "hype",
    name: "Hype Announcer",
    style: (t: string) => `🔥 ${t} LET'S GOOO! 🔥`,
  },
  {
    id: "vet",
    name: "Grumpy Veteran",
    style: (t: string) =>
      `Ugh, fine, here it is: ${t} ...anyway, back in my day the grind was real.`,
  },
  {
    id: "lore",
    name: "Lore Keeper",
    style: (t: string) =>
      `Hear ye, travelers. ${t} May your blades stay sharp.`,
  },
  {
    id: "meme",
    name: "Meme Lord",
    style: (t: string) => `${t} no cap fr fr 💀🙏`,
  },
] as const;
type Voice = (typeof VOICES)[number];

/** Where the post goes — picked in the modal, shown back in the confirmation. */
const PLATFORMS = [
  { id: "x", name: "X", icon: "𝕏", handle: "@studio_official" },
  { id: "reddit", name: "Reddit", icon: "🤖", handle: "r/thegame" },
  { id: "discord", name: "Discord", icon: "🎮", handle: "#announcements" },
  { id: "tiktok", name: "TikTok", icon: "🎵", handle: "@studio" },
] as const;
type Platform = (typeof PLATFORMS)[number];

/**
 * Vignette: the platform console's AI content module. Pick a template and
 * generate canned copy that streams in; or post it to social in a chosen
 * character voice through a confirm modal. Everything is local and canned.
 */
export default function AiContentEngineDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [template, setTemplate] = useState<Template>("Patch notes");
  // Seed the output with the default template so the demo is never a blank box
  // on arrival; interacting (pick a template, Generate, Post) streams live.
  const [output, setOutput] = useState(OUTPUT["Patch notes"]);
  const [busy, setBusy] = useState(false);
  const [platform, setPlatform] = useState<Platform>(PLATFORMS[0]);
  const [voice, setVoice] = useState<Voice>(VOICES[0]);
  const [hashtags, setHashtags] = useState(true);
  const [postedVoice, setPostedVoice] = useState<string | null>(null);
  const [postedTo, setPostedTo] = useState<string | null>(null);

  // Compose the copy through the chosen personality and settings.
  const compose = (t: Template) =>
    voice.style(OUTPUT[t]) + (hashtags ? " #Season4 #gaming" : "");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stream = useCallback((text: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setOutput("");
    setBusy(true);
    const words = text.split(" ");
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 1;
      setOutput(words.slice(0, i).join(" "));
      if (i >= words.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setBusy(false);
      }
    }, 40);
  }, []);

  // Clear the streaming timer on unmount. Cleanup only, no setState, so this
  // effect stays off the cascading-render path the lint rule guards.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Picking a template streams its copy in, so the surface reacts immediately.
  const pick = (t: Template) => {
    setPostedVoice(null);
    setTemplate(t);
    stream(compose(t));
  };

  const generate = () => {
    if (busy) return;
    setPostedVoice(null);
    stream(compose(template));
  };

  const post = () => {
    setPostedVoice(voice.name);
    setPostedTo(`${platform.handle} on ${platform.name}`);
    stream(compose(template));
  };

  return (
    <div
      className="flex min-h-full flex-col gap-3 p-5 text-foreground"
      style={{
        background: "hsl(288 22% 7%)",
        backgroundImage:
          "linear-gradient(hsl(324 52% 55% / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(324 52% 55% / 0.05) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div>
        <p className={`${console_} flex items-center gap-1.5 text-[11px] text-muted`}>
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: ONLINE, boxShadow: `0 0 8px ${ONLINE}` }}
          />
          Platform console · content module
        </p>
        <h2 className={`${console_} mt-1 text-2xl font-bold text-foreground sm:text-3xl`}>
          {feature.title}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={template === t}
            onClick={() => pick(t)}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              template === t
                ? "border-transparent text-white"
                : "border-border text-muted"
            }`}
            style={template === t ? { backgroundColor: ACCENT } : undefined}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={post}
            className="paul-touch-min rounded-md border border-border px-3 py-1 text-[12px] text-foreground transition-colors hover:bg-foreground/5"
          >
            Post to {platform.name}
          </button>
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="rounded-md px-3 py-1 text-[12px] font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: ACCENT }}
          >
            {busy ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {/* Settings: where it posts, its personality, and extras */}
      <div className="grid gap-2 rounded-lg border border-border bg-white/[0.03] p-2.5 sm:grid-cols-2">
        <div>
          <p className={`${console_} mb-1 text-[10px] text-muted`}>Post to</p>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Platform">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-label={p.name}
                aria-pressed={platform.id === p.id}
                onClick={() => setPlatform(p)}
                className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                  platform.id === p.id
                    ? "border-transparent text-white"
                    : "border-border text-muted hover:bg-white/5"
                }`}
                style={
                  platform.id === p.id ? { backgroundColor: ACCENT } : undefined
                }
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={`${console_} mb-1 text-[10px] text-muted`}>Personality</p>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Personality">
            {VOICES.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-label={v.name}
                aria-pressed={voice.id === v.id}
                onClick={() => setVoice(v)}
                className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                  voice.id === v.id
                    ? "border-transparent text-white"
                    : "border-border text-muted hover:bg-white/5"
                }`}
                style={voice.id === v.id ? { backgroundColor: ACCENT } : undefined}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-muted sm:col-span-2">
          <input
            type="checkbox"
            aria-label="Add hashtags"
            checked={hashtags}
            onChange={(e) => setHashtags(e.target.checked)}
          />
          Add hashtags to the post
        </label>
      </div>

      {postedVoice && (
        <p className="text-[11px] font-medium" style={{ color: ACCENT }}>
          ✓ Posted as {postedVoice} to {postedTo ?? "@studio_official"} (not
          really)
        </p>
      )}

      <div
        aria-label="Generated output"
        className="h-36 overflow-y-auto rounded-lg border p-3 font-mono text-[13px] leading-relaxed text-foreground"
        style={{
          borderColor: "color-mix(in srgb, var(--wp-accent, hsl(324 52% 55%)) 40%, transparent)",
          background: "hsl(288 26% 4%)",
        }}
      >
        <span aria-hidden style={{ color: ACCENT }}>
          &gt;{" "}
        </span>
        {output || (
          <span className="text-muted">
            pick a template and generate, or post to social in a character voice
          </span>
        )}
        {busy && (
          <span
            aria-hidden
            className="ml-0.5 inline-block motion-safe:animate-pulse"
            style={{ color: ACCENT }}
          >
            ▋
          </span>
        )}
      </div>
    </div>
  );
}
