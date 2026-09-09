"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, hsl(350 58% 55%))";
const GROWTH = "linear-gradient(120deg, hsl(350 72% 58%), hsl(20 92% 58%) 90%)";
const poster = "font-display font-bold uppercase tracking-tight";

type Campaign = {
  name: string;
  reward: string;
  budget: number;
  channel: string;
};

const CHANNELS = ["Referral", "Paid social", "Influencer", "Email"];
const STEPS = ["Basics", "Targeting", "Review"] as const;

// Each channel reaches and converts differently, so switching it visibly moves
// the projected numbers on the preview — not just the label.
const CHANNEL_MODEL: Record<
  string,
  { reachPerDollar: number; installsPerDollar: number; icon: string }
> = {
  Referral: { reachPerDollar: 8, installsPerDollar: 0.34, icon: "🔗" },
  "Paid social": { reachPerDollar: 22, installsPerDollar: 0.2, icon: "📣" },
  Influencer: { reachPerDollar: 14, installsPerDollar: 0.26, icon: "⭐" },
  Email: { reachPerDollar: 6, installsPerDollar: 0.4, icon: "✉️" },
};

/**
 * Vignette: the UA campaign builder, reworked as a stepped/disclosed flow.
 * You move through basics, targeting, then review one at a time, while the
 * live preview card on the right persists and updates across every step.
 */
export default function UaCampaignBuilderDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [step, setStep] = useState(0);
  const [campaign, setCampaign] = useState<Campaign>({
    name: "Spring drive",
    reward: "500 crystals",
    budget: 5000,
    channel: "Referral",
  });

  const set = <K extends keyof Campaign>(key: K, value: Campaign[K]) =>
    setCampaign((c) => ({ ...c, [key]: value }));

  const [launched, setLaunched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const closeLaunch = () => {
    setLaunched(false);
    setConfirmed(false);
  };

  // Basics is the only gated step: you cannot advance without a campaign name.
  const canAdvance = step !== 0 || campaign.name.trim().length > 0;
  const isLast = step === STEPS.length - 1;

  // Projected reach/installs/CPI, driven by BOTH budget and channel.
  const model = CHANNEL_MODEL[campaign.channel] ?? CHANNEL_MODEL.Referral;
  const installs = Math.round(campaign.budget * model.installsPerDollar);
  const reach = Math.round(campaign.budget * model.reachPerDollar);
  const cpi = (campaign.budget / Math.max(1, installs)).toFixed(2);
  const budgetPct = Math.round(((campaign.budget - 1000) / (20000 - 1000)) * 100);

  return (
    <div
      className="flex min-h-full flex-col gap-4 p-5 text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(52% 42% at 4% 0%, hsl(350 72% 55% / 0.24), transparent 60%), radial-gradient(48% 42% at 96% 6%, hsl(20 92% 55% / 0.2), transparent 62%)",
      }}
    >
      <header>
        <p className="text-[12px] font-semibold text-muted">
          UA &amp; referrals{" "}
          <span
            style={{
              backgroundImage: GROWTH,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            /
          </span>{" "}
          growth engine
        </p>
        <div className="flex items-end justify-between gap-3">
          <h2 className={`${poster} mt-1 text-3xl leading-[0.9] sm:text-4xl`}>
            {feature.title}
          </h2>
          <p className={`${poster} text-[11px] text-muted`}>
            Step {step + 1}/{STEPS.length} · {STEPS[step]}
          </p>
        </div>
        {/* step progress */}
        <div className="mt-2 flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background: i <= step ? GROWTH : "var(--color-border)",
              }}
            />
          ))}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
          <div className="space-y-2">
            {step === 0 && (
              <>
                <Input
                  label="Campaign name"
                  size="sm"
                  value={campaign.name}
                  onChange={(e) => set("name", e.target.value)}
                />
                <Input
                  label="Reward"
                  size="sm"
                  value={campaign.reward}
                  onChange={(e) => set("reward", e.target.value)}
                />
              </>
            )}

            {step === 1 && (
              <>
                <label className="block">
                  <span className="mb-0.5 block text-[11px] text-muted">
                    Budget: ${campaign.budget.toLocaleString()}
                  </span>
                  <input
                    aria-label="Budget"
                    type="range"
                    min={1000}
                    max={20000}
                    step={500}
                    value={campaign.budget}
                    onChange={(e) => set("budget", Number(e.target.value))}
                    className="w-full"
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[11px] text-muted">
                    Channel
                  </span>
                  <select
                    aria-label="Channel"
                    value={campaign.channel}
                    onChange={(e) => set("channel", e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {step === 2 && (
              <dl
                aria-label="Campaign review"
                className="space-y-1.5 text-[12px]"
              >
                {[
                  ["Name", campaign.name || "Untitled"],
                  ["Reward", campaign.reward],
                  ["Budget", `$${campaign.budget.toLocaleString()}`],
                  ["Channel", campaign.channel],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between border-b border-border pb-1"
                  >
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            {isLast ? (
              <Button size="sm" onClick={() => setLaunched(true)}>
                Launch
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!canAdvance}
                onClick={() =>
                  setStep((s) => Math.min(STEPS.length - 1, s + 1))
                }
              >
                Next
              </Button>
            )}
          </div>
        </div>

        <div
          aria-label="Campaign preview"
          className="flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <p
                className={`${poster} text-[10px]`}
                style={{
                  backgroundImage: GROWTH,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {campaign.channel} campaign
              </p>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-background"
                style={{ background: GROWTH }}
              >
                {model.icon} {campaign.channel}
              </span>
            </div>
            <p className={`${poster} mt-1 text-2xl leading-tight`}>
              {campaign.name || "Untitled"}
            </p>
            <p className="mt-1 text-[12px] text-muted">
              Earn{" "}
              <span className="font-medium text-foreground">
                {campaign.reward}
              </span>{" "}
              for every friend who signs up.
            </p>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted">Budget</span>
                <span className="font-bold text-foreground tabular-nums">
                  ${campaign.budget.toLocaleString()}
                </span>
              </div>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full transition-all"
                  style={{ width: `${budgetPct}%`, background: GROWTH }}
                />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Reach", reach.toLocaleString()],
                ["Installs", installs.toLocaleString()],
                ["CPI", `$${cpi}`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/[0.04] py-2"
                >
                  <p className="text-[9px] uppercase tracking-wider text-muted">
                    {label}
                  </p>
                  <p className={`${poster} text-[15px] tabular-nums`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={launched} onClose={closeLaunch} aria-label="Launch campaign">
        {confirmed ? (
          <div className="p-1 text-center">
            <p className="text-3xl" aria-hidden>
              🚀
            </p>
            <p className="mt-2 text-[15px] font-bold text-foreground">
              Campaign launched
            </p>
            <p className="mt-1 text-[12px] text-muted">
              {campaign.name || "Untitled"} is live on {campaign.channel}.
            </p>
            <Button size="sm" className="mt-3" onClick={closeLaunch}>
              Done
            </Button>
          </div>
        ) : (
          <div className="p-1">
            <p className="text-[15px] font-bold text-foreground">
              Launch “{campaign.name || "Untitled"}”?
            </p>
            <p className="mt-1 text-[12px] text-muted">
              {campaign.channel} · ${campaign.budget.toLocaleString()} budget ·
              ~{installs.toLocaleString()} est. installs
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={closeLaunch}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setConfirmed(true)}>
                Confirm launch
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
