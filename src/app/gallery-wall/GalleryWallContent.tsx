"use client";

import {
  useReducer,
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import WallStage from "./WallStage";
import {
  viewportRect,
  minimapPointToScroll,
  type ViewportMetrics,
} from "./_lib/arrange";
import { FRAME_SIZES, type Orientation } from "./_lib/frames";
import {
  galleryReducer,
  initialGalleryState,
  computeValidation,
  computeHangSheet,
  serializeGallery,
  deserializeGallery,
  type GalleryState,
  type LayoutMode,
  type UploadedImage,
} from "./_lib/state";

const ACCENT = "#e879f9";
const CM_PER_INCH = 2.54;
const SAVE_KEY = "gallery-wall:saved";
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.5;
type Unit = "in" | "cm";

/** Physical inches shown in the chosen unit, rounded for a tidy input. */
function toDisplay(inches: number, unit: Unit): number {
  return Math.round(unit === "cm" ? inches * CM_PER_INCH : inches);
}

/** A value typed in the chosen unit, converted back to inches for state. */
function toInches(value: number, unit: Unit): number {
  return unit === "cm" ? value / CM_PER_INCH : value;
}

/** Read one file into an {@link UploadedImage}, measuring its natural aspect. */
function readImage(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      const aspect = probe.naturalHeight === 0 ? 1 : probe.naturalWidth / probe.naturalHeight;
      resolve({ id: `${file.name}-${file.size}-${file.lastModified}`, src, aspect });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error(`Could not read ${file.name}`));
    };
    probe.src = src;
  });
}

type Props = { initialState?: GalleryState };

/**
 * The Gallery Wall Arranger. Upload photos and each one is framed with an
 * auto-chosen size and orientation; the size and orientation are yours to
 * override per photo. Drag frames anywhere on the wall (or nudge with the arrow
 * keys); overlapping or off-wall frames turn red and block saving. Auto-arrange
 * re-tidies as rows or staggered masonry, and the hang sheet prints the exact
 * measurements for every hook.
 *
 * The interesting logic lives in the pure reducer and layout modules under
 * `_lib/`; this component is the wiring and the accessible controls around them.
 */
export default function GalleryWallContent({ initialState }: Props) {
  const [state, dispatch] = useReducer(
    galleryReducer,
    initialState ?? initialGalleryState,
  );
  const [unit, setUnit] = useState<Unit>("in");
  const [zoom, setZoom] = useState(1);
  const [zoomText, setZoomText] = useState<string | null>(null);
  const [showHangSheet, setShowHangSheet] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [canRestore, setCanRestore] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<ViewportMetrics | null>(null);
  // Width of the preview window's scrollbar, so the minimap can clear it.
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  // Grab-to-pan the wall itself while zoomed in.
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(
    null,
  );
  const [panning, setPanning] = useState(false);
  const draggingMinimap = useRef(false);
  // Pop the settings column out into a floating, draggable panel so the wall
  // gets the full width.
  const [floating, setFloating] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 24, y: 96 });
  const panelDrag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);

  // Only look for a saved wall on the client, after mount, so the server and
  // first client render match. Skipped when a state is injected (tests).
  useEffect(() => {
    if (initialState) return;
    // localStorage is client-only, so this has to run after mount -- reading it
    // during render would make the server and client disagree on the button.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanRestore(window.localStorage.getItem(SAVE_KEY) !== null);
  }, [initialState]);

  const clampZoom = (z: number): number =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

  const syncView = () => {
    const el = viewportRef.current;
    if (!el) return;
    setView({
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      scrollWidth: el.scrollWidth,
      scrollHeight: el.scrollHeight,
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight,
    });
    setScrollbarWidth(el.offsetWidth - el.clientWidth);
  };

  // Drag the wall to pan while zoomed in. Frames capture their own pointer for
  // moving, so a drag that starts on a frame is left alone and never pans.
  const onWallPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el || zoom <= 1) return;
    if ((event.target as Element).closest("[data-frame-id]")) return;
    pan.current = {
      x: event.clientX,
      y: event.clientY,
      left: el.scrollLeft,
      top: el.scrollTop,
    };
    setPanning(true);
    el.setPointerCapture(event.pointerId);
  };

  const onWallPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    const start = pan.current;
    if (!el || !start) return;
    el.scrollLeft = start.left - (event.clientX - start.x);
    el.scrollTop = start.top - (event.clientY - start.y);
  };

  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pan.current) return;
    pan.current = null;
    setPanning(false);
    viewportRef.current?.releasePointerCapture(event.pointerId);
  };

  // Drag inside the minimap to jump the window to that part of the wall.
  const panToMinimap = (clientX: number, clientY: number) => {
    const el = viewportRef.current;
    const svg = minimapRef.current;
    if (!el || !svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const point = {
      x: ((clientX - rect.left) / rect.width) * state.wall.width,
      y: ((clientY - rect.top) / rect.height) * state.wall.height,
    };
    const { scrollLeft, scrollTop } = minimapPointToScroll(
      point,
      {
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
      },
      state.wall,
    );
    el.scrollLeft = scrollLeft;
    el.scrollTop = scrollTop;
  };

  const onMinimapPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    draggingMinimap.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    panToMinimap(event.clientX, event.clientY);
  };

  const onMinimapPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (draggingMinimap.current) panToMinimap(event.clientX, event.clientY);
  };

  const endMinimapDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!draggingMinimap.current) return;
    draggingMinimap.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  // Drag the floating settings panel around by its header.
  const onPanelPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    panelDrag.current = {
      x: event.clientX,
      y: event.clientY,
      left: panelPos.x,
      top: panelPos.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPanelPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = panelDrag.current;
    if (!start) return;
    setPanelPos({
      x: start.left + (event.clientX - start.x),
      y: start.top + (event.clientY - start.y),
    });
  };

  const endPanelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panelDrag.current) return;
    panelDrag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const setZoomTo = (z: number) => {
    setZoom(clampZoom(z));
    setZoomText(null);
  };

  const commitZoom = () => {
    const percent = Number.parseInt(zoomText ?? "", 10);
    if (Number.isFinite(percent)) setZoom(clampZoom(percent / 100));
    setZoomText(null);
  };

  // Keep the minimap's viewport box in sync after a zoom change re-lays the wall.
  useEffect(() => {
    const raf = requestAnimationFrame(syncView);
    return () => cancelAnimationFrame(raf);
  }, [zoom]);

  const validation = computeValidation(state);
  const minimapView = viewportRect(
    view ?? {
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 0,
      scrollHeight: 0,
      clientWidth: 0,
      clientHeight: 0,
    },
    state.wall,
  );
  const unitLabel = unit === "cm" ? "cm" : "in";
  const fmt = (inches: number): string => {
    const v = unit === "cm" ? inches * CM_PER_INCH : inches;
    return `${Math.round(v * 10) / 10} ${unitLabel}`;
  };

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const images = await Promise.all(files.map(readImage));
    if (images.length > 0) dispatch({ type: "add-images", images });
  };

  const setWall = (dimension: "width" | "height", raw: number) => {
    const inches = toInches(raw, unit);
    dispatch({
      type: "set-wall",
      width: dimension === "width" ? inches : state.wall.width,
      height: dimension === "height" ? inches : state.wall.height,
    });
  };

  const save = () => {
    if (!validation.canSave) return;
    window.localStorage.setItem(SAVE_KEY, serializeGallery(state));
    setSavedAt(new Date().toLocaleTimeString());
    setCanRestore(true);
  };

  const restore = () => {
    const raw = window.localStorage.getItem(SAVE_KEY);
    const restored = raw ? deserializeGallery(raw) : null;
    if (restored) dispatch({ type: "replace", state: restored });
  };

  const hangSheet = computeHangSheet(state);

  return (
    <PageShell colorA={ACCENT} colorB="#818cf8">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Gallery Wall" }]}
        showLogout={false}
        maxWidth="max-w-5xl"
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <header className="mb-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            Arranger
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Gallery Wall
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            Upload your photos and the app frames each one. Drag frames anywhere
            on the wall to arrange them, set your wall size, and print the hang
            sheet with the exact measurements before a single nail goes in.
          </p>
        </header>

        <div
          className={`grid gap-8 ${
            floating ? "lg:grid-cols-1" : "lg:grid-cols-[1fr_320px]"
          }`}
        >
          <section aria-label="Wall preview" className="min-w-0">
            <div className="glass-card rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-end gap-1.5">
                <label className="mr-1 flex items-center gap-1 text-[12px] text-muted">
                  <span className="sr-only">Zoom percent</span>
                  <input
                    type="number"
                    min={ZOOM_MIN * 100}
                    max={ZOOM_MAX * 100}
                    step={10}
                    value={zoomText ?? Math.round(zoom * 100)}
                    onChange={(e) => setZoomText(e.target.value)}
                    onBlur={commitZoom}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitZoom();
                      }
                    }}
                    className="w-14 rounded-md border border-border bg-surface px-1.5 py-0.5 text-right tabular-nums text-foreground"
                  />
                  <span aria-hidden>%</span>
                </label>
                <button
                  type="button"
                  aria-label="Zoom out"
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() => setZoomTo(zoom - ZOOM_STEP)}
                  className="h-7 w-7 rounded-md border border-border text-foreground transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden>&minus;</span>
                </button>
                <button
                  type="button"
                  aria-label="Zoom in"
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() => setZoomTo(zoom + ZOOM_STEP)}
                  className="h-7 w-7 rounded-md border border-border text-foreground transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden>+</span>
                </button>
                {/* Always in the DOM so the +/- buttons never shift under the
                    cursor; just hidden and inert until you've zoomed in. */}
                <button
                  type="button"
                  onClick={() => setZoomTo(1)}
                  aria-hidden={zoom === 1}
                  tabIndex={zoom === 1 ? -1 : 0}
                  disabled={zoom === 1}
                  className={`rounded-md border border-border px-2 py-1 text-[12px] text-foreground transition-colors hover:border-foreground/30 ${
                    zoom === 1 ? "invisible" : ""
                  }`}
                >
                  Fit
                </button>
              </div>

              {/* The preview window is a fixed size no matter the wall or zoom.
                  The wall is drawn to fit and centred inside it; zooming scales
                  the content past the window edges and the window scrolls. */}
              <div className="relative">
                <div
                  ref={viewportRef}
                  onScroll={syncView}
                  onPointerDown={onWallPointerDown}
                  onPointerMove={onWallPointerMove}
                  onPointerUp={endPan}
                  onPointerCancel={endPan}
                  className={`h-[clamp(320px,52vh,520px)] overflow-auto rounded-lg border border-border bg-surface/40 ${
                    zoom > 1 ? (panning ? "cursor-grabbing" : "cursor-grab") : ""
                  }`}
                >
                  <div
                    className="h-full w-full"
                    style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
                  >
                    <WallStage
                      wall={state.wall}
                      placements={validation.placements}
                      images={state.images}
                      invalidIds={validation.invalidIds}
                      onMove={(id, position) =>
                        dispatch({
                          type: "move-image",
                          id,
                          x: position.x,
                          y: position.y,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Zoom preview: a minimap showing which part of the wall the
                    window is looking at. Only useful once you're zoomed in. */}
                {zoom > 1 ? (
                  <div
                    role="img"
                    aria-label="Zoom preview minimap"
                    className="absolute w-32 overflow-hidden rounded-md border border-border bg-background/85 p-1 shadow-sm backdrop-blur"
                    style={{ right: 12 + scrollbarWidth, bottom: 12 }}
                  >
                    <svg
                      ref={minimapRef}
                      viewBox={`0 0 ${state.wall.width} ${state.wall.height}`}
                      preserveAspectRatio="xMidYMid meet"
                      onPointerDown={onMinimapPointerDown}
                      onPointerMove={onMinimapPointerMove}
                      onPointerUp={endMinimapDrag}
                      onPointerCancel={endMinimapDrag}
                      className="w-full cursor-pointer touch-none"
                      style={{ aspectRatio: `${state.wall.width} / ${state.wall.height}` }}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={state.wall.width}
                        height={state.wall.height}
                        className="fill-surface stroke-border"
                        strokeWidth={0.4}
                      />
                      {validation.placements.map((p) => (
                        <rect
                          key={p.id}
                          x={p.x}
                          y={p.y}
                          width={p.width}
                          height={p.height}
                          fill={ACCENT}
                          fillOpacity={0.4}
                        />
                      ))}
                      <rect
                        x={minimapView.x}
                        y={minimapView.y}
                        width={minimapView.width}
                        height={minimapView.height}
                        fill="none"
                        stroke={ACCENT}
                        strokeWidth={Math.max(state.wall.width, state.wall.height) * 0.012}
                      />
                    </svg>
                  </div>
                ) : null}

                {/* The warning popup: floats over the preview when saving is blocked. */}
                {validation.overlaps.length > 0 ? (
                  <div
                    role="alert"
                    className="pointer-events-none absolute inset-x-3 bottom-3 flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/15 px-3 py-2 text-[13px] font-medium text-red-700 shadow-sm backdrop-blur dark:text-red-300"
                  >
                    <span aria-hidden className="mt-0.5 font-bold">
                      ⚠
                    </span>
                    <span>
                      Some frames overlap. Move them apart before you can save.
                    </span>
                  </div>
                ) : validation.outOfBounds.length > 0 ? (
                  <div
                    role="alert"
                    className="pointer-events-none absolute inset-x-3 bottom-3 flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-[13px] font-medium text-amber-700 shadow-sm backdrop-blur dark:text-amber-300"
                  >
                    <span aria-hidden className="mt-0.5 font-bold">
                      ⚠
                    </span>
                    <span>
                      Some frames hang off the wall. Move them back on so they fit
                      the wall before saving.
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {state.images.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No photos yet. Add a few to start arranging your wall.
              </p>
            ) : (
              <p className="mt-3 text-[13px] text-muted">
                Drag a frame to move it, or select one and use the arrow keys
                (hold Shift for a bigger step).
              </p>
            )}

            {showHangSheet && hangSheet.length > 0 ? (
              <div className="mt-4 glass-card overflow-x-auto rounded-2xl p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    Hang sheet
                  </h2>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-md border border-border px-3 py-1 text-[13px] font-medium text-foreground transition-colors hover:border-foreground/30"
                  >
                    Print
                  </button>
                </div>
                <table className="w-full text-left text-[13px]">
                  <caption className="sr-only">Hang sheet</caption>
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-muted">
                      <th scope="col" className="py-1 pr-3 font-semibold">
                        Photo
                      </th>
                      <th scope="col" className="py-1 pr-3 font-semibold">
                        Frame
                      </th>
                      <th scope="col" className="py-1 pr-3 font-semibold">
                        Hook from left
                      </th>
                      <th scope="col" className="py-1 font-semibold">
                        Hook from top
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {hangSheet.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="py-1.5 pr-3">{row.label}</td>
                        <td className="py-1.5 pr-3">{row.size}</td>
                        <td className="py-1.5 pr-3 tabular-nums">
                          {fmt(row.hookFromLeft)}
                        </td>
                        <td className="py-1.5 tabular-nums">
                          {fmt(row.hookFromTop)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] text-muted">
                  Measured to each frame&rsquo;s hook (top-centre), from the
                  wall&rsquo;s left and top edges.
                </p>
              </div>
            ) : null}
          </section>

          <aside
            className={
              floating
                ? "fixed z-50 flex max-h-[80vh] w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-background/95 shadow-xl backdrop-blur"
                : "flex flex-col gap-6 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1"
            }
            style={floating ? { left: panelPos.x, top: panelPos.y } : undefined}
          >
            <div
              onPointerDown={floating ? onPanelPointerDown : undefined}
              onPointerMove={floating ? onPanelPointerMove : undefined}
              onPointerUp={floating ? endPanelDrag : undefined}
              onPointerCancel={floating ? endPanelDrag : undefined}
              className={`flex items-center justify-between gap-2 ${
                floating ? "cursor-move touch-none border-b border-border px-3 py-2" : ""
              }`}
            >
              {floating ? (
                <span className="text-[12px] font-semibold text-foreground">
                  Wall settings
                </span>
              ) : (
                <span aria-hidden />
              )}
              <button
                type="button"
                onClick={() => setFloating((f) => !f)}
                aria-pressed={floating}
                className="rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
              >
                {floating ? "Dock panel" : "Float panel"}
              </button>
            </div>
            <div className={floating ? "flex flex-col gap-6 overflow-y-auto p-3" : "contents"}>
            <div className="glass-card rounded-2xl p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Wall &amp; photos
              </h2>

              <label className="block cursor-pointer rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted transition-colors hover:border-foreground/30 hover:text-foreground">
                <span className="font-medium">Add photos</span>
                <span className="mt-0.5 block text-[12px]">
                  JPG or PNG, several at once
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={onFiles}
                />
              </label>

              <fieldset className="mt-4 border-0 p-0">
                <legend className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
                  Wall size
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[13px] text-muted">
                    Wall width ({unitLabel})
                    <input
                      type="number"
                      min={1}
                      value={toDisplay(state.wall.width, unit)}
                      onChange={(e) => setWall("width", Number(e.target.value))}
                      className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
                    />
                  </label>
                  <label className="text-[13px] text-muted">
                    Wall height ({unitLabel})
                    <input
                      type="number"
                      min={1}
                      value={toDisplay(state.wall.height, unit)}
                      onChange={(e) => setWall("height", Number(e.target.value))}
                      className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
                    />
                  </label>
                  <label className="text-[13px] text-muted">
                    Spacing ({unitLabel})
                    <input
                      type="number"
                      min={0}
                      value={toDisplay(state.gap, unit)}
                      onChange={(e) =>
                        dispatch({
                          type: "set-gap",
                          gap: toInches(Number(e.target.value), unit),
                        })
                      }
                      className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
                    />
                  </label>
                  <label className="text-[13px] text-muted">
                    Units
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as Unit)}
                      className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
                    >
                      <option value="in">Inches</option>
                      <option value="cm">Centimetres</option>
                    </select>
                  </label>
                </div>
              </fieldset>

              {state.images.length > 0 ? (
                <div className="mt-4 border-t border-border pt-4">
                  <div
                    role="group"
                    aria-label="Auto layout"
                    className="mb-3"
                  >
                    <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted">
                      Layout
                    </span>
                    <div className="flex gap-1">
                      {(["rows", "masonry"] as LayoutMode[]).map((mode) => {
                        const active = state.layout === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              dispatch({ type: "set-layout", layout: mode })
                            }
                            className={`flex-1 rounded-md border px-2 py-1 text-[12px] capitalize transition-colors ${
                              active
                                ? "border-transparent text-white"
                                : "border-border text-muted hover:text-foreground"
                            }`}
                            style={active ? { backgroundColor: ACCENT } : undefined}
                          >
                            {mode}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "auto-arrange" })}
                      className="rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-foreground/30"
                    >
                      Auto-arrange
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHangSheet((v) => !v)}
                      aria-pressed={showHangSheet}
                      className="rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-foreground/30"
                    >
                      Hang sheet
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={!validation.canSave}
                      className="rounded-md border border-transparent px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ backgroundColor: ACCENT }}
                    >
                      Save
                    </button>
                    {canRestore ? (
                      <button
                        type="button"
                        onClick={restore}
                        className="rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-foreground/30"
                      >
                        Restore
                      </button>
                    ) : null}
                  </div>
                  {savedAt ? (
                    <p role="status" className="mt-2 text-[12px] text-muted">
                      Saved at {savedAt}.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {state.images.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {state.images.map((image, index) => (
                  <li key={image.id}>
                    <fieldset className="glass-card rounded-xl border border-border p-3">
                      <legend className="px-1 text-[12px] font-semibold text-foreground">
                        Photo {index + 1}
                      </legend>
                      <div className="flex gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded blob URL, no known dimensions for next/image */}
                        <img
                          src={image.src}
                          alt={`Frame ${index + 1}`}
                          className="h-14 w-14 shrink-0 rounded-md object-cover"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <label className="text-[12px] text-muted">
                            Frame size
                            <select
                              aria-label={`Frame size for photo ${index + 1}`}
                              value={image.frame.sizeId}
                              onChange={(e) =>
                                dispatch({
                                  type: "set-frame-size",
                                  id: image.id,
                                  sizeId: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1 text-[13px] text-foreground"
                            >
                              {FRAME_SIZES.map((size) => (
                                <option key={size.id} value={size.id}>
                                  {size.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div
                            role="group"
                            aria-label={`Orientation for photo ${index + 1}`}
                            className="flex gap-1"
                          >
                            {(["portrait", "landscape"] as Orientation[]).map(
                              (orientation) => {
                                const active = image.frame.orientation === orientation;
                                return (
                                  <button
                                    key={orientation}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() =>
                                      dispatch({
                                        type: "set-orientation",
                                        id: image.id,
                                        orientation,
                                      })
                                    }
                                    className={`flex-1 rounded-md border px-2 py-1 text-[12px] capitalize transition-colors ${
                                      active
                                        ? "border-transparent text-white"
                                        : "border-border text-muted hover:text-foreground"
                                    }`}
                                    style={active ? { backgroundColor: ACCENT } : undefined}
                                  >
                                    {orientation}
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            dispatch({ type: "remove-image", id: image.id })
                          }
                          className="shrink-0 self-start rounded-md border border-border px-2 py-1 text-[12px] text-muted transition-colors hover:border-red-500/40 hover:text-red-500"
                        >
                          Remove
                          <span className="sr-only"> photo {index + 1}</span>
                        </button>
                      </div>
                    </fieldset>
                  </li>
                ))}
              </ul>
            ) : null}
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
