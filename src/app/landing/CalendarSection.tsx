import { type RefObject } from "react";
import { useInView } from "./useInView";
import Section, { reveal } from "./Section";

/** Days-of-week labels for the mock month grid header. */
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * A single day cell in the mock calendar grid.
 * `today` gets the red circle treatment, chips are optional.
 */
function MockDay({
  day,
  today,
  chips = [],
  faded,
}: {
  day: number;
  today?: boolean;
  chips?: { label: string; color: string; span?: number }[];
  faded?: boolean;
}) {
  return (
    <div className="min-h-[52px] border-r border-b border-white/10 p-1 last:border-r-0">
      <div className="flex justify-center mb-0.5">
        <span
          className={[
            "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
            today
              ? "bg-red-500 text-white font-semibold"
              : faded
                ? "text-white/25"
                : "text-white/70",
          ].join(" ")}
        >
          {day}
        </span>
      </div>
      {chips.map((chip, i) => (
        <div
          key={i}
          className="mb-0.5 rounded-sm px-1 py-px text-[8px] font-medium truncate"
          style={{ backgroundColor: chip.color + "40", color: chip.color }}
        >
          {chip.label}
        </div>
      ))}
    </div>
  );
}

export default function CalendarSection() {
  const [ref, visible] = useInView();

  return (
    <Section className="bg-gradient-to-br from-teal-900 to-neutral-900 dark:from-teal-950 dark:to-neutral-950">
      <div ref={ref as RefObject<HTMLDivElement>}>
        <h2
          className={`text-center text-3xl font-bold tracking-tight text-white md:text-4xl ${reveal(visible)}`}
        >
          Personal Calendar
        </h2>
        <p
          className={`mx-auto mt-3 max-w-lg text-center text-white/70 ${reveal(visible, "delay-100")}`}
        >
          Day, week, month, and year views with multi-day events, an
          overlapping-event layout engine, and Pokémon card attachments — built
          to track what we pull playing Pokémon Pocket together.
        </p>

        {/* Mock calendar month grid */}
        <div
          className={`mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm ${reveal(visible, "delay-200")}`}
        >
          {/* Mock toolbar */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-white/20" />
              <span className="text-sm font-semibold text-white">
                February 2026
              </span>
              <div className="h-4 w-4 rounded bg-white/20" />
            </div>
            <div className="flex gap-1.5">
              {["Day", "Week", "Month", "Year"].map((v, i) => (
                <span
                  key={v}
                  className={[
                    "rounded px-2 py-0.5 text-[10px] font-semibold",
                    i === 2
                      ? "bg-teal-500/30 text-teal-300 border border-teal-500/30"
                      : "text-white/40",
                  ].join(" ")}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-white/10">
            {DOW.map((d) => (
              <div
                key={d}
                className="py-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-white/40 border-r border-white/10 last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Mock day cells — two rows is enough to read as a calendar */}
          <div className="grid grid-cols-7">
            {/* row 1 — overflow from prev month + start of month */}
            <MockDay day={26} faded />
            <MockDay day={27} faded />
            <MockDay day={28} faded />
            <MockDay
              day={1}
              chips={[{ label: "Pocket night", color: "#10b981" }]}
            />
            <MockDay day={2} chips={[{ label: "Pocket night", color: "#10b981" }]} />
            <MockDay day={3} />
            <MockDay day={4} />
          </div>
          <div className="grid grid-cols-7">
            {/* row 2 — today + some events */}
            <MockDay day={5} />
            <MockDay
              day={6}
              chips={[{ label: "Trade meet", color: "#3b82f6" }]}
            />
            <MockDay
              day={7}
              chips={[
                { label: "Trade meet", color: "#3b82f6" },
                { label: "Pulled Mewtwo ✦", color: "#8b5cf6" },
              ]}
            />
            <MockDay
              day={8}
              chips={[{ label: "Trade meet", color: "#3b82f6" }]}
            />
            <MockDay day={9} />
            <MockDay day={10} />
            <MockDay day={11} today />
          </div>
        </div>

        {/* Feature highlights */}
        <div
          className={`mt-8 grid gap-4 md:grid-cols-3 ${reveal(visible, "delay-300")}`}
        >
          {[
            [
              "4 Calendar Views",
              "Day and week views use an absolute-positioned time grid — events span their real duration and sit side by side when they overlap.",
            ],
            [
              "Pokémon Card Tracking",
              "Attach cards pulled from Pocket to any event. Search the full TCGdex catalog and log what you got, when you got it.",
            ],
            [
              "Multi-day Events",
              "Events spanning multiple days show on every day they cover, with continuation bars in month view and all-day row promotion in week/day view.",
            ],
          ].map(([t, d]) => (
            <div
              key={t}
              className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <h4 className="text-sm font-semibold text-white">{t}</h4>
              <p className="mt-1 text-xs leading-relaxed text-white/60">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
