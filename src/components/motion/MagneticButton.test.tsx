import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import { LazyMotion, domAnimation } from "framer-motion";
import MagneticButton from "./MagneticButton";

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/app/providers", () => ({
  useHubReducedMotion: () => mocks.reduced,
}));

beforeEach(() => {
  mocks.reduced = false;
});

/** The element the wrapper moves: the control's parent. */
const wrapper = () => screen.getByRole("button", { name: "Spin" }).parentElement as HTMLElement;

/**
 * Motion values only reach the DOM once a feature bundle is loaded, which the
 * app does at its root. Without it the wrapper never visibly moves in jsdom.
 */
const renderSpin = () =>
  render(
    <LazyMotion features={domAnimation}>
      <MagneticButton>
        <button>Spin</button>
      </MagneticButton>
    </LazyMotion>,
  );

describe("MagneticButton", () => {
  it("leans toward a mouse pointer and springs back when it leaves", async () => {
    renderSpin();
    fireEvent.pointerMove(wrapper(), { pointerType: "mouse", clientX: 100, clientY: 0 });
    await waitFor(() => expect(wrapper().style.transform).toMatch(/translateX\([1-9]/));

    fireEvent.pointerLeave(wrapper());
    await waitFor(() =>
      expect(wrapper().style.transform).not.toMatch(/translateX\([1-9]/),
    );
  });

  it("stays put for a finger", async () => {
    renderSpin();
    fireEvent.pointerMove(wrapper(), { pointerType: "touch", clientX: 100, clientY: 100 });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(wrapper().style.transform).not.toMatch(/translateX\([1-9]/);
  });

  it("stays put under reduced motion", async () => {
    mocks.reduced = true;
    renderSpin();
    fireEvent.pointerMove(wrapper(), { pointerType: "mouse", clientX: 100, clientY: 100 });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(wrapper().style.transform).not.toMatch(/translateX\([1-9]/);
  });

  it("passes clicks through to the wrapped control", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <MagneticButton>
        <button onClick={onClick}>Spin</button>
      </MagneticButton>,
    );

    await user.click(screen.getByRole("button", { name: "Spin" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps the wrapped control reachable from the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <MagneticButton>
        <button>Spin</button>
      </MagneticButton>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "Spin" })).toHaveFocus();
  });

  it("adds no role of its own around the control", () => {
    render(
      <MagneticButton>
        <button>Spin</button>
      </MagneticButton>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <MagneticButton>
        <button>Spin</button>
      </MagneticButton>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
