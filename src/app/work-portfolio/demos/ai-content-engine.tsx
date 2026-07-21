"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #f472b6)";

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
  { id: "hype", name: "Hype Announcer", style: (t: string) => `🔥 ${t} LET'S GOOO! 🔥` },
  {
    id: "vet",
    name: "Grumpy Veteran",
    style: (t: string) => `Ugh, fine, here it is: ${t} ...anyway, back in my day the grind was real.`,
  },
  {
    id: "lore",
    name: "Lore Keeper",
    style: (t: string) => `Hear ye, travelers. ${t} May your blades stay sharp.`,
  },
  { id: "meme", name: "Meme Lord", style: (t: string) => `${t} no cap fr fr 💀🙏` },
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
                style={voice.id === v.id ? { backgroundColor: ACCENT } : undefined}
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
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postedVoice, setPostedVoice] = useState<string | null>(null);

  const stream = (text: string) => {
    setOutput("");
    setBusy(true);
    const words = text.split(" ");
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setOutput(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(timer);
        setBusy(false);
      }
    }, 40);
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
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">
        {feature.title}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={template === t}
            onClick={() => setTemplate(t)}
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
            className="rounded-md border border-border px-3 py-1 text-[12px] text-foreground transition-colors hover:bg-foreground/5"
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
        className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground"
      >
        {output || (
          <span className="text-muted">
            pick a template and generate, or post to social in a character voice
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
