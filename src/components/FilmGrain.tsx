/**
 * A fixed, full-viewport film-grain overlay.
 *
 * Flat, perfectly even surfaces are one of the quiet tells that a page was
 * generated rather than designed. A faint analog grain over everything breaks
 * that sterility and reads as crafted. It is purely decorative, never
 * intercepts pointer events, and is static (no animation) so it costs nothing
 * after the first paint and needs no reduced-motion branch. The texture itself
 * lives in the `.film-grain` rule in globals.css.
 */
export default function FilmGrain() {
  return <div aria-hidden="true" className="film-grain" />;
}
