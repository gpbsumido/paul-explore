"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #fb7185)";

type Campaign = {
  name: string;
  reward: string;
  budget: number;
  channel: string;
};

const CHANNELS = ["Referral", "Paid social", "Influencer", "Email"];

/**
 * Vignette: the UA campaign builder. Fill the form on the left, a live
 * preview card updates on the right, like the original's create flow.
 */
export default function UaCampaignBuilderDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [campaign, setCampaign] = useState<Campaign>({
    name: "Spring drive",
    reward: "500 crystals",
    budget: 5000,
    channel: "Referral",
  });

  const set = <K extends keyof Campaign>(key: K, value: Campaign[K]) =>
    setCampaign((c) => ({ ...c, [key]: value }));

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
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
            <span className="mb-0.5 block text-[11px] text-muted">Channel</span>
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
        </div>

        <div
          aria-label="Campaign preview"
          className="flex flex-col justify-between rounded-lg border p-3"
          style={{ borderColor: ACCENT, backgroundColor: `${ACCENT}12` }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: ACCENT }}>
              {campaign.channel} campaign
            </p>
            <p className="text-lg font-bold text-foreground">
              {campaign.name || "Untitled"}
            </p>
            <p className="mt-1 text-[12px] text-muted">
              Earn <span className="font-medium text-foreground">{campaign.reward}</span>{" "}
              for every friend who signs up.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-muted">Est. installs</span>
            <span className="font-bold text-foreground">
              {Math.round(campaign.budget / 3.5).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
