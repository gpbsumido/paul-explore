"use client";

import { useState } from "react";
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

/**
 * Vignette: the platform console's AI content module. Pick a template, hit
 * generate, watch the copy stream in. Output is canned and streamed locally.
 */
export default function AiContentEngineDemo({ feature }: { feature: WorkFeature }) {
  const [template, setTemplate] = useState<Template>("Patch notes");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = () => {
    if (busy) return;
    setOutput("");
    setBusy(true);
    const words = OUTPUT[template].split(" ");
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

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={template === t}
            onClick={() => setTemplate(t)}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              template === t ? "border-transparent text-white" : "border-border text-muted"
            }`}
            style={template === t ? { backgroundColor: ACCENT } : undefined}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="ml-auto rounded-md px-3 py-1 text-[12px] font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}
        >
          {busy ? "Generating…" : "Generate"}
        </button>
      </div>

      <div
        aria-label="Generated output"
        className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground"
      >
        {output || (
          <span className="text-muted">
            pick a template and generate, the copy streams in
          </span>
        )}
      </div>
    </div>
  );
}
