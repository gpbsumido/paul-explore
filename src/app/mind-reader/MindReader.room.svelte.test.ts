import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { axe } from "vitest-axe";
import MindReader from "./MindReader.svelte";
import { ROLES } from "./_game/roles.data";
import type { Connect, RoomMessage } from "./_room/protocol";

const FIRST_ROLE = ROLES[0].text;

/**
 * An in-memory room: every device that connects hears what the others send,
 * one microtask later, like a network would. `wire` keeps every message so a
 * test can check what actually travelled.
 */
const createRoom = (kind: "ably" | "local" = "ably") => {
  const wire: RoomMessage[] = [];
  const listeners = new Set<(m: RoomMessage) => void>();
  const connect: Connect = async (_code, onMessage) => {
    listeners.add(onMessage);
    return {
      kind,
      send(message) {
        wire.push(message);
        for (const listener of listeners) {
          if (listener !== onMessage) queueMicrotask(() => listener(message));
        }
      },
      close() {
        listeners.delete(onMessage);
      },
    };
  };
  return { wire, connect };
};

const settle = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
  await tick();
};

/** Player A on one device, Player B on another, joined to the same room. */
const twoDevices = async (kind: "ably" | "local" = "ably") => {
  let time = 1_000_000;
  const now = () => time;
  const room = createRoom(kind);
  const host = render(MindReader, { random: () => 0, now, connect: room.connect });
  const a = within(host.container);
  await fireEvent.click(a.getByRole("button", { name: /start a room/i }));
  await settle();
  const code = a.getByTestId("room-code").textContent ?? "";

  const guest = render(MindReader, { now, joinCode: code, connect: room.connect });
  const b = within(guest.container);
  await settle();

  const press = async (who: typeof a, name: RegExp) => {
    await fireEvent.click(who.getByRole("button", { name }));
    await settle();
  };
  const advance = async (ms: number) => {
    time += ms;
    vi.advanceTimersByTime(ms);
    await settle();
  };
  return { a, b, code, guest, room, press, advance };
};

describe("The Mind Reader across two devices", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("gives player A a code and a link for player B", async () => {
    const { a, code } = await twoDevices();
    expect(code).toMatch(/^[A-Z2-9]{5}$/);
    expect(a.getByRole("link", { name: /mind-reader\?room=/i })).toHaveAttribute(
      "href",
      expect.stringContaining(`?room=${code}`),
    );
  });

  it("never sends the role to player B, or shows it there, until the round is over", async () => {
    const { a, b, room, press } = await twoDevices();
    expect(b.getByRole("heading", { name: /player a is picking a deck/i })).toBeInTheDocument();

    await press(a, /deal a role/i);
    expect(a.getByText(FIRST_ROLE)).toBeInTheDocument();
    expect(b.getByRole("heading", { name: /player a is reading their role/i })).toBeInTheDocument();
    expect(b.queryByText(FIRST_ROLE)).not.toBeInTheDocument();

    await press(a, /hide it and start/i);
    expect(b.getByRole("timer")).toHaveTextContent("5:00");
    expect(b.queryByText(FIRST_ROLE)).not.toBeInTheDocument();
    expect(JSON.stringify(room.wire)).not.toContain(FIRST_ROLE);

    await press(b, /i guessed it/i);
    expect(a.getByRole("heading", { name: /got it/i })).toBeInTheDocument();
    expect(b.getByRole("heading", { name: /got it/i })).toBeInTheDocument();
    expect(b.getByText(FIRST_ROLE)).toBeInTheDocument();
  });

  it("keeps both clocks together when player B pauses and gives up", async () => {
    const { a, b, press, advance } = await twoDevices();
    await press(a, /deal a role/i);
    await press(a, /hide it and start/i);
    await advance(30_000);
    expect(b.getByRole("timer")).toHaveTextContent("4:30");

    await press(b, /pause/i);
    await advance(60_000);
    expect(a.getByRole("timer")).toHaveTextContent("4:30");
    expect(b.getByRole("timer")).toHaveTextContent("4:30");

    await press(b, /resume/i);
    await advance(30_000);
    expect(b.getByRole("timer")).toHaveTextContent("4:00");

    await press(b, /give up/i);
    expect(b.getByRole("heading", { name: /time's up/i })).toBeInTheDocument();
    expect(b.getByText(/0 guessed · 1 stumped/i)).toBeInTheDocument();
  });

  it("tells player A when the room only reaches tabs in this browser", async () => {
    const { a } = await twoDevices("local");
    expect(a.getByText(/only between tabs in this browser/i)).toBeInTheDocument();
  });

  it("has no axe violations on player B's screen mid-round", async () => {
    const { a, guest, press } = await twoDevices();
    await press(a, /deal a role/i);
    await press(a, /hide it and start/i);
    vi.useRealTimers();
    expect(await axe(guest.container)).toHaveNoViolations();
  });
});
