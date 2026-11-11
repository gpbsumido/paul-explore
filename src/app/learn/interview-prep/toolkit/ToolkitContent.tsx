import { TOOLKIT_SECTIONS } from "@/lib/leetcode/toolkit";
import CodeExample from "../_shared/CodeExample";
import PlaybookPage from "../_shared/PlaybookPage";
import { focusRing } from "../_shared/classes";

/**
 * The JavaScript and TypeScript a LeetCode answer leans on that the language
 * doesn't hand you: the node classes, a heap, a queue without shift(), and the
 * sorting, number and string traps that cost points.
 */
export default function ToolkitContent() {
  return (
    <PlaybookPage
      breadcrumbs={[
        { label: "Learn", href: "/learn" },
        { label: "Interview prep", href: "/learn/interview-prep" },
        { label: "JS toolkit" },
      ]}
      current="toolkit"
    >
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">The JavaScript toolkit</h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
        Python has heapq and deque. JavaScript has neither, and a few of its defaults (string sort, shift() being
        linear, 32-bit bitwise operators) quietly break otherwise correct answers. These are the pieces worth being
        able to write from memory. Every snippet here is run in the test suite with the outputs shown.
      </p>

      <nav aria-label="On this page" className="mt-8">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[12px]">
          {TOOLKIT_SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`rounded-sm text-muted underline underline-offset-4 hover:text-foreground ${focusRing}`}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {TOOLKIT_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="mt-14 scroll-mt-24">
          <h2 id={`${section.id}-heading`} className="text-[20px] font-semibold tracking-tight text-foreground">
            {section.title}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">{section.intro}</p>
          {section.examples.map((example) => (
            <CodeExample key={example.title} example={example} />
          ))}
          {section.notes.length > 0 && (
            <ul className="mt-5 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-muted">
              {section.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </PlaybookPage>
  );
}
