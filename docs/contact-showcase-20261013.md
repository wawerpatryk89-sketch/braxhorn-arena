# Brax / Danny contact and victory trial

Scope: two fighters for user review; no mesh, texture, rig-weight, combat-attack,
roster design or control layout replacement. Source baseline: 89b94f5dfdbcb0d919255cfb8448cebd7dda8a42.

## Motion

- Both fighters have CONTACT_PUSH and CONTACT_RECEIVE on a shared 1.20 s clock.
- Entry brings forearms together, a brief hold precedes the shove, then the
  receiving fighter uses his existing backward step and returns to guard.
- Baked 60 Hz quaternion motion on the original skeletons; analytical arm IK
  maintains shared hand targets in the hold. No live mesh warping or re-rigging.
- Positional recovery is continuous, wall corrections move the pair together,
  contact does not cause damage or a throw, and recontact has a cooldown.
- These paired actions are enabled only when both actors are Brax or Danny.
  Other pairings retain the preceding behavior.
- Short round win: authored fist raise, 1.5 s, right fist for Brax / left for Danny.
- Match win: existing supplied Mixamo Yelling Out (Krov source) retargeted to Brax;
  existing supplied Victory (Vexa source) retargeted to Danny. No new download
  from Mixamo was possible in the current browser. Source clips are preserved.
- Danny's arena entry now uses his supplied Lead Jab and Punching, then Idle.
- Presentation motions face the audience from either side of the arena.

## Result flow

One result state handles player and CPU winners, timeout and KO. It chooses a
short round win or a full match win. The score is incremented once. The next
round/result overlay waits for the actual motion duration plus settling time.
Other fighters use their existing WIN motion through the corrected common flow.

## Evidence and limits

- audit-contact-showcase.cjs: 16 close-contact configurations, including mirrors,
  directions and walls; 16 result paths (two fighters x two winner roles x
  round/match x timeout/KO). PASS.
- audit-six-input.cjs: 432 direction/button/impact cases across the full roster.
  PASS; existing controls unchanged.
- Software-rendered original textured meshes reviewed at hold, recoil, round
  victory and match victory. This is pose inspection, not a browser motion test.
- Browser QA unavailable: the supported control-browser skill is not exposed.
  No claim of iPhone/Safari playback, frame-rate or full visual acceptance.
- Two pre-existing audits also fail on the unchanged baseline: audit-six-attacks
  expects TEEP where current controls select UPPERCUT; audit-cpu-grab-cooldown
  fails its recovery assertion. Neither is reported as a newly passing gate.

Build: node --loader ./scripts/krov-three-loader.mjs scripts/build-runtime.mjs.
Regenerate the two motion packages with scripts/build-contact-showcase.mjs.

## Follow-up: clean kick pair and visible recoil

- Replaced accumulated ordinary-hit launch pressure with two distinct clean kick actions within 2500 ms of active simulation. A blocked kick breaks the pair; punches and combo sub-hits do not prime it. Existing combo finishers, lethal falls and recovery protection retain their behavior. Applies equally to player and CPU across source fighters.
- Brax/Danny paired contact now lasts 2 seconds: forearm contact, push, both backstep with staged displacement, damped hip/chest counterrotation and arm balance, then smooth guard recovery. Uses their supplied backward walking clips. Both roots retreat; receiver travels farther.
- Reserve the idle silhouette near walls during the pair to avoid a visible correction after release.
- Validation: 14 clean-kick cases (both targets, distinct actions, timeout, block, punches, combo sub-hit, recovery cooldown, reset); 16 contact scenarios and 16 celebration endings; 432 existing input mappings. Software textured mesh reference at 1.10 seconds inspected. Browser/iPhone motion QA remains unavailable in this environment.

## Screenshot regression: passive player remains crowded (version 88)

The close-contact trigger used to clear its timer on hit stun and require both fighters to be unlocked simultaneously. Its separation latch could also remain set indefinitely if fighters re-entered contact during cooldown. Thus isolated walk-in tests passed while passive-player combat could remain crowded.

The final trigger uses root distance alone, evaluated every simulation step: no input, ordinary attack, reaction, cooldown or previous-contact latch can suppress it. The minimum is 36% of the standard fighter height, independent of current pose. Once that minimum is crossed, automatic separation interrupts the current action, including combo. Already-running paired animations and downed/airborne states complete normally. Brax/Danny retreat distances increased to 0.60 m and 0.75 m plus the existing 0.19 m receiver shove; other pairs receive a stronger fallback push.

Validation: new no-input regression fails against version 87 and passes now: 48 close-contact scenarios covering idle, stunned and CPU attack states, both sides, both fighters, stale/no latch, and an artificially active cooldown. Contact must begin within two simulation frames. Passive-player 30-second CPU approach scenarios cover each difficulty; an opponent who stays outside minimum distance need not trigger a push. The 432 input checks now accept automatic separation as the required result when starting inside minimum range; they still require a real hit otherwise and verify the original six clips/control mapping. Short strikes can be cancelled by the distance rule, as explicitly requested. Prior paired-motion/celebration and clean-kick checks pass. No claim of iPhone/WebGL visual verification.


## Faster push (version 89)

User confirmed automatic separation works and requested a faster shove plus a real backward stagger. The current Brax/Danny pair now plays at 1.45x speed: 1.38 seconds total, with the impulse around 0.23–0.39 seconds. The automatic distance condition and strong displacement remain unchanged.

A new animation could not be downloaded: Mixamo's current browser page explicitly requires WebGL. Existing Big Hit To Head, Zombie Reaction Hit, Hit Reaction and Big Kidney Hit were inspected numerically on their rigs; their feet remain essentially planted. They were rejected rather than mislabeled as a backward stagger. A real stagger FBX remains required; no new external animation was downloaded and no claim of improved leg staggering is made.
