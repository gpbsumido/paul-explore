<script lang="ts">
  import { tick } from "svelte";
  import { CATEGORIES, ROLES } from "./_game/roles.data";
  import {
    clockAnnouncement,
    formatClock,
    initialState,
    publicView,
    reduce,
    remainingMs,
    type Action,
    type CategoryFilter,
    type GameState,
    type Phase,
    type PublicView,
  } from "./_game/game";
  import {
    newRoomCode,
    type Ask,
    type Connect,
    type RoomMessage,
    type RoomTransport,
  } from "./_room/protocol";
  import { BUTTON, PRIMARY_BUTTON } from "./buttonStyles";
  import PlayerB from "./PlayerB.svelte";

  // The dice and the clock come in as props so a test can fix both. Real
  // callers pass nothing and get Math.random and Date.now. `connect` is how a
  // room reaches the other device; without it there's no room option at all.
  // `joinCode` makes this device player B in that room.
  let {
    random = Math.random,
    now = Date.now,
    connect,
    joinCode,
  }: {
    random?: () => number;
    now?: () => number;
    connect?: Connect;
    joinCode?: string;
  } = $props();

  let game = $state<GameState>(initialState());
  let clock = $state(0);
  let heading = $state<HTMLElement>();

  const remaining = $derived(remainingMs(game, clock));
  const paused = $derived(game.pausedRemaining !== null);

  const announcement = $derived(clockAnnouncement(game.phase, remaining));

  const decks: { id: CategoryFilter; label: string; blurb: string }[] = [
    { id: "all", label: "Everything", blurb: `All ${ROLES.length} roles` },
    ...CATEGORIES,
  ];

  function send(action: Action) {
    game = reduce(game, action);
  }

  // Player A's side of a room. The transport is a plain variable because
  // nothing on screen depends on it; `room` is what the markup reads.
  let transport: RoomTransport | null = null;
  let room = $state<{ code: string; kind: RoomTransport["kind"] } | null>(null);
  const roomLink = $derived(
    room ? `${window.location.origin}/mind-reader?room=${room.code}` : "",
  );

  const actionFor = (ask: Ask): Action =>
    ask === "pause" || ask === "resume" ? { type: ask, now: now() } : { type: ask };

  function onHostMessage(message: RoomMessage) {
    if (message.t === "hello") transport?.send({ t: "view", view: publicView(game, now()) });
    if (message.t === "ask") send(actionFor(message.ask));
  }

  async function startRoom() {
    if (!connect) return;
    const code = newRoomCode(random);
    transport = await connect(code, onHostMessage);
    room = { code, kind: transport.kind };
  }

  // Every change to the round goes to the room as a view. publicView is what
  // keeps the role off the wire until the reveal.
  $effect(() => {
    if (!room) return;
    transport?.send({ t: "view", view: publicView(game, now()) });
  });

  $effect(() => () => transport?.close());

  // Player B's side: join, say hello so player A sends the current view, and
  // keep the latest one for PlayerB.svelte to render.
  let guestView = $state<PublicView | null>(null);
  let guestTransport: RoomTransport | null = null;
  $effect(() => {
    if (!joinCode || !connect) return;
    let closed = false;
    connect(joinCode, (message) => {
      if (message.t === "view") guestView = message.view;
    }).then((t) => {
      if (closed) return t.close();
      guestTransport = t;
      t.send({ t: "hello" });
    });
    return () => {
      closed = true;
      guestTransport?.close();
    };
  });

  // Tick while the round is live and unpaused. Writing `clock` is what makes
  // the countdown re-render; the effect itself only re-runs on a phase change.
  $effect(() => {
    if (game.phase !== "playing" || paused) return;
    clock = now();
    const id = setInterval(() => {
      clock = now();
      if (remainingMs(game, clock) <= 0) send({ type: "timeUp" });
    }, 250);
    return () => clearInterval(id);
  });

  // Move focus to the new heading whenever the screen changes, but leave it
  // alone on first load so the page does not steal focus from the header.
  let lastPhase: Phase = "setup";
  $effect(() => {
    const phase = game.phase;
    if (phase === lastPhase) return;
    lastPhase = phase;
    tick().then(() => heading?.focus());
  });

</script>

{#snippet title(text: string)}
  <h2
    bind:this={heading}
    tabindex="-1"
    class="font-display text-2xl font-semibold text-foreground outline-none"
  >
    {text}
  </h2>
{/snippet}

{#snippet action(label: string, onclick: () => void, isPrimary = false)}
  <button type="button" class={isPrimary ? PRIMARY_BUTTON : BUTTON} {onclick}>{label}</button>
{/snippet}

{#if joinCode && connect}
  <PlayerB
    code={joinCode}
    view={guestView}
    {now}
    onask={(ask) => guestTransport?.send({ t: "ask", ask })}
  />
{:else}
<section class="glass-card mx-auto w-full max-w-xl rounded-xl p-6 sm:p-8">
  <p role="status" class="sr-only">{announcement}</p>

  {#if room}
    <div class="mb-6 rounded-lg border border-border p-4">
      <p class="text-sm text-muted">
        Room <span data-testid="room-code" class="font-mono text-lg font-semibold text-foreground">{room.code}</span>
      </p>
      <p class="mt-1 text-sm text-muted">
        Player B joins at <a class="break-all text-foreground underline" href={roomLink}>{roomLink}</a>
      </p>
      {#if room.kind === "local"}
        <p class="mt-2 text-sm text-muted">
          Online rooms aren't set up here, so this one works only between tabs in this browser.
        </p>
      {/if}
    </div>
  {/if}

  {#if game.phase === "setup"}
    {@render title("How it works")}
    <ol class="mt-4 list-decimal space-y-2 pl-5 text-muted">
      <li>Player A gets a secret role or relationship toward Player B.</li>
      <li>A chats normally and drops subtle hints. No saying it outright.</li>
      <li>B has five minutes to work out what A is.</li>
    </ol>

    <fieldset class="mt-6">
      <legend class="mb-2 text-sm font-semibold text-foreground">Pick a deck</legend>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {#each decks as deck (deck.id)}
          <label
            class="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3 has-[:checked]:bg-surface has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-500"
          >
            <input
              type="radio"
              name="deck"
              value={deck.id}
              checked={game.category === deck.id}
              onchange={() => send({ type: "setCategory", category: deck.id })}
              class="mt-1"
            />
            <span>
              <span class="block font-medium text-foreground">{deck.label}</span>
              <span class="block text-sm text-muted">{deck.blurb}</span>
            </span>
          </label>
        {/each}
      </div>
    </fieldset>

    <div class="mt-6">
      {@render action("Deal a role", () => send({ type: "deal", random }), true)}
    </div>

    {#if connect && !room}
      <div class="mt-8 border-t border-border pt-6">
        <h3 class="font-semibold text-foreground">Playing apart?</h3>
        <p class="mt-1 text-sm text-muted">
          Start a room and send Player B the link. Your role is dealt on this device and never
          leaves it until the round is over.
        </p>
        <div class="mt-4">{@render action("Start a room", startRoom)}</div>
      </div>
    {/if}
  {:else if game.phase === "secret"}
    <p class="text-sm font-semibold uppercase tracking-wide text-muted">Round {game.round}</p>
    {@render title("Player A: your secret role")}
    <p class="mt-2 text-sm text-muted">
      {room ? "Only this device has it." : "Player B, look away."}
    </p>
    <p data-testid="secret-role" class="mt-4 rounded-lg bg-surface p-4 text-xl font-medium text-foreground">
      {game.role?.text}
    </p>
    <div class="mt-6 flex flex-wrap gap-3">
      {@render action("Hide it and start the clock", () => send({ type: "start", now: now() }), true)}
      {@render action("Redraw", () => send({ type: "redraw", random }))}
    </div>
  {:else if game.phase === "playing"}
    <p class="text-sm font-semibold uppercase tracking-wide text-muted">Round {game.round}</p>
    {@render title("Keep talking")}
    <p
      role="timer"
      aria-live="off"
      aria-label="Time left"
      class="mt-4 font-mono text-6xl tabular-nums text-foreground"
    >
      {formatClock(remaining)}
    </p>
    {#if paused}
      <p class="mt-1 text-sm text-muted">Paused</p>
    {/if}
    <p class="mt-4 text-muted">
      Player B, ask anything. Player A, stay in conversation and hint, don't announce.
    </p>
    <div class="mt-6 flex flex-wrap gap-3">
      {@render action("Player B guessed it", () => send({ type: "guessed" }), true)}
      {#if paused}
        {@render action("Resume", () => send({ type: "resume", now: now() }))}
      {:else}
        {@render action("Pause", () => send({ type: "pause", now: now() }))}
      {/if}
      {@render action("Give up", () => send({ type: "giveUp" }))}
    </div>
  {:else}
    {@render title(game.lastOutcome === "guessed" ? "Got it" : "Time's up")}
    <p class="mt-2 text-sm text-muted">The role was</p>
    <p class="mt-1 rounded-lg bg-surface p-4 text-xl font-medium text-foreground">
      {game.role?.text}
    </p>
    <p class="mt-4 text-muted">{game.guessed} guessed · {game.stumped} stumped</p>
    <div class="mt-6">
      {@render action("Next round", () => send({ type: "next", random }), true)}
    </div>
  {/if}
</section>
{/if}
