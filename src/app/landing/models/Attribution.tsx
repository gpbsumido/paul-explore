type Props = {
  /** Attribution text shown verbatim, e.g. "Basketball by Creator · CC BY". */
  credit: string;
  /** Link to the original asset page. Renders as an anchor when provided. */
  url?: string;
};

/**
 * Tiny CC-BY credit overlay rendered in the bottom-right corner of a model
 * canvas. Lives outside the WebGL canvas so it is accessible to screen
 * readers and selectable as text.
 *
 * Wrap the Canvas + Attribution together in a `relative` positioned div so
 * the absolute positioning resolves correctly.
 */
export default function Attribution({ credit, url }: Props) {
  const shared =
    "text-[9px] leading-none text-white/30 transition-colors select-none";

  return (
    <div
      className="pointer-events-none absolute bottom-1 right-2 z-10"
      aria-label={`3D model credit: ${credit}`}
    >
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${shared} pointer-events-auto hover:text-white/60`}
        >
          {credit}
        </a>
      ) : (
        <span className={shared}>{credit}</span>
      )}
    </div>
  );
}
