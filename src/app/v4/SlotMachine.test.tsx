import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  within,
  act,
} from "@testing-library/react";
import { axe } from "@/test/a11y";
import SlotMachine from "./SlotMachine";
import { buildSlots } from "./slotData";
import { WIN_MS } from "./WinCelebration";

const mocks = vi.hoisted(() => ({
  reducedMotion: false,
  playWinSound: vi.fn(),
  unlockWinAudio: vi.fn(),
}));

vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mocks.reducedMotion,
}));

// The jingle itself is covered in winSound.test.ts; here only whether the
// machine asks for it, and when.
vi.mock("./winSound", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./winSound")>()),
  playWinSound: mocks.playWinSound,
  unlockWinAudio: mocks.unlockWinAudio,
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: (href: string) => push(href) }),
}));

vi.mock("next/font/google", () => ({
  Fraunces: () => ({ className: "font-fraunces", style: {} }),
}));

const renderMachine = () =>
  render(
    <SlotMachine greeting="Hello there" action={<button>Log in</button>} />,
  );

beforeEach(() => {
  mocks.reducedMotion = false;
  mocks.playWinSound.mockClear();
  mocks.unlockWinAudio.mockClear();
  push.mockClear();
  window.localStorage.clear();
});

describe("SlotMachine reels", () => {
  it("keeps each reel an accessible region named for its column", () => {
    renderMachine();
    // Apps is the default landed category, so the middle reel names an app link.
    expect(
      screen.getByRole("listbox", { name: "Category" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listbox", { name: "App link" }),
    ).toBeInTheDocument();
    // The Write-up reel is a listbox when it has options and a plain group when
    // the landed app has no write-up yet; either way it's present and labelled.
    const writeup =
      screen.queryByRole("listbox", { name: "Write-up" }) ??
      screen.getByRole("group", { name: "Write-up" });
    expect(writeup).toBeInTheDocument();
  });

  it("drops the numbered column headers above the reels", () => {
    renderMachine();
    expect(screen.queryByText("01")).not.toBeInTheDocument();
    expect(screen.queryByText("02")).not.toBeInTheDocument();
    expect(screen.queryByText("03")).not.toBeInTheDocument();
  });

  it("puts one continuous magnifier lens across the reels", () => {
    renderMachine();
    // The loupe is a single glass bar spanning all three columns now, not a
    // separate bar per reel.
    expect(screen.getAllByTestId("reel-lens")).toHaveLength(1);
  });

  it("annotates the landed row with a drawn-in label pointing at it", () => {
    renderMachine();
    // The reel names now live in the annotation layer, not a static header.
    const annotations = screen.getAllByTestId("reel-annotation");
    expect(annotations.length).toBeGreaterThanOrEqual(2);
    expect(within(annotations[0]).getByText("Category")).toBeInTheDocument();
  });

  it("moves focus between reels with Left and Right arrows", () => {
    renderMachine();
    const category = screen.getByRole("listbox", { name: "Category" });
    const options = screen.getByRole("listbox", { name: "App link" });

    category.focus();
    expect(category).toHaveFocus();

    fireEvent.keyDown(category, { key: "ArrowRight" });
    expect(options).toHaveFocus();

    fireEvent.keyDown(options, { key: "ArrowLeft" });
    expect(category).toHaveFocus();
  });

  it("opens the landed row when its label is clicked", () => {
    push.mockClear();
    renderMachine();
    // The middle reel has landed on an app; its big label is the obvious thing
    // to click, and it used to just re-select the row it was already on.
    const optReel = screen.getByRole("listbox", { name: "App link" });
    const landed = within(optReel).getByText(/\S/, {
      selector: ".font-fraunces",
    });
    fireEvent.click(landed.closest("div.group") as HTMLElement);
    // The machine rests on the first app, so that is the one that opens.
    const [apps] = buildSlots();
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(apps.options[0].href);
  });

  it("has no axe violations", async () => {
    const { container } = renderMachine();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("SlotMachine pull", () => {
  const [apps] = buildSlots();
  const firstApp = apps.options[0];
  const firstExternalAppIndex = () =>
    apps.options.findIndex((option) => option.external);
  // With Math.random at 0 the weighted pick lands on the first app: a win.
  // Just under 1 lands on the final write-up-only category: no app to open.
  const WIN_ROLL = 0;
  const NO_WIN_ROLL = 0.9999;
  /** Long enough for all three reels to settle, short of the confetti ending. */
  const SETTLE_MS = 2500;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const pull = (roll: number) => {
    vi.spyOn(Math, "random").mockReturnValue(roll);
    fireEvent.click(screen.getByRole("button", { name: "Spin the reels" }));
  };
  const letTimePass = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };
  const celebration = () => screen.queryByTestId("win-celebration");

  it("arms the audio inside the click itself, not after the reels stop", () => {
    renderMachine();

    pull(WIN_ROLL);

    expect(mocks.unlockWinAudio).toHaveBeenCalledTimes(1);
    expect(mocks.playWinSound).not.toHaveBeenCalled();
  });

  it("locks the button and hides the pick while the reels turn", () => {
    renderMachine();

    pull(WIN_ROLL);

    expect(screen.getByRole("button", { name: "Spin the reels" })).toBeDisabled();
    expect(screen.getByText("spinning…")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Open / }),
    ).not.toBeInTheDocument();
  });

  it("lands on an app, offers to open it, and celebrates with sound", () => {
    renderMachine();

    pull(WIN_ROLL);
    letTimePass(SETTLE_MS);

    expect(screen.getByRole("button", { name: "Spin the reels" })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: `Open ${firstApp.label} →` }),
    ).toHaveAttribute("href", firstApp.href);
    expect(celebration()).toBeInTheDocument();
    expect(mocks.playWinSound).toHaveBeenCalledTimes(1);
  });

  it("stops the confetti once the flourish is over", () => {
    renderMachine();

    pull(WIN_ROLL);
    letTimePass(SETTLE_MS);
    expect(celebration()).toBeInTheDocument();

    letTimePass(WIN_MS);

    expect(celebration()).not.toBeInTheDocument();
  });

  it("lands on a write-up-only column without a prize: no confetti, no sound, nothing to open", () => {
    renderMachine();

    pull(NO_WIN_ROLL);
    letTimePass(SETTLE_MS);

    expect(screen.getByRole("button", { name: "Spin the reels" })).toBeEnabled();
    expect(celebration()).not.toBeInTheDocument();
    expect(mocks.playWinSound).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("link", { name: /^Open / }),
    ).not.toBeInTheDocument();
  });

  it("clears an unfinished celebration the moment the next pull starts", () => {
    renderMachine();
    pull(WIN_ROLL);
    letTimePass(SETTLE_MS);
    expect(celebration()).toBeInTheDocument();

    pull(NO_WIN_ROLL);

    expect(celebration()).not.toBeInTheDocument();
  });

  it("celebrates a second win too, rather than leaving the first stuck on", () => {
    renderMachine();
    pull(WIN_ROLL);
    letTimePass(SETTLE_MS + WIN_MS);
    expect(celebration()).not.toBeInTheDocument();

    pull(WIN_ROLL);
    letTimePass(SETTLE_MS);

    expect(celebration()).toBeInTheDocument();
    expect(mocks.playWinSound).toHaveBeenCalledTimes(2);
  });

  it("under reduced motion lands straight away with no spinning, confetti or sound", () => {
    mocks.reducedMotion = true;
    renderMachine();

    pull(NO_WIN_ROLL);

    expect(screen.queryByText("spinning…")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spin the reels" })).toBeEnabled();
    const lastCategory = buildSlots().at(-1)!;
    const landedRow = within(
      screen.getByRole("listbox", { name: "Category" }),
    ).getByRole("option", { selected: true });
    expect(landedRow).toHaveTextContent(lastCategory.label);
    expect(celebration()).not.toBeInTheDocument();
    expect(mocks.playWinSound).not.toHaveBeenCalled();
  });

  it("favours the Apps column over its plain share of the combinations", () => {
    renderMachine();
    const categories = buildSlots();
    const comboCount = (options: ReturnType<typeof buildSlots>[number]["options"]) =>
      options.reduce((n, o) => n + Math.max(o.thoughts.length, 1), 0);
    const unweightedShare =
      comboCount(categories[0].options) /
      categories.reduce((n, c) => n + comboCount(c.options), 0);

    const ROLLS = 40;
    let appLandings = 0;
    for (let i = 0; i < ROLLS; i += 1) {
      pull((i + 0.5) / ROLLS);
      letTimePass(SETTLE_MS);
      const landed = within(
        screen.getByRole("listbox", { name: "Category" }),
      ).getByRole("option", { selected: true });
      if (landed.textContent === "Apps") appLandings += 1;
      letTimePass(WIN_MS);
    }

    expect(appLandings / ROLLS).toBeGreaterThan(unweightedShare * 1.5);
  }, 20_000);

  it("opens an external app in a new tab, not in this one", () => {
    const externalIndex = firstExternalAppIndex();
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderMachine();
    const appReel = screen.getByRole("listbox", { name: "App link" });
    for (let i = 0; i < externalIndex; i += 1) {
      fireEvent.keyDown(appReel, { key: "ArrowDown" });
    }

    const external = apps.options[externalIndex];
    expect(
      screen.getByRole("link", { name: `Open ${external.label} →` }),
    ).toHaveAttribute("target", "_blank");
    fireEvent.keyDown(screen.getByRole("listbox", { name: "Category" }), {
      key: "Enter",
    });

    expect(open).toHaveBeenCalledWith(
      external.href,
      "_blank",
      "noopener,noreferrer",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("opens the landed app with Enter on the category reel", () => {
    renderMachine();

    fireEvent.keyDown(screen.getByRole("listbox", { name: "Category" }), {
      key: "Enter",
    });

    expect(push).toHaveBeenCalledWith(firstApp.href);
  });
});

describe("SlotMachine sound toggle", () => {
  it("mutes the win sound, remembers it, and unmutes again", () => {
    renderMachine();
    const mute = screen.getByRole("button", { name: "Mute win sound" });
    expect(mute).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(mute);

    const unmute = screen.getByRole("button", { name: "Unmute win sound" });
    expect(unmute).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem("v4-win-sound")).toBe("off");
    expect(mocks.unlockWinAudio).not.toHaveBeenCalled();

    fireEvent.click(unmute);

    expect(
      screen.getByRole("button", { name: "Mute win sound" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("v4-win-sound")).toBe("on");
    // Unmuting is a gesture, so it arms the audio right then.
    expect(mocks.unlockWinAudio).toHaveBeenCalledTimes(1);
  });

  it("starts muted when the visitor muted it last time", () => {
    window.localStorage.setItem("v4-win-sound", "off");

    renderMachine();

    expect(
      screen.getByRole("button", { name: "Unmute win sound" }),
    ).toBeInTheDocument();
  });
});
