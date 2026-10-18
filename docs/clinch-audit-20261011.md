# Gameplay audit and clinch repair — 2026-10-11

## Confirmed issues repaired
- Close-contact grabs rejected because gap tolerance was applied to the whole pair instead of each participant's allowed correction. Each actor still moves at most 0.08 H for alignment.
- One shared 127.75 px pair gap left Brax's gripping hand about 44 px horizontally away from Nyxa's wrist. Per-pair gaps are now computed from the supplied shoulder-throw pose: Brax→Brax 104.37, Brax→Nyxa 83.51, Nyxa→Brax 126.67, Nyxa→Nyxa 105.80 canonical pixels. Initial vertical wrist differences are 0.67–18.41 px; no joint or geometry editing. This is numeric alignment, not GPU visual approval.
- Hold expired after 350 ms. It now lasts up to 1.2 s. C at close contact grabs; another C within 600 ms queues a throw (first 200 ms remain escapable). Down+C still queues grab/throw; U releases. The control displays RZUT while holding and ZERWIJ for the defender. Existing complete 1.5 source-second throw runs at 2.5× (600 ms), respecting the total hold limit. Brax landing damage 12, Nyxa 11, once only.
- Guard incorrectly prevented grabs; grabs now bypass it. Get-up and short regrab protection still reject grabs.
- Grounded/downed characters incorrectly took part in standing push separation. Excluded during recovery.
- Knockdowns could retain the player's jump controller. It is now cleared.
- Voluntary attacks kept post-get-up invulnerability. Both player and CPU attacks clear it; get-up protection returns to master 350 ms.

## Walking
Brax forward step uses the supplied Medium Step Forward (1), retargeted to the new Brax bind pose and limb lengths (leg ratio 1.06898). This was the Nyxa-shaped clip in the new Brax archive; it is no longer copied blindly across rigs. Only the animation tracks were retargeted, not the Brax mesh, skeleton, textures or weights. Runtime root height keeps a supporting foot/toe at the ground. Travel speed remains the slower v58 value; normal gait plays at 1×. Single hold walks; double tap and hold runs. New Brax combo uses supplied Uppercut Jab (six hand contacts) followed by Kicking (seventh/finishing contact), 3.67 seconds at 1.6×. Intro is Running Forward Flip then Warming Up, 7.4 seconds, with planar root extraction to stay in the fighter staging position. Old Krov model, motions and renderer removed from the published assets at user request; disabled roster slot awaits new Krov assets.

## Verification
PASS: eight ordered Brax/Nyxa pair/direction combinations through real C button events, physical contact range, C→C throw, landing once, recovery, guard bypass, protected defender, distant rejection, neutral timeout; source skinning and 8-influence conservation; short-step finite poses and near-ground feet; moving guard seams; regenerated bone-centred hitboxes; forward/backward pointer transitions and multi-touch; contact timing; both fighter controls and both attack directions; two-launch KO for player and CPU; basic attack and Nyxa combo duration; existing Brax recovery/escape audit.

Limits: no browser/GPU/iPhone visual playback available. Legacy audit-krov.cjs cannot run because it still expects deleted dist/assets/brax-data.js; this is a stale test, not a passing Krov audit. Vexa and complete distinct master clinch variants are not certified by this work. Current Brax/Nyxa paired action is the supplied shoulder throw; a full authored holding loop, push, and paired clinch knee are not supplied/integrated as complete separate pairs. No claim that all game features are finished.

Rebuild: source import → source-import/retarget-step.mjs → build-new-fighter-config.mjs → align-source-grips.mjs. The latter computes per-pair grip gaps after config generation.
