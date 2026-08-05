"use client";

import { ChatThread } from "@/lib/threads";
import { CalendarChatPart1 } from "./CalendarChatPart1";
import { CalendarChatPart2 } from "./CalendarChatPart2";
import { CalendarChatPart3 } from "./CalendarChatPart3";

/** The chat view of the calendar write-up, split into thread parts. */
export function CalendarChat() {
  return (
    <ChatThread>
      <CalendarChatPart1 />
      <CalendarChatPart2 />
      <CalendarChatPart3 />
    </ChatThread>
  );
}
