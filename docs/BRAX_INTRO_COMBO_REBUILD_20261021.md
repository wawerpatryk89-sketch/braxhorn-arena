# BRAXHORN — BRAX: pre-fight choreography and combo QA (2026-10-21)

Status: SPECIFICATION / NOT IMPLEMENTED. Based on user-recorded 90dbffad-c668-46ea-a448-efacd0af8a71.mp4, the existing main-branch combat engine, and BRAXHORN_KATALOG_ANIMACJI_V4.xlsx. Do not mark as visually tested. Do not deploy without approval.

## Mandatory intro order

NORMAL_WALK_IN -> DECELERATE -> RELAXED_STOP -> TWO_ACTOR_DIALOGUE -> HAND_CONTACT_HIGH_FIVE -> RELEASE -> TURN_OUT -> NORMAL_WALK_BACK -> TURN_IN -> EXISTING_INTRO -> EXISTING_COUNTDOWN -> FIGHT.

Preserve existing intro after the new pre-fight sequence. New pre-fight only once per match, not every round. Both fighters should be within the viewport and remain grounded. Stable arena camera; no zoom or screen shake. Synchronize two actors on one monotonic clock. Disable damage, hitboxes, attacks, grabs, special and CPU during the pre-fight. Do not restart timer until existing FIGHT. Do not use combat kicks, taunts or approach lunges as walking.

## NEW source candidates — select by visual verification and retarget

| Role | Catalog ID | Original FBX | Source | Constraint |
| --- | --- | --- | --- | --- |
| relaxed-to-walk | BA-0808 | MOB1_Stand_Relaxed_to_Walk_F | MCO V4 / MotusMan v55 | retarget required |
| natural walk forward | BA-0807 | MOB1_Walk_F | MCO V4 / MotusMan v55 | retarget required, sync root displacement and foot plants |
| relaxed stop/idle | BA-0809 | MOB1_Stand_Relaxed_Idle | MCO V4 / MotusMan v55 | no combat guard during dialogue |
| gesticulating speaker A | BA-0806 | Convo_12_Gesturing_Up_C_Center_Loop | MCO V4 / MotusMan v55 | preview: dialogue gestures, not a paired clip |
| gesticulating speaker B | catalogue INTRO_PRZED_WALKA | talk_animate_hands.fbx | Motifect Emotes & Social v1.0 | humanoid retarget required |
| alternative response | catalogue INTRO_PRZED_WALKA | explain_wide_gesture.fbx | Motifect Emotes & Social v1.0 | stagger dialogue by 0.3-0.6s |
| subtle listener response | catalogue INTRO_PRZED_WALKA | Shrugging_mixamo.fbx | Rokoko Studio (Mocap)(2).zip | avoid full-body ungrounded turns |
| high-five initiator | BA-0600 | hifive_9_v1.fbx | Hifive 9 (Fab) | ONE skeleton only; no synchronized partner supplied |

**Critical:** hifive_9_v1.fbx contains only one skeleton per V4 catalog. Never play it on both fighters blindly and claim that they touched hands. Author/retarget a matching receiver clip using verified wrist targets and contact frames; otherwise report missing partner motion and leave feature unapproved. Shaking Hands 1/2 are a handshake, not an acceptable silent substitution for the requested high-five.

Both characters walk towards each other using ordinary locomotion, stop at conversation distance, talk with alternating gestures, high-five at a common contact frame, turn 180 degrees, walk to original start positions, turn back to face each other, then execute original INTRO and COUNTDOWN. No disappearing/repositioning/teleportation. Build a deterministic state machine with cancellation on menu exit, rematch, network disconnect, reset and visibility changes. For online multiplayer host controls phase and contact clock.

## Brax combo / throw issues observed

- Video does not demonstrate a completed combo. Do not claim the combo works from that recording.
- Existing main-branch startCombo() rejects input while B.lock. The separate test branch patch buffers a combo pressed during an active attack and adds contact-driven ring/particle VFX. This is only a first partial fix; run runtime tests.
- Existing sourcePairInput(kind) accepts only evade/grab during a 200ms pair, not P1/P2. Existing beginSourcePair(B) is a proximity-sensitive single throw, not the two requested CHWYT+P1/P2 distinct techniques. Implement real separate attacker+victim clips, input hold state, and proper contact distance. Do not fake an implementation by aliasing both inputs to the same throw.
- Main branch already has a short finisher slowdown and camera kick. No confirmed BRAX-specific start energy ring, motion trails or ground shockwave in the tested recording.

## Required BRAX combo QA

1. Verify Brax's actual COMBO sequence and finisher against approved master. Compare actual source clip names and contact groups; never assume animation from its label.
2. Train mode: energy 100%, COMBO press when idle, after P1/P2, while advancing, from both sides, from edges, vs each of eight opponents. Log accepted/queued/rejected, reason and each contact group.
3. CHWYT+P1/P2: hold GRAB and tap P1 or P2; separate technique and paired victim reaction; verify proximity windows, no opponent teleport, no control lock.
4. FX: activation ring, directional contact sparks, hand/foot motion trail, brief finisher slow-down, landing dust/ground wave and low-frequency impact audio. Event-driven; don't trigger effects for blocked/missed attacks. Phone vibration only where supported.
5. Test with WebGL/iPhone/Android/desktop and real multiplayer; do not claim these tests if unavailable. Keep a clean rollback path and do not deploy without approval.
