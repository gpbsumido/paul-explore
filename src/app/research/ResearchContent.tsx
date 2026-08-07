"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { queryKeys } from "@/lib/queryKeys";
import {
  TOPICS,
  TOPIC_CATEGORIES,
  DEMOGRAPHICS,
  type Journal,
  type ResearchTopic,
} from "@/lib/research/data";
import { JOURNALS as JOURNAL_LIST } from "@/lib/research/data";
import { SOURCES, type SourceId } from "@/lib/research/sources";
import { useSourcePrefs, customJournalId } from "./useSourcePrefs";
import {
  topicsResponseSchema,
  publicationsResponseSchema,
  demographicsResponseSchema,
  discoverResponseSchema,
  SOURCE_LABELS,
  type EvidenceStatus,
  type TopicEvidence,
} from "@/lib/research/pubmed";

type Tab =
  "topics" | "counts" | "discovered" | "journals" | "demographics" | "sources";

const TABS: { id: Tab; label: string }[] = [
  { id: "topics", label: "Topics" },
  { id: "counts", label: "Counts" },
  { id: "discovered", label: "Discovered" },
  { id: "journals", label: "Journals" },
  { id: "demographics", label: "Demographics" },
  { id: "sources", label: "Sources" },
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
  sparse:
    "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300",
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
  const sourcePrefs = useSourcePrefs();
  const { activeSources, visibleJournals } = sourcePrefs;

  const topicsQuery = useQuery({
    queryKey: queryKeys.research.topics(),
    queryFn: () => getJson("/api/research/topics"),
    select: (json) => topicsResponseSchema.parse(json),
    staleTime: 60 * 60 * 1000,
  });

  const evidenceById = new Map<string, TopicEvidence>(
    (topicsQuery.data?.topics ?? []).map((t) => [t.id, t]),
  );
  const window = topicsQuery.data?.window ?? null;

  const toggleDemo = (id: string) =>
    setDemoIds((current) =>
      current.includes(id) ? current.filter((d) => d !== id) : [...current, id],
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
          {/* The provenance sentence matters, but on a phone it pushed the
              first real number below the fold. Kept for tablets and up. */}
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Candidate project topics scored against the literature that already
            exists.{" "}
            <span className="hidden sm:inline">
              Evidence levels come live from{" "}
              <a
                className="underline hover:text-foreground"
                href="https://pubmed.ncbi.nlm.nih.gov/"
                target="_blank"
                rel="noreferrer"
              >
                PubMed
              </a>{" "}
              via the NCBI E-utilities API; publication lists add{" "}
              <a
                className="underline hover:text-foreground"
                href="https://europepmc.org/"
                target="_blank"
                rel="noreferrer"
              >
                Europe PMC
              </a>{" "}
              for preprints and records PubMed doesn&apos;t carry.
            </span>
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

      <div
        role="tablist"
        aria-label="Research views"
        className="mb-6 flex flex-wrap gap-2"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 rounded-full border px-4 text-sm transition-colors sm:min-h-9 ${
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
          window={window}
          isLoading={topicsQuery.isLoading}
          isError={topicsQuery.isError}
          onRetry={() => topicsQuery.refetch()}
          openTopicId={topicId}
          onOpenTopic={openTopic}
          demoIds={demoIds}
          onToggleDemo={toggleDemo}
          sources={activeSources}
        />
      )}

      {tab === "counts" && <CountsPanel />}

      {tab === "discovered" && (
        <DiscoveredPanel
          demoIds={demoIds}
          onToggleDemo={toggleDemo}
          sources={activeSources}
        />
      )}

      {tab === "journals" && (
        <JournalsPanel
          journals={visibleJournals}
          sources={activeSources}
          openJournalId={journalId}
          onOpenJournal={(id) => {
            setJournalId((current) => (current === id ? null : id));
            setTopicId(null);
          }}
        />
      )}

      {tab === "demographics" && <DemographicsPanel topicId={topicId} />}

      {tab === "sources" && <SourcesPanel prefs={sourcePrefs} />}
    </div>
  );
}

type CountWindow = { fromYear: number; toYear: number } | null;

/**
 * States how far back the numbers reach.
 *
 * Every count on this page is a search against a live index, and "824 papers"
 * means nothing without knowing whether that is one year or forty. The all-time
 * figure really is unbounded -- PubMed indexes back to the 1800s in places -- so
 * it says so rather than leaving the reader to assume a decade.
 */
function CoverageNote({ window }: { window: CountWindow }) {
  return (
    <p className="text-xs text-muted">
      Totals cover all years indexed by PubMed. &ldquo;Recent&rdquo; means{" "}
      {window ? `${window.fromYear}–${window.toYear}` : "the last 5 years"}.
    </p>
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
  window,
  isLoading,
  isError,
  onRetry,
  openTopicId,
  onOpenTopic,
  demoIds,
  onToggleDemo,
  sources,
}: {
  evidenceById: Map<string, TopicEvidence>;
  window: CountWindow;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  openTopicId: string | null;
  onOpenTopic: (id: string) => void;
  demoIds: string[];
  onToggleDemo: (id: string) => void;
  sources: SourceId[];
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
      <CoverageNote window={window} />
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
                  sources={sources}
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
  sources,
}: {
  topic: ResearchTopic;
  evidence: TopicEvidence | undefined;
  isLoading: boolean;
  isOpen: boolean;
  onOpen: () => void;
  demoIds: string[];
  onToggleDemo: (id: string) => void;
  sources: SourceId[];
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
          <span className="block font-medium text-foreground">
            {topic.name}
          </span>
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
          <PublicationList
            topicId={topic.id}
            demoIds={demoIds}
            sources={sources}
          />
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
    <fieldset className="mb-4 min-w-0">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Narrow to a population
      </legend>
      <div className="flex min-w-0 flex-wrap gap-2">
        {DEMOGRAPHICS.map((facet) => {
          const checked = selected.includes(facet.id);
          return (
            <label
              key={facet.id}
              className={`flex min-h-11 cursor-pointer items-center rounded-full border px-3 text-xs transition-colors focus-within:ring-2 focus-within:ring-foreground sm:min-h-8 ${
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
  journalName,
  meshTerm,
  demoIds = [],
  sources,
}: {
  topicId?: string;
  journalId?: string;
  journalName?: string;
  meshTerm?: string;
  demoIds?: string[];
  sources: SourceId[];
}) {
  const params = new URLSearchParams();
  if (topicId) params.set("topic", topicId);
  if (journalId) params.set("journal", journalId);
  if (journalName) params.set("journalName", journalName);
  if (meshTerm) params.set("mesh", meshTerm);
  if (demoIds.length > 0) params.set("demo", demoIds.join(","));
  params.set("sources", sources.join(","));

  const query = useQuery({
    queryKey: queryKeys.research.publications({
      topicId,
      journalId,
      journalName,
      meshTerm,
      demoIds,
      sources,
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

  // The list is capped at 20 newest, so the oldest one here is the real floor
  // of what is on screen -- not the floor of what the search matched.
  const oldest = publications.at(-1)?.pubDate ?? null;

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
        {query.data?.total} matching papers across all years, newest first ·
        searched{" "}
        {(query.data?.sources ?? ["pubmed"])
          .map((s) => SOURCE_LABELS[s])
          .join(" · ")}
        {oldest && ` · oldest shown: ${oldest}`}
      </p>
      <ul className="space-y-3">
        {publications.map((pub) => (
          <li
            key={pub.id}
            className="rounded-lg border border-border bg-surface p-3"
          >
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
              {pub.authors.length > 0 &&
                ` · ${pub.authors.slice(0, 3).join(", ")}`}
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
  sources,
}: {
  demoIds: string[];
  onToggleDemo: (id: string) => void;
  sources: SourceId[];
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
        MeSH headings recurring across the two hundred most recent vascular
        surgery papers, with the boilerplate and anything already on the Topics
        tab removed.
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
                className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-surface sm:flex-row sm:items-center sm:justify-between sm:gap-3"
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
                  <PublicationList
                    meshTerm={topic.name}
                    demoIds={demoIds}
                    sources={sources}
                  />
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
  journals,
  sources,
  openJournalId,
  onOpenJournal,
}: {
  journals: Journal[];
  sources: SourceId[];
  openJournalId: string | null;
  onOpenJournal: (id: string) => void;
}) {
  if (journals.length === 0) {
    return (
      <p className="text-sm text-muted">
        Every journal is switched off. Turn one back on under Sources.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {journals.map((journal) => {
        const isCustom = journal.id.startsWith("custom-");
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
              <span className="font-medium text-foreground">
                {journal.name}
              </span>
              <span className="text-xs text-muted">{journal.pubmedName}</span>
            </button>
            {isOpen && (
              <div id={panelId} className="border-t border-border px-4 py-4">
                <PublicationList
                  journalId={isCustom ? undefined : journal.id}
                  journalName={isCustom ? journal.pubmedName : undefined}
                  sources={sources}
                />
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
        How many papers on{" "}
        <strong className="text-foreground">{scopeName}</strong> include each
        population. Open a topic on the Topics tab to rescope this.
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
                <li key={facet.id}>
                  {/* Label and number share a line, bar sits under them. On a
                      phone a fixed label column left the bar a useless sliver. */}
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-foreground">
                      {facet.label}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-muted">
                      {query.isLoading ? "…" : (count ?? 0)}
                    </span>
                  </div>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-surface">
                    <span
                      className="block h-full rounded-full bg-foreground/40"
                      style={{
                        width: count
                          ? `${Math.round((count / max) * 100)}%`
                          : "0%",
                      }}
                    />
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

/**
 * Which databases and journals the explorer searches.
 *
 * Deliberately the last tab: knowing where the evidence comes from matters,
 * configuring it matters less than finding the research, and nothing here is
 * needed to get a useful answer out of the other four.
 */
function SourcesPanel({ prefs }: { prefs: ReturnType<typeof useSourcePrefs> }) {
  const [name, setName] = useState("");
  const [abbrev, setAbbrev] = useState("");

  const addCustomJournal = () => {
    const trimmedName = name.trim();
    const trimmedAbbrev = abbrev.trim();
    if (!trimmedName || !trimmedAbbrev) return;
    prefs.addJournal({
      id: customJournalId(trimmedName),
      name: trimmedName,
      pubmedName: trimmedAbbrev,
    });
    setName("");
    setAbbrev("");
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
          Databases
        </h2>
        <p className="mb-3 text-sm text-muted">
          Evidence levels are always counted from PubMed alone, so the
          none/sparse/active numbers mean the same thing whichever of these are
          on.
        </p>
        <ul className="space-y-3">
          {SOURCES.map((source) => {
            const on = !prefs.prefs.ignoredSources.includes(source.id);
            return (
              <li
                key={source.id}
                className="rounded-xl border border-border bg-surface/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {source.name}
                    </a>
                    <p className="mt-1 text-sm text-muted">
                      {source.description}
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={source.scoresEvidence}
                      onChange={() => prefs.toggleSource(source.id)}
                      aria-label={`Use ${source.name}`}
                      className="h-4 w-4 accent-foreground"
                    />
                    {source.scoresEvidence ? "Always on" : "Search this"}
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
          Journals
        </h2>
        <p className="mb-3 text-sm text-muted">
          Which journals appear on the Journals tab. Add any journal by its
          PubMed title abbreviation.
        </p>
        <ul className="mb-4 space-y-2">
          {[...JOURNAL_LIST, ...prefs.prefs.customJournals].map((journal) => {
            const on = !prefs.prefs.ignoredJournals.includes(journal.id);
            const isCustom = journal.id.startsWith("custom-");
            return (
              <li
                key={journal.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => prefs.toggleJournal(journal.id)}
                    aria-label={`Use ${journal.name}`}
                    className="h-4 w-4 accent-foreground"
                  />
                  <span className="text-foreground">{journal.name}</span>
                  <span className="text-xs text-muted">
                    {journal.pubmedName}
                  </span>
                </label>
                {isCustom && (
                  <button
                    type="button"
                    onClick={() => prefs.removeJournal(journal.id)}
                    className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface/60 p-4">
          <div>
            <label
              htmlFor="journal-name"
              className="mb-1 block text-xs text-muted"
            >
              Journal name
            </label>
            <input
              id="journal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div>
            <label
              htmlFor="journal-abbrev"
              className="mb-1 block text-xs text-muted"
            >
              PubMed abbreviation
            </label>
            <input
              id="journal-abbrev"
              value={abbrev}
              onChange={(e) => setAbbrev(e.target.value)}
              placeholder="J Vasc Surg"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
          </div>
          <Button variant="outline" size="sm" onClick={addCustomJournal}>
            Add journal
          </Button>
        </div>
      </section>
    </div>
  );
}

type SortMode = "most" | "fewest" | "alpha";

const SORTS: { id: SortMode; label: string }[] = [
  { id: "most", label: "Most papers" },
  { id: "fewest", label: "Fewest papers" },
  { id: "alpha", label: "A–Z" },
];

/**
 * The numbers view: every topic with how many papers it has in the last five
 * years, narrowable to one population.
 *
 * Sorting fewest-first is the one that earns its keep -- it puts the thin topics
 * at the top, which is the whole question this tool exists to answer.
 *
 * Laid out for a phone first: each row is a stacked block that becomes a single
 * line at `sm:` and up, so nothing scrolls sideways and no column has a fixed
 * width fighting a 390px screen.
 */
function CountsPanel() {
  const [sort, setSort] = useState<SortMode>("most");
  const [demoId, setDemoId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const all = useQuery({
    queryKey: queryKeys.research.topics(),
    queryFn: () => getJson("/api/research/topics"),
    select: (json) => topicsResponseSchema.parse(json),
    staleTime: 60 * 60 * 1000,
  });

  const scoped = useQuery({
    queryKey: queryKeys.research.topicsByDemo(demoId ?? ""),
    queryFn: () => getJson(`/api/research/topics?demo=${demoId}`),
    select: (json) => topicsResponseSchema.parse(json),
    staleTime: 60 * 60 * 1000,
    enabled: demoId !== null,
  });

  if (all.isError) {
    return (
      <ErrorState
        message="Couldn't reach PubMed for the counts."
        onRetry={() => all.refetch()}
      />
    );
  }

  const window = all.data?.window ?? null;
  const recentById = new Map(
    (all.data?.topics ?? []).map((t) => [t.id, t.recent]),
  );
  const scopedById = new Map(
    (scoped.data?.topics ?? []).map((t) => [t.id, t.recent]),
  );

  const rows = TOPICS.map((topic) => ({
    topic,
    recent: recentById.get(topic.id) ?? 0,
    inDemo: demoId ? scopedById.get(topic.id) : undefined,
  })).sort((a, b) => {
    if (sort === "alpha") return a.topic.name.localeCompare(b.topic.name);
    if (sort === "fewest") return a.recent - b.recent;
    return b.recent - a.recent;
  });

  const selected = DEMOGRAPHICS.find((d) => d.id === demoId);

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Papers published{" "}
        {window
          ? `${window.fromYear}–${window.toYear}`
          : "in the last five years"}
        , per topic.{" "}
        <span className="hidden sm:inline">
          Sort fewest-first to put the thin topics on top, or pick a population
          to see how much of each topic actually studied those patients.
        </span>
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={sort === s.id}
            onClick={() => setSort(s.id)}
            className={`min-h-11 rounded-full border px-4 text-sm transition-colors sm:min-h-9 ${
              sort === s.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* A group, not a fieldset: these are toggle buttons rather than form
          controls, and a fieldset refuses to shrink below its min-content
          width, which defeated flex-wrap and pushed chips off a phone screen. */}
      <div role="group" aria-labelledby="counts-population" className="mb-5">
        <p
          id="counts-population"
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
        >
          Narrow to a population
        </p>
        <div className="flex min-w-0 flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={demoId === null}
            onClick={() => setDemoId(null)}
            className={`min-h-11 rounded-full border px-3 text-xs transition-colors sm:min-h-8 ${
              demoId === null
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            All papers
          </button>
          {DEMOGRAPHICS.map((facet) => (
            <button
              key={facet.id}
              type="button"
              aria-pressed={demoId === facet.id}
              onClick={() => setDemoId(demoId === facet.id ? null : facet.id)}
              className={`min-h-11 rounded-full border px-3 text-xs transition-colors sm:min-h-8 ${
                demoId === facet.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {facet.label}
            </button>
          ))}
        </div>
      </div>

      {demoId !== null && scoped.isLoading && (
        <p className="mb-3 text-xs text-muted">
          Counting {selected?.label} across every topic…
        </p>
      )}

      <ul className="space-y-2">
        {rows.map(({ topic, recent, inDemo }) => {
          const isOpen = openId === topic.id;
          const panelId = `counts-panel-${topic.id}`;
          const share =
            inDemo !== undefined && recent > 0
              ? Math.round((inDemo / recent) * 100)
              : null;
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
                className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-surface sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="font-medium text-foreground">
                  {topic.name}
                </span>
                <span className="flex shrink-0 items-baseline gap-2 sm:justify-end">
                  <span className="text-lg font-semibold tabular-nums text-foreground">
                    {all.isLoading ? "…" : recent}
                  </span>
                  <span className="text-xs text-muted">
                    papers in the last 5 years
                  </span>
                  {inDemo !== undefined && (
                    <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs tabular-nums text-muted">
                      {inDemo} of {recent}
                      {share !== null && ` · ${share}%`}
                    </span>
                  )}
                </span>
              </button>

              {isOpen && (
                <div id={panelId} className="border-t border-border px-4 py-4">
                  <TopicSplit topicId={topic.id} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * A topic's demographic split over the same five-year window as the column it
 * expands from. An all-time split beside a five-year total would be two
 * different questions sharing a row.
 */
function TopicSplit({ topicId }: { topicId: string }) {
  const query = useQuery({
    queryKey: queryKeys.research.demographics(topicId, 5),
    queryFn: () =>
      getJson(`/api/research/demographics?topic=${topicId}&window=5`),
    select: (json) => demographicsResponseSchema.parse(json).facets,
    staleTime: 60 * 60 * 1000,
  });

  if (query.isError) {
    return (
      <ErrorState
        message="Couldn't load the split for this topic."
        onRetry={() => query.refetch()}
      />
    );
  }

  const counts = new Map((query.data ?? []).map((f) => [f.id, f.count]));
  const max = Math.max(1, ...[...counts.values()]);

  return (
    <>
      <p className="mb-3 text-xs text-muted">
        Of this topic&apos;s last five years, how many papers include each
        population.
      </p>
      <ul className="space-y-2">
        {DEMOGRAPHICS.map((facet) => {
          const count = counts.get(facet.id);
          return (
            <li key={facet.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-foreground">{facet.label}</span>
                <span className="text-sm tabular-nums text-muted">
                  {query.isLoading ? "…" : (count ?? 0)}
                </span>
              </div>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface">
                <span
                  className="block h-full rounded-full bg-foreground/40"
                  style={{
                    width: count ? `${Math.round((count / max) * 100)}%` : "0%",
                  }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </>
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
