/** Shared label class used across the form field primitives. */
export const LABEL_CLASS = "block text-sm font-medium text-foreground mb-1.5";

// `fieldClass` and `buildDescribedBy` used to style/wire the local Input and
// Textarea. Those now delegate to @paul-portfolio/react, which brings its own
// field styling and aria-describedby, so the helpers have no callers left and
// were removed (the dead-exports check enforces that).
