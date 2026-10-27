<script lang="ts">
  import { tick } from "svelte";
  import { CATEGORIES, ROLES } from "./_game/roles.data";
  import {
    formatClock,
    initialState,
    reduce,
    remainingMs,
    type Action,
    type CategoryFilter,
    type GameState,
    type Phase,
  } from "./_game/game";

  // The dice and the clock come in as props so a test can fix both. Real
  // callers pass nothing and get Math.random and Date.now.
  let {
    random = Math.random,
    now = Date.now,
  }: { random?: () => number; now?: () => number } = $props();

  let game = $state<GameState>(initialState());
  let clock = $state(0);
  let heading = $state<HTMLElement>();

  const remaining = $derived(remainingMs(game, clock));
  const paused = $derived(game.pausedRemaining !== null);

  // Only two moments are worth interrupting a screen reader for. Announcing
  // every second would drown out the conversation the game is about.
  const announcement = $derived.by(() => {
    if (game.phase !== "playing") return "";
    const seconds = Math.ceil(remaining / 1000);
    if (seconds <= 10) return "Ten seconds left";
    if (seconds <= 60) return "One minute left";
    return "";
  });

  const decks: { id: CategoryFilter; label: string; blurb: string }[] = [
    { id: "all", label: "Everything", blurb: `All ${ROLES.length} roles` },
    ...CATEGORIES,
  ];

  function send(action: Action) {
    game = reduce(game, action);
  }

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

  const button =
    "paul-touch-min rounded-md border border-border px-4 py-2 font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500";
  const primary =
    "paul-touch-min rounded-md bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500";
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
  <button type="button" class={isPrimary ? primary : button} {onclick}>{label}</button>
{/snippet}

<section class="glass-card mx-auto w-full max-w-xl rounded-xl p-6 sm:p-8">
  <p role="status" class="sr-only">{announcement}</p>

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
  {:else if game.phase === "secret"}
    <p class="text-sm font-semibold uppercase tracking-wide text-muted">Round {game.round}</p>
    {@render title("Player A: your secret role")}
    <p class="mt-2 text-sm text-muted">Player B, look away.</p>
    <p class="mt-4 rounded-lg bg-surface p-4 text-xl font-medium text-foreground">
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
