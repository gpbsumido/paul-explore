import { useEffect } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import LoopingDemo from "./LoopingDemo";

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/app/providers", () => ({
  useHubReducedMotion: () => mocks.reduced,
}));

// The wrapper only runs while the card is on screen. jsdom has no real
// observer, so the test setup's stub reports nothing; this makes it report
// visible, which is the state the looping behaviour is about.
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useInView: () => true,
}));

let mounts = 0;
function CountsMounts() {
  // Counted in an effect rather than during render: a render is allowed to run
  // more than once for the same mount, so counting there would measure React's
  // scheduling instead of the remount this test is about.
  useEffect(() => {
    mounts += 1;
  }, []);
  return <span>demo body</span>;
}

beforeEach(() => {
  mounts = 0;
  mocks.reduced = false;
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * The motion primitives animate once, when they scroll into view, and that is
 * correct on a real page: a headline that re-runs its entrance every few
 * seconds is a distraction. On the gallery it means the demo has usually
 * finished before anyone arrives at the card, so the thing being demonstrated
 * is invisible and the card shows a settled end state.
 *
 * This wrapper replays its child on the showcase only, by remounting it, and
 * gives every card a button so the replay is available on demand rather than
 * only on a timer.
 */
describe("LoopingDemo", () => {
  it("renders what it is given", () => {
    render(
      <LoopingDemo label="Text reveal">
        <CountsMounts />
      </LoopingDemo>,
    );
    expect(screen.getByText("demo body")).toBeInTheDocument();
  });

  it("replays on its own so a visitor who arrives late still sees it", () => {
    render(
      <LoopingDemo label="Text reveal" intervalMs={3000}>
        <CountsMounts />
      </LoopingDemo>,
    );
    expect(mounts).toBe(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(mounts).toBe(2);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(mounts).toBe(3);
  });

  it("holds still under reduced motion, showing the finished state", () => {
    mocks.reduced = true;
    render(
      <LoopingDemo label="Text reveal" intervalMs={3000}>
        <CountsMounts />
      </LoopingDemo>,
    );

    act(() => {
      vi.advanceTimersByTime(9000);
    });
    expect(mounts).toBe(1);
  });

  it("replays when asked, which is the accessible way to offer motion", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mocks.reduced = true;
    render(
      <LoopingDemo label="Text reveal" intervalMs={3000}>
        <CountsMounts />
      </LoopingDemo>,
    );

    await user.click(screen.getByRole("button", { name: /replay text reveal/i }));
    expect(mounts).toBe(2);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <LoopingDemo label="Text reveal">
        <CountsMounts />
      </LoopingDemo>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
