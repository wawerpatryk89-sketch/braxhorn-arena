# 2026-10-11 — Nina, Brax, controls and Danny

## Changes
- Nina: original Martelo 2, Martelo Do Chau Sem Mao, Chapa-Giratoria and Armada; Rifle Punch and Illegal Elbow remain the two upper-body actions. Combo uses the supplied Capoeira (1) plus Chapa-Giratoria, with five measured foot contacts. Esquiva remains her defense. No jump, standing block or initiating throw.
- Nina locomotion: full supplied Walking retargeted to her bind pose, instead of a shared boxing step blended to a static ginga. Backward movement uses her own Standing Walk Back. Source rotation tracks, rig, skinning and appearance unchanged.
- Brax: his own full Idle restores the original head posture. Full forward Walking; backward step no longer blended 70% toward a static block pose. No manual neck rotation, silhouette or texture edits.
- COMBO sits at the center of P1/P2/K1/K2. Controls are raised to 22–34 CSS px plus the device bottom safe area.
- Roster uses native touch momentum scrolling, mouse dragging, and suppression of selection during a drag. Legacy parent swipe handlers ignore the roster.
- Fullscreen training/difficulty setup with steel frames, large selectable tiles, clear descriptions and an arena action.
- Danny imported from Denny.zip and the supplied muscular fighter model. His actual mesh is used for the roster portrait; no generated redesign.

## Danny selection
| Action | Source |
|---|---|
| P1 | Lead Jab |
| P2 | Punching |
| K1 | Mma Kick |
| K2 | Kicking |
| Forward + P1 | Hook |
| Forward + P2 | Side Kick |
| Combo | Boxing → Hook → Mma Kick → Side Kick |
| Defense | Left Block, Dodging |
| Intro / win | Taunt |
| Ground fall | Sweep Fall |
| Being thrown | Shoulder Throw, Victim |

His source package lacks a forward walk, forward run, dedicated get-up, and torso-hit clip. Forward Walking, Getting Up and Kidney Hit were retargeted from the supplied shared pool. The shared Flying Back Death supplies the complete airborne launch/landing. A forward run or throw-aggressor is optional for his kickboxing design; no blank buttons are exposed. One duplicated Head Hit is omitted from the runtime set. All raw imported clips remain in source-assets/danny.

## Validation
- 196 combo scenarios: 7 × 7 matchups, both facings, center/edge; all real contact groups, approach and return of control.
- Danny: 168 real strike-contact scenarios, both roles/facings; no repeated damage for one contact group.
- Nina: 144 strike scenarios checked after move changes; input/evade/victim-throw tests pass.
- Danny: six inputs, movement/release, guard, dodge, no free jump, no initiating throw, 10 incoming throw/escape cases, recovery and two-launch KO.
- 24 Nina edge-launch/recovery scenarios remain within arena bounds.
- Original 12-influence skinning retained; all seven models have finite sampled animated geometry.
- Existing direction controls pass captured drag, multitouch, cancellation, blur/pause, walk and double-tap run checks.
- Publication build converts clip Float32 samples to lossless binary encoding and gzips metadata. Every decoded time/value sample is asserted bit-exact. Original source JSON remains under dist; the generated out directory is the deployment output. This reduces loading size without reducing animation samples or texture resolution.

## Verification limit
The available cloud browser cannot create a WebGL context. Menu layout and interactions can be reviewed live, but rendered combat and real iPhone multi-touch/frame rate cannot be certified in that browser. Software renders of the supplied meshes were used to inspect Brax's head posture and Nina's acrobatic pose.
