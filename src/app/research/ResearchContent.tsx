"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { queryKeys } from "@/lib/queryKeys";
import {
  TOPICS,
  TOPIC_CATEGORIES,
  JOURNALS,
  DEMOGRAPHICS,
  type ResearchTopic,
} from "@/lib/research/data";
import {
  topicsResponseSchema,
  publicationsResponseSchema,
  demographicsResponseSchema,
  discoverResponseSchema,
  SOURCE_LABELS,
  type EvidenceStatus,
  type TopicEvidence,
} from "@/lib/research/pubmed";

type Tab = "topics" | "discovered" | "journals" | "demographics";

const TABS: { id: Tab; label: string }[] = [
  { id: "topics", label: "Topics" },
  { id: "discovered", label: "Discovered" },
  { id: "journals", label: "Journals" },
  { id: "demographics", label: "Demographics" },
];

const STATUS_LABEL: Record<EvidenceStatus, string> = {
  none: "No research yet",
  sparse: "Sparse",
  active: "Active",
};

// Text carries the meaning; color only reinforces it, so the badge still reads
// for anyone who can't distinguish the hues.
const STATUS_STYLE: Record<EvidenceStatus, string> = {
  none: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  sparse: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  active: "border-border bg-surface text-muted",
};

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

/**
 * The research explorer: browse candidate vascular topics against how much
 * literature already exists, read the recent papers, and see which populations
 * that literature actually studied.
 */
export default function ResearchContent() {
  const [tab, setTab] = useState<Tab>("topics");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [journalId, setJournalId] = useState<string | null>(null);
  const [demoIds, setDemoIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const topicsQuery = useQuery({
    queryKey: queryKeys.research.topics(),
    queryFn: () => getJson("/api/research/topics"),
    select: (json) => topicsResponseSchema.parse(json).topics,
    staleTime: 60 * 60 * 1000,
  });

  const evidenceById = new Map<string, TopicEvidence>(
    (topicsQuery.data ?? []).map((t) => [t.id, t]),
  );

  const toggleDemo = (id: string) =>
    setDemoIds((current) =>
      current.includes(id)
        ? current.filter((d) => d !== id)
        : [...current, id],
    );

  const openTopic = (id: string) => {
    setTopicId((current) => (current === id ? null : id));
    setJournalId(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Vascular research explorer
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Candidate project topics scored against the literature that already
            exists. Evidence levels and papers come live from{" "}
            <a
              className="underline hover:text-foreground"
              href="https://pubmed.ncbi.nlm.nih.gov/"
              target="_blank"
              rel="noreferrer"
            >
              PubMed
            </a>{" "}
            via the NCBI E-utilities API.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          loading={topicsQuery.isFetching}
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: queryKeys.research.topics(),
            })
          }
        >
          Refresh
        </Button>
      </header>

      <div role="tablist" aria-label="Research views" className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`h-9 rounded-full border px-4 text-sm transition-colors ${
              tab === t.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-surface/70 text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "topics" && (
        <TopicsPanel
          evidenceById={evidenceById}
          isLoading={topicsQuery.isLoading}
          isError={topicsQuery.isError}
          onRetry={() => topicsQuery.refetch()}
          openTopicId={topicId}
          onOpenTopic={openTopic}
          demoIds={demoIds}
          onToggleDemo={toggleDemo}
        />
      )}

      {tab === "discovered" && (
        <DiscoveredPanel demoIds={demoIds} onToggleDemo={toggleDemo} />
      )}

      {tab === "journals" && (
        <JournalsPanel
          openJournalId={journalId}
          onOpenJournal={(id) => {
            setJournalId((current) => (current === id ? null : id));
            setTopicId(null);
          }}
        />
      )}

      {tab === "demographics" && <DemographicsPanel topicId={topicId} />}
    </div>
  );
}

function EvidenceBadge({ status }: { status: EvidenceStatus }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function TopicsPanel({
  evidenceById,
  isLoading,
  isError,
  onRetry,
  openTopicId,
  onOpenTopic,
  demoIds,
  onToggleDemo,
}: {
  evidenceById: Map<string, TopicEvidence>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  openTopicId: string | null;
  onOpenTopic: (id: string) => void;
  demoIds: string[];
  onToggleDemo: (id: string) => void;
}) {
  if (isError) {
    return (
      <ErrorState
        message="Couldn't reach PubMed for the evidence scan."
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="space-y-8">
      {TOPIC_CATEGORIES.map((category) => {
        const topics = TOPICS.filter((t) => t.category === category);
        if (topics.length === 0) return null;
        return (
          <section key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              {category}
            </h2>
            <ul className="space-y-3">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  evidence={evidenceById.get(topic.id)}
                  isLoading={isLoading}
                  isOpen={openTopicId === topic.id}
                  onOpen={() => onOpenTopic(topic.id)}
                  demoIds={demoIds}
                  onToggleDemo={onToggleDemo}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function TopicCard({
  topic,
  evidence,
  isLoading,
  isOpen,
  onOpen,
  demoIds,
  onToggleDemo,
}: {
  topic: ResearchTopic;
  evidence: TopicEvidence | undefined;
  isLoading: boolean;
  isOpen: boolean;
  onOpen: () => void;
  demoIds: string[];
  onToggleDemo: (id: string) => void;
}) {
  const panelId = `topic-panel-${topic.id}`;

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-surface/60">
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface"
      >
        <span className="min-w-0">
          <span className="block font-medium text-foreground">{topic.name}</span>
          <span className="mt-0.5 block text-sm text-muted">
            {topic.description}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {evidence ? (
            <>
              <EvidenceBadge status={evidence.status} />
              <span className="text-xs text-muted">
                {evidence.total} papers · {evidence.recent} recent
              </span>
            </>
          ) : (
            <span className="text-xs text-muted">
              {isLoading ? "Scanning…" : "—"}
            </span>
          )}
        </span>
      </button>

      {isOpen && (
        <div id={panelId} className="border-t border-border px-4 py-4">
          <DemographicFilters selected={demoIds} onToggle={onToggleDemo} />
          <PublicationList topicId={topic.id} demoIds={demoIds} />
        </div>
      )}
    </li>
  );
}

function DemographicFilters({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Narrow to a population
      </legend>
      <div className="flex flex-wrap gap-2">
        {DEMOGRAPHICS.map((facet) => {
          const checked = selected.includes(facet.id);
          return (
            <label
              key={facet.id}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors focus-within:ring-2 focus-within:ring-foreground ${
                checked
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => onToggle(facet.id)}
              />
              {facet.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PublicationList({
  topicId,
  journalId,
  meshTerm,
  demoIds = [],
}: {
  topicId?: string;
  journalId?: string;
  meshTerm?: string;
  demoIds?: string[];
}) {
  const params = new URLSearchParams();
  if (topicId) params.set("topic", topicId);
  if (journalId) params.set("journal", journalId);
  if (meshTerm) params.set("mesh", meshTerm);
  if (demoIds.length > 0) params.set("demo", demoIds.join(","));

  const query = useQuery({
    queryKey: queryKeys.research.publications({
      topicId,
      journalId,
      meshTerm,
      demoIds,
    }),
    queryFn: () => getJson(`/api/research/publications?${params.toString()}`),
    select: (json) => publicationsResponseSchema.parse(json),
    staleTime: 30 * 60 * 1000,
  });

  if (query.isLoading) {
    return <PublicationSkeleton />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message="Couldn't load publications from PubMed."
        onRetry={() => query.refetch()}
      />
    );
  }

  const publications = query.data?.publications ?? [];

  if (publications.length === 0) {
    return (
      <p className="text-sm text-muted">
        No publications match this combination. That gap is the opportunity.
      </p>
    );
  }

  return (
    <>
      <p className="mb-3 text-xs text-muted">
        {query.data?.total} matching papers, newest first · searched{" "}
        {(query.data?.sources ?? ["pubmed"])
          .map((s) => SOURCE_LABELS[s])
          .join(" · ")}
      </p>
      <ul className="space-y-3">
        {publications.map((pub) => (
          <li key={pub.id} className="rounded-lg border border-border bg-surface p-3">
            <a
              href={pub.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {pub.title}
            </a>
            <p className="mt-1 text-xs text-muted">
              {[pub.journal, pub.pubDate].filter(Boolean).join(" · ")}
              {pub.authors.length > 0 && ` · ${pub.authors.slice(0, 3).join(", ")}`}
              {pub.authors.length > 3 && " et al."}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Topics the field is publishing on right now, derived from the MeSH headings
 * of recent vascular papers rather than from my curated list. Same evidence
 * badges, so a recurring theme with almost no accumulated literature stands out
 * the same way a curated gap does.
 */
function DiscoveredPanel({
  demoIds,
  onToggleDemo,
}: {
  demoIds: string[];
  onToggleDemo: (id: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: queryKeys.research.discover(),
    queryFn: () => getJson("/api/research/discover"),
    select: (json) => discoverResponseSchema.parse(json).topics,
    staleTime: 60 * 60 * 1000,
  });

  if (query.isError) {
    return (
      <ErrorState
        message="Couldn't derive topics from recent literature."
        onRetry={() => query.refetch()}
      />
    );
  }

  if (query.isLoading) {
    return <PublicationSkeleton />;
  }

  const topics = query.data ?? [];

  if (topics.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nothing recurring enough in the recent sample to suggest a theme.
      </p>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted">
        MeSH headings recurring across the last hundred vascular surgery papers,
        with the boilerplate and anything already on the Topics tab removed.
      </p>
      <ul className="space-y-3">
        {topics.map((topic) => {
          const isOpen = openId === topic.id;
          const panelId = `discovered-panel-${topic.id}`;
          return (
            <li
              key={topic.id}
              className="overflow-hidden rounded-xl border border-border bg-surface/60"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : topic.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">
                    {topic.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">
                    Tagged on {topic.papers} of the recent papers sampled
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <EvidenceBadge status={topic.status} />
                  <span className="text-xs text-muted">
                    {topic.total} papers · {topic.recent} recent
                  </span>
                </span>
              </button>
              {isOpen && (
                <div id={panelId} className="border-t border-border px-4 py-4">
                  <DemographicFilters
                    selected={demoIds}
                    onToggle={onToggleDemo}
                  />
                  <PublicationList meshTerm={topic.name} demoIds={demoIds} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function JournalsPanel({
  openJournalId,
  onOpenJournal,
}: {
  openJournalId: string | null;
  onOpenJournal: (id: string) => void;
}) {
  return (
    <ul className="space-y-3">
      {JOURNALS.map((journal) => {
        const isOpen = openJournalId === journal.id;
        const panelId = `journal-panel-${journal.id}`;
        return (
          <li
            key={journal.id}
            className="overflow-hidden rounded-xl border border-border bg-surface/60"
          >
            <button
              type="button"
              onClick={() => onOpenJournal(journal.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface"
            >
              <span className="font-medium text-foreground">{journal.name}</span>
              <span className="text-xs text-muted">{journal.pubmedName}</span>
            </button>
            {isOpen && (
              <div id={panelId} className="border-t border-border px-4 py-4">
                <PublicationList journalId={journal.id} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DemographicsPanel({ topicId }: { topicId: string | null }) {
  const query = useQuery({
    queryKey: queryKeys.research.demographics(topicId ?? undefined),
    queryFn: () =>
      getJson(
        `/api/research/demographics${topicId ? `?topic=${topicId}` : ""}`,
      ),
    select: (json) => demographicsResponseSchema.parse(json).facets,
    staleTime: 60 * 60 * 1000,
  });

  const scopeName = topicId
    ? (TOPICS.find((t) => t.id === topicId)?.name ?? "all vascular surgery")
    : "all vascular surgery";

  if (query.isError) {
    return (
      <ErrorState
        message="Couldn't load demographic coverage from PubMed."
        onRetry={() => query.refetch()}
      />
    );
  }

  const counts = new Map((query.data ?? []).map((f) => [f.id, f.count]));
  const max = Math.max(1, ...[...counts.values()]);
  const groups = [...new Set(DEMOGRAPHICS.map((d) => d.group))];

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        How many papers on <strong className="text-foreground">{scopeName}</strong>{" "}
        include each population. Open a topic on the Topics tab to rescope this.
      </p>

      {groups.map((group) => (
        <section key={group}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            {group}
          </h2>
          <ul className="space-y-2">
            {DEMOGRAPHICS.filter((d) => d.group === group).map((facet) => {
              const count = counts.get(facet.id);
              return (
                <li key={facet.id} className="flex items-center gap-3">
                  <span className="w-48 shrink-0 text-sm text-foreground">
                    {facet.label}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                    <span
                      className="block h-full rounded-full bg-foreground/40"
                      style={{
                        width: count ? `${Math.round((count / max) * 100)}%` : "0%",
                      }}
                    />
                  </span>
                  <span className="w-16 shrink-0 text-right text-sm tabular-nums text-muted">
                    {query.isLoading ? "…" : (count ?? 0)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PublicationSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="animate-pulse rounded-lg border border-border bg-surface p-3"
        >
          <div className="h-4 w-3/4 rounded bg-surface-raised" />
          <div className="mt-2 h-3 w-1/3 rounded bg-surface-raised" />
        </li>
      ))}
    </ul>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <p className="text-sm text-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
