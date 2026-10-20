# BULL BREAKER — branch acceptance report

Base: GitHub main `934acf497f39f9b7e1da1cda71dfd8ced76bde10`. No deployment.

Ordinary chain uses existing attack buttons: **P1 → P2 → K1 → GRAB → P2 → K2** (keyboard **A → F → S → C → F → G**). This does not spend special energy or replace the existing COMBO. Brax's original config entries, attack hitboxes and original animation payloads are preserved. JUMP is an explicitly authorized addition from the owner's Rokoko pack.

## Steps

| Step | Existing slot / clip | Link after last contact | Hitstop | Scaling | HP damage | Cumulative |
|---|---|---|---|---|---:|---:|
| 1 | LIGHT_PUNCH / Jab Cross (1) | 120–350 ms | 50 ms | 100% | 3 + 4 | 7 |
| 2 | HOOK / Hook | 120–350 ms | 67 ms | 85% | round(11 × .85) = 9 | 16 |
| 3 | MUAY_THAI_ROUNDHOUSE / Kicking | 120–350 ms | 67 ms | 75% | round(12 × .75) = 9 | 25 |
| 4 | THROW_ATTACKER / Shoulder Throw, Aggressor | 120–350 ms after paired release | 100 ms | 65% | round(12 × .65) = 8 | 33 |
| 5 | UPPERCUT / Uppercut Jab | 120–350 ms | 90 ms | 55% | round(10 × .55) = 6 | 39 |
| 6 | HEAVY_KICK / Brax Side Kick | Ends chain | 110 ms | 50%, then +15% | round(12 × .5 × 1.15) = 7 | 46 |

Numbers are player damage before existing CPU difficulty power modifiers. Minimum damage is 1. The two jab-cross contacts are separate physical hits: full chain is **7 hits**, not six fabricated damage events. Existing pair code had its throw damage in the engine rather than config; the same base value 12 is now explicit in this chain's throw data.

## Mechanics and presentation

- Data is under `IDLE.chain` in Brax config. This location preserves compatibility with loaders that treat every top-level config entry as an animation slot. Engine uses generic steps/input/scale/window/type/reaction/tempo/trail/after fields.
- Chain recovery cancellation requires confirmed clean contact; 150 ms buffer, blocked/evaded/expired/interrupted chains reset. Last jab-cross damage group opens the window.
- Paired shoulder throw retains the existing synchronized attacker/victim clips and the existing pre-impact 200 ms escape opportunity. This is Brax's arm/shoulder throw; **a separate frozen neck-clinch mode was not implemented**. Anatomical hand/neck acceptance across all rigs remains unverified.
- Orange/gold sparks, motion trails from the third striking step, a short decaying camera shake, throw/landing dust and radial floor mark. Finisher uses 300 ms at 0.35 speed after its 110 ms contact freeze. Hitstop uses unscaled simulation ticks during this slow-motion so it does not accidentally become a 314 ms freeze.
- Existing impact/heavy/land sounds; optional vibration with a settings toggle and safe absence on iPhone Safari.
- Training guide shows the chain and marks the current step. PL/EN hit count and finisher name.
- Existing WIN_ROUND follows the finisher and cancels on attack, direction or guard input; damage interrupts it. No additional mandatory recovery lock.
- Rokoko Jumping_ROM segment 3.8–5.2 seconds is sampled into a separate 169 KB clip payload. The original model and clip archive are untouched. K2 after the launcher plays its takeoff, then the original side kick with the recorded jump height, then landing. No extra button.
- Opponents use their existing land/down/get-up sequence. The optional PunchingtheGround candidate was inspected structurally but not inserted: it starts standing, descends to kneeling and needs a separately verified transition for each opponent. We do not claim that angry ground gesture is delivered.
- **No wall-bounce or invisible wall was added.** This supersedes that part of the original brief, per the owner's correction. Existing main-branch viewport/camera behavior was not redesigned.
- CPU: easy does not chain, normal stops after three steps, hard performs all six. Host snapshots carry chain step, scale, contact-window clock, input buffer, hitstop, jump/air/flight/display state. Damage remains host authoritative. Guest effects consume confirmed host events.

## Contact adjustments (no source hitbox edits)

1. Clean hook gives a brief push only when necessary to obtain a 0.54 body-height gap for the roundhouse. This addresses very close range and low idle poses.
2. Throw entry uses smooth existing pair alignment with a chain-only approach tolerance of 0.45 body heights. Other pair attacks retain their existing limits.
3. Original shoulder throw lands the opponent behind the attacker. Ground bounce lasts 420 ms, reaches 0.07 viewport heights and returns horizontally toward a 0.32 body-height gap over 250 ms. This is continuous rebound movement; original throw root displacement is committed before it starts.
4. Uppercut runs at 1.8× its existing action tempo. Its launcher lasts 700 ms and reaches 0.11 viewport heights. This lets the real JUMP takeoff and side kick connect within the aerial interval.
5. Side kick runs at 1.4× its existing action tempo while chained. Finisher direction is explicitly away from the attacker after the throw's side switch.

## Verification

PASS:
- `scripts/audit-bull-breaker.cjs`: full physical-contact chain against all 8 opponents in both facings (16), through touch pointer handlers and keyboard handlers, exact 46 damage, plus 14 state/CPU checks (buffer edges, expiry, block, evade, attacker interruption, pre-impact grab break, damage floor/scaling, host snapshot/guest input authority and original-slot preservation).
- Existing combo confirmation: 2688 checks.
- Fair pressure: 5120 cases.
- Combat integrity after fixing unintended CPU chaining in idle training: 912 contacts, 38 misses, 12 recoveries.
- Hit energy: 144 cases; paired clinch: 576; sustained contact: 360.
- Existing CPU policy: 192 matchups/difficulties. Existing energy CPU combo: 72 matchups/directions.
- Expansion gameplay: 134 cases; expansion model checks: 82.
- Existing network rendering audit: buffered interpolation, host-only damage and prediction confirmation.
- Original COMBO and every original slot deep-equal to base (except new nested IDLE.chain). No original clip archive, model, skeleton, weight, texture or hitbox modification.
- Actual skinned mesh software renders inspected at throw, jump preparation and finisher. This is **not** WebGL/browser acceptance and does not validate the combined live particles/audio presentation.

Existing baseline failures, not repaired outside scope:
- `npm test` reaches `audit-rankings.cjs`, then fails because the harness's old `go` element is undefined. Same failure before edits.
- `npm run test:regressions` stops at `audit-v108-fixes.cjs`: synthetic keyboard event has no target, so existing `e.target.closest` fails. Reproduced using original main combat source. Remaining chained scripts in that npm command did not run.

Not verified: physical iPhone/Safari vibration or touch feel, real two-device online session, GPU/WebGL performance and complete in-browser visual acceptance; exact hand/neck alignment/frozen clinch; angry ground gesture. PR remains a draft for visual acceptance, not a claim of perfection.

## Reproduction

`node scripts/audit-bull-breaker.cjs`

`node --loader ./scripts/krov-three-loader.mjs scripts/build-bull-breaker-jump.mjs`

Runtime model/texture/base-clip files are existing external fighter-package inputs, not stored in GitHub main. The jump builder needs those local assets. New clip provenance is in `source-assets/bull-breaker/provenance.json`.
