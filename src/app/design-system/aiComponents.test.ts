import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COMPONENTS } from "./catalog";

/**
 * The 10 AI-app primitives that landed in @paul-portfolio/react 0.6.0. The
 * catalog integrity test proves the documented set equals the package's whole
 * export surface; this one pins the specific components this task exists to add,
 * so a stray removal names exactly what went missing instead of a diff of the
 * full manifest. Toast ships its runtime surface as ToastProvider plus the
 * useToast hook, so the renderable primitive we document is ToastProvider.
 */
const AI_COMPONENTS = [
  "ChatComposer",
  "ChatMessage",
  "CodeBlock",
  "Combobox",
  "CommandPalette",
  "RichTextEditor",
  "StreamingText",
  "ToastProvider",
  "TokenUsageMeter",
  "TypingDots",
] as const;

/** The keys of the PREVIEWS record, read from source (mirrors previewCoverage). */
function previewKeys(): string[] {
  const src = readFileSync(
    join(process.cwd(), "src/app/design-system/DesignSystemShowcaseContent.tsx"),
    "utf-8",
  );
  const start = src.indexOf("const PREVIEWS: Record<string, ReactNode> = {");
  const end = src.indexOf("\n};", start);
  const body = src.slice(start, end);
  return [...body.matchAll(/^\s{2}"?([a-z][a-z-]*)"?:/gm)].map((m) => m[1]);
}

describe("AI-app components in the showcase", () => {
  it("documents every 0.6.0 AI primitive in the catalog", () => {
    const documented = new Set(COMPONENTS.map((c) => c.importName));
    const missing = AI_COMPONENTS.filter((name) => !documented.has(name));
    expect(missing).toEqual([]);
  });

  it("gives every AI primitive a live preview to render", () => {
    const keys = new Set(previewKeys());
    const aiIds = COMPONENTS.filter((c) =>
      (AI_COMPONENTS as readonly string[]).includes(c.importName),
    ).map((c) => c.id);
    const missing = aiIds.filter((id) => !keys.has(id));
    expect(missing).toEqual([]);
  });
});
