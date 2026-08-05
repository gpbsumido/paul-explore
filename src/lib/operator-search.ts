// ---------------------------------------------------------------------------
// Operator quick-search: one index over the things an operator jumps between —
// stores, fleet products, and the operator tools — with a small hand-rolled
// ranker so a prefix beats a mid-word match beats a subsequence. Pure and
// dependency-free; the combobox on top is where the keyboard and ARIA live.
// ---------------------------------------------------------------------------

import { z } from "zod";

export type SearchItemType = "store" | "product" | "tool";

export type SearchItem = {
  id: string;
  type: SearchItemType;
  label: string;
  sublabel: string;
  href: string;
};

/** The operator tools, always searchable and shown as a launcher when idle. */
export const OPERATOR_TOOLS: readonly SearchItem[] = [
  {
    id: "tool-planner",
    type: "tool",
    label: "Plan a location",
    sublabel: "Tool",
    href: "/operator/planner",
  },
  {
    id: "tool-products",
    type: "tool",
    label: "Product performance",
    sublabel: "Tool",
    href: "/operator/products",
  },
  {
    id: "tool-loss",
    type: "tool",
    label: "Shrink & loss",
    sublabel: "Tool",
    href: "/operator/loss",
  },
];

export type SearchIndexInput = {
  stores: readonly { id: string; name: string; status?: string }[];
  products: readonly { name: string; category: string }[];
};

/** The search-index endpoint response. */
export const searchIndexResponseSchema = z.object({
  stores: z.array(
    z.object({ id: z.string(), name: z.string(), status: z.string().optional() }),
  ),
  products: z.array(z.object({ name: z.string(), category: z.string() })),
});

export type SearchIndexResponse = z.infer<typeof searchIndexResponseSchema>;

/**
 * Builds the searchable index: every store linking to its detail page, every
 * distinct product linking to the performance view, and the operator tools.
 */
export function buildSearchIndex(
  input: SearchIndexInput,
): readonly SearchItem[] {
  const storeItems: SearchItem[] = input.stores.map((store) => ({
    id: `store-${store.id}`,
    type: "store",
    label: store.name,
    sublabel: store.status ?? "Store",
    href: `/operator/stores/${store.id}`,
  }));

  const seen = new Set<string>();
  const productItems: SearchItem[] = [];
  for (const product of input.products) {
    if (seen.has(product.name)) continue;
    seen.add(product.name);
    productItems.push({
      id: `product-${product.name}`,
      type: "product",
      label: product.name,
      sublabel: product.category,
      href: "/operator/products",
    });
  }

  return [...storeItems, ...productItems, ...OPERATOR_TOOLS];
}

/** Whether `query`'s characters appear in order within `text` (fuzzy typing). */
function isSubsequence(query: string, text: string): boolean {
  let qi = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] === query[qi]) qi++;
  }
  return qi === query.length;
}

/**
 * Scores one label against a lowercased query. Higher is better; 0 means no
 * match. A prefix beats a word-boundary match beats any substring beats a
 * loose subsequence, so the most obvious hit rises to the top.
 */
function scoreLabel(label: string, query: string): number {
  const text = label.toLowerCase();
  if (text.startsWith(query)) return 4;
  if (text.includes(` ${query}`) || text.includes(`-${query}`)) return 3;
  if (text.includes(query)) return 2;
  if (isSubsequence(query, text)) return 1;
  return 0;
}

/**
 * Ranks the index against a query, best first. An empty query returns the tools
 * as a launcher. Ties break toward the shorter, then alphabetical, label so the
 * ordering is stable. Capped at `limit` (default 8).
 */
export function searchItems(
  index: readonly SearchItem[],
  query: string,
  limit: number = 8,
): readonly SearchItem[] {
  const q = query.trim().toLowerCase();
  if (q === "") return OPERATOR_TOOLS;

  return index
    .map((item) => ({
      item,
      score: Math.max(
        scoreLabel(item.label, q),
        // A sublabel hit is a weak signal, never enough to outrank a real one.
        scoreLabel(item.sublabel, q) > 0 ? 0.5 : 0,
      ),
    }))
    .filter((scored) => scored.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.label.length - b.item.label.length ||
        a.item.label.localeCompare(b.item.label),
    )
    .slice(0, limit)
    .map((scored) => scored.item);
}
