/** Calendar write-up summary sections. */
export function CalendarSummary() {
  return (
    <>
      <section>
              <h2 className="mb-3 text-lg font-bold">Architecture overview</h2>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Next.js frontend + Express BFF gating all database access
                    behind Auth0 session verification
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Postgres for events, members, attachments, and Google OAuth
                    tokens; no heavy calendar library on the frontend
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      date-fns
                    </code>{" "}
                    for all date math — named imports so only the functions used
                    land in the bundle
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The four views</h2>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Day, week, month, and year — each is its own async server
                    component with its own Suspense boundary and matching
                    skeleton
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Skeleton matches the exact view structure (same row heights,
                    same grid) to prevent CLS when the JS chunk arrives
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Week view has an overlap layout engine: simultaneous events
                    get equal-width columns instead of stacking
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Google Calendar sync</h2>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    OAuth 2.0: user connects in Settings, backend exchanges the
                    authorization code for tokens, stores the refresh token in
                    Postgres
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Webhook-driven: Google push notifications hit the Express
                    backend when events change; backend fetches the delta and
                    upserts into Postgres
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Token refresh: middleware checks expiry before every Google
                    API call and refreshes automatically using the stored
                    refresh token
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Sharing and permissions
              </h2>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Calendars can be shared; each member has either an owner or
                    viewer role
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Only owners can add or remove members, delete the calendar,
                    or modify Google Calendar ACL entries
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      addCalendarAclEntry
                    </code>{" "}
                    fires fire-and-forget after the DB insert so ACL latency
                    never delays the HTTP response
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Other features</h2>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Pokémon card attachments: events can have TCG cards pinned
                    to them, stored as card IDs and fetched from TCGdex on
                    render
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Countdown view: days-until calculator for named upcoming
                    events
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Events list: infinite scroll via IntersectionObserver;
                    observer reconnects after each page load to prevent
                    duplicate callbacks
                  </span>
                </li>
              </ul>
            </section>
    </>
  );
}
