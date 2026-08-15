"use client";

import V5Content, { type V5ContentProps } from "./V5Content";

/** Guest v5 landing: the pitch, with a log in call to action in the header. */
export default function LandingContentV5(
  props: Omit<V5ContentProps, "me"> = {},
) {
  return <V5Content {...props} />;
}
