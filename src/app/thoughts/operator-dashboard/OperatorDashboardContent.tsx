"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
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
    </ThoughtLayout>
  );
}
