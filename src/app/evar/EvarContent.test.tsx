import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { axe } from "vitest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EvarContent from "./EvarContent";
import { EVAR_CASES, referenceFor } from "@/lib/evar/phantom";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const firstCase = EVAR_CASES[0];

// Personal bests live in localStorage, so one test's finish mustn't become the next one's best to beat.
afterEach(() => {
  window.localStorage.clear();
});

/** The page reads sign-in state through react-query, so it needs a client. */
const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <EvarContent />
    </QueryClientProvider>,
  );

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
    renderPage();
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
    renderPage();
    keyboardCaliper(10);
    const expected = (10 * firstCase.pixelMm).toFixed(1);
    expect(screen.getByRole("status")).toHaveTextContent(`${expected} mm`);
  });

  it("can't record a diameter before a caliper exists", () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: /record caliper as proximal neck diameter/i }),
    ).toBeDisabled();
  });

  it("records the caliper and marked slices, then scores them", () => {
    renderPage();
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
    renderPage();
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

  it("starts on Medium, with no hints and no clock", () => {
    renderPage();
    expect(screen.getByRole("radio", { name: /medium/i })).toBeChecked();
    expect(screen.queryByRole("list", { name: /hints/i })).toBeNull();
    expect(screen.queryByRole("timer")).toBeNull();
  });

  it("shows where to look on Easy", () => {
    renderPage();
    fireEvent.click(screen.getByRole("radio", { name: /easy/i }));
    const hints = screen.getByRole("list", { name: /hints/i });
    expect(within(hints).getByText(/lowest renal artery/i)).toBeInTheDocument();
    expect(within(hints).getByText(/widest/i)).toBeInTheDocument();
  });

  it("only offers the cases that belong to the level", () => {
    renderPage();
    fireEvent.click(screen.getByRole("radio", { name: /hard/i }));
    expect(screen.getByRole("radio", { name: /hostile/i })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: new RegExp(EVAR_CASES[0].title) })).toBeNull();
  });

  it("counts Hard down from 5:00 and hands the answers in at 0:00", () => {
    vi.useFakeTimers();
    try {
      renderPage();
      fireEvent.click(screen.getByRole("radio", { name: /hard/i }));
      expect(screen.getByRole("timer")).toHaveTextContent("5:00");

      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByRole("timer")).toHaveTextContent("4:00");
      expect(screen.queryByRole("table", { name: /results/i })).toBeNull();

      act(() => {
        vi.advanceTimersByTime(4 * 60_000);
      });
      // The results popup is open by now, which hides the stage behind it.
      expect(screen.getByRole("timer", { hidden: true })).toHaveTextContent("0:00");
      expect(screen.getByRole("dialog", { name: /how you did/i })).toBeInTheDocument();
      expect(screen.getByRole("table", { name: /results/i })).toBeInTheDocument();
      expect(screen.getByText(/time's up/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("gives a score and the time taken when the answers are checked", () => {
    vi.useFakeTimers();
    try {
      renderPage();
      act(() => {
        vi.advanceTimersByTime(83_000);
      });
      fireEvent.click(screen.getByRole("button", { name: /check answers/i }));
      expect(screen.getByText(/0 of 5 within tolerance/i)).toHaveTextContent("1:23");
    } finally {
      vi.useRealTimers();
    }
  });

  it("grades the devices picked against the sizing table", () => {
    renderPage();
    fireEvent.change(screen.getByRole("combobox", { name: /main body/i }), {
      target: { value: "ETBF2816C145EE" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /contralateral limb/i }), {
      target: { value: "ETLW1610C93EE" },
    });
    fireEvent.click(screen.getByRole("button", { name: /check answers/i }));

    const devices = screen.getByRole("table", { name: /devices/i });
    expect(within(devices).getByRole("row", { name: /main body/i })).toHaveTextContent(/matches the table/i);
    expect(within(devices).getByRole("row", { name: /contralateral/i })).toHaveTextContent(/doesn't match/i);
    expect(screen.getByText(/not affiliated with medtronic/i)).toBeInTheDocument();
  });

  it("forgets the devices when the case changes", () => {
    renderPage();
    const mainBody = () => screen.getByRole("combobox", { name: /main body/i });
    fireEvent.change(mainBody(), { target: { value: "ETBF2816C145EE" } });
    fireEvent.click(screen.getByRole("radio", { name: new RegExp(EVAR_CASES[1].title) }));
    expect(mainBody()).toHaveValue("");
  });

  it("scores against reference values an admin set by hand", async () => {
    server.use(
      http.get("/api/evar/references", () =>
        HttpResponse.json({
          references: [
            {
              caseId: firstCase.id,
              neckDiameter: 25.5,
              neckLength: 28,
              maxSac: 61,
              rightCia: 14,
              leftCia: 12.5,
              note: null,
              updatedAt: "2026-10-22T10:00:00.000Z",
            },
          ],
        }),
      ),
    );
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /check answers/i }));
    expect(await screen.findByText(/set by hand/i)).toBeInTheDocument();
    const results = screen.getByRole("table", { name: /results/i });
    expect(within(results).getByRole("row", { name: /proximal neck diameter/i })).toHaveTextContent("25.5");
  });

  it("has no axe violations", async () => {
    const { container } = renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });
});

/** Marks both ends of the neck on the right slices, which scores the length within tolerance. */
function markNeckLength() {
  const ref = referenceFor(firstCase);
  fireEvent.change(sliceSlider(), { target: { value: String(firstCase.lowestRenalSlice) } });
  fireEvent.click(screen.getByRole("button", { name: /mark this slice as lowest renal artery/i }));
  fireEvent.change(sliceSlider(), { target: { value: String(ref.sacStartSlice) } });
  fireEvent.click(screen.getByRole("button", { name: /mark this slice as aneurysm start/i }));
}

const checkAnswers = () => fireEvent.click(screen.getByRole("button", { name: /check answers/i }));
const resultsDialog = () => screen.getByRole("dialog", { name: /how you did/i });

describe("EvarContent results popup", () => {
  it("pops up stars and points when the answers are checked", () => {
    renderPage();
    expect(screen.queryByRole("dialog")).toBeNull();
    markNeckLength();
    checkAnswers();

    const dialog = resultsDialog();
    expect(within(dialog).getByText(/0 of 3 stars/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/\d+ points/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("table", { name: /results/i })).toBeInTheDocument();
  });

  it("calls the first scored finish a personal best, and a worse one not", () => {
    renderPage();
    markNeckLength();
    checkAnswers();
    expect(within(resultsDialog()).getByText(/new personal best/i)).toBeInTheDocument();

    fireEvent.click(within(resultsDialog()).getByRole("button", { name: /try again/i }));
    checkAnswers();
    expect(within(resultsDialog()).getByText(/0 points/i)).toBeInTheDocument();
    expect(within(resultsDialog()).queryByText(/new personal best/i)).toBeNull();
  });

  it("starts the same case fresh on Try again", () => {
    renderPage();
    keyboardCaliper(10);
    fireEvent.click(screen.getByRole("button", { name: /record caliper as proximal neck diameter/i }));
    checkAnswers();
    fireEvent.click(within(resultsDialog()).getByRole("button", { name: /try again/i }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("radio", { name: new RegExp(EVAR_CASES[0].title) })).toBeChecked();
    expect(screen.getByRole("button", { name: /record caliper as proximal neck diameter/i })).toBeDisabled();
    expect(screen.getAllByText("Not recorded")).toHaveLength(4);
  });

  it("moves on to the next case", () => {
    renderPage();
    checkAnswers();
    fireEvent.click(within(resultsDialog()).getByRole("button", { name: /next case/i }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("radio", { name: new RegExp(EVAR_CASES[1].title) })).toBeChecked();
  });

  it("closes to review the scan and opens again from Show results", () => {
    renderPage();
    checkAnswers();
    fireEvent.click(within(resultsDialog()).getByRole("button", { name: /review the scan/i }));

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.change(sliceSlider(), { target: { value: "40" } });
    expect(sliceSlider()).toHaveValue("40");

    fireEvent.click(screen.getByRole("button", { name: /show results/i }));
    expect(resultsDialog()).toBeInTheDocument();
  });

  it("has no axe violations with the popup open", async () => {
    renderPage();
    checkAnswers();
    expect(await axe(resultsDialog())).toHaveNoViolations();
  });
});
