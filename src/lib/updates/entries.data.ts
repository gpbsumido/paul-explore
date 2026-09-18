import type { UpdateEntry } from "./types";

/**
 * The public changelog, curated for a reader.
 *
 * This is deliberately not a parse of the internal CHANGELOG.md — that file is
 * written for me, in the voice of a diff, and there are hundreds of entries.
 * This is the newsletter version: the handful of things worth telling a visitor
 * about, in plain language, newest first. When one closed a public ticket, it
 * lists the ticket id and the board links back.
 */
export const UPDATE_ENTRIES: UpdateEntry[] = [
  {
    id: "e-zeroproof-win-celebration",
    date: "2026-09-18",
    version: "6.20.0",
    category: "improvement",
    tags: ["zeroproof"],
    title: "ZeroProof cheers your wins, and shows more of your record",
    summary:
      "Open Your record after a bet lands in your favour and ZeroProof adds up what you just won and celebrates it — once per win. The record also gained a win rate, a net-profit figure, and a recent-form strip of your last few results.",
    body: [
      "Winning should feel like something. Now the first time you check Your record after a bet settles in your favour, ZeroProof totals what you just won and celebrates it — a number that counts up, a glow, a few sparkles — then quietly remembers it, so the same win doesn't cheer at you every visit. Ask your device for reduced motion and it stays calm and just shows the total.",
      "The record panel also tells you more at a glance: your win rate over graded bets, your net profit across everything that's settled, and a row of your last eight results as win/loss/push chips. It all reads off bets already loaded, so nothing new is fetched.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-interviewee-deck",
    date: "2026-09-17",
    version: "6.19.0",
    category: "feature",
    tags: ["interviewee"],
    title: "Interviewee — a private, keyboard-driven interview-prep deck",
    summary:
      "A new admin-only deck for my interview prep, organised by job interview: open an interview, then a topic, for bullet-point answers with the detail behind a tap and related topics a keystroke away. Number keys jump straight to a card.",
    body: [
      "I wanted something I could actually drive mid-interview without reaching for the mouse, so the deck is keyboard-first at every level: number keys 1 through 9 jump straight to an interview or topic, the arrow keys walk the cards, and Escape drops back from a topic to its interview. Each topic opens the headline points with the deeper detail tucked behind a disclosure, and related topics show as cards you can hop to sideways.",
      "The whole thing is fed from one data shape — an interview owning its topics — so a page of prep notes becomes the deck without touching the UI. It's behind sign-in and admin-only, since the content is my own answers; marking a topic reviewed slides it into a separate list rather than deleting it, remembered on my device.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-board-date-range",
    date: "2026-09-15",
    version: "6.18.0",
    category: "improvement",
    tags: ["zeroproof"],
    title: "Filter the board by a date range, with a calendar",
    summary:
      "The board's date filter is now a From/To calendar range instead of a single-day dropdown — pick two dates and see just the games in that window. Leave one side open for everything before or after a date.",
    body: [
      "The first cut of the board filters let you pick one day at a time from a list. Now it's a pair of calendar date pickers — From and To — so you can scope the board to a whole range: this weekend, the next two weeks, whatever. Either side can be left blank for an open-ended 'from here on' or 'up to then', and picking the dates in either order still does the sensible thing.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-budget-sign-in",
    date: "2026-09-15",
    version: "6.17.0",
    category: "improvement",
    tags: ["budget"],
    title: "The budget now lives on your account — sign in to use it",
    summary:
      "The budget tracker is now behind sign-in. Signed in, it's the same shared, synced tracker; signed out, you get a page explaining what it does and a way in, rather than a browser-only budget that couldn't really be shared. A budget belongs to your account now.",
    body: [
      "The tracker started life running entirely in your browser, which was honest but meant a 'shared' budget was really just a stand-in. Now that budgets live on the server and sync across your devices, keeping a separate browser-only copy for signed-out visitors was more confusing than useful — so /budget asks you to sign in first.",
      "Signed out, the page still tells you exactly what the tracker does — fast add, sharing and splitting, the by-category and by-person analytics — and gives you a button to sign in and start. It just doesn't show or store a budget until you do. If you'd been using the old browser-only budget, note that it lived in your browser and the account budget is a fresh, separate thing.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-board-filters",
    date: "2026-09-15",
    version: "6.16.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "Filter the ZeroProof board by sport, fantasy, date, and odds",
    summary:
      "The board got filters. Show or hide ESPN fantasy, narrow to a single sport, jump to one day, or keep only big favorites, longshots, or even matchups. It all happens in the browser, instantly, over the games already loaded — and when nothing matches, it tells you and offers a one-tap Clear.",
    body: [
      "The board could get long once there were real games and fantasy matchups on it at once, and I wanted to be able to say 'just show me the NFL' or 'just the longshots'. So there's a row of filters on the board now: a sports-or-fantasy toggle, a sport picker, a date picker, and an odds lens — any big favorite (−200 or shorter), any longshot (+200 or longer), or even matchups only.",
      "They compose: pick Fantasy and the sport list narrows to the fantasy games, pick a single day and it shows just that day. Nothing goes to the server — the board is already served whole from the database, so filtering is instant and private. If a combination matches nothing, the board says so instead of going blank, and Clear filters puts everything back.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-budget-backend",
    date: "2026-09-15",
    version: "6.15.0",
    category: "feature",
    tags: ["budget"],
    title: "Budgets now sync to your account, and share for real",
    summary:
      "Sign in and your budget lives on the server and follows you across devices; sharing a budget by email actually pulls the other person onto it now, instead of being a local stand-in. Signed out, it still works entirely in your browser with no account. Every expense also gained an optional note and vendor, and the whole page got an iPhone-app makeover.",
    body: [
      "The budget tracker started life entirely in your browser, which was honest but couldn't really be shared. Now, when you're signed in, it's backed by a real database and syncs everywhere you log in — and making a budget public and approving someone's request to join actually gives them access to the same budget. Signed out, nothing changes: it stays in your browser and needs no account.",
      "Two small things I kept wanting: an optional note (what the spend was for) and a vendor (where it went) on each item. And since I mostly open this on my phone, the page now feels like an app — a big title, a segmented week/month/year switch, a full-width Add button, taps that respond the instant you press, and spacing that clears the home indicator.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-budget-editing",
    date: "2026-09-14",
    version: "6.14.0",
    category: "feature",
    tags: ["budget"],
    title: "Edit budget items, and split them across people",
    summary:
      "You can now open any expense you've logged and change it — category, amount, date, tags — or delete it. And instead of pinning a spend on one person, you can split it across several, with a one-tap even split. The by-person totals count each share.",
    body: [
      "The budget tracker shipped able to add fast but not to fix a mistake. Now every item in the cycle list has an edit control: open it and change the category, amount, when it happened, or its tags, or delete it outright.",
      "Splitting is the bigger one. A dinner that two people share no longer has to land entirely on whoever logged it — tick the people in on it, tap 'Split evenly', and the amount divides across them (the odd cent goes to the first person so it always adds up). The by-person breakdown counts each share rather than the whole ticket.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-budget-tracker",
    date: "2026-09-14",
    version: "6.13.0",
    category: "feature",
    tags: ["budget"],
    title: "A budget tracker where logging a spend takes three taps",
    summary:
      "A new budget app at /budget built around one thing: how fast it is to add an expense. Tap Add, pick a category, type the amount, done — the date and time default to now. Share a budget with the people you split with, and see the last 30 days, the current billing cycle, and where it went by category and by person.",
    body: [
      "Most budgeting apps lose me in the first week because logging a coffee is a chore. So this one makes the add flow the whole point: a bottom sheet slides up and asks three things in order — which category, how much, and only if you care, when and how to tag it. The common case is a category tap and a number.",
      "A budget can be shared. You add the people you split with, switch who's active, and each expense is attributed to them, which feeds a by-person breakdown alongside the by-category one, the running 30-day and billing-cycle totals, and a week/month/year history that compares this period to the last. It lives in your browser for now, so sharing is honest about it: 'invite someone' is a link that carries the budget, and a public budget lets people ask to join with your email for you to approve — full cross-device sync arrives with the backend. Editing an item and splitting a single expense across people are coming next.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-gods-view",
    date: "2026-09-14",
    version: "6.12.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "An admin's-eye view of every ZeroProof bet",
    summary:
      "Signed in as the owner, there's now one page that shows and searches everyone's ZeroProof bets — live and resolved — and each player's win-loss-push record. The public leaderboard stays anonymous; this is the only place that names names, and it's invisible to anyone else.",
    body: [
      "The public board shows players by an opaque handle on purpose — no one browsing the leaderboard sees who's who. But I wanted a way to look across the whole book myself: who's betting what, which bets are still open, how everyone's record actually shakes out. So there's a new admin-only page that puts every player's bets in one searchable table, with a per-player record summary above it (wins-losses-pushes, total bets, and how many are still live).",
      "Search matches on email, name, selection, or market, and a simple All / Live / Resolved filter narrows the ledger. It's gated to my account the same way the rest of the admin tools are — to anyone else the page simply doesn't exist.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-showcase-navigation",
    date: "2026-09-12",
    version: "6.11.0",
    category: "feature",
    tags: ["design-system"],
    title: "The design-system gallery is now searchable",
    summary:
      "The component gallery grew categories, live search, sorting, and shareable links, plus a component of the day featured at the top — no more scrolling a flat grid of 49 cards to find one.",
    body: [
      "The showcase listed every primitive in one long grid, in catalog order. Fine at 20 components; at 49 it meant scanning. Each component now files under one of six categories — AI & chat, charts, forms, overlays, content, and motion effects — and the gallery has a search box, category chips, and a sort control (curated, name, category, or how widely adopted a component is).",
      "Whatever view you end up with lands in the address bar, so a filtered, sorted slice of the gallery is a link you can send. Every card is an anchor too. And each day the page features a different component at the top, picked deterministically from the date, so returning visitors get a reason to notice something they'd scrolled past.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-apple-design",
    date: "2026-09-10",
    version: "6.10.0",
    category: "improvement",
    tags: ["design-system", "accessibility"],
    title: "A polish pass on how the whole site feels",
    summary:
      "The site now honours your system settings for reduced transparency, higher contrast, and less motion; buttons respond the instant you press them; menus and dialogs move more naturally; and switching light/dark eases instead of snapping.",
    body: [
      "I went through the app against Apple's design principles for how an interface should feel — responsive, physical, calm — and fixed a long list of small things. If you've turned on Reduce Transparency, Increase Contrast, or Reduce Motion in your OS, the site respects all three now: the frosted-glass surfaces turn solid, faint borders get stronger, and the brightness change when you flip light/dark fades instead of jumping.",
      "The rest is feel. Buttons and toggles react on the press, not when you let go. Menus grow out of the button you tapped rather than blinking into place, and dialogs settle in without a bounce. Headings are set a little tighter at large sizes, and text scales properly if you've bumped up your browser's font size.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-error-toasts",
    date: "2026-09-10",
    version: "6.9.0",
    category: "improvement",
    tags: ["design-system", "zeroproof"],
    title: "When something fails to save, the site now tells you",
    summary:
      "Actions that couldn't go through used to fail quietly — you'd click and nothing would happen. Now any failed save pops a short message explaining what went wrong, everywhere on the site.",
    body: [
      "It's a frustrating kind of bug: you do something, it silently doesn't work, and you're left guessing whether it saved. Under the hood every write now runs through one place that catches a failure and shows it as a small notification — with the real reason where there is one, like being told you already have an active season wallet, and a plain apology where there isn't.",
      "The little notification itself is a piece I added to my own design system first and then wired in here, so it looks and behaves the same wherever it shows up.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-guided-tours",
    date: "2026-09-09",
    version: "6.8.0",
    category: "feature",
    tags: ["design-system", "fantasy", "tcg", "operator", "vitals"],
    title: "Guided tours across the main features",
    summary:
      "The ZeroProof tour was worth having everywhere. A first visit to Fantasy, the Pokémon TCG browser, the operator and vitals dashboards, or the design-system gallery now offers the same quick click-through — it asks first, then walks you through the page one highlight at a time.",
    body: [
      "Landing cold on a feature you've never used, it isn't always obvious where to start. So the same tour that shipped on ZeroProof now runs on the main pages: it opens with a simple question, and only if you say yes does it spotlight each part of the page in turn, switching tabs where a page has them.",
      "It never nags — decline or finish it once and it stays gone — and every page keeps a Take-the-tour button to bring it back. Under the hood it's now one reusable engine rather than a per-page rebuild, so more pages can pick it up cheaply.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-tour",
    date: "2026-09-09",
    version: "6.7.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "A guided tour of the ZeroProof lobby",
    summary:
      "New to ZeroProof? The lobby now offers a quick click-through tour — it asks first, then walks you through the board, leagues, leaderboard and your record, one highlight at a time.",
    body: [
      "The ZeroProof lobby packs a lot into a few tabs, and it wasn't obvious where to start. A first visit now opens with a simple question — take a quick tour? — and only if you say yes does it walk you through the place, spotlighting each part and switching to its tab as it goes.",
      "It never nags: decline it or finish it once and it stays gone, but a Take-the-tour button in the header brings it back whenever you want a refresher.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-work-portfolio-polish",
    date: "2026-09-09",
    version: "6.6.0",
    category: "improvement",
    tags: ["work-portfolio"],
    title: "The work-portfolio demos got a full polish pass",
    summary:
      "Each project now looks like itself, the demos open full of real data instead of empty, a new This Site stop links to the real features of this site, and a pile of small bugs — a vanishing chart, a referral link pointing at prod, forms that took bad input — are fixed.",
    body: [
      "Reviewed every demo the way someone landing cold would and made each read like the real product it came from. Each project's stage now carries its own accent and texture, so the jobs stop blurring into one near-black surface. Sparse demos open full — the wallet lookup lands on a resolved sample, the referral form is a focused card.",
      "A new final stop, This Site, breaks the pattern: instead of a reconstruction it's a directory of live links to the real features of this site — the operator dashboard, the calendar, these write-ups, and more.",
      "And the bugs: the slug-dashboards chart that overflowed its card and then rendered nothing once I over-corrected (fixed with a definite height), a referral link that pointed at production from the develop deploy, and forms that accepted invalid input.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-espn-health",
    date: "2026-09-09",
    version: "6.5.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "See when an ESPN league you added can't be reached",
    summary:
      "If a public ESPN league you add to your contest is private, has a wrong id or season, or ESPN is down, the league page now tells you — instead of its matchups just never showing up.",
    body: [
      "Adding a public ESPN league to a contest is only useful if you can tell it worked. The league page now shows each added ESPN league's health: a warning with the reason and when it last resolved if it can't be reached, and nothing when it's fine.",
      "Behind it, one unreachable league (or one failing sport on the odds side) no longer sinks the whole ingest — it's skipped and logged so everything else keeps syncing and settling, and the failing one is retried automatically.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-league-espn-additive",
    date: "2026-09-08",
    version: "6.4.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "Add ESPN leagues to your league — and still bet everything else",
    summary:
      "A league's commissioner can add public ESPN fantasy leagues on the league page. Their matchups show on the board to bet, and the league stays free to bet everything else.",
    body: [
      "Running a league, you can now add one or more public ESPN fantasy leagues to it — sport, id, season, an optional label — right on the league page, and remove them again. Everyone in the league sees which are added; only the commissioner manages the list.",
      "This is additive, not a cage: the added leagues' weekly matchups start showing on the board, and members bet them alongside real-sports lines and anything else. It reuses the same wallet, ledger and settlement as the rest of ZeroProof.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-board-bet-line",
    date: "2026-09-08",
    version: "6.3.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "See your bet right on the board",
    summary:
      "A fixture you've bet on now shows what you picked and how much you staked, on its card — with the odds and, once it's graded, the result.",
    body: [
      "The board already kept a game you'd bet on in view and badged it. Now the card says what the bet was: your selection, the stake, the price you got, and a coloured result once it settles. Bet more than once on the same matchup and each one is listed.",
      "It reuses the bets the board already loads, so it's just surfacing what was there — no extra call, and it lines up with the same figures on Your record.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-espn-matchups",
    date: "2026-09-08",
    version: "6.2.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "Bet ESPN fantasy matchups",
    summary:
      "Fantasy matchups show up on the board with a Fantasy badge, and bet like anything else.",
    body: [
      "The board now carries ESPN fantasy head-to-head matchups alongside the real-sports lines — each badged Fantasy Football or Fantasy Basketball so you know which is which — and they bet like anything else.",
      "It reuses the same wallet, ledger and settlement as the rest of ZeroProof — a fantasy matchup is just another event that settles on the weekly score. Adding ESPN leagues to a contest you run came next.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-leagues",
    date: "2026-09-08",
    version: "6.1.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "Start your own ZeroProof league",
    summary:
      "Run your own contest: set the starting bankroll, the size, and how it's won — first to a target or highest by a date. Players join, each league keeps its own board and crowns a winner.",
    body: [
      "The new Leagues tab lets you spin up a private contest and set the rules: how much everyone starts with, how many can join, and the win condition — first to a target bankroll, or the highest balance by a deadline. Public leagues are searchable and join with a tap; invite-only ones share a short code.",
      "Every league has its own page: the rules, a board ranked by bankroll (ROI breaking ties), and — once it's settled — the winner. You bet from a league-scoped wallet, so league play stays separate from the global sharp record. The whole thing is a scope over the machinery ZeroProof already had, so bets, the ledger and settlement didn't change.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-live",
    date: "2026-09-04",
    version: "6.0.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "ZeroProof is live — real lines, a bettable lobby, a milestone 6.0",
    summary:
      "The no-loss sportsbook is fully live: real odds on the board, wallets, a bet slip, live settlement, a leaderboard and your own record. A milestone major — nothing breaking.",
    body: [
      "This is where ZeroProof stops being a read-only preview and becomes the whole loop: real football lines feed the board on a schedule, you open a Season or Challenge wallet, pick an outcome to fill a bet slip, and place a stake the settler grades — with the result and the closing-line value landing back on your record without a reload.",
      "The lobby splits into Board, Leaderboard and Your record tabs; the board opens on the next few days, groups fixtures by day and flags the games you're already in; and Your record charts a bankroll trend. It's the 6.0 milestone because the product genuinely went live — the dollars staying simulated is the only thing between here and real money, and that's a licensing question, not a code one.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-trend",
    date: "2026-09-04",
    version: "5.25.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "See how your season is trending, on your record",
    summary:
      "Your record now charts cumulative profit and loss over your settled bets — one line for the season, one for everything.",
    body: [
      "The Your record tab grows a bankroll trend: two overlaid lines charting cumulative profit and loss over your settled bets, one for just your Season wallets and one for everything, so you can see how a season is going against your record as a whole.",
      "It's computed from the bets you already load and drawn with the shared design-system chart, and the current figures are printed in text under it so the trend never reads as shape-and-colour alone.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-board-days",
    date: "2026-09-04",
    version: "5.24.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "The ZeroProof board reads by day, and flags games you're already in",
    summary:
      "Fixtures are grouped under a heading per day, and any game you've already bet on is badged and always shown — even past the day-horizon.",
    body: [
      "The board used to be one flat list of upcoming games. It's grouped by day now — each day its own heading — so a weekend slate reads as days rather than a wall.",
      "And a fixture you've already placed a bet on gets a \"Your bet\" badge and stays on the board even when it's beyond the current few-day window, so you never lose track of a game you're in.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-board-horizon",
    date: "2026-09-03",
    version: "5.23.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "ZeroProof goes live, and the board opens on the next few days",
    summary:
      "Real football lines feed the lobby now, and the board shows the next three days by default — with a load-more, an auto-load-on-scroll toggle, and a collapse back.",
    body: [
      "The events board is fed by real odds now: they're pulled from a sportsbook data API on a schedule and stored to the database, so the lobby shows live lines with no vendor call riding on the page.",
      "Football is a weekly slate, so rather than a wall of games a week out, the board opens on the next three days. Load more adds three days at a time, a toggle switches to loading automatically as you scroll, and you can collapse back to three whenever you want — a filter over the list the page already has, so widening the window costs no fetch.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-lobby",
    date: "2026-09-03",
    version: "5.22.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "ZeroProof: a no-loss sportsbook, now with a lobby",
    summary:
      "The public events board is live — real lines over a real double-entry ledger, with the dollars simulated on purpose.",
    body: [
      "ZeroProof is sports betting with the loss taken out: you lock a deposit for a term, bet it freely on real lines, and get the original deposit back at the end no matter your record — what you keep forever is the record itself. The ledger is real from the first row; the money is a button.",
      "This first slice of the front end is read-only: a lobby that shows the upcoming events board with the latest moneyline, spread and total lines, served straight from the database. The bet slip, the profile and the leaderboards come next, built on the same slate. The write-up explains why it was built ledger-first.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-ai-components",
    date: "2026-09-02",
    version: "5.21.0",
    category: "feature",
    tags: ["design-system", "a11y"],
    title: "Ten AI-app components join the design system gallery",
    summary:
      "A chat composer, streaming text, a command palette, a token meter and more — live in the showcase.",
    body: [
      "The shared component library grew a set of pieces aimed at AI surfaces: a chat composer and message bubble, text that streams in the way a model replies, a typing indicator, a code block with a copy button, a filterable combobox, a ⌘K command palette, a small rich-text editor, a toast stack, and a token-usage meter.",
      "Every one is now rendered live on the design-system page from the real published package, with its accessibility guarantees spelled out on the card — labelled controls, live regions for the streaming and typing pieces, and progressbar semantics on the meter. The gallery documents the whole package or the build goes red, so these couldn't be added quietly.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-tcg-catalog",
    date: "2026-08-31",
    version: "5.19.0",
    category: "fix",
    tags: ["tcg", "reliability"],
    title: "Pokémon sets load from our own catalog now",
    summary:
      "The set lists stopped depending on a third party that had quietly gone dark.",
    body: [
      "The Pokémon set and Pocket pages used to fetch a public card API at render time. When that service pointed its North-American traffic at a dead node, the pages didn't error loudly — they rendered empty and got cached that way for a day, so the lists looked abandoned when nothing was actually wrong.",
      "They now read from a catalog this site mirrors itself, and an empty list is told apart from a failed read: one says the catalog hasn't been built yet, the other says the read failed. Nothing in a production build calls a third party for these pages any more.",
    ],
    resolvedTicketIds: ["t-pocket-unavailable"],
  },
  {
    id: "e-check-in",
    date: "2026-08-30",
    version: "5.18.0",
    category: "feature",
    tags: ["events", "auth"],
    title: "Volunteer arrival check-in",
    summary:
      "Confirm someone actually turned up to a shift, without any hardware.",
    body: [
      "A display at the entrance shows a six-digit code that rotates every two minutes. A volunteer opens a link on their phone, signs in, and types the code, and the arrival is recorded against their real account rather than a name they typed into a box.",
      "The code is derived from the time window rather than stored, so nothing on this side ever holds a working code. The NFC-tap version was dropped on purpose: it works in Chrome on Android and not at all in Safari on iOS, so a tap would have silently failed for every iPhone.",
    ],
    resolvedTicketIds: ["t-attendance-proof"],
  },
  {
    id: "e-command-palette",
    date: "2026-08-10",
    version: "5.12.0",
    category: "feature",
    tags: ["navigation", "a11y"],
    title: "Jump anywhere with ⌘K",
    summary:
      "A command palette that fuzzy-searches every page, dev note, and action.",
    body: [
      "Hitting ⌘K (or Ctrl+K) opens a search box over whatever you're on. It matches every route, every write-up, and a set of actions, ranks them with a hand-rolled fuzzy matcher, and groups the results.",
      "It's a proper ARIA combobox: full keyboard navigation, screen-reader announcements for the result count, and focus returned to where you were when it closes.",
    ],
    resolvedTicketIds: ["t-global-search"],
  },
  {
    id: "e-operator",
    date: "2026-07-28",
    version: "5.6.0",
    category: "feature",
    tags: ["dashboard", "data"],
    title: "An operator dashboard for micro-retail",
    summary:
      "Fleet management for smart, unstaffed stores: polling, freshness, and charts.",
    body: [
      "A reconstruction of a real operations surface — a fleet of self-serve stores, each with stock, sales, and health. It polls at tiered intervals depending on how fresh a value needs to be, shows optimistic updates when you act, and sorts by severity so the store on fire is at the top.",
      "It's also where the charting story got worked out, and several of the dashboard's own write-ups live under it.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-design-system",
    date: "2026-07-12",
    version: "5.2.0",
    category: "feature",
    tags: ["design-system", "docs"],
    title: "A live gallery for the design system",
    summary:
      "Every shared primitive rendered interactively, with a props playground.",
    body: [
      "The shared component library now has a Storybook-style page: each primitive rendered live, a props playground that generates the code for what you configure, a token gallery, and a link to where each component actually ships.",
      "It's driven from a catalog with an integrity test, so a component that's added without an example, or an example that points at a dead usage, fails a build rather than rotting quietly.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-draft-lab",
    date: "2026-08-25",
    version: "5.16.0",
    category: "feature",
    tags: ["fantasy", "tools"],
    title: "Draft Lab, a fantasy-draft companion",
    summary:
      "Live recommendations, tiers, and a post-draft grade for every pick.",
    body: [
      "A companion for a live fantasy draft: it projects points, cuts players into tiers, and recommends who to take given who's left and what your roster still needs. After the draft it grades each pick by how much it improved your startable lineup versus what was on the board at that moment.",
      "It reconstructs the room from the league's own API so it works for any pool, and it keeps its data in the browser with file round-trips so a reload can't wipe a league setup.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-v5-landing",
    date: "2026-07-24",
    version: "5.0.0",
    category: "improvement",
    tags: ["landing", "design"],
    title: "A landing page that makes the case",
    summary:
      "The home page is now an argument for hiring a lead front-end developer.",
    body: [
      "The root of the site was rebuilt around a single job: making the case for a front-end lead. An asymmetric hero with a code-built 3D object, a proof strip of real counts, the craft traits each backed by a real page, and a bento of everything else.",
      "The older landing pages didn't disappear — they moved to an archive you can still browse, each behind a banner saying which version it was.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-world",
    date: "2026-07-28",
    version: "5.5.0",
    category: "experiment",
    tags: ["3d", "game"],
    title: "Explore Toronto in 3D",
    summary:
      "Walk a low-poly downtown Toronto like an RPG to reach the rest of the site.",
    body: [
      "A playable, low-poly downtown Toronto. You steer an explorer with the keyboard or an on-screen joystick past the CN Tower and City Hall to glowing exhibits, each of which opens a real feature of the site.",
      "The game core was built test-first, which is unusual for a 3D toy, and it respects reduced-motion and cleans up its canvas properly when you leave.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-vitals-alerts",
    date: "2026-08-05",
    version: "5.10.0",
    category: "improvement",
    tags: ["performance", "monitoring"],
    title: "Real-user performance now raises alerts",
    summary:
      "The vitals dashboard went from a chart you read to a thing that tells you.",
    body: [
      "Real-user Core Web Vitals were already collected and charted. They now feed an alert layer: when a metric slips past its budget across enough real sessions, that's surfaced rather than left for someone to notice on a graph.",
      "The honest-failure work came with it — a degraded read no longer renders as a healthy-looking empty state.",
    ],
    resolvedTicketIds: [],
  },
];
