"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #e879f9)";

type Campaign = { id: number; name: string; status: "Draft" | "Live" };

const INITIAL: Campaign[] = [
  { id: 1, name: "Launch week push", status: "Live" },
  { id: 2, name: "Creator spotlight", status: "Draft" },
];

/**
 * Vignette: the content engine's campaign manager. A list with a create
 * form and inline status toggle, standing in for the CRUD routes.
 */
export default function CampaignManagerDemo({ feature }: { feature: WorkFeature }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL);
  const [name, setName] = useState("");
  const [nextId, setNextId] = useState(3);

  const create = () => {
    if (!name.trim()) return;
    setCampaigns((c) => [...c, { id: nextId, name: name.trim(), status: "Draft" }]);
    setNextId((n) => n + 1);
    setName("");
  };

  const toggle = (id: number) =>
    setCampaigns((c) =>
      c.map((x) =>
        x.id === id ? { ...x, status: x.status === "Live" ? "Draft" : "Live" } : x,
      ),
    );

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
        className="flex gap-2"
      >
        <input
          aria-label="New campaign name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="name a campaign"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground"
        />
        <button
          type="submit"
          className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
          style={{ backgroundColor: ACCENT }}
        >
          Create
        </button>
      </form>

      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {campaigns.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2">
            <span className="text-[13px] text-foreground">{c.name}</span>
            <button
              type="button"
              aria-label={`Toggle ${c.name}`}
              onClick={() => toggle(c.id)}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: c.status === "Live" ? "#34d399" : "#94a3b8" }}
            >
              {c.status}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
