import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import GalleryWallContent from "./GalleryWallContent";
import type { GalleryState, FramedImage, Position } from "./_lib/state";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

// The walls API is exercised in its own tests; here it just needs to not fetch.
vi.mock("./_lib/walls-api", () => ({
  listWalls: vi.fn(async () => []),
  getWall: vi.fn(),
  createWall: vi.fn(async () => ({ id: "w1", name: "Hallway", updatedAt: "t" })),
  updateWall: vi.fn(async () => ({ id: "w1", name: "Hallway", updatedAt: "t" })),
  deleteWall: vi.fn(async () => undefined),
}));

import { createWall } from "./_lib/walls-api";

const framed = (
  id: string,
  aspect: number,
  frame: FramedImage["frame"],
  position?: Position,
): FramedImage => ({ id, src: `blob:${id}`, aspect, frame, position });

const seededState = (overrides: Partial<GalleryState> = {}): GalleryState => ({
  images: [
    framed("a", 0.8, { sizeId: "8x10", orientation: "portrait" }),
    framed("b", 1.5, { sizeId: "11x14", orientation: "landscape" }),
  ],
  wall: { width: 96, height: 60 },
  gap: 3,
  layout: "rows",
  ...overrides,
});

const overlapping = (): GalleryState =>
  seededState({
    images: [
      framed("a", 0.8, { sizeId: "8x10", orientation: "portrait" }, { x: 10, y: 10 }),
      framed("b", 0.8, { sizeId: "8x10", orientation: "portrait" }, { x: 12, y: 12 }),
    ],
  });

const frameRectX = (container: HTMLElement, id: string): number =>
  Number(container.querySelector(`[data-frame-id="${id}"] rect`)?.getAttribute("x"));

/** Pretend the window is wide (or not), which gates the floating panel. */
const setViewportWide = (wide: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("min-width: 1024px") ? wide : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

beforeEach(() => {
  window.localStorage.clear();
  window.print = vi.fn();
  setViewportWide(true);
});

describe("GalleryWallContent", () => {
  it("renders the heading and a labelled upload control", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /gallery wall/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/add photos/i)).toBeInTheDocument();
  });

  it("shows the wall size inputs seeded from state", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    expect(screen.getByLabelText(/wall width/i)).toHaveValue(96);
    expect(screen.getByLabelText(/wall height/i)).toHaveValue(60);
  });

  it("renders the to-scale preview with one frame per photo", () => {
    const { container } = render(<GalleryWallContent initialState={seededState()} />);
    expect(container.querySelectorAll("svg image")).toHaveLength(2);
  });

  it("lets me change a single photo's frame size", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    const group = screen.getByRole("group", { name: "Photo 1" });
    const select = within(group).getByLabelText(/frame size/i);
    fireEvent.change(select, { target: { value: "16x20" } });
    expect(select).toHaveValue("16x20");
  });

  it("lets me flip a single photo's orientation", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    const group = screen.getByRole("group", { name: "Photo 1" });
    const landscape = within(group).getByRole("button", { name: /landscape/i });
    fireEvent.click(landscape);
    expect(landscape).toHaveAttribute("aria-pressed", "true");
  });

  it("moves a frame to the right when its handle is nudged with the arrow key", () => {
    const { container } = render(<GalleryWallContent initialState={seededState()} />);
    const before = frameRectX(container, "a");
    fireEvent.keyDown(container.querySelector('[data-frame-id="a"]')!, {
      key: "ArrowRight",
    });
    expect(frameRectX(container, "a")).toBeCloseTo(before + 1, 5);
  });

  it("flags overlapping frames and blocks saving with a warning", () => {
    const { container } = render(
      <GalleryWallContent initialState={overlapping()} />,
    );
    expect(container.querySelector('[data-frame-id="a"]')).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/overlap/i);
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("saves a valid arrangement as a named wall", async () => {
    render(<GalleryWallContent initialState={seededState()} />);
    const save = screen.getByRole("button", { name: /^save$/i });
    expect(save).toBeEnabled();
    fireEvent.change(screen.getByLabelText(/wall name/i), {
      target: { value: "Hallway" },
    });
    fireEvent.click(save);
    await waitFor(() =>
      expect(createWall).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Hallway" }),
      ),
    );
  });

  it("auto-arranges overlapping frames back into a valid layout", () => {
    render(<GalleryWallContent initialState={overlapping()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /auto-arrange/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeEnabled();
  });

  it("zooms in on repeated clicks of the same button without it moving", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    // The Fit control is always in the DOM so the +/- buttons never shift.
    expect(screen.getByText("Fit")).toBeInTheDocument();
    const zoomInput = screen.getByLabelText(/zoom percent/i);
    expect(zoomInput).toHaveValue(100);
    const zoomIn = screen.getByRole("button", { name: /zoom in/i });
    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    expect(zoomInput).toHaveValue(200);
    fireEvent.click(screen.getByRole("button", { name: /zoom out/i }));
    expect(zoomInput).toHaveValue(150);
  });

  it("lets me type a zoom amount, clamped to the limits", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    const zoomInput = screen.getByLabelText(/zoom percent/i);
    fireEvent.change(zoomInput, { target: { value: "175" } });
    fireEvent.blur(zoomInput);
    expect(zoomInput).toHaveValue(175);
    fireEvent.change(zoomInput, { target: { value: "999" } });
    fireEvent.blur(zoomInput);
    expect(zoomInput).toHaveValue(400);
    fireEvent.change(zoomInput, { target: { value: "5" } });
    fireEvent.blur(zoomInput);
    expect(zoomInput).toHaveValue(100);
  });

  it("shows the zoom preview minimap only once zoomed in", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    expect(
      screen.queryByRole("img", { name: /zoom preview/i }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(
      screen.getByRole("img", { name: /zoom preview/i }),
    ).toBeInTheDocument();
  });

  it("floats the settings panel out and docks it back", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    const toggle = screen.getByRole("button", { name: /float panel/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    const docked = screen.getByRole("button", { name: /dock panel/i });
    expect(docked).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(docked);
    expect(
      screen.getByRole("button", { name: /float panel/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("docks the panel again when the header button is pressed with a real pointer", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    fireEvent.click(screen.getByRole("button", { name: /float panel/i }));

    // A real press lands on the draggable header before the button's click. The
    // header must not capture the pointer, or the click never reaches the button.
    const dock = screen.getByRole("button", { name: /dock panel/i });
    fireEvent.pointerDown(dock, { clientX: 40, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(dock, { clientX: 90, clientY: 70, pointerId: 1 });
    fireEvent.pointerUp(dock, { clientX: 90, clientY: 70, pointerId: 1 });
    fireEvent.click(dock);

    expect(screen.getByRole("button", { name: /float panel/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("does not drag the floating panel when its header button is pressed", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    fireEvent.click(screen.getByRole("button", { name: /float panel/i }));
    const panel = document.querySelector("aside") as HTMLElement;
    const before = panel.style.left;

    const dock = screen.getByRole("button", { name: /dock panel/i });
    fireEvent.pointerDown(dock, { clientX: 40, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(dock, { clientX: 300, clientY: 400, pointerId: 1 });

    expect(panel.style.left).toBe(before);
  });

  it("centres everything into one balanced cluster on aesthetic arrange", () => {
    const { container } = render(
      <GalleryWallContent initialState={seededState()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /aesthetic arrange/i }));

    const rects = Array.from(
      container.querySelectorAll("[data-frame-id] rect"),
    ).map((r) => ({
      x: Number(r.getAttribute("x")),
      y: Number(r.getAttribute("y")),
      w: Number(r.getAttribute("width")),
      h: Number(r.getAttribute("height")),
    }));

    // Equal margins left and right: the cluster sits in the middle of the wall.
    const left = Math.min(...rects.map((r) => r.x));
    const right = Math.max(...rects.map((r) => r.x + r.w));
    expect(left).toBeCloseTo(96 - right, 4);

    // Equal margins top and bottom too: the whole block is centred.
    const top = Math.min(...rects.map((r) => r.y));
    const bottom = Math.max(...rects.map((r) => r.y + r.h));
    expect(top).toBeCloseTo(60 - bottom, 4);
  });

  it("drops any hand-placed positions when arranging aesthetically", () => {
    const { container } = render(
      <GalleryWallContent
        initialState={seededState({
          images: [
            framed("a", 0.8, { sizeId: "8x10", orientation: "portrait" }, { x: 1, y: 1 }),
            framed("b", 1.5, { sizeId: "11x14", orientation: "landscape" }, { x: 60, y: 40 }),
          ],
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /aesthetic arrange/i }));
    const first = container.querySelector('[data-frame-id="a"] rect');
    expect(Number(first?.getAttribute("x"))).not.toBe(1);
  });

  it("will not float the panel when the window is too narrow for it", () => {
    setViewportWide(false);
    render(<GalleryWallContent initialState={seededState()} />);
    expect(screen.getByRole("button", { name: /float panel/i })).toBeDisabled();
  });

  it("switches the auto layout to masonry", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    const masonry = screen.getByRole("button", { name: /masonry/i });
    fireEvent.click(masonry);
    expect(masonry).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a printable hang sheet with a measured row per photo", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    fireEvent.click(screen.getByRole("button", { name: /hang sheet/i }));
    const table = screen.getByRole("table", { name: /hang sheet/i });
    // header row + one row per photo
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: /^print/i }));
    expect(window.print).toHaveBeenCalled();
  });

  it("warns when a frame hangs off the wall", () => {
    render(
      <GalleryWallContent initialState={seededState({ wall: { width: 12, height: 12 } })} />,
    );
    expect(screen.getByText(/off the wall|fit the wall/i)).toBeInTheDocument();
  });

  it("converts the wall size when switching to centimetres", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    fireEvent.change(screen.getByLabelText(/units/i), { target: { value: "cm" } });
    expect(screen.getByLabelText(/wall width/i)).toHaveValue(244);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<GalleryWallContent initialState={seededState()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
