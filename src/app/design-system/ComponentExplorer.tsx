"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FilterBar, Input, Select } from "@/components/ui";
// Type-only import: erased at compile time, so the server-only catalog data
// never reaches the client bundle.
import type { CategoryId } from "./catalog";

/**
 * The stateful half of the component gallery. The cards arrive already
 * rendered on the server (previews included); this island only decides which
 * of them show and in what order, so hydration stays as small as the
 * controls. The active view lands in the URL (?q=&category=&sort=) via
 * replaceState so any filtered state is shareable without touching the
 * Next router or forcing the page dynamic.
 */

export type ExplorerCategory = {
  id: CategoryId;
  label: string;
  count: number;
};

export type ExplorerItem = {
  id: string;
  name: string;
  category: CategoryId;
  /** How many in-app pages render it, for the adoption sort. */
  adoption: number;
  /** Lowercased name + tagline + usage, searched with plain includes(). */
  haystack: string;
  card: ReactNode;
};

export type SortOrder = "curated" | "name" | "category" | "adoption";

const SORT_LABELS: Record<SortOrder, string> = {
  curated: "Curated",
  name: "Name A-Z",
  category: "Category",
  adoption: "Most adopted",
};

const isSortOrder = (value: string): value is SortOrder =>
  value in SORT_LABELS;

const chipClass = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
    active
      ? "border-primary-600 bg-primary-600 text-white"
      : "border-border bg-surface text-muted hover:text-foreground"
  }`;

export default function ComponentExplorer({
  categories,
  items,
}: {
  categories: ExplorerCategory[];
  items: ExplorerItem[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [sort, setSort] = useState<SortOrder>("curated");
  const hydratedFromUrl = useRef(false);

  const categoryIds = useMemo(
    () => new Set(categories.map((c) => c.id)),
    [categories],
  );

  // Adopt any shared URL once on mount. Initial render uses the defaults so
  // server and client markup agree; the corrected state applies right after
  // hydration.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("category");
    const sortParam = params.get("sort");
    if (q) setQuery(q); // eslint-disable-line react-hooks/set-state-in-effect -- one-time adoption of a shared URL after hydration; the URL is browser-only, and reading it during render desyncs the static HTML
    if (cat && categoryIds.has(cat as CategoryId)) {
      setCategory(cat as CategoryId); // eslint-disable-line react-hooks/set-state-in-effect -- same one-time URL adoption
    }
    if (sortParam && isSortOrder(sortParam)) setSort(sortParam); // eslint-disable-line react-hooks/set-state-in-effect -- same one-time URL adoption
    hydratedFromUrl.current = true;
  }, [categoryIds]);

  // Reflect the active view back into the URL so it can be shared. Defaults
  // collapse to a clean pathname rather than ?q=&category=all noise.
  useEffect(() => {
    if (!hydratedFromUrl.current) return;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (sort !== "curated") params.set("sort", sort);
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      search
        ? `${window.location.pathname}?${search}`
        : window.location.pathname,
    );
  }, [query, category, sort]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = items.filter(
      (item) =>
        (category === "all" || item.category === category) &&
        (needle === "" || item.haystack.includes(needle)),
    );
    if (sort === "curated") return matching;
    const categoryRank = new Map(categories.map((c, rank) => [c.id, rank]));
    const byName = (a: ExplorerItem, b: ExplorerItem) =>
      a.name.localeCompare(b.name);
    const comparators: Record<
      Exclude<SortOrder, "curated">,
      (a: ExplorerItem, b: ExplorerItem) => number
    > = {
      name: byName,
      category: (a, b) =>
        (categoryRank.get(a.category) ?? 0) -
          (categoryRank.get(b.category) ?? 0) || byName(a, b),
      adoption: (a, b) => b.adoption - a.adoption || byName(a, b),
    };
    return [...matching].sort(comparators[sort]);
  }, [items, categories, query, category, sort]);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
  };

  return (
    <div>
      <FilterBar label="Component filters" className="mb-4">
        <Input
          label="Search components"
          hideLabel
          type="search"
          size="sm"
          placeholder="Search components…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-56"
        />
        <Select
          label="Sort"
          value={sort}
          onChange={(e) => {
            if (isSortOrder(e.target.value)) setSort(e.target.value);
          }}
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FilterBar>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={category === "all"}
          className={chipClass(category === "all")}
          onClick={() => setCategory("all")}
        >
          All {items.length}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            aria-pressed={category === cat.id}
            className={chipClass(category === cat.id)}
            onClick={() =>
              setCategory((current) => (current === cat.id ? "all" : cat.id))
            }
          >
            {cat.label} {cat.count}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="mb-4 text-sm text-muted">
        Showing {visible.length} of {items.length} components
      </p>

      {visible.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-sm text-muted">
            No components match{query ? ` "${query.trim()}"` : " these filters"}
            . Try a shorter term, or browse a category instead.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <div key={item.id} className="contents">
              {item.card}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
