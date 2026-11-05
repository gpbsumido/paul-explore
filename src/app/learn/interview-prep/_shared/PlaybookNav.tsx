import Link from "next/link";

const SECTIONS = [
  { id: "roadmap", label: "Roadmap", href: "/learn/interview-prep" },
  { id: "drill", label: "Drill", href: "/learn/interview-prep/drill" },
  { id: "plan", label: "Study plan", href: "/learn/interview-prep/plan" },
  { id: "toolkit", label: "JS toolkit", href: "/learn/interview-prep/toolkit" },
] as const;

export type PlaybookSection = (typeof SECTIONS)[number]["id"] | "pattern";

/**
 * The four corners of the playbook, on every page of it. The current one is
 * marked with aria-current and an underline, not colour alone.
 */
export default function PlaybookNav({ current }: { current: PlaybookSection }) {
  return (
    <nav aria-label="Interview prep" className="mb-10">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[13px]">
        {SECTIONS.map((section) => {
          const isCurrent = section.id === current;
          return (
            <li key={section.id}>
              <Link
                href={section.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`rounded-sm underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
                  isCurrent ? "text-foreground underline decoration-2" : "text-muted"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
