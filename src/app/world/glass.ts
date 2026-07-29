/**
 * The frosted panel treatment every HUD surface in the world shares — the city
 * shows through, the text stays readable. Kept in one place so the nav, the
 * rail and the phone sheet can't drift apart.
 */
export const GLASS_STYLE = {
  background: "rgba(7, 10, 18, 0.6)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.1)",
} as const;
