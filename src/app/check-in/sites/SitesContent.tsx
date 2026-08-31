"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Site = { id: string; name: string; periodSeconds: number };
type Arrival = { id: string; email: string | null; at: string };

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

/**
 * The organizer's side: the sites they run, the link to put on the poster, and
 * who has turned up today.
 */
export default function SitesContent() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [openSiteId, setOpenSiteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sites = useQuery({
    queryKey: ["check-in-sites"],
    queryFn: async () => (await getJson("/api/check-in/sites")) as { sites: Site[] },
  });

  const addSite = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await fetch("/api/check-in/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["check-in-sites"] });
    } finally {
      setSaving(false);
    }
  };

  if (sites.isError) {
    return (
      <p role="alert" className="text-sm text-warning-600 dark:text-warning-300">
        Couldn&apos;t load your sites. Reload to try again.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void addSite();
        }}
      >
        <Input
          label="Site name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Riverside Food Bank"
          className="max-w-xs"
        />
        <Button type="submit" variant="outline" loading={saving}>
          Add site
        </Button>
      </form>

      {sites.isLoading && <p className="text-sm text-muted">Loading your sites…</p>}

      <ul className="space-y-4">
        {(sites.data?.sites ?? []).map((site) => (
          <SiteCard
            key={site.id}
            site={site}
            isOpen={openSiteId === site.id}
            onToggle={() =>
              setOpenSiteId((current) => (current === site.id ? null : site.id))
            }
          />
        ))}
      </ul>

      {sites.isSuccess && (sites.data?.sites ?? []).length === 0 && (
        <p className="text-sm text-muted">
          No sites yet. Add one, put its display up at the entrance, and share
          its check-in link with volunteers.
        </p>
      )}
    </div>
  );
}

function SiteCard({
  site,
  isOpen,
  onToggle,
}: {
  site: Site;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const arrivals = useQuery({
    queryKey: ["check-in-arrivals", site.id],
    queryFn: async () =>
      (await getJson(`/api/check-in/sites/${site.id}/arrivals`)) as {
        arrivals: Arrival[];
      },
    enabled: isOpen,
    // The roster is what someone refreshes to see who just walked in.
    staleTime: 0,
  });

  const volunteerLink = `/check-in?site=${site.id}`;

  return (
    <li className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium text-foreground">{site.name}</span>
        <span className="flex flex-wrap gap-2">
          <Button href={`/check-in/display?site=${site.id}`} variant="outline" size="sm">
            Open display
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} aria-expanded={isOpen}>
            Today&apos;s arrivals
          </Button>
        </span>
      </div>

      {/* The link that goes on the poster, in full, so it can be copied or
          turned into a QR code without digging it out of the address bar. */}
      <p className="mt-2 break-all font-mono text-xs text-muted">
        {volunteerLink}
      </p>

      {isOpen && (
        <div className="mt-4 border-t border-border pt-3">
          {arrivals.isLoading && (
            <p className="text-sm text-muted">Loading arrivals…</p>
          )}
          {arrivals.isError && (
            <p role="alert" className="text-sm text-warning-600 dark:text-warning-300">
              Couldn&apos;t load today&apos;s arrivals.
            </p>
          )}
          {arrivals.isSuccess && arrivals.data.arrivals.length === 0 && (
            <p className="text-sm text-muted">Nobody has checked in today.</p>
          )}
          <ul className="space-y-2">
            {(arrivals.data?.arrivals ?? []).map((arrival) => (
              <li
                key={arrival.id}
                className="flex flex-wrap justify-between gap-2 text-sm"
              >
                <span className="text-foreground">
                  {arrival.email ?? "Volunteer"}
                </span>
                <span className="text-muted">
                  {new Date(arrival.at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
