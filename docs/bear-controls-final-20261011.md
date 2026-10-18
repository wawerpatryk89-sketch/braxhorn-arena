# Five-fighter release — 11 October 2026

## Changes

- Brax idle: replaced a 0.32-second guard fragment stretched over 2.2 seconds with a retargeted full 3.3-second Fighting Idle loop. Mesh, materials, skeleton and skin weights are preserved. Head travel is 21.66 source pixels and the loop has continuous joint transforms.
- Brax/Nyxa combo entry distances now match actual bone contacts. Brax and Bear contact windows sample the moving striking bone across a short interval; each group deals damage once. Both fighters shift together during an edge combo so wall correction cannot pull the target out of the series.
- Both fighters are confined after normal movement, root-motion commits, throws and recovery. No offscreen opponent remains unreachable.
- Grapple input reads CHWYT, changes to RZUT or ZERWIJ during a hold, and permits a reachable standing target in hit reaction. Paired throw motion and single landing damage are retained.
- Removed free-jump states and all public jump input routes, plus the unused down button. Ten touch controls remain: five movement/defence/grapple and four strike buttons plus combo. Forward+P1/P2 exposes the remaining two basic attacks.
- New Walking FBX is retargeted to all five preserved rigs for distant approach, with cadence matched to movement speed. Close range switches back to each fighter's combat step. It also works after getting up when separation warrants an approach.
- Added Bear with six distinct basic attacks, a shoulder advance followed by heavy punches and uppercut launch, defence, throws, falls, recovery and an entrance.
- Roster uses five horizontally draggable cards with explicit player/opponent selection. Empty badges are hidden. Mode-screen margins use matching background artwork without stretching its controls.
- Full-resolution textures converted to pixel-identical lossless WebP. Original PNGs and unused clip candidates retained outside deployment. Runtime only loads selected fighter pair; metadata permits menu navigation before 3D initialization.

## Fighter distinction

| Fighter | Six basic source clips | Combo identity |
|---|---|---|
| Brax | Jab Cross (1), Hook, Mma Kick (1), Kicking, Boxing, Kicking (2) | Seven contacts; heavy boxing series and finishing kick |
| Nyxa | Body Jab Cross, Hook, Mma Kick (1), Mma Kick (1) (2), Illegal Elbow Punch, Illegal Knee | Seven contacts; sustained series and spinning kick |
| Vexa | Boxing, Boxing (2), Pontera, Roundhouse Kick (1), Armada, Flying Kick | Five contacts; rotation and jumping kick |
| Krov | Jab Cross, Hook Punch, Mma Kick, Kicking, Illegal Elbow Punch, Uppercut | Close punches, elbows and paired throw |
| Bear | Jab Cross, Smash, Bencao, Knee Jab, Standing Sprint Forward, Surprise Uppercut | Shoulder contact, overhead punches, uppercut launch |

161 source FBX animation files parsed across the five current character packs; five exact duplicate candidates identified and excluded from active duplication. Three new approach/taunt files also imported for comparison. Happy Walk and new Taunt remain archived candidates; Walking is selected. No core walk/defence/hit/fall/get-up/throw/combo state is missing. Shared grip and approach animations are intentional.

## Verification

- 100 real combo-entry scenarios: five attackers × five defenders × both facings × centre/edge. All configured contact groups land on an idle target and control returns.
- 360 new-character basic-strike cases against all five body types, both facings and both player/CPU roles. Guarded/distant Krov combo cannot grab.
- 50 paired-grapple cases; capture, throw, release, escape, range protection and one landing damage.
- 100 edge launch/recovery cases; both actors visible and reachable.
- 15 distant-approach, post-getup and input-release cases. Direction capture, switching, multitouch, cancel, blur, pause, walking and double-tap run checks pass for all five.
- All five original weighted meshes pass sampled animated-geometry checks; no invalid vertex transforms or lost extra skin weights. Brax short steps and idle loop checked in source pose sampling.
- Bear: six inputs, animated idle, run, guard, evade, combo and second-airborne-launch KO pass.

These are source/engine tests. The cloud browser reports WebGL disabled, so rendered 3D quality and performance on the user's phone are not certified by this audit.
