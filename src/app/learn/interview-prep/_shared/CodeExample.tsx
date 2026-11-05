import type { CodeExample as CodeExampleData } from "@/lib/leetcode/types";

/**
 * One worked example: what it's for, the code, and the calls it's checked
 * against. The same checks run in the test suite, so what's printed here is
 * what the code actually returns.
 */
export default function CodeExample({ example }: { example: CodeExampleData }) {
  return (
    <figure className="mt-6">
      <figcaption className="text-[14px] font-semibold text-foreground">{example.title}</figcaption>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">{example.explanation}</p>
      <pre className="mt-3 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.03] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed text-foreground">
        <code>{example.code}</code>
      </pre>
      {example.cases.length > 0 && (
        <ul className="mt-2 space-y-1 font-mono text-[12px] text-muted" aria-label={`Checks for ${example.title}`}>
          {example.cases.map((c) => (
            <li key={c.call} className="overflow-x-auto whitespace-nowrap">
              {c.call} <span aria-hidden>→</span>
              <span className="sr-only">returns</span> {JSON.stringify(c.expected)}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
