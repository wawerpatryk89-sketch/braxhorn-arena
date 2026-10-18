# Full supplied contact, moving strikes and Nina's eight moves

## Source and behavior
- `source-assets/brax-contact-20261013`: supplied Pushing, Stumble Backwards, Dodging Back FBX. The complete Pushing clip is sampled before the backward dodge, rather than the previous cut to 0.55 s mixed mostly into guard. All six rigs receive the same source sequence. No new fall/throw is invented. Contact remains non-damaging.
- Trigger: deep root overlap or accumulated attempted movement into a physically touching opponent. Passive proximity does not accumulate pressure. The push remains visible before the fast authored backward dodge; common wall correction is used while the pair fits, individual bounds when the full retreat would exceed the arena.
- Moving attacks: every basic forward attack preserves movement; sprint hand inputs select hand attacks rather than the standing directional alternatives. Vexa's sprint K2 uses her existing flying kick, Nina's sprint K2 her high Armada. Original kicking legs are retained. Running legs layered under punches use floor IK without moving the hands or torso.
- Brax double-back backflip and all six round/match celebrations remain as in v99.
- Nina: two hand combinations from supplied Fist Fight B; Chapa, Chapéu de couro, Rasteira, Armada, Meia lua, Martelo do chão. Neutral four buttons + forward four buttons. Combo joins two hand contacts, Chapa, Armada. Bounded approach keeps hand follow-up in reach. Source contacts, not larger fictitious hit boxes.
- Nina double-back uses supplied Esquiva 1 backward roll. At the arena edge, visual confinement takes precedence over retreat distance. Idle alternates ginga and a supplied esquiva, remains immediately interruptible and does not add automatic damage or invulnerability.
- No models, materials, textures or skin weights replaced.

## Verification
- 144 contact scenarios: all pairs, both facings, center and walls; no crossing, damage or stuck actions.
- 72 approaches: all pairs against idle and sparring CPU.
- 48 moving attacks: real controls, both facings, entire strike followed by RUN, release stops movement.
- 8 Brax backflips, 8 Nina rolls: keyboard/touch, both facings, center/walls; no phantom damage.
- 144 Nina matchup strike cases, including opposing fighter attacks against Nina.
- Nina combo against all six opponents in both directions: all four contacts against five opponents; three including finisher against Nina's evasive idle. A visually missed kick does not deal phantom damage.
- 48 victory scenarios: player/CPU, round/match, timeout/KO.
- 5752 skeletal poses: finite transforms, preserved other fighters' attacks and celebrations, unchanged hand paths under run layering, backward roll inversion.
- Offline textured model render inspection: contact and push poses on all six rigs; running punch leg-floor correction. The contact montage uses unconstrained source world travel, so the final panel can leave the offline camera; in-game arena confinement was tested separately.
- Build packs exact Float32 animation samples.

## Limit of verification
No live WebGL browser or iPhone Safari playback was available in this environment. Offline renders and logic tests do not establish full device-level visual acceptance. Do not describe this version as visually perfect or iPhone-certified.
