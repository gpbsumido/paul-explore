import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within, act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { axe } from "vitest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EvarContent from "./EvarContent";
import { EVAR_CASES, referenceFor, anatomyFor } from "@/lib/evar/phantom";
import { parseManifest } from "@/lib/evar/scans";
import manifest from "../../../public/evar/scans/manifest.json";
import { gzipSync } from "node:zlib";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const firstCase = EVAR_CASES[0];

// Personal bests live in localStorage, so one test's finish mustn't become the next one's best to beat.
afterEach(() => {
  window.localStorage.clear();
});

/**
 * The page reads sign-in state through react-query, so it needs a client. The
 * guided tour opens itself on a first visit, so it's marked seen here; its own
 * tests are in EvarTour.test.tsx.
 */
const renderPage = () => {
  window.localStorage.setItem("evar-tour-seen", "true");
  window.localStorage.setItem("evar-study-asked", "true");
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <EvarContent />
    </QueryClientProvider>,
  );
};

const sliceSlider = () => screen.getByRole("slider", { name: /slice/i });
/** Device sizing lives on its own tab, after measuring. */
const openDevices = () => fireEvent.click(screen.getByRole("tab", { name: /size the graft/i }));
/** The landmarks only graft lengths need are folded away until asked for. */
const openLandmarks = () => fireEvent.click(screen.getByRole("button", { name: /landmarks for graft lengths/i }));
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
    openDevices();
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
    fireEvent.click(screen.getByRole("button", { name: /review the scan/i }));
    fireEvent.click(screen.getByRole("button", { name: /about these sizing tables/i }));
    expect(screen.getByText(/not affiliated with medtronic/i)).toBeInTheDocument();
  });

  it("forgets the devices when the case changes", () => {
    renderPage();
    openDevices();
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

  it("follows the site theme instead of forcing its own", () => {
    const { container } = renderPage();
    expect(container.querySelector("[data-theme]")).toBeNull();
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

  it("adds a finished case to this device's results once, and links to them", () => {
    renderPage();
    checkAnswers();
    const history = JSON.parse(window.localStorage.getItem("evar-history-v2") ?? "[]");
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ levelId: "medium", caseId: firstCase.id, within: 0, timedOut: false });
    expect(within(resultsDialog()).getByRole("link", { name: /all your results/i })).toHaveAttribute("href", "/evar/results");

    fireEvent.click(within(resultsDialog()).getByRole("button", { name: /review the scan/i }));
    fireEvent.click(screen.getByRole("button", { name: /show results/i }));
    expect(JSON.parse(window.localStorage.getItem("evar-history-v2") ?? "[]")).toHaveLength(1);
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

describe("EvarContent zoom", () => {
  const zoomGroup = () => screen.getByRole("group", { name: /zoom/i });
  const zoomLevel = () => within(zoomGroup()).getByText(/×$/);

  /** jsdom lays nothing out, so the viewer is given a 384 px box to click in. */
  function sizeViewer() {
    vi.spyOn(viewer(), "getBoundingClientRect").mockReturnValue(DOMRect.fromRect({ x: 0, y: 0, width: 384, height: 384 }));
  }

  function click(x: number, y: number) {
    fireEvent.pointerDown(viewer(), { clientX: x, clientY: y, pointerId: 1, button: 0 });
    fireEvent.pointerUp(viewer(), { clientX: x, clientY: y, pointerId: 1, button: 0 });
  }

  it("steps through the zoom with the buttons, and stops at the ends", () => {
    renderPage();
    expect(zoomLevel()).toHaveTextContent("1×");
    expect(screen.getByRole("button", { name: /zoom out/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reset zoom/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(zoomLevel()).toHaveTextContent("2×");
    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(zoomLevel()).toHaveTextContent("8×");
    expect(screen.getByRole("button", { name: /zoom in/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /reset zoom/i }));
    expect(zoomLevel()).toHaveTextContent("1×");
  });

  it("zooms with + and - and resets with 0 from the keyboard", () => {
    renderPage();
    viewer().focus();
    fireEvent.keyDown(viewer(), { key: "+" });
    fireEvent.keyDown(viewer(), { key: "+" });
    expect(zoomLevel()).toHaveTextContent("4×");
    fireEvent.keyDown(viewer(), { key: "-" });
    expect(zoomLevel()).toHaveTextContent("2×");
    fireEvent.keyDown(viewer(), { key: "0" });
    expect(zoomLevel()).toHaveTextContent("1×");
  });

  it("measures the same millimetres with the keyboard at 4×", () => {
    renderPage();
    viewer().focus();
    fireEvent.keyDown(viewer(), { key: "+" });
    fireEvent.keyDown(viewer(), { key: "+" });
    keyboardCaliper(10);
    expect(screen.getByRole("status")).toHaveTextContent(`${(10 * firstCase.pixelMm).toFixed(1)} mm`);
  });

  it("places clicks on the anatomy under the pointer, so the same gap on screen is half as far at 2×", () => {
    renderPage();
    sizeViewer();
    click(150, 192);
    click(250, 192);
    expect(screen.getByRole("status")).toHaveTextContent(`${(100 * firstCase.pixelMm).toFixed(1)} mm`);

    fireEvent.keyDown(viewer(), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    click(150, 192);
    click(250, 192);
    expect(screen.getByRole("status")).toHaveTextContent(`${(50 * firstCase.pixelMm).toFixed(1)} mm`);
  });

  it("pans on a drag and places no point", () => {
    renderPage();
    sizeViewer();
    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    fireEvent.pointerDown(viewer(), { clientX: 200, clientY: 200, pointerId: 1, button: 0 });
    fireEvent.pointerMove(viewer(), { clientX: 260, clientY: 230, pointerId: 1, button: 0 });
    fireEvent.pointerUp(viewer(), { clientX: 260, clientY: 230, pointerId: 1, button: 0 });
    expect(screen.getByRole("status")).toHaveTextContent(/no caliper placed/i);
  });

  it("keeps the zoom across slices and starts a new case at 1×", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    fireEvent.change(sliceSlider(), { target: { value: "40" } });
    expect(zoomLevel()).toHaveTextContent("2×");

    fireEvent.click(screen.getByRole("radio", { name: new RegExp(EVAR_CASES[1].title) }));
    expect(zoomLevel()).toHaveTextContent("1×");
  });
});

describe("EvarContent lengths", () => {
  const markAt = (slice: number, name: RegExp) => {
    fireEvent.change(sliceSlider(), { target: { value: String(slice) } });
    fireEvent.click(screen.getByRole("button", { name }));
  };

  it("measures from the lowest renal to the bifurcation and each internal iliac along the centerline", () => {
    renderPage();
    markAt(firstCase.lowestRenalSlice, /mark this slice as lowest renal artery/i);
    openLandmarks();
    markAt(firstCase.bifurcationSlice, /mark this slice as aortic bifurcation/i);
    markAt(firstCase.internalIliacSlice.right, /mark this slice as right internal iliac origin/i);
    const expected = anatomyFor(firstCase);
    expect(screen.getByText(/renal to bifurcation/i).closest("li")).toHaveTextContent(`${expected.renalToBifurcation.toFixed(1)} mm`);
    expect(screen.getByText(/renal to right internal iliac/i).closest("li")).toHaveTextContent(
      `${expected.renalToInternalIliac.right.toFixed(1)} mm`,
    );
  });

  it("grades the picked lengths in the results", () => {
    renderPage();
    openDevices();
    fireEvent.change(screen.getByRole("combobox", { name: /main body/i }), { target: { value: "ETBF2816C145EE" } });
    fireEvent.change(screen.getByRole("combobox", { name: /contralateral limb/i }), { target: { value: "ETLW1616C93EE" } });
    fireEvent.click(screen.getByRole("button", { name: /check answers/i }));
    const lengths = within(screen.getByRole("dialog")).getByRole("table", { name: /lengths/i });
    expect(within(lengths).getByRole("row", { name: /gate above the bifurcation/i })).toBeInTheDocument();
    expect(within(lengths).getByRole("row", { name: /contralateral reach/i })).toHaveTextContent(/123.143 mm/);
    expect(within(lengths).getByRole("row", { name: /ipsilateral reach/i })).toBeInTheDocument();
  });
});

describe("EvarContent manufacturers", () => {
  it("offers each manufacturer's own devices, and clears the picks when it changes", () => {
    renderPage();
    openDevices();
    const mainBody = () => screen.getByRole("combobox", { name: /main body/i });
    fireEvent.change(mainBody(), { target: { value: "ETBF2816C145EE" } });
    expect(mainBody()).toHaveValue("ETBF2816C145EE");

    fireEvent.click(screen.getByRole("radio", { name: /gore excluder/i }));
    expect(mainBody()).toHaveValue("");
    expect(within(mainBody()).getByRole("option", { name: /CXT281416/ })).toBeInTheDocument();
    expect(within(mainBody()).queryByRole("option", { name: /ETBF2816C145EE/ })).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: /zenith alpha/i }));
    expect(within(mainBody()).getAllByRole("option", { name: /ZIMB/ }).length).toBeGreaterThan(0);
  });
});

describe("EvarContent real CTA", () => {
  const [scan] = parseManifest(manifest, "/evar/scans");

  /** A uniform volume, so the page has something to draw without shipping the real file to the test. */
  function serveScan() {
    server.use(
      http.get(scan.file, () => new HttpResponse(gzipSync(new Uint8Array(scan.size * scan.size * scan.slices).fill(100)))),
    );
  }

  /** Real scans are picked from a select, since there will be hundreds of them. */
  const pickScan = async () => {
    const select = await screen.findByRole("combobox", { name: /real scan/i });
    fireEvent.change(select, { target: { value: within(select).getByRole("option", { name: scan.title }).getAttribute("value") } });
  };

  const openScan = async () => {
    renderPage();
    await pickScan();
    await waitFor(() => expect(screen.queryByText(/loading the scan/i)).toBeNull());
  };

  it("loads the real case, measures in its own pixels, and credits where it came from", async () => {
    serveScan();
    await openScan();
    expect(screen.getAllByText(/CC BY 4\.0/).length).toBeGreaterThan(0);
    openDevices();
    expect(screen.getByText(/only the diameters are graded/i)).toBeInTheDocument();
    keyboardCaliper(10);
    expect(screen.getByRole("status")).toHaveTextContent(`${(10 * scan.pixelMm).toFixed(1)} mm`);
  });

  it("says it isn't scored yet when nobody has measured it, and keeps nothing", async () => {
    serveScan();
    await openScan();
    fireEvent.click(screen.getByRole("button", { name: /check answers/i }));
    expect(within(screen.getByRole("dialog")).getByText(/isn.t scored yet/i)).toBeInTheDocument();
    expect(window.localStorage.getItem("evar-history-v2")).toBeNull();
  });

  it("scores it like any other case once there's a reference", async () => {
    serveScan();
    server.use(
      http.get("/api/evar/references", () =>
        HttpResponse.json({
          references: [
            { caseId: scan.id, neckDiameter: 22, neckLength: 18, maxSac: 34, rightCia: 13, leftCia: 12, note: null, updatedAt: "2026-10-23T12:00:00.000Z" },
          ],
        }),
      ),
    );
    await openScan();
    await waitFor(() => expect(screen.queryByText(/isn.t scored yet/i)).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: /check answers/i }));
    const results = within(screen.getByRole("dialog")).getByRole("table", { name: /results/i });
    expect(within(results).getByRole("row", { name: /proximal neck diameter/i })).toHaveTextContent("22.0 mm");
  });
});

describe("EvarContent, one job at a time", () => {
  it("splits the work into Measure and Size the graft, starting on Measure", () => {
    renderPage();
    const measure = screen.getByRole("tab", { name: /measure/i });
    const devices = screen.getByRole("tab", { name: /size the graft/i });
    expect(measure).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("combobox", { name: /main body/i })).toBeNull();

    fireEvent.keyDown(measure, { key: "ArrowRight" });
    expect(devices).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("combobox", { name: /main body/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /record caliper as proximal neck diameter/i })).toBeNull();
  });

  it("counts the five measurements on the Measure tab", () => {
    renderPage();
    expect(screen.getByRole("tab", { name: /measure/i })).toHaveTextContent(/0 of 5/);
    keyboardCaliper(10);
    fireEvent.click(screen.getByRole("button", { name: /record caliper as proximal neck diameter/i }));
    expect(screen.getByRole("tab", { name: /measure/i })).toHaveTextContent(/1 of 5/);
  });

  it("folds the graft-length landmarks away until they're asked for", () => {
    renderPage();
    const toggle = screen.getByRole("button", { name: /landmarks for graft lengths/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /mark this slice as aortic bifurcation/i })).toBeNull();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /mark this slice as aortic bifurcation/i })).toBeInTheDocument();
  });

  it("folds the viewer controls and the measuring rules away until opened", () => {
    renderPage();
    const controls = screen.getByRole("button", { name: /viewer controls/i });
    expect(controls).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(/press enter at each end/i)).not.toBeVisible();
    fireEvent.click(controls);
    expect(screen.getByText(/press enter at each end/i)).toBeVisible();

    const rules = screen.getByRole("button", { name: /how to measure/i });
    expect(screen.getByText(/outer wall to outer wall/i)).not.toBeVisible();
    fireEvent.click(rules);
    expect(screen.getByText(/outer wall to outer wall/i)).toBeVisible();
  });

  it("folds the sizing tables' source and disclaimer away", () => {
    renderPage();
    openDevices();
    expect(screen.getByText(/not affiliated with/i)).not.toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /about these sizing tables/i }));
    expect(screen.getByText(/not affiliated with medtronic/i)).toBeVisible();
  });
});

describe("EvarContent real CTA, when things go wrong", () => {
  const [scan] = parseManifest(manifest, "/evar/scans");

  it("says when a scan won't load, and tries again on request", async () => {
    let fail = true;
    server.use(
      http.get(scan.file, () =>
        fail ? new HttpResponse(null, { status: 503 }) : new HttpResponse(gzipSync(new Uint8Array(scan.size * scan.size * scan.slices).fill(100))),
      ),
    );
    renderPage();
    const select = await screen.findByRole("combobox", { name: /real scan/i });
    fireEvent.change(select, { target: { value: within(select).getByRole("option", { name: scan.title }).getAttribute("value") } });
    expect(await screen.findByText(/couldn.t load this scan/i)).toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(screen.queryByText(/couldn.t load this scan/i)).toBeNull());
    await waitFor(() => expect(screen.queryByText(/loading the scan/i)).toBeNull());
  });

  it("keeps phantoms as pills and real scans in a select, with no phantom pill checked while a scan is open", async () => {
    server.use(http.get(scan.file, () => new HttpResponse(gzipSync(new Uint8Array(scan.size * scan.size * scan.slices)))));
    renderPage();
    expect(screen.getByRole("radio", { name: firstCase.title })).toBeChecked();
    expect(screen.queryByRole("radio", { name: new RegExp(scan.title) })).toBeNull();
    const select = await screen.findByRole("combobox", { name: /real scan/i });
    fireEvent.change(select, { target: { value: within(select).getByRole("option", { name: scan.title }).getAttribute("value") } });
    expect(screen.getByRole("radio", { name: firstCase.title })).not.toBeChecked();
    expect(select).toHaveDisplayValue(scan.title);
  });
});
