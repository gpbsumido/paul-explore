import Link from "next/link";
import { patternById } from "@/lib/leetcode/patterns";
import { patternPath } from "@/lib/leetcode/urls";
import PlaybookPage from "../_shared/PlaybookPage";

const sectionHeading = "text-[20px] font-semibold tracking-tight text-foreground";
const linkClasses =
  "rounded-sm text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

const ROUTINE: { step: string; detail: string }[] = [
  {
    step: "Restate it and work one example by hand.",
    detail:
      "Input, output, and a small case on paper. Half of the wrong answers I've written came from solving a slightly different problem than the one asked.",
  },
  {
    step: "Read the constraints before the clever part.",
    detail:
      "The largest n tells you the complexity budget. n ≤ 20 invites backtracking; n up to 10^5 rules out anything quadratic.",
  },
  {
    step: "Name the signal, then the pattern.",
    detail:
      "Which words gave it away? Say the pattern out loud before writing a line. If nothing jumps out, run down the roadmap asking each pattern's question.",
  },
  {
    step: "Say the brute force and its complexity.",
    detail:
      "It's the fallback if the better idea doesn't come, and the baseline the better idea has to beat. Interviewers want to hear it.",
  },
  {
    step: "Improve it with the pattern's question.",
    detail:
      "What am I recomputing? What would sorting buy me? What do I need to remember from what I've already seen?",
  },
  {
    step: "Write it, then trace it.",
    detail:
      "Run your example through the code by hand, then the edge cases: empty, one element, all the same, duplicates, negatives, the largest input.",
  },
  {
    step: "Timebox the struggle to 25 minutes.",
    detail:
      "Stuck past that, open the tell. Still stuck, read a solution until you understand it, close it, and write it yourself. Rate it Again so it comes back tomorrow.",
  },
  {
    step: "Rate it and write one line.",
    detail:
      "“The signal was ___, the trick was ___.” That sentence is what you're actually trying to remember, more than the code.",
  },
];

const WEEKS: { week: number; patternIds: string[]; focus: string }[] = [
  { week: 1, patternIds: ["arrays-hashing", "two-pointers"], focus: "Get fast at the easy ones. Most mediums are one of these plus a twist." },
  { week: 2, patternIds: ["sliding-window", "prefix-sum", "stack"], focus: "Subarrays and substrings: window when it's contiguous and monotone, prefix sums when it isn't." },
  { week: 3, patternIds: ["binary-search", "linked-list", "monotonic-stack"], focus: "Binary search on the answer is the one people miss. Practise the predicate." },
  { week: 4, patternIds: ["tree-dfs", "tree-bfs", "bst"], focus: "Decide what each recursive call returns before writing it." },
  { week: 5, patternIds: ["heap", "intervals", "trie"], focus: "Write the toolkit heap from memory until it takes five minutes." },
  { week: 6, patternIds: ["backtracking", "graphs"], focus: "Choose, explore, un-choose; then grids as graphs." },
  { week: 7, patternIds: ["topological-sort", "union-find", "shortest-path", "greedy"], focus: "Lower frequency, high payoff when they turn up. Greedy needs an argument, not a hunch." },
  { week: 8, patternIds: ["dp-1d", "dp-2d", "bit-manipulation"], focus: "Define dp[i] in words first. Then mock interviews: two a week, timed, out loud." },
];

const IN_THE_ROOM: { phase: string; minutes: string; say: string[] }[] = [
  {
    phase: "Clarify",
    minutes: "2 to 3 min",
    say: [
      "Restate the problem in your own words and confirm the output format.",
      "Ask what the input can look like: empty? duplicates? negatives? sorted? how large?",
      "Ask whether you can modify the input, and whether there's always an answer.",
    ],
  },
  {
    phase: "Examples",
    minutes: "2 min",
    say: ["Walk one small example by hand.", "Make up an edge case and say what it should return."],
  },
  {
    phase: "Approach",
    minutes: "5 min",
    say: [
      "Brute force first, with its complexity.",
      "Then the better idea, naming the pattern and why the wording points at it.",
      "State the target complexity and get a nod before you write anything.",
    ],
  },
  {
    phase: "Code",
    minutes: "15 to 20 min",
    say: [
      "Narrate as you write. Silence reads as stuck even when you're not.",
      "Descriptive names, small helpers, light TypeScript types.",
      "If you'd normally reach for a library heap, say so and ask whether to write one.",
    ],
  },
  {
    phase: "Test",
    minutes: "5 min",
    say: [
      "Trace your example through the code line by line.",
      "Run the edge cases you raised earlier.",
      "Fix bugs calmly and out loud. Finding your own bug counts in your favour.",
    ],
  },
  {
    phase: "Wrap up",
    minutes: "2 min",
    say: ["Time and space complexity, one more time.", "Trade-offs and what you'd change at ten times the scale."],
  },
];

const UNSTICK = [
  "Let me try a smaller example.",
  "What if the input were sorted?",
  "What am I computing more than once?",
  "What would I need to remember about what I've already seen?",
  "Can I solve it for the first i elements and extend?",
];

/**
 * How to work through the playbook: the routine for every problem, an eight
 * week schedule over the roadmap, and what to do in the interview itself.
 */
export default function PlanContent() {
  return (
    <PlaybookPage
      breadcrumbs={[
        { label: "Learn", href: "/learn" },
        { label: "Interview prep", href: "/learn/interview-prep" },
        { label: "Study plan" },
      ]}
      current="plan"
    >
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Study plan</h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
        Grinding problems in a random order is slow, and grinding one topic until it feels easy is misleading. What
        works is learning a pattern, recalling it rather than rereading it, mixing it in with the others, and coming
        back to it just as it starts to fade.
      </p>

      <section aria-labelledby="routine-heading" className="mt-12">
        <h2 id="routine-heading" className={sectionHeading}>
          Every problem, the same way
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          The same eight steps every time, until they&apos;re automatic and the only thing left to think about is the
          problem.
        </p>
        <ol className="mt-6 space-y-5">
          {ROUTINE.map((item, i) => (
            <li key={item.step} className="flex gap-4">
              <span aria-hidden className="w-6 shrink-0 font-mono text-[13px] tabular-nums text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-[15px] font-medium text-foreground">{item.step}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="why-heading" className="mt-14">
        <h2 id="why-heading" className={sectionHeading}>
          Why it&apos;s built like this
        </h2>
        <ul className="mt-4 space-y-4 text-[14px] leading-relaxed text-muted">
          <li>
            <strong className="text-foreground">Recall beats rereading.</strong> Practising retrieval produces much
            better retention than studying the same material again (Roediger and Karpicke, 2006). That&apos;s why the
            templates are hidden until you&apos;ve tried to write them.
          </li>
          <li>
            <strong className="text-foreground">Spacing beats cramming.</strong> Reviews spread out over growing gaps
            hold up far better than the same number crammed together (Cepeda and colleagues, 2006). The 1, 3, 7, 14,
            30, 60 day ladder is a simple version of that.
          </li>
          <li>
            <strong className="text-foreground">Mixing beats blocking.</strong> Practising different problem types
            shuffled together is harder in the moment and much better on the test (Rohrer and Taylor, 2007). A ladder
            of ten sliding-window problems in a row tells you the pattern up front; an interview never will. The{" "}
            <Link href="/learn/interview-prep/drill" className={linkClasses}>
              recognition drill
            </Link>{" "}
            is the mixed practice.
          </li>
        </ul>
      </section>

      <section aria-labelledby="weeks-heading" className="mt-14">
        <h2 id="weeks-heading" className={sectionHeading}>
          Eight weeks, about an hour a day
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Each day: ten drill cards first (five minutes), then clear anything due, then two new problems from this
          week&apos;s ladders. Saturdays are a timed mock: two mediums in 45 minutes, out loud. Sundays are for catching
          up or resting.
        </p>
        <table className="mt-6 w-full text-left text-[14px]">
          <caption className="sr-only">Week by week schedule</caption>
          <thead>
            <tr className="border-b border-border text-[12px] text-muted">
              <th scope="col" className="py-2 pr-4 font-medium">
                Week
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Patterns
              </th>
              <th scope="col" className="py-2 font-medium">
                Focus
              </th>
            </tr>
          </thead>
          <tbody>
            {WEEKS.map(({ week, patternIds, focus }) => (
              <tr key={week} className="border-b border-border/50 align-top">
                <th scope="row" className="py-3 pr-4 font-mono font-normal text-muted">
                  {week}
                </th>
                <td className="py-3 pr-4">
                  <ul className="space-y-1">
                    {patternIds.map((id) => {
                      const pattern = patternById(id);
                      if (!pattern) throw new Error(`Week ${week} lists "${id}", which isn't a pattern`);
                      return (
                        <li key={id}>
                          <Link href={patternPath(id)} className={linkClasses}>
                            {pattern.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </td>
                <td className="py-3 text-muted">{focus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          Four weeks instead? Do two weeks a week, and take only the first four or five problems of each ladder.
          After the eight weeks, keep the drill and the due list going. Ten minutes a day keeps it all warm.
        </p>
      </section>

      <section aria-labelledby="room-heading" className="mt-14">
        <h2 id="room-heading" className={sectionHeading}>
          In the room
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          A 45-minute coding round grades how you get to the answer as much as the answer itself. The same shape every
          time keeps nerves from deciding what you do next.
        </p>
        <ol className="mt-6 space-y-6">
          {IN_THE_ROOM.map(({ phase, minutes, say }) => (
            <li key={phase}>
              <h3 className="text-[15px] font-semibold text-foreground">
                {phase} <span className="ml-1 font-mono text-[12px] font-normal text-muted">{minutes}</span>
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-muted">
                {say.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <h3 className="mt-10 text-[15px] font-semibold text-foreground">Things to say when you&apos;re stuck</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-muted">
          {UNSTICK.map((line) => (
            <li key={line}>&ldquo;{line}&rdquo;</li>
          ))}
        </ul>
      </section>
    </PlaybookPage>
  );
}
