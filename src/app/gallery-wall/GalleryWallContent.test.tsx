import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import GalleryWallContent from "./GalleryWallContent";
import type { GalleryState, FramedImage, Position } from "./_lib/state";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

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

beforeEach(() => {
  window.localStorage.clear();
  window.print = vi.fn();
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

  it("saves a valid arrangement to storage", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    const save = screen.getByRole("button", { name: /save/i });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    expect(window.localStorage.getItem("gallery-wall:saved")).toBeTruthy();
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
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
