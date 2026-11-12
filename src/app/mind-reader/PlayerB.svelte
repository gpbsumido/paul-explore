<script lang="ts">
  import { tick } from "svelte";
  import { clockAnnouncement, formatClock, type PublicView } from "./_game/game";
  import type { Ask } from "./_room/protocol";
  import { BUTTON, PRIMARY_BUTTON } from "./buttonStyles";

  // Player B's screen in a room. It never holds the role until player A's
  // device sends the reveal, and it never runs the rules: every button is an
  // ask that player A's device decides on and answers with a fresh view.
  let {
    code,
    view,
    now,
    onask,
  }: {
    code: string;
    view: PublicView | null;
    now: () => number;
    onask: (ask: Ask) => void;
  } = $props();

  let heading = $state<HTMLElement>();
  let clock = $state(0);
  let syncedAt = $state(0);

  // A view carries time left at the moment it was sent, so the local clock
  // counts down from when it arrived rather than trusting player A's clock.
  $effect(() => {
    if (!view) return;
    syncedAt = now();
    clock = syncedAt;
  });

  const remaining = $derived.by(() => {
    if (!view) return 0;
    if (view.phase !== "playing" || view.paused) return view.remainingMs;
    return Math.max(0, view.remainingMs - (clock - syncedAt));
  });
  const announcement = $derived(view ? clockAnnouncement(view.phase, remaining) : "");

  $effect(() => {
    if (view?.phase !== "playing" || view.paused) return;
    const id = setInterval(() => (clock = now()), 250);
    return () => clearInterval(id);
  });

  // Focus follows the screen, but not when the first view lands on page load.
  let lastPhase: string | null = null;
  $effect(() => {
    const phase = view?.phase ?? null;
    if (phase === lastPhase) return;
    const first = lastPhase === null;
    lastPhase = phase;
    if (!first) tick().then(() => heading?.focus());
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

<section class="glass-card mx-auto w-full max-w-xl rounded-xl p-6 sm:p-8">
  <p role="status" class="sr-only">{announcement}</p>
  <p class="text-sm font-semibold uppercase tracking-wide text-muted">
    Room {code}{view ? ` · Round ${view.round}` : ""}
  </p>

  {#if !view}
    {@render title("Waiting for Player A")}
    <p class="mt-2 text-muted">
      You're Player B. Keep this page open; the game starts here once Player A is in the room.
    </p>
  {:else if view.phase === "setup"}
    {@render title("Player A is picking a deck")}
    <p class="mt-2 text-muted">You're Player B. Your job is to work out who they are to you.</p>
  {:else if view.phase === "secret"}
    {@render title("Player A is reading their role")}
    <p class="mt-2 text-muted">It only ever goes to their device. The clock starts when they're ready.</p>
  {:else if view.phase === "playing"}
    {@render title("Keep talking")}
    <p
      role="timer"
      aria-live="off"
      aria-label="Time left"
      class="mt-4 font-mono text-6xl tabular-nums text-foreground"
    >
      {formatClock(remaining)}
    </p>
    {#if view.paused}
      <p class="mt-1 text-sm text-muted">Paused</p>
    {/if}
    <p class="mt-4 text-muted">Ask anything. Say it out loud when you think you know.</p>
    <div class="mt-6 flex flex-wrap gap-3">
      <button type="button" class={PRIMARY_BUTTON} onclick={() => onask("guessed")}>
        I guessed it
      </button>
      {#if view.paused}
        <button type="button" class={BUTTON} onclick={() => onask("resume")}>Resume</button>
      {:else}
        <button type="button" class={BUTTON} onclick={() => onask("pause")}>Pause</button>
      {/if}
      <button type="button" class={BUTTON} onclick={() => onask("giveUp")}>Give up</button>
    </div>
  {:else}
    {@render title(view.lastOutcome === "guessed" ? "Got it" : "Time's up")}
    <p class="mt-2 text-sm text-muted">The role was</p>
    <p class="mt-1 rounded-lg bg-surface p-4 text-xl font-medium text-foreground">{view.role}</p>
    <p class="mt-4 text-muted">{view.guessed} guessed · {view.stumped} stumped</p>
    <p class="mt-2 text-sm text-muted">Player A deals the next round.</p>
  {/if}
</section>
