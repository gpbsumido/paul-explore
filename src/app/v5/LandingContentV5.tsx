import V5Content, { type V5ContentProps } from "./V5Content";

/**
 * The v5 landing, served identically to everyone. The header CTA resolves the
 * session client-side, so this needs no auth props and / stays static.
 */
export default function LandingContentV5(props: V5ContentProps = {}) {
  return <V5Content {...props} />;
}
