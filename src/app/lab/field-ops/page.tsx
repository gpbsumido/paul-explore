import type { Metadata } from "next";
import FieldOpsConsole from "./FieldOpsConsole";

export const metadata: Metadata = {
  title: "Field Ops | Lab",
  description:
    "A simulated field console: live tracks on a 3D map, a video tile and an alert queue that stays honest when data goes stale or the link drops.",
};

export default function FieldOpsPage() {
  return <FieldOpsConsole />;
}
