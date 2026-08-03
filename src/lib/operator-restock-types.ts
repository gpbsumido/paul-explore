// ---------------------------------------------------------------------------
// The wire shape for recording one slot during a restock session.
//
// Its own module so the API client and the BFF can both import it without
// pulling in the React-facing draft helpers.
// ---------------------------------------------------------------------------

export type RestockLineBody = {
  expectedQty: number;
  /** Null means the restocker deliberately skipped counting this slot. */
  countedQty: number | null;
  added: number;
  removed: number;
  removalReason: string | null;
};
