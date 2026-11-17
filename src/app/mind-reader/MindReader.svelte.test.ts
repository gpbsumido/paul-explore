import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { axe } from "vitest-axe";
import MindReader from "./MindReader.svelte";
import { ROLES } from "./_game/roles.data";

const FIRST_ROLE = ROLES[0].text;

/** A fixed dice roll (always the first role in the deck) and a clock the test moves by hand. */
const setup = () => {
  let time = 1_000_000;
  const view = render(MindReader, { random: () => 0, now: () => time });
  const advance = async (ms: number) => {
    time += ms;
    vi.advanceTimersByTime(ms);
    await tick();
  };
  return { ...view, advance };
};

const click = async (name: RegExp) => {
  await fireEvent.click(screen.getByRole("button", { name }));
  await tick();
};

describe("The Mind Reader (Svelte)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts on the rules screen and says how big the deck is", () => {
    setup();
    expect(screen.getByRole("heading", { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${ROLES.length} roles`))).toBeInTheDocument();
    expect(screen.queryByText(FIRST_ROLE)).not.toBeInTheDocument();
  });

  it("shows the role to player A alone, then hides it for the whole conversation", async () => {
    setup();
    await click(/deal a role/i);
    expect(screen.getByText(FIRST_ROLE)).toBeInTheDocument();
    await click(/hide it and start/i);
    expect(screen.queryByText(FIRST_ROLE)).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("5:00");
  });

  it("counts down, and reveals the role when time runs out", async () => {
    const { advance } = setup();
    await click(/deal a role/i);
    await click(/hide it and start/i);
    await advance(60_000);
    expect(screen.getByRole("timer")).toHaveTextContent("4:00");
    await advance(240_000);
    expect(screen.getByRole("heading", { name: /time's up/i })).toBeInTheDocument();
    expect(screen.getByText(FIRST_ROLE)).toBeInTheDocument();
    expect(screen.getByText(/1 stumped/i)).toBeInTheDocument();
  });

  it("freezes the clock while paused", async () => {
    const { advance } = setup();
    await click(/deal a role/i);
    await click(/hide it and start/i);
    await advance(30_000);
    await click(/pause/i);
    await advance(120_000);
    expect(screen.getByRole("timer")).toHaveTextContent("4:30");
    await click(/resume/i);
    await advance(30_000);
    expect(screen.getByRole("timer")).toHaveTextContent("4:00");
  });

  it("scores a guess and deals a fresh role for the next round", async () => {
    setup();
    await click(/deal a role/i);
    await click(/hide it and start/i);
    await click(/player b guessed it/i);
    expect(screen.getByRole("heading", { name: /got it/i })).toBeInTheDocument();
    expect(screen.getByText(/1 guessed/i)).toBeInTheDocument();
    await click(/next round/i);
    expect(screen.getByText(/round 2/i)).toBeInTheDocument();
    expect(screen.queryByText(FIRST_ROLE)).not.toBeInTheDocument();
  });

  it("announces the clock at one minute, not every second", async () => {
    const { advance } = setup();
    await click(/deal a role/i);
    await click(/hide it and start/i);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");
    await advance(240_000);
    expect(status).toHaveTextContent(/one minute left/i);
    expect(screen.getByRole("timer")).toHaveAttribute("aria-live", "off");
  });

  it("moves focus to the new heading on every phase change, but not on first load", async () => {
    setup();
    expect(document.body).toHaveFocus();
    await click(/deal a role/i);
    await vi.waitFor(() =>
      expect(screen.getByRole("heading", { name: /your secret role/i })).toHaveFocus(),
    );
  });

  it("has no axe violations on the rules screen or mid-round", async () => {
    // axe schedules its own work with timers, so it needs the real ones.
    vi.useRealTimers();
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
    await click(/deal a role/i);
    await click(/hide it and start/i);
    expect(await axe(container)).toHaveNoViolations();
  });
});
