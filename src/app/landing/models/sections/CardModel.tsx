"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";

const CLAMP_MARGIN = 8;

/**
 * Tooltip content component. Rendered inside an always-mounted <Html> so
 * Drei has already positioned the container before this mounts. The
 * useLayoutEffect fires on mount (empty deps), measures the rendered rect,
 * and nudges the transform so the tooltip stays inside the viewport.
 */
function CardTooltip({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translateX(-50%)";
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    if (rect.left < CLAMP_MARGIN) {
      el.style.transform = `translateX(calc(-50% + ${CLAMP_MARGIN - rect.left}px))`;
    } else if (rect.right > vw - CLAMP_MARGIN) {
      el.style.transform = `translateX(calc(-50% - ${rect.right - (vw - CLAMP_MARGIN)}px))`;
    }
  }, []);

  return (
    <div
      ref={ref}
      className="hotspot-tooltip hotspot-tooltip--up"
      style={{ pointerEvents: "none" }}
    >
      <p className="hotspot-tooltip-label">{label}</p>
      <p className="hotspot-tooltip-desc">{description}</p>
    </div>
  );
}

// Fan rotations in radians — positive = counterclockwise = screen-left.
const FAN_ROTATIONS = [0.64, 0.32, 0, -0.32, -0.64] as const;
// Distance from the fan pivot to each card's center.
const FAN_RADIUS = 1.5;
// How far up a hovered card lifts in local +Y.
const LIFT = 0.42;

// Z stacking: center card (i=2) is closest to camera, outer cards furthest.
// Prevents z-fighting where cards overlap near the pivot.
const Z_STACK = [-0.2, -0.1, 0, -0.1, -0.2] as const;
// Stable array references so R3F doesn't re-apply position on every render.
const ROTATION_GROUP_POSITIONS = Z_STACK.map(
  (z) => [0, 0, z] as [number, number, number],
);

type CardDef = {
  color: string;
  label?: string;
  description?: string;
};

const CARDS: CardDef[] = [
  {
    color: "#7c3aed",
    label: "Infinite Scroll",
    description:
      "IntersectionObserver sentinel loads next pages as you scroll — reconnects after each fetch so wide viewports never stall.",
  },
  {
    color: "#1d4ed8",
    label: "URL-Synced State",
    description:
      "Search, type filter, and page number live in the URL — shareable, bookmarkable, and back/forward navigable.",
  },
  {
    color: "#dc2626",
    label: "6000+ Cards",
    description:
      "Full TCGdex database, filterable by set, type, and rarity. Set metadata is fetched server-side for fast initial paint.",
  },
  {
    color: "#b45309",
    label: "Server / Client Split",
    description:
      "Set metadata fetched server-side via TCGdex SDK. Paginated card grids are client components with Suspense boundaries.",
  },
  {
    color: "#4338ca",
    label: "Event Attachments",
    description:
      "Log pulled cards to any calendar event — every Pocket session is tracked with what you got and when.",
  },
];

/**
 * Five playing cards fanned in an arc. Cards with feature labels lift upward
 * on hover and show a tooltip above them — no standard hotspot dots.
 *
 * Z stacking separates overlapping card geometry so the center card renders
 * on top of adjacent cards at their overlap region.
 *
 * stopPropagation on pointer events prevents multiple cards from triggering
 * when the ray hits overlapping geometry.
 */
export default function CardModel() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // Ref keeps useFrame in sync without stale closures.
  const hoveredRef = useRef<number | null>(null);
  const liftRefs = useRef<(Group | null)[]>([]);

  useEffect(() => {
    liftRefs.current.forEach((g) => {
      if (g) g.position.y = FAN_RADIUS;
    });
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  useFrame((_, delta) => {
    liftRefs.current.forEach((group, i) => {
      if (!group) return;
      const target = hoveredRef.current === i ? FAN_RADIUS + LIFT : FAN_RADIUS;
      group.position.y = THREE.MathUtils.lerp(
        group.position.y,
        target,
        Math.min(delta * 12, 1),
      );
    });
  });

  return (
    <group position={[0, -FAN_RADIUS, 0]}>
      {CARDS.map((card, i) => {
        const isHovered = hoveredIndex === i;
        const hasTip = Boolean(card.label);

        return (
          <group
            key={i}
            rotation={[0, 0, FAN_ROTATIONS[i]]}
            position={ROTATION_GROUP_POSITIONS[i]}
          >
            <group
              ref={(el) => {
                liftRefs.current[i] = el;
              }}
            >
              <mesh
                onPointerEnter={(e) => {
                  e.stopPropagation();
                  hoveredRef.current = i;
                  setHoveredIndex(i);
                  document.body.style.cursor = hasTip ? "pointer" : "default";
                }}
                onPointerLeave={(e) => {
                  e.stopPropagation();
                  hoveredRef.current = null;
                  setHoveredIndex(null);
                  document.body.style.cursor = "";
                }}
              >
                <boxGeometry args={[0.68, 0.98, 0.05]} />
                <meshStandardMaterial
                  color={card.color}
                  emissive={card.color}
                  emissiveIntensity={isHovered && hasTip ? 0.45 : 0.12}
                  metalness={0.15}
                  roughness={0.65}
                />
              </mesh>

              {/* Inner border on the card face */}
              <mesh position={[0, 0, 0.027]}>
                <boxGeometry args={[0.57, 0.86, 0.001]} />
                <meshStandardMaterial
                  color="#000000"
                  opacity={0.2}
                  transparent
                />
              </mesh>

              {/* Html is always mounted so Drei positions the container before
                  CardTooltip appears — this ensures getBoundingClientRect()
                  returns the correct screen position for viewport clamping. */}
              <Html
                position={[0, 0.58, 0.03]}
                center
                style={{ pointerEvents: "none" }}
              >
                {isHovered && hasTip && (
                  <CardTooltip
                    label={card.label!}
                    description={card.description!}
                  />
                )}
              </Html>
            </group>
          </group>
        );
      })}
    </group>
  );
}
