"use client";

import V5Content, { type MeData, type V5ContentProps } from "./V5Content";

/**
 * Signed-in v5 hub: the same pitch with the header auth state flipped. The
 * personal routes live in the header menu, not in a bar of their own.
 */
export default function FeatureHubV5({
  initialMe,
  ...rest
}: Omit<V5ContentProps, "me"> & { initialMe?: MeData }) {
  return <V5Content me={initialMe ?? { name: null, email: null }} {...rest} />;
}
