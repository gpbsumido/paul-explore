"use client";

import V5Content, { type MeData } from "./V5Content";

/**
 * Signed-in v5 hub: the same pitch, plus a greeting and the three routes that
 * only mean something with an account.
 */
export default function FeatureHubV5({ initialMe }: { initialMe?: MeData }) {
  return <V5Content me={initialMe ?? { name: null, email: null }} />;
}
