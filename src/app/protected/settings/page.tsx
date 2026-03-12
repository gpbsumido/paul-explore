import type { Metadata } from "next";
import SettingsContent from "./SettingsContent";

export const metadata: Metadata = {
  title: "Settings | Dashboard",
  description: "Manage your account connections and preferences.",
};

export default function SettingsPage() {
  return <SettingsContent />;
}
