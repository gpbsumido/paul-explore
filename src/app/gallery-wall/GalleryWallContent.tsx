"use client";

import { useReducer, useState, useEffect, type ChangeEvent } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import WallStage from "./WallStage";
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
  const [showHangSheet, setShowHangSheet] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [canRestore, setCanRestore] = useState(false);

  // Only look for a saved wall on the client, after mount, so the server and
  // first client render match. Skipped when a state is injected (tests).
  useEffect(() => {
    if (initialState) return;
    // localStorage is client-only, so this has to run after mount -- reading it
    // during render would make the server and client disagree on the button.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanRestore(window.localStorage.getItem(SAVE_KEY) !== null);
  }, [initialState]);

  const validation = computeValidation(state);
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

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section aria-label="Wall preview" className="min-w-0">
            <div className="relative glass-card rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-end gap-1.5">
                <span
                  aria-live="polite"
                  className="mr-1 text-[12px] tabular-nums text-muted"
                >
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  aria-label="Zoom out"
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                  className="h-7 w-7 rounded-md border border-border text-foreground transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden>&minus;</span>
                </button>
                <button
                  type="button"
                  aria-label="Zoom in"
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                  className="h-7 w-7 rounded-md border border-border text-foreground transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden>+</span>
                </button>
                {zoom !== 1 ? (
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="rounded-md border border-border px-2 py-1 text-[12px] text-foreground transition-colors hover:border-foreground/30"
                  >
                    Fit
                  </button>
                ) : null}
              </div>
              {/* Zoom scales the preview wider than its column; the wrapper
                  scrolls so you can pan. Drag math reads the SVG's live size,
                  so moving a frame stays accurate at any zoom. */}
              <div className="max-h-[70vh] overflow-auto rounded-lg">
                <div style={{ width: `${zoom * 100}%` }}>
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
              {/* The warning popup: floats over the preview when saving is blocked. */}
              {validation.overlaps.length > 0 ? (
                <div
                  role="alert"
                  className="pointer-events-none absolute inset-x-4 bottom-4 flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/15 px-3 py-2 text-[13px] font-medium text-red-700 shadow-sm backdrop-blur dark:text-red-300"
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
                  className="pointer-events-none absolute inset-x-4 bottom-4 flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-[13px] font-medium text-amber-700 shadow-sm backdrop-blur dark:text-amber-300"
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

          <aside className="flex flex-col gap-6">
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
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
