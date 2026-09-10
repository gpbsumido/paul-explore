/**
 * One step of a guided tour.
 *
 * The first step in a tour is always the consent card (centred, no anchor): it
 * asks before anything gets spotlighted. Every step after it is a coach-mark
 * pinned to a real element by its DOM id.
 */
export type TourStep = {
  /** id of the element to spotlight; omit for a centred card (the consent step). */
  anchor?: string;
  title: string;
  body: string;
  /**
   * Run when this step opens — switch a tab, scroll a panel into view, anything
   * the step needs set up before its anchor is measured. Called in the click
   * handler, not an effect, so it stays clear of the set-state-in-effect rule.
   */
  onEnter?: () => void;
};
