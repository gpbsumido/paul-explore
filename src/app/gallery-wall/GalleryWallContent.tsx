"use client";

import { useReducer, useState, type ChangeEvent } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import WallStage from "./WallStage";
import { FRAME_SIZES, type Orientation } from "./_lib/frames";
import {
  galleryReducer,
  initialGalleryState,
  computeArrangement,
  type GalleryState,
  type UploadedImage,
} from "./_lib/state";

const ACCENT = "#e879f9";
const CM_PER_INCH = 2.54;
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
 * auto-chosen size and orientation; the frame size and orientation are yours to
 * override per photo. Enter a wall size and the preview shows the arrangement to
 * scale, warning you when the frames won't fit.
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
  const arrangement = computeArrangement(state);

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

  const unitLabel = unit === "cm" ? "cm" : "in";

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
            Upload your photos and the app frames each one, auto-picking a frame
            size and orientation. Change any of them, set your wall size, and see
            the whole wall laid out to scale before a single nail goes in.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section aria-label="Wall preview" className="min-w-0">
            <div className="glass-card rounded-2xl p-4">
              <WallStage
                wall={state.wall}
                placements={arrangement.placements}
                images={state.images}
              />
            </div>
            {state.images.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No photos yet. Add a few to start arranging your wall.
              </p>
            ) : null}
            {arrangement.overflows ? (
              <div
                role="status"
                className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-700 dark:text-amber-400"
              >
                <span aria-hidden className="mt-0.5 font-bold">
                  ⚠
                </span>
                <span>
                  These frames don&rsquo;t fit the wall. Make the wall bigger, the
                  spacing smaller, or use smaller frames.
                </span>
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
                          alt={`Uploaded photo ${index + 1}`}
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
