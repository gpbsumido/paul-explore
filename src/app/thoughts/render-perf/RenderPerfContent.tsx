import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { RenderPerfChat } from "./sections/RenderPerfChat";
import { RenderPerfSummary1 } from "./sections/RenderPerfSummary1";
import { RenderPerfSummary2 } from "./sections/RenderPerfSummary2";

export default function RenderPerfContent() {
  return (
    <ThoughtLayout
      breadcrumb="Render Performance"
      title="Render Performance"
      intro={
        <>
          A second performance pass, this time focused on runtime rendering
          costs rather than network-level vitals. Context value instability,
          resize handler allocation, GPU-heavy CSS, unbounded DOM growth, and
          transition waste. Working through these incrementally.
        </>
      }
      chat={<RenderPerfChat />}
    >
      <RenderPerfSummary1 />
      <RenderPerfSummary2 />
      <WhatsNext
        nowShipped={[
          "Render cost treated as a measurable thing rather than an instinct, with the work aimed at what profiling showed.",
          "Memoisation applied where a profile justified it, rather than sprinkled defensively where it costs more than it saves.",
        ]}
        couldImprove={[
          "There is no render-performance check in CI, so a regression is invisible until someone notices interaction feeling heavy.",
          "The findings are specific to the pages profiled, and nothing says whether the rest of the app has the same problems.",
        ]}
        upcoming={[
          "Nothing scheduled. The vitals INP number is the signal I would watch, and per-route budgets there would give this teeth.",
        ]}
      />
    </ThoughtLayout>
  );
}
