"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function GraphQLThoughtsContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "GraphQL" }]}
        right={<ViewToggle view={view} setView={setView} />}
        showLogout={false}
        maxWidth="max-w-3xl"
      />

      {view === "summary" ? (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50">
              Dev notes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              GraphQL Pokédex
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              A Pokémon browser on PokeAPI&apos;s public Hasura endpoint — plain
              fetch over Apollo, server-side initial data, and useInfiniteQuery
              pagination.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">Why GraphQL over REST</h2>
              <p className="text-muted">
                The PokeAPI REST endpoint returns a massive JSON blob per
                Pokémon — game versions, form descriptions, encounter data —
                most of which a card view ignores. GraphQL lets you ask for
                exactly what the card needs. The PokeAPI v2 endpoint is powered
                by Hasura, which introspects the Postgres database and
                auto-generates the entire schema. Every table and relationship
                becomes queryable with filtering, sorting, aggregates, and
                nested joins — no resolvers written by hand.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Why plain fetch over Apollo Client
              </h2>
              <p className="text-muted">
                Apollo Client adds around 60kb gzipped to the client bundle.
                GraphQL is just HTTP — a POST request with a JSON body
                containing{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  query
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  variables
                </code>
                . Plain fetch handles that in about 10 lines. A client library
                earns its cost when you need a normalized cache, optimistic
                mutations, or real-time subscriptions. None of those are needed
                here, so the library would just be weight.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Variables over interpolation
              </h2>
              <p className="text-muted">
                The query string itself is a constant that never changes — only
                the variables object changes with user input. This means the
                network tab always shows the same query shape, which makes
                debugging easier and lets Hasura cache the parsed query on its
                side. Interpolation also opens the door to injection: someone
                passing{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  {"}) { id } query Anything {"}
                </code>{" "}
                as a search string could restructure the query entirely.
                Variables are always treated as scalars, never as query syntax.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Server-side initial data
              </h2>
              <p className="text-muted">
                Page 1 is fetched server-side via a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  fetchPokemonDirect
                </code>{" "}
                function that calls PokeAPI straight from the server — no proxy
                needed, since server code doesn&apos;t have CSP constraints. It
                passes{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  next: {"{"} revalidate: 3600 {"}"}
                </code>{" "}
                to the underlying fetch so repeated renders within an hour hit
                Next.js&apos;s data cache. The page wraps the server component
                in a Suspense boundary with a skeleton fallback — the skeleton
                streams immediately while the fetch resolves, then the real grid
                drops in.
              </p>
              <p className="mt-3 text-muted">
                The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  initialData
                </code>{" "}
                prop goes straight into the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useInfiniteQuery
                </code>{" "}
                cache as the first page. TanStack treats it as fresh for 30
                seconds and skips the initial fetch. The seed only applies to
                the no-filter key — passing it unconditionally caused a bug
                where filtered queries got seeded with unfiltered server data
                and the 30-second stale time prevented the filter fetch from
                firing.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                useInfiniteQuery and the CSP proxy
              </h2>
              <p className="text-muted">
                The original implementation used manual{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  loadedKey
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  filterKey
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  hasServerData
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  abortRef
                </code>
                , and offset state. After converting to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useInfiniteQuery
                </code>{" "}
                all of that is gone. The query key includes{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  debouncedName
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  activeType
                </code>{" "}
                — when either changes, TanStack cancels the in-flight request
                and fires a fresh fetch automatically.
              </p>
              <p className="mt-3 text-muted">
                The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/graphql
                </code>{" "}
                proxy route forwards the POST body upstream to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  beta.pokeapi.co/graphql/v1beta
                </code>
                . It exists because the app&apos;s CSP locks{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  connect-src
                </code>{" "}
                to same-origin, so the browser can&apos;t reach the upstream URL
                directly. Secondary benefit: the upstream URL stays out of the
                client bundle entirely.
              </p>
            </section>
          </div>
        </main>
      ) : (
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 11:00 AM</Timestamp>

              <Received pos="first">what&apos;s the GraphQL page</Received>
              <Received pos="last">another Pokémon thing?</Received>

              <Sent pos="first">
                a Pokédex browser built on the PokeAPI Hasura GraphQL endpoint —
                search any Pokémon by name or filter by type, shows the sprite,
                type badges, and base stat bars
              </Sent>
              <Sent pos="last">
                and yes, more Pokémon. I&apos;m playing a lot of Pocket with my
                partner so the theme fits
              </Sent>

              <Timestamp>11:02 AM</Timestamp>

              <Received>why GraphQL instead of a REST API</Received>

              <Sent pos="first">
                two things — field selection and the schema
              </Sent>
              <Sent pos="middle">
                REST gives you whatever the server decided to return. if you
                call <code>/api/pokemon/pikachu</code>, you get a massive JSON
                blob with game versions, form descriptions, encounter data —
                most of which you ignore. GraphQL lets you ask for exactly what
                you need
              </Sent>
              <Sent pos="last">
                the PokeAPI v2 endpoint is powered by Hasura, which introspects
                the Postgres database and auto-generates the entire schema —
                every table and relationship becomes queryable. you get
                filtering, sorting, aggregates, and nested joins for free
                without a single resolver written by hand
              </Sent>

              <div className={styles.codeBubble}>
                {`# only ask for what the card needs
query PokemonList($limit: Int!, $offset: Int!, $name: String!) {
  pokemon_v2_pokemon(
    where: { is_default: { _eq: true }, name: { _ilike: $name } }
    order_by: { id: asc }
    limit: $limit
    offset: $offset
  ) {
    id
    name
    pokemon_v2_pokemontypes { pokemon_v2_type { name } }
    pokemon_v2_pokemonstats { base_stat pokemon_v2_stat { name } }
  }
}`}
              </div>

              <Timestamp>11:08 AM</Timestamp>

              <Received>why no Apollo or urql</Received>

              <Sent pos="first">
                bundle size, mostly. Apollo Client adds around 60kb gzipped to
                your client. for what I&apos;m doing here — send a query, get
                data back — that&apos;s a lot to pay
              </Sent>
              <Sent pos="middle">
                GraphQL is just HTTP. a POST request with a JSON body containing{" "}
                <code>query</code> and <code>variables</code>. plain fetch
                handles that in about 10 lines
              </Sent>
              <Sent pos="last">
                a client library earns its cost when you need a normalized cache
                (avoid re-fetching objects you already have), optimistic
                mutations, or real-time subscriptions. I don&apos;t need any of
                that here, so the library would just be weight
              </Sent>

              <div className={styles.codeBubble}>
                {`// that's all a GraphQL "client" needs to be
async function gql(query, variables, signal) {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}`}
              </div>

              <Timestamp>11:14 AM</Timestamp>

              <Received>
                what about the proxy — same reason as the calendar?
              </Received>

              <Sent pos="first">
                exactly. the app&apos;s CSP locks <code>connect-src</code> to
                same-origin, so the browser can&apos;t directly reach{" "}
                <code>beta.pokeapi.co/graphql/v1beta</code>. the{" "}
                <code>/api/graphql</code> route just forwards the POST body
                upstream and returns the response
              </Sent>
              <Sent pos="last">
                secondary benefit: the upstream URL stays out of the client
                bundle entirely. if it ever changes, you update one constant in
                one route file
              </Sent>

              <Received>
                variables vs string interpolation — does it matter for a public
                API?
              </Received>

              <Sent pos="first">
                yes, always use variables — even against a public API
              </Sent>
              <Sent pos="middle">
                the query string itself is a constant that never changes. only
                the variables object changes with user input. this means the
                network tab always shows the same query shape, which makes
                debugging easier and lets Hasura cache the parsed query on its
                side
              </Sent>
              <Sent pos="last">
                interpolation also opens the door to injection — someone passing{" "}
                <code>{"}) { id } query Anything {"}</code> as a search string
                could restructure the query entirely. variables are always
                treated as scalars, never as query syntax
              </Sent>

              <Timestamp>11:22 AM</Timestamp>

              <Received>how is loading state handled</Received>

              <Sent pos="first">
                derived, same pattern as the calendar and TCG browser — no extra
                boolean
              </Sent>
              <Sent pos="middle">
                there&apos;s a <code>loadedKey</code> string that tracks which
                filter state the current results belong to, and a{" "}
                <code>filterKey</code> derived from the debounced name + active
                type. <code>loading = loadedKey !== filterKey</code>
              </Sent>
              <Sent pos="last">
                that also handles the AbortController cleanly — when a new
                search fires, the old controller is aborted, and the{" "}
                <code>loadedKey</code> update in the new fetch&apos;s{" "}
                <code>.then()</code> never fires for the aborted request, so
                loading stays true until the right results land
              </Sent>

              <Timestamp>11:29 AM</Timestamp>

              <Received pos="first">
                hold on — is the first grid load still a client-side fetch?
              </Received>
              <Received pos="last">
                does the user still see a skeleton flash on arrival?
              </Received>

              <Sent pos="first">
                not anymore — page 1 is fetched server-side now
              </Sent>
              <Sent pos="middle">
                there&apos;s a <code>fetchPokemonDirect</code> in the lib that
                calls PokeAPI straight from the server, no proxy needed. the{" "}
                <code>/api/graphql</code> proxy only exists for the browser (CSP
                + endpoint hiding) — server code doesn&apos;t have those
                constraints. it also passes{" "}
                <code>
                  next: {"{"} revalidate: 3600 {"}"}
                </code>{" "}
                to the underlying fetch so repeated renders within an hour hit
                Next.js&apos;s data cache instead of PokeAPI every time
              </Sent>
              <Sent pos="last">
                <code>page.tsx</code> has a <code>PokemonWithData</code> async
                server component that calls it, wrapped in a{" "}
                <code>Suspense</code> boundary with a skeleton fallback. the
                skeleton streams immediately while the fetch resolves, then the
                real grid drops in. first paint shows actual Pokémon, no loading
                spinner
              </Sent>

              <Received>
                how does GraphQLContent know not to re-fetch on mount
              </Received>

              <Sent pos="first">
                two things. <code>loadedKey</code> is pre-seeded to the default
                filter key — <code>&quot;||&quot;</code>, empty search and no
                type — so <code>loading</code> is already <code>false</code>{" "}
                before the component even mounts
              </Sent>
              <Sent pos="last">
                and there&apos;s a <code>hasServerData</code> ref initialised to{" "}
                <code>!!initialData</code>. on the first effect run it returns
                early and flips to false — after that, every filter change
                triggers a normal fetch. one-time skip, nothing special after
              </Sent>

              <Received>
                what if PokeAPI is down when the page renders server-side
              </Received>

              <Sent>
                the server fetch is in a try/catch that swallows the error and
                passes <code>initialData={"{undefined}"}</code> to{" "}
                <code>GraphQLContent</code>. it initialises with an empty array
                and falls back to the client-side fetch on mount, same as
                before. not great UX but it doesn&apos;t crash
              </Sent>

              <Timestamp>11:38 AM</Timestamp>

              <Received>what would you improve</Received>

              <Sent pos="first">
                caching is the obvious one — every type switch re-fetches even
                if you&apos;ve already loaded that page. a simple{" "}
                <code>Map&lt;filterKey, data&gt;</code> would make repeat
                filters instant without needing a client library
              </Sent>
              <Sent pos="middle">
                the live query panel is a nice demo but not something a real
                user needs. in a production app that&apos;d be behind a dev-only
                flag
              </Sent>
              <Sent pos="last">
                and introspection queries would be cool — let the user browse
                the schema itself, see what fields exist and what types they
                return. Hasura exposes the full introspection endpoint, so the
                data is there
              </Sent>

              <Timestamp>11:45 AM</Timestamp>

              <Received pos="first">
                did the loadedKey and hasServerData stuff ever get cleaned up
              </Received>
              <Received pos="last">
                that was a lot of manual state for one page
              </Received>

              <Sent pos="first">
                yes, this one got converted to <code>useInfiniteQuery</code> too
              </Sent>
              <Sent pos="middle">
                <code>loadedKey</code>, <code>filterKey</code>,{" "}
                <code>hasServerData</code>, <code>abortRef</code>,{" "}
                <code>offset</code> state, and <code>handleLoadMore</code> are
                all gone. the query key includes <code>debouncedName</code> and{" "}
                <code>activeType</code> — when either changes TanStack cancels
                the in-flight request and fires a fresh fetch on the new key
                automatically
              </Sent>
              <Sent pos="last">
                <code>isFetchingNextPage</code> replaces the{" "}
                <code>loadingMore</code> boolean and <code>isLoading</code>{" "}
                replaces the derived{" "}
                <code>loading = loadedKey !== filterKey</code> expression — both
                come straight from the hook, no manual state to keep in sync
              </Sent>

              <Received>
                how does it know not to re-fetch the server data on mount
              </Received>

              <Sent pos="first">
                the <code>initialData</code> prop goes straight into the query
                cache as the first page. TanStack treats it as fresh for 30
                seconds and skips the initial fetch — no{" "}
                <code>hasServerData</code> ref needed
              </Sent>
              <Sent pos="last">
                once the user types or picks a type the key changes and the new
                fetch fires on the new key. the seeded data stays cached for the
                no-filter key. it is the same one-time skip, just baked into how{" "}
                <code>initialData</code> works rather than a manual flag
              </Sent>

              <Received>what does this show as a dev</Received>

              <Sent pos="first">
                that I understand GraphQL as a specification, not just as
                &quot;the Apollo thing&quot;. knowing when to use it — typed
                schema, field selection, nested relationships across tables —
                versus when a REST endpoint is simpler and faster to build
              </Sent>
              <Sent pos="last">
                and that I reach for the right tool, not the popular one. plain
                fetch with a 10-line wrapper is the right call here. Apollo
                would have been the cargo-cult choice
              </Sent>

              <Received>makes sense</Received>

              <Sent>
                yeah, it&apos;s one of those things that looks overcomplicated
                until you work with a real nested schema and suddenly the
                self-documenting query language pays for itself
              </Sent>

              <Received>
                wait I thought you said the type filter worked because the query
                key changes and a fresh fetch fires
              </Received>

              <Sent pos="first">
                that was wrong — I had a bug. the filter was silently not
                working because <code>initialData</code> was provided
                unconditionally to <code>useInfiniteQuery</code>
              </Sent>
              <Sent pos="last">
                TanStack evaluates <code>initialData</code> fresh on every
                render, not just on mount. so when the user clicked a type pill,
                the new query key found <code>initialData</code> truthy, seeded
                itself with the unfiltered server data, and{" "}
                <code>staleTime: 30_000</code> prevented the actual filter fetch
                from firing for 30 seconds
              </Sent>

              <Received>how did you catch it</Received>

              <Sent pos="first">
                the grid was showing all Pokémon after clicking a type pill
                instead of the filtered list. tracing the flow confirmed the
                fetch was never made — TanStack thought the data was fresh
              </Sent>
              <Sent pos="last">
                fix was to gate it:{" "}
                <code>
                  initialData: seedPage &amp;&amp; !name &amp;&amp; !type ? ...
                  : undefined
                </code>
                . the seed only applies to the no-filter key. filtered queries
                start empty and fetch normally
              </Sent>

              <Received>subtle</Received>

              <Sent>
                really subtle. the behavior looks correct at first — the
                unfiltered grid loads fast — but the filter is completely
                broken. easy to miss if you only test the happy path
              </Sent>

              {/* Typing indicator */}
              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
