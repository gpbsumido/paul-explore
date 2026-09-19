"use client";

import { TextLoop } from "@paul-portfolio/react";

/**
 * The "03 / Under the surface" heading. The last word cycles through the things
 * the surface polish is hiding, so the claim keeps restating itself.
 */
export default function DetailsHeading() {
  return (
    <h2>
      Playful on the outside.
      <br />
      Serious about the{" "}
      <TextLoop
        items={[
          "details.",
          "tests.",
          "accessibility.",
          "performance.",
          "edge cases.",
        ]}
      />
    </h2>
  );
}
