"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import type { RefObject } from "react";
import { FEATURES } from "@/app/_shared/featureData.data";
import { EXHIBITS } from "@/lib/world/exhibits";
import { ROADS, LAKE_EDGE_Z, SPAWN } from "@/lib/world/cityLayout";
import { WORLD_BOUNDS } from "@/lib/world/movement";
import { currentTimeOfDay, type TimeOfDay } from "@/lib/world/daylight";
import { spring, instantTransition } from "@/lib/animations";
import { useWorldKeys } from "./useWorldKeys";
import WorldNav from "./WorldNav";
import WorldHudSheet from "./WorldHudSheet";
import { GLASS_STYLE } from "./glass";
import { OUTFITS, outfitById } from "./outfits";
import { useWorldPresence } from "./presence/useWorldPresence";
import { useWorldAudio } from "./audio/useWorldAudio";
import {
  tourPath,
  MIN_REPLAY_POINTS,
  type GhostPath,
  type GhostPoint,
} from "@/lib/world/ghost";
import { explorerName } from "@/lib/world/presence";
import { defaultFidelity } from "@/lib/world/fidelity";
import { isWembyUnlocked, LOCKED_OUTFIT_ID } from "@/lib/world/unlocks";
import { seasonFor, SEASON_DRESSING, type Season } from "@/lib/world/seasons";
import type { Vec2 } from "@/types/world";
import type { InteractionKind } from "./WorldScene";
import { useWeather, type WeatherCondition } from "@/hooks/useWeather";
import { WEATHER_DRESSING } from "@/lib/world/weather";
import {
  COLLECTIBLES,
  REACHABLE_CELLS,
  CELL_SIZE,
  explorationPercent,
} from "@/lib/world/collectibles";

import type { JoystickState, PlayerSnapshot } from "./refs";

const COLLECTED_KEY = "world-collected";
const VISITED_KEY = "world-visited";
const FIDELITY_KEY = "world-fidelity";
const OUTFIT_KEY = "world-outfit";
const GHOST_KEY = "world-ghost-path";
const GHOST_VISIBLE_KEY = "world-ghost-visible";
const GHOST_SAVE_INTERVAL_MS = 15_000;

const loadStringArray = (key: string): readonly string[] => {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(key) ?? "[]",
    );
    return Array.isArray(parsed) && parsed.every((v) => typeof v === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
};

const loadStoredGhost = (): GhostPath | null => {
  try {
    const raw = window.localStorage.getItem(GHOST_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as {
      outfitId?: unknown;
      name?: unknown;
      points?: unknown;
    };
    if (
      typeof candidate.outfitId !== "string" ||
      !Array.isArray(candidate.points)
    )
      return null;
    if (candidate.points.length < MIN_REPLAY_POINTS) return null;
    const valid = candidate.points.every(
      (p: unknown) =>
        typeof p === "object" &&
        p !== null &&
        typeof (p as GhostPoint).x === "number" &&
        typeof (p as GhostPoint).z === "number" &&
        typeof (p as GhostPoint).t === "number",
    );
    if (!valid) return null;
    const name =
      typeof candidate.name === "string" && candidate.name.length <= 24
        ? candidate.name
        : undefined;
    return {
      outfitId: candidate.outfitId,
      name,
      points: candidate.points as GhostPoint[],
    };
  } catch {
    return null;
  }
};
// If the guided walk somehow never arrives, just open the feature.
const AUTO_RUN_TIMEOUT_MS = 45_000;

const fidelityLabel = (value: number) => {
  if (value < 0.25) return "Low poly";
  if (value < 0.5) return "Balanced";
  if (value < 0.75) return "High";
  return "Very high";
};

const WorldCanvas = dynamic(() => import("./WorldCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
          Building Toronto…
        </span>
      </div>
    </div>
  ),
});

function Key({ children }: { readonly children: string }) {
  return (
    <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// Minimap — drawn straight in world coordinates via the SVG viewBox, with the
// player arrow updated imperatively from the render loop's shared ref.
// ---------------------------------------------------------------------------

function Minimap({
  playerRef,
  visited,
}: {
  readonly playerRef: RefObject<PlayerSnapshot>;
  readonly visited: readonly string[];
}) {
  const arrowRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const player = playerRef.current;
      const arrow = arrowRef.current;
      if (player && arrow) {
        const degrees = 180 - (player.heading * 180) / Math.PI;
        arrow.setAttribute(
          "transform",
          `translate(${player.x} ${player.z}) rotate(${degrees})`,
        );
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playerRef]);

  return (
    <div className="rounded-2xl p-2.5" style={GLASS_STYLE}>
      <p className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
        Downtown Toronto
      </p>
      <svg
        viewBox={`${WORLD_BOUNDS.minX} ${WORLD_BOUNDS.minZ} 156 144`}
        className="block h-[104px] w-full overflow-hidden rounded-lg bg-black/40"
        aria-label="Minimap of the city with exhibit locations"
        role="img"
      >
        <rect
          x={-78}
          y={LAKE_EDGE_Z}
          width={156}
          height={66 - LAKE_EDGE_Z}
          fill="#12263f"
        />
        {ROADS.map((road) => (
          <line
            key={road.name}
            x1={road.orientation === "ns" ? road.at : road.from}
            y1={road.orientation === "ns" ? road.from : road.at}
            x2={road.orientation === "ns" ? road.at : road.to}
            y2={road.orientation === "ns" ? road.to : road.at}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={road.width / 2}
          >
            <title>{road.name}</title>
          </line>
        ))}
        {EXHIBITS.map((exhibit) => {
          const feature = FEATURES.find((f) => f.id === exhibit.featureId);
          const color = feature?.color ?? "#ffffff";
          const title = `${feature?.title ?? exhibit.featureId} — ${exhibit.landmark}`;
          if (exhibit.featured) {
            // the main exhibition reads as a sparkle, not a dot
            return (
              <polygon
                key={exhibit.featureId}
                points="0,-5 1.3,-1.3 5,0 1.3,1.3 0,5 -1.3,1.3 -5,0 -1.3,-1.3"
                transform={`translate(${exhibit.position.x} ${exhibit.position.z})`}
                fill={color}
                stroke="#070a12"
                strokeWidth={0.6}
              >
                <title>{title}</title>
              </polygon>
            );
          }
          return (
            <circle
              key={exhibit.featureId}
              cx={exhibit.position.x}
              cy={exhibit.position.z}
              r={2.6}
              fill={color}
            >
              <title>{title}</title>
            </circle>
          );
        })}
        {/* fog of war — unexplored blocks stay dim until walked */}
        {[...REACHABLE_CELLS]
          .filter((cell) => !visited.includes(cell))
          .map((cell) => {
            const [cx, cz] = cell.split(",").map(Number);
            return (
              <rect
                key={cell}
                x={WORLD_BOUNDS.minX + cx * CELL_SIZE}
                y={WORLD_BOUNDS.minZ + cz * CELL_SIZE}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill="#070a12"
                opacity={0.55}
              />
            );
          })}
        <g ref={arrowRef} transform={`translate(${SPAWN.x} ${SPAWN.z})`}>
          <polygon
            points="0,-4.6 3.4,3.8 0,1.9 -3.4,3.8"
            fill="#ffffff"
            stroke="#070a12"
            strokeWidth={0.8}
          />
        </g>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Touch joystick, shown only on coarse pointers.
// ---------------------------------------------------------------------------

function Joystick({
  joystickRef,
}: {
  readonly joystickRef: RefObject<JoystickState>;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const apply = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current;
      const knob = knobRef.current;
      if (!base || !knob) return;
      const rect = base.getBoundingClientRect();
      const max = rect.width / 2 - 16;
      const rawX = clientX - (rect.left + rect.width / 2);
      const rawY = clientY - (rect.top + rect.height / 2);
      const length = Math.hypot(rawX, rawY);
      const scale = length > max ? max / length : 1;
      const dx = rawX * scale;
      const dy = rawY * scale;
      if (joystickRef.current) {
        joystickRef.current.x = dx / max;
        joystickRef.current.z = dy / max;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    },
    [joystickRef],
  );

  const release = useCallback(() => {
    if (joystickRef.current) {
      joystickRef.current.x = 0;
      joystickRef.current.z = 0;
    }
    if (knobRef.current)
      knobRef.current.style.transform = "translate(0px, 0px)";
  }, [joystickRef]);

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Movement joystick"
      className="pointer-events-auto relative flex h-28 w-28 touch-none items-center justify-center rounded-full"
      style={GLASS_STYLE}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        apply(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          apply(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        ref={knobRef}
        className="h-12 w-12 rounded-full border border-white/25 bg-white/20 transition-transform duration-75"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorldContent() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  // The city dresses for the visitor's local clock; ?t=day|dusk|night forces
  // a look, and anything unknowable falls back to night. Browser-only sources
  // (clock, URL, localStorage) are read after mount — reading them during
  // hydration leaves the server-rendered HUD out of sync with the state.
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("night");
  const [season, setSeason] = useState<Season>("summer");
  // Real weather where the visitor is, unless ?w= forces a condition.
  const live = useWeather();
  const [forcedWeather, setForcedWeather] = useState<WeatherCondition | null>(
    null,
  );
  const condition: WeatherCondition = forcedWeather ?? live.condition;
  const [fidelity, setFidelity] = useState(0.6);
  const [outfitId, setOutfitId] = useState(OUTFITS[0].id);
  const [ghostPath, setGhostPath] = useState<GhostPath | null>(null);
  const [ghostVisible, setGhostVisible] = useState(true);
  const [collected, setCollected] = useState<readonly string[]>([]);
  const [visited, setVisited] = useState<readonly string[]>([]);
  const [lastFind, setLastFind] = useState<{
    id: string;
    count: number;
  } | null>(null);
  const [unlockToast, setUnlockToast] = useState(false);
  const wembyUnlocked = isWembyUnlocked(collected);
  const collectedRef = useRef<readonly string[]>([]);
  const visitedRef = useRef<readonly string[]>([]);
  const findToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef<readonly GhostPoint[]>([]);
  const outfitIdRef = useRef(outfitId);
  useEffect(() => {
    outfitIdRef.current = outfitId;
  }, [outfitId]);

  // Persist this visit's stroll so the NEXT visit gets haunted by it. Saved on
  // an interval, when the tab hides, and on unmount; too-short walks are
  // ignored and the timestamps are rebased to zero.
  useEffect(() => {
    // The stroll keeps one curated identity for the whole session, so the
    // ghost it becomes replays under a stable name.
    const strollName = explorerName(Math.random());
    const save = () => {
      const points = recordingRef.current;
      if (points.length < MIN_REPLAY_POINTS) return;
      const start = points[0].t;
      const rebased = points.map((p) => ({ x: p.x, z: p.z, t: p.t - start }));
      try {
        window.localStorage.setItem(
          GHOST_KEY,
          JSON.stringify({
            outfitId: outfitIdRef.current,
            name: strollName,
            points: rebased,
          }),
        );
      } catch {
        // Storage full or blocked — the ghost just doesn't get updated.
      }
    };
    const interval = setInterval(save, GHOST_SAVE_INTERVAL_MS);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, []);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("t");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser-only sources (clock, URL, localStorage) after hydration; initializing state from them directly desyncs the server-rendered HUD
    setTimeOfDay(
      forced === "day" || forced === "dusk" || forced === "night"
        ? forced
        : currentTimeOfDay(),
    );
    const forcedW = new URLSearchParams(window.location.search).get("w");
    if (
      forcedW === "clear" ||
      forcedW === "partly-cloudy" ||
      forcedW === "fog" ||
      forcedW === "rain" ||
      forcedW === "snow" ||
      forcedW === "storm"
    ) {
      setForcedWeather(forcedW);
    }
    const forcedSeason = new URLSearchParams(window.location.search).get(
      "season",
    );
    setSeason(
      forcedSeason === "winter" ||
        forcedSeason === "spring" ||
        forcedSeason === "summer" ||
        forcedSeason === "fall"
        ? forcedSeason
        : seasonFor(),
    );
    const raw = window.localStorage.getItem(FIDELITY_KEY);
    const parsed = raw === null ? Number.NaN : Number(raw);
    if (Number.isFinite(parsed)) {
      setFidelity(Math.min(Math.max(parsed, 0), 1));
    } else {
      // First visit: size the default to the hardware instead of guessing.
      setFidelity(
        defaultFidelity({
          cores: navigator.hardwareConcurrency,
          // Chromium-only hint; absent elsewhere.
          memory:
            "deviceMemory" in navigator
              ? (navigator as { deviceMemory?: number }).deviceMemory
              : undefined,
          coarsePointer: window.matchMedia("(pointer: coarse)").matches,
        }),
      );
    }
    setOutfitId(outfitById(window.localStorage.getItem(OUTFIT_KEY)).id);
    // A previous stroll haunts the city; first-timers get the guided tour.
    // Either way the ghost carries a curated name — the recording's own, or a
    // fresh random pick for the tour and for older nameless recordings.
    const base = loadStoredGhost() ?? tourPath();
    setGhostPath(
      base.name ? base : { ...base, name: explorerName(Math.random()) },
    );
    setGhostVisible(window.localStorage.getItem(GHOST_VISIBLE_KEY) !== "off");
    const storedCollected = loadStringArray(COLLECTED_KEY);
    const storedVisited = loadStringArray(VISITED_KEY);
    collectedRef.current = storedCollected;
    visitedRef.current = storedVisited;
    setCollected(storedCollected);
    setVisited(storedVisited);
  }, []);

  const handleCollect = useCallback((id: string) => {
    const current = collectedRef.current;
    if (current.includes(id)) return;
    const next = [...current, id];
    collectedRef.current = next;
    setCollected(next);
    // The token that completes the ground set is the one that earns the suit.
    if (!isWembyUnlocked(current) && isWembyUnlocked(next))
      setUnlockToast(true);
    setLastFind({ id, count: next.length });
    if (findToastTimer.current) clearTimeout(findToastTimer.current);
    findToastTimer.current = setTimeout(() => setLastFind(null), 3000);
    try {
      window.localStorage.setItem(COLLECTED_KEY, JSON.stringify(next));
    } catch {
      // Storage full or blocked — progress just isn't remembered.
    }
  }, []);
  useEffect(
    () => () => {
      if (findToastTimer.current) clearTimeout(findToastTimer.current);
    },
    [],
  );

  const handleExplore = useCallback((explored: readonly string[]) => {
    setVisited(explored);
    try {
      window.localStorage.setItem(VISITED_KEY, JSON.stringify(explored));
    } catch {
      // Same deal as above.
    }
  }, []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [runningTo, setRunningTo] = useState<string | null>(null);
  const [arrivedAt, setArrivedAt] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const activeIdRef = useRef<string | null>(null);
  const playerRef = useRef<PlayerSnapshot>({
    x: SPAWN.x,
    z: SPAWN.z,
    heading: Math.PI,
  });
  const joystickRef = useRef<JoystickState>({ x: 0, z: 0 });
  const autoTargetRef = useRef<string | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teleportRef = useRef<Vec2 | null>(null);
  const [prompt, setPrompt] = useState<{ label: string; key: string } | null>(
    null,
  );
  const [riding, setRiding] = useState(false);
  const [lookout, setLookout] = useState(false);

  const handleInteractionChange = useCallback(
    (_kind: InteractionKind, label: string | null, key = "E") => {
      setPrompt(label === null ? null : { label, key });
    },
    [],
  );

  const handleActiveExhibit = useCallback((featureId: string | null) => {
    activeIdRef.current = featureId;
    setActiveId(featureId);
  }, []);

  // E is context-sensitive now — the scene knows where the player is standing,
  // so it decides between visiting, boarding, hopping off, and the elevator.
  const interactRef = useRef(false);
  const requestInteract = useCallback(() => {
    interactRef.current = true;
  }, []);
  const [photoMode, setPhotoMode] = useState(false);
  const togglePhotoMode = useCallback(() => setPhotoMode((on) => !on), []);
  const keysRef = useWorldKeys(requestInteract, togglePhotoMode);

  // Photo mode hands back a data URL; turn it into a download.
  const captureRef = useRef(false);
  const handleCapture = useCallback((dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "explore-toronto.png";
    link.click();
  }, []);

  const visitFeature = useCallback(
    (featureId: string) => {
      const feature = FEATURES.find((f) => f.id === featureId);
      if (feature) router.push(feature.href);
    },
    [router],
  );

  // Live presence: Ably when a key is configured, this browser's other tabs
  // otherwise, nothing when the world-live-presence flag is off.
  const { peersRef, peers } = useWorldPresence({
    enabled: true,
    playerRef,
    outfitId,
  });

  // The city only makes noise once the visitor has touched something.
  const { audioRef, muted, toggleMuted } = useWorldAudio(!prefersReduced);

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    autoTimerRef.current = null;
  }, []);
  useEffect(() => clearAutoTimer, [clearAutoTimer]);

  // From the exhibit list: sprint the explorer across the city to the booth,
  // then open the feature. Reduced motion (or a stuck run) goes straight there.
  const startRunTo = useCallback(
    (featureId: string) => {
      const feature = FEATURES.find((f) => f.id === featureId);
      if (!feature) return;
      if (prefersReduced) {
        router.push(feature.href);
        return;
      }
      autoTargetRef.current = featureId;
      setRunningTo(featureId);
      clearAutoTimer();
      autoTimerRef.current = setTimeout(() => {
        autoTargetRef.current = null;
        setRunningTo(null);
        setArrivedAt(featureId);
      }, AUTO_RUN_TIMEOUT_MS);
    },
    [prefersReduced, router, clearAutoTimer],
  );

  const handleAutoRunEnd = useCallback(
    (featureId: string, arrived: boolean) => {
      clearAutoTimer();
      setRunningTo(null);
      // Arriving is not the same as agreeing to leave — ask first.
      if (arrived) setArrivedAt(featureId);
    },
    [clearAutoTimer],
  );

  const activeExhibit = activeId
    ? EXHIBITS.find((e) => e.featureId === activeId)
    : null;
  const activeFeature = activeId
    ? FEATURES.find((f) => f.id === activeId)
    : null;

  return (
    <main
      className="relative overflow-hidden bg-black"
      style={{ height: "100dvh" }}
    >
      <h1 className="sr-only">
        Explore Toronto — a 3D world of this site&apos;s features
      </h1>

      {/* Photo mode takes over the screen: no HUD, just the shutter. */}
      {photoMode && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div
            className="pointer-events-auto absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-2.5"
            style={GLASS_STYLE}
          >
            <span className="hidden items-center gap-1.5 text-[11px] text-white/55 pointer-fine:flex">
              <Key>A</Key>
              <Key>D</Key> orbit
              <span className="text-white/20">·</span>
              <Key>W</Key>
              <Key>S</Key> zoom
              <span className="text-white/20">·</span>
              <Key>Space</Key>
              <Key>Shift</Key> height
            </span>
            <button
              type="button"
              onClick={() => {
                captureRef.current = true;
              }}
              className="rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-opacity hover:opacity-85"
            >
              📷 Save photo
            </button>
            <button
              type="button"
              onClick={togglePhotoMode}
              className="text-[11px] text-white/55 hover:text-white/85"
            >
              exit (P)
            </button>
          </div>
        </div>
      )}

      <WorldCanvas
        keysRef={keysRef}
        joystickRef={joystickRef}
        playerRef={playerRef}
        prefersReduced={!!prefersReduced}
        onActiveExhibit={handleActiveExhibit}
        timeOfDay={timeOfDay}
        fidelity={fidelity}
        outfit={outfitById(outfitId)}
        autoTargetRef={autoTargetRef}
        onAutoRunEnd={handleAutoRunEnd}
        recordingRef={recordingRef}
        ghostPath={ghostVisible ? ghostPath : null}
        peers={peers}
        peersRef={peersRef}
        collected={collected}
        collectedRef={collectedRef}
        onCollect={handleCollect}
        visitedRef={visitedRef}
        onExplore={handleExplore}
        season={season}
        interactRef={interactRef}
        onVisitExhibit={visitFeature}
        onInteractionChange={handleInteractionChange}
        onRideChange={setRiding}
        onLookoutChange={setLookout}
        teleportRef={teleportRef}
        photoMode={photoMode}
        captureRef={captureRef}
        onCapture={handleCapture}
        condition={condition}
        audioRef={audioRef}
      />

      {/* Controls legend — pointless on touch, and too wide for a phone-sized
          window, so it waits for a real keyboard on a real screen. */}
      <div
        className="absolute left-4 top-4 hidden flex-col gap-2 md:pointer-fine:flex"
        hidden={photoMode}
      >
        <div
          className="flex items-center gap-2 rounded-2xl px-3 py-2"
          style={GLASS_STYLE}
        >
          <Key>W</Key>
          <Key>A</Key>
          <Key>S</Key>
          <Key>D</Key>
          <span className="text-[11px] text-white/60">walk</span>
          <span className="text-white/20">·</span>
          <Key>Shift</Key>
          <span className="text-[11px] text-white/60">run</span>
          <span className="text-white/20">·</span>
          <Key>Space</Key>
          <span className="text-[11px] text-white/60">jump</span>
          <span className="text-white/20">·</span>
          <Key>E</Key>
          <span className="text-[11px] text-white/60">visit</span>
        </div>
        <p
          className="rounded-xl px-2.5 py-1.5 text-[11px] text-white/55"
          style={GLASS_STYLE}
        >
          Walk up to a glowing ring to see what&apos;s exhibited there.
        </p>
      </div>

      {/* Right rail: one column of equal-width panels. Opening the exhibit
          list takes the space the outfit and fidelity panels were using, so
          the rail itself never needs a scrollbar. On a phone the whole rail
          moves inside the sheet, where it just stacks and scrolls. */}
      <WorldHudSheet
        hidden={photoMode}
        menu={!photoMode && <WorldNav />}
        summary={`🪙 ${collected.length}/${COLLECTIBLES.length} · ${explorationPercent(visited)}%`}
      >
        <div
          className={`pointer-events-none absolute bottom-6 right-4 top-4 grid w-44 gap-2 max-md:static max-md:flex max-md:w-full max-md:flex-col max-md:pointer-events-auto ${
            // Collapsed, the list hugs its summary bar; expanded, it takes the
            // leftover space. Either way the controls stay pinned to the bottom.
            listOpen
              ? "grid-rows-[auto_minmax(0,1fr)_auto]"
              : "grid-rows-[auto_auto_1fr]"
          }`}
          hidden={photoMode}
        >
          {/* top group */}
          <div className="flex flex-col gap-2">
            <div className="pointer-events-auto shrink-0">
              <Minimap playerRef={playerRef} visited={visited} />
            </div>
            <p
              className="pointer-events-auto shrink-0 rounded-2xl px-3 py-1.5 text-[11px] text-white/70"
              style={GLASS_STYLE}
            >
              🪙 {collected.length}/{COLLECTIBLES.length}
              <span className="mx-1 text-white/25">·</span>
              {explorationPercent(visited)}%
              <span className="mx-1 text-white/25">·</span>
              <span
                className="text-white/55"
                title={`${SEASON_DRESSING[season].label} · ${WEATHER_DRESSING[condition].label}`}
              >
                {WEATHER_DRESSING[condition].label}
                {live.temperature !== null && !forcedWeather
                  ? ` ${live.temperature}°`
                  : ""}
              </span>
            </p>
            {peers.length > 0 && (
              <p
                className="pointer-events-auto shrink-0 rounded-2xl px-3 py-1.5 text-[11px] text-white/75"
                style={GLASS_STYLE}
                role="status"
              >
                🧑‍🤝‍🧑 {peers.length} other explorer{peers.length === 1 ? "" : "s"}{" "}
                here
              </p>
            )}
          </div>

          {/* the list gets exactly the room the other two groups leave */}
          <details
            className="pointer-events-auto flex min-h-0 flex-col overflow-hidden rounded-2xl"
            style={GLASS_STYLE}
            onToggle={(e) => setListOpen(e.currentTarget.open)}
          >
            <summary className="shrink-0 cursor-pointer select-none px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/60 hover:text-white/90">
              All exhibits
            </summary>
            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2 max-md:max-h-[40vh]">
              {[...EXHIBITS]
                .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
                .map((exhibit) => {
                  const feature = FEATURES.find(
                    (f) => f.id === exhibit.featureId,
                  );
                  if (!feature) return null;
                  return (
                    <li key={exhibit.featureId}>
                      <button
                        type="button"
                        onClick={() => startRunTo(exhibit.featureId)}
                        title={`Speed-run to ${exhibit.landmark}, then open ${feature.title}`}
                        className="flex w-full items-start gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-white/5"
                      >
                        <span
                          aria-hidden
                          className="mt-1 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: feature.color }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-semibold leading-tight text-white/85">
                            {feature.title}
                            {exhibit.featured && (
                              <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-secondary-300">
                                ★ main
                              </span>
                            )}
                          </span>
                          <span className="block text-[10px] leading-tight text-white/45">
                            {exhibit.landmark}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className="mt-0.5 text-[10px] text-white/35"
                        >
                          ⏩
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </details>
          {/* bottom group */}
          <div className="flex flex-col justify-end gap-2 self-end max-md:self-stretch">
            {/* outfit picker */}
            <div
              className="pointer-events-auto rounded-2xl p-3"
              style={GLASS_STYLE}
            >
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/55">
                Outfit
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {OUTFITS.map((option) => {
                  const locked = !!option.locked && !wembyUnlocked;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={locked}
                      title={
                        locked
                          ? "Locked — find every token you can reach on foot"
                          : option.label
                      }
                      onClick={() => {
                        if (locked) return;
                        setOutfitId(option.id);
                        window.localStorage.setItem(OUTFIT_KEY, option.id);
                      }}
                      aria-pressed={outfitId === option.id}
                      className={`paul-touch-target flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-colors ${
                        locked
                          ? "cursor-not-allowed text-white/30"
                          : outfitId === option.id
                            ? "bg-white/15 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white/85"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/25"
                        style={{
                          backgroundColor: locked
                            ? "transparent"
                            : option.accent,
                        }}
                      />
                      {locked ? "🔒 ???" : option.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                aria-pressed={ghostVisible}
                onClick={() => {
                  const next = !ghostVisible;
                  setGhostVisible(next);
                  window.localStorage.setItem(
                    GHOST_VISIBLE_KEY,
                    next ? "on" : "off",
                  );
                }}
                className="paul-touch-min mt-2 flex w-full items-center justify-between rounded-lg border-t border-white/10 px-2 pb-0.5 pt-2 text-[11px] text-white/60 hover:text-white/85"
              >
                <span>👻 Ghost stroll</span>
                <span
                  className={ghostVisible ? "text-white/85" : "text-white/35"}
                >
                  {ghostVisible ? "on" : "off"}
                </span>
              </button>
              <button
                type="button"
                aria-pressed={!muted}
                onClick={toggleMuted}
                className="paul-touch-min flex w-full items-center justify-between rounded-lg px-2 pb-0.5 pt-1.5 text-[11px] text-white/60 hover:text-white/85"
              >
                <span>{muted ? "🔇" : "🔊"} Sound</span>
                <span className={muted ? "text-white/35" : "text-white/85"}>
                  {muted ? "off" : "on"}
                </span>
              </button>
            </div>
            {/* Fidelity: one line plus the slider — the value label on the right
            already says which end you're at. */}
            <div
              className="pointer-events-auto shrink-0 rounded-2xl px-3 py-2"
              style={GLASS_STYLE}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/55">
                  Fidelity
                </span>
                <span className="text-[10px] text-white/45">
                  {fidelityLabel(fidelity)}
                </span>
              </div>
              <input
                type="range"
                aria-label="World fidelity, low poly to very high poly"
                min={0}
                max={1}
                step={0.05}
                value={fidelity}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setFidelity(value);
                  window.localStorage.setItem(FIDELITY_KEY, String(value));
                }}
                className="paul-touch-target h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
              />
            </div>
          </div>
        </div>
      </WorldHudSheet>

      {/* Touch controls. On a phone they span the bottom — thumb on the stick,
          buttons under the other hand — so the middle stays clear for the
          placard. Wider touch screens keep the old huddle in the corner. */}
      <div
        className="pointer-events-none absolute bottom-20 left-5 hidden items-end gap-3 pointer-coarse:flex max-md:bottom-6 max-md:right-5 max-md:justify-between"
        hidden={photoMode}
      >
        <Joystick joystickRef={joystickRef} />
        <div className="flex items-end gap-3">
          {/* Touch has no E key, so the one thing E does gets a button. */}
          <button
            type="button"
            aria-label="Interact"
            className="pointer-events-auto flex h-14 w-14 touch-none items-center justify-center rounded-full text-[13px] font-bold uppercase tracking-wider text-white/80"
            style={GLASS_STYLE}
            onPointerDown={requestInteract}
          >
            E
          </button>
          <button
            type="button"
            aria-label="Jump"
            className="pointer-events-auto flex h-14 w-14 touch-none items-center justify-center rounded-full text-[11px] font-bold uppercase tracking-wider text-white/80"
            style={GLASS_STYLE}
            onPointerDown={() => keysRef.current?.add("Space")}
            onPointerUp={() => keysRef.current?.delete("Space")}
            onPointerCancel={() => keysRef.current?.delete("Space")}
          >
            Jump
          </button>
        </div>
      </div>

      {/* observation deck: the city from the pod, one click from anywhere */}
      <AnimatePresence>
        {lookout && (
          <m.div
            key="lookout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={
              prefersReduced ? instantTransition : { ...spring.smooth }
            }
            className="absolute bottom-6 left-1/2 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-2xl p-4 max-md:max-h-[55dvh] max-md:pointer-coarse:bottom-36 md:w-[min(520px,calc(100vw-25rem))]"
            style={GLASS_STYLE}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              CN Tower · Observation deck
            </p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-white/90">
              Pick a landmark and I&apos;ll take you there
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {EXHIBITS.map((exhibit) => {
                const feature = FEATURES.find(
                  (f) => f.id === exhibit.featureId,
                );
                if (!feature) return null;
                return (
                  <button
                    key={exhibit.featureId}
                    type="button"
                    onClick={() => {
                      teleportRef.current = {
                        x: exhibit.position.x,
                        z: exhibit.position.z + 3,
                      };
                    }}
                    className="paul-touch-target flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: feature.color }}
                    />
                    <span className="truncate">{exhibit.landmark}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/45">
              <Key>E</Key> to take the elevator down
            </p>
          </m.div>
        )}
      </AnimatePresence>

      {/* context prompt: what E does from here */}
      <AnimatePresence>
        {prompt && !lookout && (
          <m.div
            key={prompt.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={
              prefersReduced ? instantTransition : { ...spring.snappy }
            }
            className="absolute bottom-32 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl px-3 py-1.5 text-[12px] text-white/80 max-md:pointer-coarse:bottom-24 max-md:pointer-coarse:left-auto max-md:pointer-coarse:right-5 max-md:pointer-coarse:translate-x-0"
            style={GLASS_STYLE}
          >
            <Key>{prompt.key}</Key> {prompt.label}
          </m.div>
        )}
      </AnimatePresence>

      {/* riding the 501 */}
      {riding && (
        <p
          className="absolute left-1/2 top-4 -translate-x-1/2 rounded-2xl px-4 py-2 text-[12px] text-white/85 max-md:top-16"
          style={GLASS_STYLE}
          role="status"
        >
          🚋 Riding the 501 Queen
        </p>
      )}

      {/* arrived on foot — going in is still the visitor's call */}
      <AnimatePresence>
        {arrivedAt &&
          !lookout &&
          !photoMode &&
          (() => {
            const feature = FEATURES.find((f) => f.id === arrivedAt);
            const exhibit = EXHIBITS.find((e) => e.featureId === arrivedAt);
            if (!feature || !exhibit) return null;
            return (
              <m.div
                key={`arrived-${arrivedAt}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={
                  prefersReduced ? instantTransition : { ...spring.smooth }
                }
                className="absolute bottom-6 left-1/2 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-2xl p-4 max-md:max-h-[55dvh] max-md:pointer-coarse:bottom-36 md:w-[min(420px,calc(100vw-25rem))]"
                style={{
                  ...GLASS_STYLE,
                  borderColor: `color-mix(in srgb, ${feature.color} 40%, rgba(255,255,255,0.1))`,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Arrived · {exhibit.landmark}
                </p>
                <h2
                  className="mt-0.5 text-[16px] font-semibold"
                  style={{ color: feature.color }}
                >
                  Go inside {feature.title}?
                </h2>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setArrivedAt(null)}
                    className="text-[12px] text-white/55 hover:text-white/85"
                  >
                    Stay in the city
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArrivedAt(null);
                      router.push(feature.href);
                    }}
                    className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-85"
                    style={{ backgroundColor: feature.color }}
                  >
                    Open {feature.title} →
                  </button>
                </div>
              </m.div>
            );
          })()}
      </AnimatePresence>

      {/* the mystery costume, earned */}
      <AnimatePresence>
        {unlockToast && (
          <m.div
            key="unlock"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={
              prefersReduced ? instantTransition : { ...spring.bounce }
            }
            className="absolute left-1/2 top-1/3 w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl p-4 text-center"
            style={{
              ...GLASS_STYLE,
              borderColor: "rgba(196, 206, 212, 0.5)",
            }}
            role="status"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Costume unlocked
            </p>
            <h2 className="mt-1 text-[17px] font-semibold text-white/90">
              Every token you could reach on foot — nice
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/70">
              The mystery suit turns out to be very, very tall. Put it on and
              those last three tokens are just… there.
            </p>
            <button
              type="button"
              onClick={() => {
                setOutfitId(LOCKED_OUTFIT_ID);
                window.localStorage.setItem(OUTFIT_KEY, LOCKED_OUTFIT_ID);
                setUnlockToast(false);
              }}
              className="mt-3 rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-85"
            >
              Wear it →
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* token pickup toast */}
      <AnimatePresence>
        {lastFind && (
          <m.div
            key={`find-${lastFind.id}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={
              prefersReduced ? instantTransition : { ...spring.snappy }
            }
            className="absolute left-1/2 top-16 -translate-x-1/2 rounded-2xl px-4 py-2 text-[12px] text-white/85 max-md:top-28"
            style={GLASS_STYLE}
            role="status"
          >
            {lastFind.count === COLLECTIBLES.length
              ? "🎉 All 25 tokens found — you own this city!"
              : `🪙 Token found — ${lastFind.count}/${COLLECTIBLES.length}`}
          </m.div>
        )}
      </AnimatePresence>

      {/* speedrun banner */}
      <AnimatePresence>
        {runningTo && (
          <m.div
            key="runbanner"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={
              prefersReduced ? instantTransition : { ...spring.snappy }
            }
            className="absolute left-1/2 top-4 -translate-x-1/2 rounded-2xl px-4 py-2 text-[12px] text-white/85 max-md:top-16"
            style={GLASS_STYLE}
          >
            ⏩ Running to{" "}
            <span className="font-semibold">
              {FEATURES.find((f) => f.id === runningTo)?.title}
            </span>{" "}
            — move to cancel
          </m.div>
        )}
      </AnimatePresence>

      {/* exhibit placard */}
      <AnimatePresence>
        {activeExhibit &&
          activeFeature &&
          !lookout &&
          !riding &&
          !arrivedAt && (
            <m.div
              key={activeFeature.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={
                prefersReduced ? instantTransition : { ...spring.smooth }
              }
              className="absolute bottom-6 left-1/2 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-2xl p-4 max-md:max-h-[55dvh] max-md:pointer-coarse:bottom-36 md:w-[min(420px,calc(100vw-25rem))]"
              style={{
                ...GLASS_STYLE,
                borderColor: `color-mix(in srgb, ${activeFeature.color} 40%, rgba(255,255,255,0.1))`,
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                {activeExhibit.featured ? (
                  <>
                    <span className="text-secondary-300">★ Main exhibition</span> ·{" "}
                    {activeExhibit.landmark}
                  </>
                ) : (
                  activeExhibit.landmark
                )}
              </p>
              <h2
                className="mt-0.5 text-[17px] font-semibold"
                style={{ color: activeFeature.color }}
              >
                {activeFeature.title}
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/70">
                {activeExhibit.blurb}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="hidden items-center gap-1.5 text-[11px] text-white/50 pointer-fine:flex">
                  <Key>E</Key> to visit
                </span>
                <Link
                  href={activeFeature.href}
                  className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-85"
                  style={{ backgroundColor: activeFeature.color }}
                >
                  Open {activeFeature.title} →
                </Link>
              </div>
            </m.div>
          )}
      </AnimatePresence>
    </main>
  );
}
