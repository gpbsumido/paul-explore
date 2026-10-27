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
    id: "e-mind-reader",
    date: "2026-10-26",
    version: "9.1.0",
    category: "feature",
    tags: ["game", "svelte"],
    title: "The Mind Reader: a party game for two",
    summary:
      "A new game at /mind-reader. One of you is dealt a secret role toward the other, like a bodyguard or a spy after a wallet, and has to drop hints in normal conversation while the other has five minutes to work out what it is.",
    body: [
      "There are 240 roles in six categories, and you can pick a category or play them all. A role doesn't come up again until the deck is used up. Player A sees the role, hides it and starts the clock, then Player B guesses; there's a pause button, a running score and a fresh role for the next round.",
      "It's also the first page on the site written in Svelte, and the write-up covers what that took.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-evar-moved",
    date: "2026-10-25",
    version: "9.0.0",
    category: "improvement",
    tags: ["evar"],
    title: "EVAR sizing practice has moved to medical.paulsumido.com",
    summary:
      "EVAR sizing practice is its own website now, at medical.paulsumido.com. Old links on this site take you to the same page there.",
    body: [
      "The practice, the guide, the plan, your results and the study all moved to medical.paulsumido.com, built as a separate project. The practice itself is at /practice and the welcome page is the homepage. Any link to /evar on this site redirects to the matching page.",
      "Your personal bests and results history were saved in this browser for paulsumido.com, so they don't come with you to the new address, and the welcome page will show again on your first visit. If you joined the research study, your recorded attempts are kept and you're still in it. The write-up on how it was built stays here.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-evar-guide",
    date: "2026-10-24",
    version: "8.4.0",
    category: "feature",
    tags: ["evar"],
    title: "A guide to measuring for an EVAR, and a how-to video",
    summary:
      "EVAR sizing practice has a step-by-step guide to measuring for a repair, with a picture of each step, and a 54-second video on where the calipers go. A first visit now starts on the welcome page.",
    body: [
      "The guide goes through the measurements in the order they're taken, sizes a real case from a maker's table, and ends with what planning a real repair adds, alongside the guidelines and device instructions it was checked against. Anything the results don't count links straight to its step.",
      "The welcome page has a second video showing what to look for on each slice and where the calipers go. A first visit to the practice now lands on the welcome page instead of opening with a popup, and the study question is asked there.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-evar-plan-fees",
    date: "2026-10-24",
    version: "8.3.0",
    category: "improvement",
    tags: ["evar"],
    title: "Clearer costs in the EVAR sizing plan",
    summary:
      "The EVAR sizing plan now shows what running the site costs on its own, with a switch to add a resident's time, the fees for looking after it, and who owns the code and the study data.",
    body: [
      "A resident's time to set each scan's answers was most of every total, and it may well be given for free, so it's now a switch you can turn on. Every total also includes a one-off base fee and a 10% upkeep fee for looking after the site, and the page lists what that covers.",
      "The domain line now says plainly that it depends on the name chosen, and a short section says who owns what: the code stays with its developer, and the study data belongs to the research team.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-evar-welcome",
    date: "2026-10-24",
    version: "8.2.0",
    category: "feature",
    tags: ["evar", "research"],
    title: "A welcome page and a short video for EVAR sizing practice",
    summary:
      "EVAR sizing practice has a welcome page with a 47-second video of how a case works, and the research study question right on the page.",
    body: [
      "The welcome page is where the practice will start once it has a website of its own. It says what the practice is, shows a short video of a case from the first slice to the results, and asks whether you'd like to join the research study.",
      "Answer the study question there and the practice remembers, so it won't ask again. The video has no sound, and everything it shows is written out underneath it.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-evar-plan",
    date: "2026-10-24",
    version: "8.1.0",
    category: "feature",
    tags: ["evar", "research"],
    title: "What EVAR sizing practice is for, and what it costs",
    summary:
      "A new page explains what the EVAR sizing practice is trying to do and what it would cost to run on its own website, with sliders for any number of scans, visitors and months.",
    body: [
      "The EVAR sizing practice is moving to a website of its own. The new plan page says what it's for, a place to practise the measurements behind an aneurysm repair and a study of how that skill grows over training, and then what running it would cost, in Canadian dollars.",
      "Move the sliders to try any size: how many scans, how many people a day, how many scans each, and for how long. Most of the cost is a resident's time to measure each new scan. The servers, storage and domain come to between about $99 and $353 a year.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-8-0-0",
    date: "2026-10-23",
    version: "8.0.0",
    category: "improvement",
    tags: ["evar", "practice", "research"],
    title: "The rebuilt EVAR sizing practice",
    summary:
      "Version 8 brings the rebuilt EVAR sizing practice to everyone, with harder and more realistic cases, three makers' sizing tables, a real CT scan, and a research study that starts fresh.",
    body: [
      "Over the last few updates the EVAR sizing practice was rebuilt. You can zoom and pan the scan, the practice necks are tapered, angled, calcified or lined with thrombus like real ones, graft lengths are measured along the vessel, and you can size a Medtronic Endurant, a Gore Excluder or a Cook Zenith Alpha. There's a real, deidentified CT scan to practise on, a short tour, and a calmer page that shows one job at a time.",
      "Every practice case changed, so earlier results can't be compared with new ones, and the research study starts again: attempts recorded on the old cases are cleared. If you joined the study, you're still in it and don't need to sign up again.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-32-0",
    date: "2026-10-23",
    version: "7.32.0",
    category: "improvement",
    tags: ["evar", "practice"],
    title: "EVAR sizing, faster and ready for more real scans",
    summary:
      "EVAR sizing practice opens on its real CT scan, fits on one screen, scrolls through slices with the mouse wheel, and is ready for many more real scans.",
    body: [
      "The practice scans draw about twice as fast and stop redrawing when nothing has changed. The mouse wheel now moves through the slices the way it does in hospital imaging software, and holding Ctrl or Command while you scroll zooms. On a computer the whole practice fits on one screen, with the measurement list scrolling on its own.",
      "Real scans are now listed in one place alongside their files, so many more can be added without changing the site, and you can pick from them in a list. If a scan can't load, the page says so and lets you try again.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-31-0",
    date: "2026-10-23",
    version: "7.31.0",
    category: "improvement",
    tags: ["evar", "practice", "research"],
    title: "A calmer EVAR sizing page",
    summary:
      "EVAR sizing practice asks about its research study first, then shows one job at a time instead of everything at once.",
    body: [
      "The first time you visit, you're asked whether you'd like to join the study before anything else, and your answer is remembered. After that, measuring and choosing the graft are separate tabs, the scan gets more room, and things you only need now and then, like the viewer controls and the extra landmarks for graft lengths, fold away until you open them.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-30-0",
    date: "2026-10-23",
    version: "7.30.0",
    category: "improvement",
    tags: ["evar", "practice"],
    title: "A tour of EVAR sizing practice",
    summary:
      "EVAR sizing practice offers a short guided tour the first time you open it, so you know where the scan, the measurements and the devices are.",
    body: [
      "It asks before it starts, takes a few clicks, and points at each part of the page in turn, from choosing a level to checking your answers. You can open it again any time from the button under the title.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-29-0",
    date: "2026-10-23",
    version: "7.29.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "A real CT scan in EVAR practice",
    summary:
      "EVAR sizing practice has its first real patient scan: a deidentified CT of an abdominal aortic aneurysm, from an openly licensed research collection.",
    body: [
      "It's the last case on Medium, and you measure it with the same tools as the practice cases. Real anatomy is messier than the practice scans, which is the point.",
      "Until its answers have been measured by hand it isn't scored: you'll see your own numbers, and nothing from it is saved. The scan's source and licence are shown with it.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-28-0",
    date: "2026-10-23",
    version: "7.28.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "EVAR sizing with Gore and Cook devices",
    summary:
      "EVAR sizing practice lets you size a Gore Excluder or a Cook Zenith Alpha as well as a Medtronic Endurant, each graded against its own sizing table.",
    body: [
      "Pick a manufacturer and choose from its devices. The same measurements can call for different sizes from different makers, and one iliac can sometimes take either of two legs on a Gore table, so the results say which sizes would have worked.",
      "The scans also got a little taller, so the iliac arteries have a realistic length to land a graft in.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-27-0",
    date: "2026-10-23",
    version: "7.27.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "EVAR graft lengths, graded",
    summary:
      "EVAR sizing practice now grades the graft lengths you pick, not just the diameters, measured along the vessel instead of straight down the scan.",
    body: [
      "Mark where the aorta splits and where each internal iliac branches off, and the page works out the distances along the vessel. When you check your answers, each leg of the graft has to end safely inside its common iliac without covering the internal iliac, and the results show where it had to land next to where you said.",
      "Neck length is measured along the vessel too. On a neck that leans, that can be quite a bit longer than the slices suggest.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-26-0",
    date: "2026-10-23",
    version: "7.26.0",
    category: "improvement",
    tags: ["evar", "practice"],
    title: "EVAR necks that fight back",
    summary:
      "Every EVAR practice case now has a neck with something real to get wrong: a taper, an angle, calcium or thrombus.",
    body: [
      "Some necks narrow or widen on the way down, so where the neck ends moves. Some lean, which turns the neck into an oval on the scan, and only the short side is the true width. Others have calcified plaque in the wall or a layer of clot lining one side, and the measurement still goes to the outer wall. Each case's debrief explains what its neck does.",
      "The cases changed shape, so results and personal bests from the old versions have been cleared.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-25-0",
    date: "2026-10-23",
    version: "7.25.0",
    category: "improvement",
    tags: ["evar", "practice"],
    title: "Zoom in on the EVAR scans",
    summary:
      "The EVAR sizing scans zoom and pan now, so a two-millimetre tolerance is a fair test on a phone.",
    body: [
      "Scroll, pinch or use the buttons in the corner to zoom up to eight times, and drag to move around. Your calipers measure the same distance at any zoom, and the zoom stays put as you scroll through the slices. It all works from the keyboard too: plus and minus zoom, and zero resets.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-24-0",
    date: "2026-10-23",
    version: "7.24.0",
    category: "feature",
    tags: ["evar", "research"],
    title: "Filtering the EVAR study results",
    summary:
      "The EVAR study now has a results page for its admin, so the recorded attempts can be read without downloading a spreadsheet first.",
    body: [
      "Attempts can be narrowed by level, case, training level, whether the clock ran out and a date range, with how often each measurement landed within tolerance and a CSV of just the rows on screen. It only shows study data from people who consented.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-23-0",
    date: "2026-10-23",
    version: "7.23.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "Your EVAR results over time",
    summary:
      "EVAR sizing practice remembers every case you finish on this device, so you can see whether your measurements are getting better.",
    body: [
      "The new results page sums up each level you've played, charts how many measurements landed within tolerance attempt by attempt, and lists every attempt. It's all kept in your browser, so it works without signing in and nothing is sent anywhere.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-22-0",
    date: "2026-10-23",
    version: "7.22.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "More EVAR cases, realer scans",
    summary:
      "EVAR sizing practice has nine cases now, two more on every level, and the scans look like an abdomen instead of a diagram.",
    body: [
      "Easy gets two more straightforward aneurysms, Medium gets narrow iliacs and a wide one on the left, and Hard gets a neck just short of the usual landing length and an 8 cm sac. Every slice now shows the organs around the aorta too: the IVC, liver, spleen, kidneys, psoas, a full vertebra, bowel gas and the scanner table, with grainy noise like a real scanner.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-21-0",
    date: "2026-10-23",
    version: "7.21.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "EVAR practice scores you",
    summary:
      "EVAR sizing practice now fills the screen with the scan, and every finished case ends in a results popup with stars, points and a personal best to beat.",
    body: [
      "The scan sits in the middle of a dark stage, with the measurements on one side, the device picker on the other, and the slice and caliper controls in a dock along the bottom. Points reward how close each measurement landed and each device that matches the sizing table, with a time bonus on Hard. Stars count measurements alone. Personal bests are kept per level and case on this device.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-20-0",
    date: "2026-10-22",
    version: "7.20.0",
    category: "feature",
    tags: ["evar", "research"],
    title: "EVAR study data can be downloaded",
    summary:
      "The recorded EVAR study attempts can now be downloaded from the site as a spreadsheet, one row per attempt.",
    body: [
      "Each row has the participant's training level next to their measurements, scores and device picks, so the study can go straight into a spreadsheet or a stats package. Participants stay pseudonymous: an id and a training profile, never a name or an email.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-19-0",
    date: "2026-10-22",
    version: "7.19.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "EVAR answers can be corrected",
    summary:
      "The reference answers each EVAR practice case is scored against can now be corrected by hand, without waiting for a release.",
    body: [
      "Each practice case has exact answers computed from its geometry. When one needs correcting, it can now be changed directly, and the next attempt is scored against the corrected value. Results say when a case's answers were set by hand.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-18-0",
    date: "2026-10-22",
    version: "7.18.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "Join a study of how sizing skill develops",
    summary:
      "Signed-in users can opt in to having their EVAR sizing attempts recorded, to compare how accuracy changes over training.",
    body: [
      "Under the practice there's now a research study. If you sign in and agree to the consent text, each attempt you check is saved under a random participant id, with your training level, so results can later be compared across a career. You can see your recorded attempts and withdraw at any time, which deletes everything.",
      "The consent text is a draft while the study waits for ethics approval. Practising doesn't need an account and works exactly the same if you don't join.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-17-0",
    date: "2026-10-22",
    version: "7.17.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "Pick the stent graft after you measure",
    summary:
      "EVAR sizing now asks which main body and limbs you'd use, and checks your choice against a manufacturer's sizing table.",
    body: [
      "After measuring, choose the main body, the limb for the other side, and anything extra on the main body's leg. Your picks are checked against the sizing table for the real anatomy, and against what your own measurements would have given, so you can see whether a wrong choice came from a wrong number.",
      "It uses a manufacturer's public sizing sheet for practice only. It isn't affiliated with the manufacturer and isn't for planning real cases.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-16-0",
    date: "2026-10-22",
    version: "7.16.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "EVAR sizing has Easy, Medium and Hard",
    summary:
      "Pick a level: Easy tells you where to look, Medium is the standard exercise, and Hard gives you the worst anatomy and five minutes.",
    body: [
      "Easy comes with hints on which slices to look at and a bit more room for error. Medium is two cases at standard tolerances. Hard has a new case with a wide, very short neck and a right iliac that needs the biggest limb, and a countdown that hands your answers in when it reaches zero.",
      "Results now open with your score and how long it took.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-15-0",
    date: "2026-10-22",
    version: "7.15.0",
    category: "feature",
    tags: ["evar", "practice"],
    title: "Practise EVAR sizing on CT",
    summary:
      "A new practice page for measuring an abdominal aortic aneurysm before an endovascular repair, scored against exact answers.",
    body: [
      "Scroll through axial CT slices, put calipers on the aortic neck, the aneurysm sac and both common iliac arteries, and mark where the neck starts and ends. Check your answers to see how far off each measurement was and what the anatomy would mean for the repair.",
      "The scans are synthetic CT phantoms rather than patient images, which is what lets every answer be exact. The calipers work with a mouse or entirely from the keyboard.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-14-0",
    date: "2026-10-03",
    version: "7.14.0",
    category: "feature",
    tags: ["fantasy", "nfl"],
    title: "The trade analyzer knows your league's format",
    summary:
      "The NFL trade analyzer reads the league's scoring, lets you try PPR, TE premium and superflex what-ifs, and accounts for the drop or waiver pickup a lopsided trade forces.",
    body: [
      "The analyzer shows the league's real format and can re-score a trade as if it were half PPR, non-PPR, TE premium or superflex. It recalculates from each player's projected receptions instead of applying a rough multiplier.",
      "A two-for-one trade now includes the player the busier roster would have to drop and the free agent the other side could add. A new value-over-waiver row shows how much each side gets above what's freely available at each position.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-13-0",
    date: "2026-10-02",
    version: "7.13.0",
    category: "improvement",
    tags: ["zeroproof"],
    title: "Jump straight to ZeroProof's featured games",
    summary:
      "The biggest underdog and closest game now show when they kick off, with a button that takes you to them on the board, and the board looks a month ahead at most.",
    body: [
      "The two featured cards at the top of the ZeroProof board show their date and time. A Go to date button scrolls you to that game in its day on the board, loading more days first if it's further out than the board was showing.",
      "The board now stops a month ahead. Once you've loaded that far, it tells you to come back later for more games instead of fetching further out.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-12-0",
    date: "2026-10-02",
    version: "7.12.0",
    category: "feature",
    tags: ["fantasy", "nfl"],
    title: "A fantasy football trade analyzer, and projections you can trust",
    summary:
      "Fantasy NFL has a trade analyzer that shows who wins a deal this week, next week and for the rest of the season, and the matchup projections no longer run high.",
    body: [
      "The new Trade analyzer tab lets you pick two teams, search for players and build a trade. It compares each side's best possible starting lineup before and after, so a two-for-one deal isn't judged on raw totals, and shows each player's strength of schedule for the rest of the season.",
      "On the matchups page, projected finals stopped counting points from games that were already over, so a finished week now reads its real score. The scoring-plays ticker can be collapsed and filtered, and clicking a play highlights the players involved in the matchup cards.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-11-0",
    date: "2026-09-29",
    version: "7.11.0",
    category: "feature",
    tags: ["work-portfolio", "architecture"],
    title: "The work portfolio is becoming its own app",
    summary:
      "The work portfolio now has its own repo, build and deploy, and this site is ready to load it at runtime as a micro-frontend.",
    body: [
      "The work portfolio moved into its own repository with its history intact. It builds and deploys on its own, and this site pulls it in at runtime over Module Federation instead of compiling it in.",
      "Nothing looks different yet. The switch is behind a flag that starts at zero, so the move can happen gradually and roll back without a deploy. If the portfolio ever fails to load, the page shows a retry card instead of breaking.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-telemetry",
    date: "2026-09-29",
    version: "7.10.0",
    category: "improvement",
    tags: ["zeroproof", "privacy"],
    title: "Privacy-first, loss-proof analytics for the ZeroProof lobby",
    summary:
      "The ZeroProof lobby now measures how it's used without dropping data or tracking anyone who hasn't opted in: events are queued, batched, and flushed reliably even as you close the tab — and nothing is recorded until you accept the cookie consent.",
    body: [
      "Interactions are queued and sent in small batches rather than one request per event, and a flush fires as the tab is backgrounded (via the browser's sendBeacon) so the last events before you leave aren't lost — the usual silent gap in web analytics.",
      "It's anonymous by design: the device key is a hashed, non-reversible value, there's a per-tab session id, and if you haven't accepted the site's cookie consent nothing is collected at all. Delivery is at-least-once with retries, and the backend de-duplicates so a resend never double-counts.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-release-7-9-0",
    date: "2026-09-22",
    version: "7.9.0",
    category: "feature",
    tags: ["fantasy", "nfl", "zeroproof"],
    title: "Fantasy NFL and a more useful ZeroProof board",
    summary:
      "Fantasy NFL matchups now show scores, starters, win chances and live plays; ZeroProof lets you build a multi-bet slip and browse a clearer board.",
    body: [
      "The new Fantasy NFL page brings weekly head-to-head matchups, each starter's actual and projected points, a calculated win probability and a live scoring-plays ticker that stays in view as you scroll.",
      "ZeroProof now lets you add several picks to one slip, give each its own stake and place them together. Day headers stay visible while browsing, and live or final fixtures close their betting controls. The design-system catalog also reflects 18 components already in use across the site.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-fantasy-nfl-plays-ticker",
    date: "2026-09-22",
    version: "7.8.0",
    category: "feature",
    tags: ["fantasy", "nfl"],
    title: "A live plays ticker for Fantasy NFL",
    summary:
      "The NFL matchups page now shows the real scoring plays behind each score, tagged with whose fantasy team the player belongs to.",
    body: [
      "Real ESPN play-by-play text — not a computed number — tagged with the fantasy team that rosters whichever player it mentions. No fantasy-point delta per play; that would mean reimplementing my league's scoring rules against raw stats, a second source of truth that could quietly drift from ESPN's own total.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-fantasy-nfl",
    date: "2026-09-22",
    version: "7.7.0",
    category: "feature",
    tags: ["fantasy", "nfl"],
    title: "Fantasy NFL matchups",
    summary:
      "Head-to-head weekly matchups for my ESPN fantasy football league, with per-player points and a win probability ESPN doesn't provide.",
    body: [
      "A new NFL sibling to the fantasy basketball matchups page: each week's head-to-head games, team totals, and every starter's actual and projected fantasy points for that week.",
      "ESPN carries no win-probability field for a fantasy matchup, so it's computed from each side's projected final score, with a spread that narrows as a week's games finish rather than reading a mid-week lead as a certainty.",
      "The live plays ticker — a feed of the scoring plays behind each score — is intentionally out of this release; it needs a second ESPN API and only means anything during live games, so it's shipping as its own follow-up.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-multi-bet-slip",
    date: "2026-09-22",
    version: "7.6.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "Build a whole slip of bets at once",
    summary:
      "The ZeroProof bet slip holds as many picks as you like now — tap outcomes to add them, give each its own stake, and place them together. The slip stays docked at the bottom while you browse, and the board's day headers stick as you scroll.",
    body: [
      "Picking an outcome used to replace whatever was on the slip. Now every tap adds a leg — bet both sides, several games, a mix of moneylines and totals — each with its own stake, all placed in one go; a leg drops off as it lands. The slip is docked to the bottom of the screen so it stays in reach while you scroll for more.",
      "Two board tweaks rode along: the 'Sunday, Sep 27' day label now sticks just under the filters as you scroll, so it's always clear which day you're looking at, and a fixture's team colour moved from a thin left bar to a thick strip along the bottom of the card. Betting also closes the moment a game starts, so a live matchup can't be bet by mistake.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-design-detox",
    date: "2026-09-20",
    version: "7.5.9",
    category: "improvement",
    tags: ["design"],
    title: "A site-wide design pass",
    summary:
      "The whole site got a going-over to read as designed rather than generated: cleaner cards, bolder editorial headings, Apple-style squircle corners, and grids that break out of the rigid three-up into an irregular bento.",
    body: [
      "Cards dropped the colored left stripe — the most-cited 'this was generated' tell — and carry their category colour as a small dot instead. Every page now opens with one confident display heading and a numbered section marker, so the site reads like it belongs together rather than a stack of separately styled screens.",
      "Rounded corners became Apple-style squircles (a superellipse instead of a plain arc) wherever the browser supports it, and the card grids stopped being perfectly even — a featured card plus a repeating wide tile turn the thoughts index and the hubs into an irregular bento. Smaller fixes rode along: the little arrows now sit on the text line, and the work-portfolio 'this site' thumbnails match your theme.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-portfolio-playground",
    date: "2026-09-19",
    version: "7.5.0",
    category: "feature",
    tags: ["landing"],
    title: "The home page is a portfolio playground now",
    summary:
      "A rebuilt landing: a switchable portrait hero, a shelf of projects you scroll sideways through, a heading that keeps restating itself, and a field-notes wall that blooms in flowers. Plus a new Surprise page, and light mode in the corners it used to miss.",
    body: [
      "The root of the site is a new design. A portrait hero you can flip between three scenes and pause; a shelf of fifteen projects that travels left as you scroll down (and swipes on a phone); a heading that keeps restating what the polish is hiding — details, tests, accessibility, performance; and a Field Notes section where 'docs and thoughts' grows out of flowers over a drifting wall of app screenshots that name themselves as you hover. Every earlier edition still lives at /discover.",
      "The 'Surprise me' button opens a new /surprise page that spins you to a random feature or lays them all out in an interactive list. And light mode now reaches the particle lab and the work-portfolio demos, which used to stay dark on a light page.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-design-system-effects-gallery",
    date: "2026-09-18",
    version: "7.4.0",
    category: "feature",
    tags: ["design-system"],
    title: "Two dozen new effects, live in the component gallery",
    summary:
      "The design-system gallery now shows every motion and effect component the shared package ships — sparks, blur reveals, glass, 3D and path galleries, particle text and more — each with a live, playable preview.",
    body: [
      "The shared UI package grew a batch of motion and effect components, and the gallery at /design-system now documents all of them: click sparks, blur reveals, star borders, liquid glass, a rubber-band segmented control, a lattice loader, a drifting 3D wall, spinning and path galleries, a momentum slider, hover and link image reveals, portrait heroes, a light bloom, particle and botanical canvas text, a refine frame, and a floating folder. Every one has a real, prop-accurate preview you can interact with, not a screenshot.",
      "They're heavy — canvas loops, 3D transforms, animation frames — so each preview only starts once its card scrolls into view. Opening the gallery stays fast instead of firing two dozen animation loops at once.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-board-visuals",
    date: "2026-09-18",
    version: "7.3.0",
    category: "improvement",
    tags: ["zeroproof"],
    title: "The ZeroProof board got a glow-up",
    summary:
      "Highlight cards for the biggest underdog and the closest game, team-tinted fixtures, a set of new animations, and bets that show up the moment you place them.",
    body: [
      "The board used to be a flat list. Now, above the fixtures, two cards point you at the games worth a look: today's biggest underdog — the longest shot on the board, with what it pays if it lands and a button that drops it straight into your slip — and the closest game, the matchup nearest a coin flip. Every fixture also carries its team's real colour — the actual brand colour for the major leagues — so the board reads at a glance instead of as a wall of grey.",
      "It moves, too: selecting a bet throws off a little spark, borders shimmer, headings resolve from a blur, and the bet slip sits on a frosted iOS-style glass surface — all of which stands down if you've asked your device for reduced motion. And placing a bet now shows on its fixture instantly, rather than after a round-trip to the server.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-past-fixtures",
    date: "2026-09-18",
    version: "7.2.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "Look back at past fixtures on the ZeroProof board",
    summary:
      "A new checkbox on the board shows recently-finished games alongside the upcoming ones — read-only, and you can scroll back up to three months.",
    body: [
      "The board only ever showed what's coming up. Now there's a 'Show past fixtures' checkbox: turn it on and recently-finished games appear too, marked Final, with their closing lines shown for reference (you can't bet a game that's already happened). It reveals a couple of weeks at a time, and a 'Load earlier' button — or the date filter — walks back up to three months.",
      "It's off by default, so the everyday board is exactly as it was. Handy for looking back at how a line moved, or a matchup you meant to bet and didn't.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-compare",
    date: "2026-09-18",
    version: "7.1.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "See how you stack up on ZeroProof",
    summary:
      "A new Compare tab lets you pick a player from the leaderboard and put your record next to theirs — win rate, ROI, sharp score and more, with who leads each and where you'd rank.",
    body: [
      "The leaderboard tells you who's on top, but not how you measure up against a particular player. The new Compare tab does: pick someone from the board and your stats line up beside theirs — win rate, ROI, sharp score, record, volume — with each measure flagging who's ahead and a running tally of who leads more of them, plus where you'd land on the board by ROI. Your own open bets sit right alongside.",
      "It's records only, on purpose: the board is anonymous and everyone's individual picks stay private, so this compares how you've each done, not which side you each took.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-win-celebration",
    date: "2026-09-18",
    version: "7.1.0",
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
    id: "e-zeroproof-1-0",
    date: "2026-09-15",
    version: "7.0.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "ZeroProof is live — a sportsbook with the loss taken out",
    summary:
      "The no-loss sportsbook is fully working now. Lock a simulated deposit for a term, bet real lines against a real ledger, and get the deposit back at the end no matter your record — what you keep is the record itself: wins, losses, ROI, closing-line value, streaks, a leaderboard, and badges. Fantasy matchup betting and shared leagues are in too.",
    body: [
      "The idea was always sports betting without the sting: you can't lose your deposit, so the only thing at stake is how good your calls were. That whole loop runs now — open a Season or Challenge wallet, place a bet with the odds frozen the moment you commit, and every stake, payout and refund is a real double-entry ledger row (with simulated dollars, on purpose — real money is a licensing problem for later). At term end the deposit comes back and the record stays.",
      "Beyond the core: ESPN fantasy matchups are bettable and only show once a league has actually drafted and its season is about to start, real leagues let people share a contest and a bankroll-ranked board, and the settler grades and pays out on a schedule. It's the milestone this version marks.",
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
