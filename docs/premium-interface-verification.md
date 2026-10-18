# Premium interface and shared records — 2026-10-15

## Implemented

- Six existing fighter cards now display five numeric, ten-segment attribute meters. `scripts/build-premium-stats.mjs` reads current attack, movement and throw configuration. The relative scale and raw values are recorded in `docs/fighter-stat-method.json`. Combat balance and artwork are unchanged.
- Full-size Wyzwania i rekordy mode card and a dedicated three-card hub for Survival, challenges and the world leaderboard. Overflowing main mode cards have explicit scroll arrows.
- 24 challenges in four categories. A selected task shows its conditions, goal, progress and launch action. Guard challenges prevent choosing Nina, whose current moveset has no guard. Survival task progress persists between opponents in a run.
- Real Worker API and D1 persistence for named players, runs, matches, records and completed challenges. Public top 100, per-mode/difficulty boards and own rank. Guests receive an HttpOnly session cookie; signing in links guest results to the stable Site identity. Local legacy records are retained as local progress, not uploaded as verified online scores.
- Online records require a server-issued match ID. The server checks ownership, duplicate submissions, time bounds, allowed fighters and modes, round consistency, challenge goals and basic result conditions. Scores are accumulated on the server. This is sanity validation of a client-run game, not authoritative server simulation or complete anti-cheat.
- Pending result submissions are retried after reconnecting; permanent validation failures are removed from the retry queue with an error status. Match, run and leaderboard updates commit in one D1 transaction, so a failed leaderboard write leaves the match available for retry.

## Verification completed

- Real browser at 1363 × 936: main menu, hub, challenge list/detail, transition to character selection and filled stat meters. Corrected a script ordering bug, an inherited opaque card overlay and overly wide desktop cards during inspection.
- Real browser iframe at 844 × 390: entry/nickname flow and main mode menu. Main cards stay readable and scroll horizontally.
- `audit-online.mjs`: 20 checks against a real local Worker and D1, including visibility in an independent guest session, duplicate protection, foreign match rejection, invalid time/fighter rejection, cross-origin rejection, restoring profile via the stable identity header, tournament paths with two and three wins, and a match with drawn rounds. A temporary local SQL trigger forces a leaderboard write failure; retrying the same match then creates exactly one result. Identity-header verification is a local server test; hosted sign-in interaction has not been tested.
- `audit-expansion.cjs`: 127 existing/integrated checks.
- `audit-rankings.cjs`: 90 local-cache and boot compatibility checks.
- `audit-drills.cjs`: 24 drill checks, including a real throw escape advancing a challenge.
- `audit-phone-controls.cjs`: 48 touch cases across all six fighters.
- `audit-campaigns.cjs`: Arcade, Survival and tournament flow compatibility.
- `audit-combat-integrity.cjs`: 912 contacts, 38 misses, 12 recovery checks, guard and KO.
- `audit-mode-first-films.cjs`: mode-first navigation and all six fighter films.
- Backend TypeScript check and optimized production build passed.

## Remaining release checks

The browser tool stopped responding while opening the hub in the phone viewport. A recovery documentation request and browser-session reset also timed out. Do not describe the following as verified:

- Phone hub, all challenge categories/details, Survival setup and world ranking at 844 × 390, 667 × 375 and 915 × 412.
- All six character cards after horizontal scrolling on the phone.
- Browser → match completion → online save → leaderboard rendering in the final UI.
- Hosted sign-in and hosted D1 migration/records after publication.

The public game has not been updated during this work. Complete the remaining visual checks before deploying the saved revision at the existing URL. Do not create a separate test Site or change the audience/URL.

## Source and build layout

Original editable game files moved from `dist/` to `game/`. `backend/` contains the supported Sites Vinext Worker starter and API. `build/`, `backend/public/`, `backend/dist/` and root `dist/` are generated. `backend/game.html` is generated from the optimized HTML by `scripts/build-server.mjs`.

Install dependencies at root and in `backend/`. Run `npm run build` at root; it preserves the existing asset optimization pipeline and produces a Worker bundle in root `dist/`. Database migrations are generated in `backend/drizzle/` and copied to root `drizzle/` for Sites packaging. Applied SQL and metadata must remain immutable.

The temporary phone QA page is generated only under ignored `backend/public/`; the production build removes it.
