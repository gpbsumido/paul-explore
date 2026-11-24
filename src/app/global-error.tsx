"use client";

import RouteError from "@/components/RouteError";
import "./globals.css";

/**
 * The last boundary, for a failure in the root layout itself. It replaces the
 * layout, so it brings its own document and styles. It renders in the light
 * theme: the theme comes from a script in the layout that isn't here, and this
 * screen is rare enough that copying it isn't worth a second source of truth.
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <RouteError retry={retry} />
      </body>
    </html>
  );
}
