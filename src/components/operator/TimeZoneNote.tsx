import { zoneLabel } from "@/lib/operator-timezone";

interface TimeZoneNoteProps {
  timeZone: string;
  /** True on fleet-wide views, where the zone is a choice rather than a fact. */
  isViewerZone?: boolean;
}

/**
 * Says which timezone a chart's buckets are measured in.
 *
 * On a store view this is disclosure. On the fleet view it is load-bearing: the
 * fleet spans BC through ON, so a bucket labelled "Tue" cannot be everyone's
 * Tuesday, and the only honest thing to do is name whose it is. Plain text
 * rather than a tooltip, so it reads the same to a screen reader.
 */
export default function TimeZoneNote({
  timeZone,
  isViewerZone = false,
}: TimeZoneNoteProps) {
  return (
    <p className="text-xs text-muted">
      Days start at midnight in{" "}
      <span className="font-medium text-foreground">{zoneLabel(timeZone)}</span>
      {isViewerZone ? " — your local time, not each store's" : null}
    </p>
  );
}
