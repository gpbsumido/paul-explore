import { Fragment } from "react";

/** A single classified chunk of a JSON string, in source order. */
export type JsonToken = {
  text: string;
  kind: "key" | "string" | "number" | "literal" | "punct";
};

const COLORS: Record<JsonToken["kind"], string> = {
  key: "#7dd3fc",
  string: "#a3e635",
  number: "#fbbf24",
  literal: "#f472b6",
  punct: "var(--color-muted, #94a3b8)",
};

// Matches a JSON string, number, or true/false/null literal in one pass so we
// can colour each chunk. A string followed by a colon is a key, not a value.
const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;

/**
 * Split pretty-printed JSON into coloured tokens without a syntax-highlight
 * dependency. Everything the regex does not claim (braces, commas, whitespace)
 * stays as punct so the text round-trips exactly.
 */
export function tokenizeJson(json: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let last = 0;

  for (const m of json.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) {
      tokens.push({ text: json.slice(last, start), kind: "punct" });
    }
    const [, str, colon, num, literal] = m;
    if (str !== undefined) {
      tokens.push({ text: str, kind: colon ? "key" : "string" });
      if (colon) tokens.push({ text: colon, kind: "punct" });
    } else if (num !== undefined) {
      tokens.push({ text: num, kind: "number" });
    } else if (literal !== undefined) {
      tokens.push({ text: literal, kind: "literal" });
    }
    last = start + m[0].length;
  }

  if (last < json.length) {
    tokens.push({ text: json.slice(last), kind: "punct" });
  }
  return tokens;
}

/** Read-only, lightly syntax-highlighted view of any JSON-serialisable value. */
export function JsonView({ value }: { value: unknown }) {
  const tokens = tokenizeJson(JSON.stringify(value, null, 2));
  return (
    <pre
      data-testid="json-view"
      className="overflow-auto whitespace-pre rounded-md border border-border bg-background/60 p-2 font-mono text-[10px] leading-relaxed"
    >
      {tokens.map((t, i) => (
        <Fragment key={i}>
          {t.kind === "punct" ? (
            t.text
          ) : (
            <span style={{ color: COLORS[t.kind] }}>{t.text}</span>
          )}
        </Fragment>
      ))}
    </pre>
  );
}
