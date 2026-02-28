import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

export default function GraphQLThoughtsContent() {
  return (
    <div className={styles.phone}>
      {/* ---- Top bar ---- */}
      <div className={styles.topBar}>
        <Link href="/protected" className={styles.backLink}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;Back
        </Link>
        <div className={styles.contactInfo}>
          <span className={styles.contactName}>GraphQL</span>
          <span className={styles.contactSub}>iMessage</span>
        </div>
        <div className={styles.themeBtn}>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Chat ---- */}
      <div className={styles.chat}>
        <Timestamp>Today 11:00 AM</Timestamp>

        <Received pos="first">what's the GraphQL page</Received>
        <Received pos="last">another Pokémon thing?</Received>

        <Sent pos="first">
          a Pokédex browser built on the PokeAPI Hasura GraphQL endpoint —
          search any Pokémon by name or filter by type, shows the sprite, type
          badges, and base stat bars
        </Sent>
        <Sent pos="last">
          and yes, more Pokémon. I&apos;m playing a lot of Pocket with my
          partner so the theme fits
        </Sent>

        <Timestamp>11:02 AM</Timestamp>

        <Received>why GraphQL instead of a REST API</Received>

        <Sent pos="first">two things — field selection and the schema</Sent>
        <Sent pos="middle">
          REST gives you whatever the server decided to return. if you call{" "}
          <code>/api/pokemon/pikachu</code>, you get a massive JSON blob with
          game versions, form descriptions, encounter data — most of which you
          ignore. GraphQL lets you ask for exactly what you need
        </Sent>
        <Sent pos="last">
          the PokeAPI v2 endpoint is powered by Hasura, which introspects the
          Postgres database and auto-generates the entire schema — every table
          and relationship becomes queryable. you get filtering, sorting,
          aggregates, and nested joins for free without a single resolver
          written by hand
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
          bundle size, mostly. Apollo Client adds around 60kb gzipped to your
          client. for what I&apos;m doing here — send a query, get data back —
          that&apos;s a lot to pay
        </Sent>
        <Sent pos="middle">
          GraphQL is just HTTP. a POST request with a JSON body containing{" "}
          <code>query</code> and <code>variables</code>. plain fetch handles
          that in about 10 lines
        </Sent>
        <Sent pos="last">
          a client library earns its cost when you need a normalized cache
          (avoid re-fetching objects you already have), optimistic mutations, or
          real-time subscriptions. I don&apos;t need any of that here, so the
          library would just be weight
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

        <Received>what about the proxy — same reason as the calendar?</Received>

        <Sent pos="first">
          exactly. the app&apos;s CSP locks <code>connect-src</code> to
          same-origin, so the browser can&apos;t directly reach{" "}
          <code>beta.pokeapi.co/graphql/v1beta</code>. the{" "}
          <code>/api/graphql</code> route just forwards the POST body upstream
          and returns the response
        </Sent>
        <Sent pos="last">
          secondary benefit: the upstream URL stays out of the client bundle
          entirely. if it ever changes, you update one constant in one route
          file
        </Sent>

        <Received>
          variables vs string interpolation — does it matter for a public API?
        </Received>

        <Sent pos="first">
          yes, always use variables — even against a public API
        </Sent>
        <Sent pos="middle">
          the query string itself is a constant that never changes. only the
          variables object changes with user input. this means the network tab
          always shows the same query shape, which makes debugging easier and
          lets Hasura cache the parsed query on its side
        </Sent>
        <Sent pos="last">
          interpolation also opens the door to injection — someone passing{" "}
          <code>{"}) { id } query Anything {"}</code> as a search string could
          restructure the query entirely. variables are always treated as
          scalars, never as query syntax
        </Sent>

        <Timestamp>11:22 AM</Timestamp>

        <Received>how is loading state handled</Received>

        <Sent pos="first">
          derived, same pattern as the calendar and TCG browser — no extra
          boolean
        </Sent>
        <Sent pos="middle">
          there&apos;s a <code>loadedKey</code> string that tracks which filter
          state the current results belong to, and a <code>filterKey</code>{" "}
          derived from the debounced name + active type.{" "}
          <code>loading = loadedKey !== filterKey</code>
        </Sent>
        <Sent pos="last">
          that also handles the AbortController cleanly — when a new search
          fires, the old controller is aborted, and the <code>loadedKey</code>{" "}
          update in the new fetch&apos;s <code>.then()</code> never fires for
          the aborted request, so loading stays true until the right results
          land
        </Sent>

        <Timestamp>11:29 AM</Timestamp>

        <Received pos="first">
          hold on — is the first grid load still a client-side fetch?
        </Received>
        <Received pos="last">
          does the user still see a skeleton flash on arrival?
        </Received>

        <Sent pos="first">not anymore — page 1 is fetched server-side now</Sent>
        <Sent pos="middle">
          there&apos;s a <code>fetchPokemonDirect</code> in the lib that calls
          PokeAPI straight from the server, no proxy needed. the{" "}
          <code>/api/graphql</code> proxy only exists for the browser (CSP +
          endpoint hiding) — server code doesn&apos;t have those constraints. it
          also passes{" "}
          <code>
            next: {"{"} revalidate: 3600 {"}"}
          </code>{" "}
          to the underlying fetch so repeated renders within an hour hit
          Next.js&apos;s data cache instead of PokeAPI every time
        </Sent>
        <Sent pos="last">
          <code>page.tsx</code> has a <code>PokemonWithData</code> async server
          component that calls it, wrapped in a <code>Suspense</code> boundary
          with a skeleton fallback. the skeleton streams immediately while the
          fetch resolves, then the real grid drops in. first paint shows actual
          Pokémon, no loading spinner
        </Sent>

        <Received>
          how does GraphQLContent know not to re-fetch on mount
        </Received>

        <Sent pos="first">
          two things. <code>loadedKey</code> is pre-seeded to the default filter
          key — <code>&quot;||&quot;</code>, empty search and no type — so{" "}
          <code>loading</code> is already <code>false</code> before the
          component even mounts
        </Sent>
        <Sent pos="last">
          and there&apos;s a <code>hasServerData</code> ref initialised to{" "}
          <code>!!initialData</code>. on the first effect run it returns early
          and flips to false — after that, every filter change triggers a normal
          fetch. one-time skip, nothing special after
        </Sent>

        <Received>
          what if PokeAPI is down when the page renders server-side
        </Received>

        <Sent>
          the server fetch is in a try/catch that swallows the error and passes{" "}
          <code>initialData={"{undefined}"}</code> to{" "}
          <code>GraphQLContent</code>. it initialises with an empty array and
          falls back to the client-side fetch on mount, same as before. not
          great UX but it doesn&apos;t crash
        </Sent>

        <Timestamp>11:38 AM</Timestamp>

        <Received>what would you improve</Received>

        <Sent pos="first">
          caching is the obvious one — every type switch re-fetches even if
          you&apos;ve already loaded that page. a simple{" "}
          <code>Map&lt;filterKey, data&gt;</code> would make repeat filters
          instant without needing a client library
        </Sent>
        <Sent pos="middle">
          the live query panel is a nice demo but not something a real user
          needs. in a production app that&apos;d be behind a dev-only flag
        </Sent>
        <Sent pos="last">
          and introspection queries would be cool — let the user browse the
          schema itself, see what fields exist and what types they return.
          Hasura exposes the full introspection endpoint, so the data is there
        </Sent>

        <Received>what does this show as a dev</Received>

        <Sent pos="first">
          that I understand GraphQL as a specification, not just as &quot;the
          Apollo thing&quot;. knowing when to use it — typed schema, field
          selection, nested relationships across tables — versus when a REST
          endpoint is simpler and faster to build
        </Sent>
        <Sent pos="last">
          and that I reach for the right tool, not the popular one. plain fetch
          with a 10-line wrapper is the right call here. Apollo would have been
          the cargo-cult choice
        </Sent>

        <Received>makes sense</Received>

        <Sent>
          yeah, it&apos;s one of those things that looks overcomplicated until
          you work with a real nested schema and suddenly the self-documenting
          query language pays for itself
        </Sent>

        {/* Typing indicator */}
        <div className={styles.typingDots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
