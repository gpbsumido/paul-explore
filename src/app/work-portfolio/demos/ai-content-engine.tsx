"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
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

/** Confirm-post modal: pick a character voice, preview the styled copy, post. */
function PostModal({
  template,
  onClose,
  onPost,
}: {
  template: Template;
  onClose: () => void;
  onPost: (voice: Voice) => void;
}) {
  const [voice, setVoice] = useState<Voice>(VOICES[0]);
  return (
    <Modal open onClose={onClose} aria-label="Post to social">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Post to social <span className="normal-case">(not really)</span>
        </p>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-foreground">
            Character voice
          </span>
          <div className="flex flex-wrap gap-1.5">
            {VOICES.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={voice.id === v.id}
                onClick={() => setVoice(v)}
                className={`rounded-full border px-2.5 py-1 text-[11px] ${
                  voice.id === v.id
                    ? "border-transparent text-white"
                    : "border-border text-muted"
                }`}
                style={
                  voice.id === v.id ? { backgroundColor: ACCENT } : undefined
                }
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background p-2 text-[12px] leading-relaxed text-foreground">
          {voice.style(OUTPUT[template])}
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onPost(voice)}>
            Post
          </Button>
        </div>
      </div>
    </Modal>
  );
}

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
  const [posting, setPosting] = useState(false);
  const [postedVoice, setPostedVoice] = useState<string | null>(null);

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
    stream(OUTPUT[t]);
  };

  const generate = () => {
    if (busy) return;
    setPostedVoice(null);
    stream(OUTPUT[template]);
  };

  const post = (voice: Voice) => {
    setPosting(false);
    setPostedVoice(voice.name);
    stream(voice.style(OUTPUT[template]));
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
            onClick={() => setPosting(true)}
            className="paul-touch-min rounded-md border border-border px-3 py-1 text-[12px] text-foreground transition-colors hover:bg-foreground/5"
          >
            Post to social
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

      {postedVoice && (
        <p className="text-[11px] font-medium" style={{ color: ACCENT }}>
          ✓ Posted as {postedVoice} to @studio_official (not really)
        </p>
      )}

      <div
        aria-label="Generated output"
        className="min-h-32 flex-1 overflow-y-auto rounded-lg border p-3 font-mono text-[13px] leading-relaxed text-foreground"
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

      {posting && (
        <PostModal
          template={template}
          onClose={() => setPosting(false)}
          onPost={post}
        />
      )}
    </div>
  );
}
