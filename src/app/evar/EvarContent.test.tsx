import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import EvarContent from "./EvarContent";
import { EVAR_CASES, referenceFor } from "@/lib/evar/phantom";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const firstCase = EVAR_CASES[0];

const sliceSlider = () => screen.getByRole("slider", { name: /slice/i });
const viewer = () => screen.getByRole("application", { name: /axial ct slice/i });

/** Places a caliper with the keyboard: Enter, move right `steps` pixels, Enter. */
function keyboardCaliper(steps: number) {
  const canvas = viewer();
  canvas.focus();
  fireEvent.keyDown(canvas, { key: "Enter" });
  for (let i = 0; i < steps; i += 1) {
    fireEvent.keyDown(canvas, { key: "ArrowRight" });
  }
  fireEvent.keyDown(canvas, { key: "Enter" });
}

describe("EvarContent", () => {
  it("moves through the slices with the slider and with PageUp/PageDown", () => {
    render(<EvarContent />);
    const slider = sliceSlider();
    fireEvent.change(slider, { target: { value: "30" } });
    expect(slider).toHaveValue("30");

    fireEvent.keyDown(viewer(), { key: "PageDown" });
    expect(slider).toHaveValue("31");
    fireEvent.keyDown(viewer(), { key: "PageUp" });
    fireEvent.keyDown(viewer(), { key: "PageUp" });
    expect(slider).toHaveValue("29");
  });

  it("announces a caliper placed entirely from the keyboard, in mm", () => {
    render(<EvarContent />);
    keyboardCaliper(10);
    const expected = (10 * firstCase.pixelMm).toFixed(1);
    expect(screen.getByRole("status")).toHaveTextContent(`${expected} mm`);
  });

  it("can't record a diameter before a caliper exists", () => {
    render(<EvarContent />);
    expect(
      screen.getByRole("button", { name: /record caliper as proximal neck diameter/i }),
    ).toBeDisabled();
  });

  it("records the caliper and marked slices, then scores them", () => {
    render(<EvarContent />);
    const ref = referenceFor(firstCase);

    keyboardCaliper(10);
    fireEvent.click(
      screen.getByRole("button", { name: /record caliper as proximal neck diameter/i }),
    );

    fireEvent.change(sliceSlider(), {
      target: { value: String(firstCase.lowestRenalSlice) },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /mark this slice as lowest renal artery/i }),
    );
    fireEvent.change(sliceSlider(), {
      target: { value: String(ref.sacStartSlice) },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /mark this slice as aneurysm start/i }),
    );

    fireEvent.click(screen.getByRole("button", { name: /check answers/i }));

    const results = screen.getByRole("table", { name: /results/i });
    const neckRow = within(results).getByRole("row", { name: /proximal neck diameter/i });
    expect(neckRow).toHaveTextContent((10 * firstCase.pixelMm).toFixed(1));
    expect(neckRow).toHaveTextContent(/outside tolerance/i);

    const lengthRow = within(results).getByRole("row", { name: /neck length/i });
    expect(lengthRow).toHaveTextContent(/within tolerance/i);

    const sacRow = within(results).getByRole("row", { name: /maximum sac diameter/i });
    expect(sacRow).toHaveTextContent(/not measured/i);
  });

  it("starts fresh when another case is picked", () => {
    render(<EvarContent />);
    keyboardCaliper(4);
    fireEvent.click(
      screen.getByRole("button", { name: /record caliper as proximal neck diameter/i }),
    );
    fireEvent.click(screen.getByRole("radio", { name: new RegExp(EVAR_CASES[1].title) }));
    expect(screen.queryByRole("table", { name: /results/i })).toBeNull();
    expect(
      screen.getByRole("button", { name: /record caliper as proximal neck diameter/i }),
    ).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<EvarContent />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
