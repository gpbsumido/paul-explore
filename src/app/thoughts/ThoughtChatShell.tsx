"use client";

import { useState, type ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
import ViewToggle from "@/app/thoughts/ViewToggle";

type Props = {
  /** Breadcrumb label (the page title in the header trail). */
  breadcrumb: string;
  /** The deprecated banner, when the write-up needs one. Shown in both views. */
  banner?: ReactNode;
  /** The fully-rendered summary <main>, built by ThoughtLayout on the server. */
  summary: ReactNode;
  /** The iMessage-style chat view. */
  chat: ReactNode;
};

/**
 * The client half of ThoughtLayout, only mounted when a write-up has a chat
 * view. The summary/chat toggle needs useState, and putting that state here
 * instead of in ThoughtLayout keeps the ~80 chat-less write-ups as pure server
 * markup with no hydration cost. Both views arrive fully rendered as props;
 * this component just picks which one to show.
 */
export default function ThoughtChatShell({
  breadcrumb,
  banner,
  summary,
  chat,
}: Props) {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: breadcrumb }]}
        right={<ViewToggle view={view} setView={setView} />}
        maxWidth="max-w-3xl"
      />

      {banner}

      {view === "summary" ? summary : chat}
    </>
  );
}
