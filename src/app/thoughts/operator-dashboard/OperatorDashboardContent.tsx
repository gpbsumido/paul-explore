"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { OperatorChat } from "./sections/OperatorChat";
import { OperatorTimelineOverview } from "./sections/OperatorTimelineOverview";
import { OperatorBuild } from "./sections/OperatorBuild";
import { OperatorUpdatesEarly } from "./sections/OperatorUpdatesEarly";
import { OperatorUpdatesLate } from "./sections/OperatorUpdatesLate";

export default function OperatorDashboardContent() {
  return (
    <ThoughtLayout
      breadcrumb="Operator Dashboard"
      title="Operator Dashboard"
      intro={
        <>
          A fleet management dashboard for smart micro-retail stores. Monitor
          store status, inventory health, alerts, and sensor data across an
          entire network in real time — built with tiered polling, optimistic
          updates, and a data freshness system.
        </>
      }
      chat={<OperatorChat />}
    >
      <OperatorTimelineOverview />
      <OperatorBuild />
      <OperatorUpdatesEarly />
      <OperatorUpdatesLate />
      <WhatsNext
        nowShipped={[
          "Polling tiers set per resource rather than shared — 15s for alerts, 30s for store status, 60s for inventory, none for historical activity — because they encode a real judgement about what going stale costs.",
          "Five near-identical read hooks factored through one useOperatorResource factory, with each adapter keeping its own return shape so no consuming component had to change.",
          "Loading, empty and error told apart everywhere, after a bug where an unreachable API rendered as a legitimately empty fleet.",
          "This write-up split into focused sections once it passed five thousand lines, because a document nobody scrolls to the end of is not documentation.",
        ]}
        couldImprove={[
          "Polling rather than streaming. For a dashboard claiming to be live, server-sent events would be both cheaper and more honest than re-asking every fifteen seconds.",
          "No virtualisation on the store list, which is fine at this fleet size and would not be at ten times it.",
          "The charts are lazy-loaded but still heavy, and nothing budgets what the dashboard is allowed to cost on first paint.",
        ]}
        upcoming={[
          "Give the route the error boundary the rest of the app just got — it was one of the twelve without one.",
          "Server-sent events for alerts, which are the only tier where fifteen seconds of staleness is genuinely too long.",
        ]}
      />
    </ThoughtLayout>
  );
}
