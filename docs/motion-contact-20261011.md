# Brax / Nyxa: movement and contact correction

Updates the existing 2.5D combat presentation: unchanged source 3D meshes, textures, skeletons and attack clips, side orthographic camera, one-axis movement.

- Replaced frozen idle with a 2.1-second looping quiet guard segment from the supplied clips. Brax uses Knee Jabs To Uppercut 4.70–5.60 s; Nyxa uses Hook 0–0.22 s. A short overlap blends the seam. This is a temporary reuse of existing motion, not a newly supplied dedicated idle animation.
- Added per-action playback rates, shared by visual animation and combat timing. Brax knee chain plays at 2.2×; individual attacks use 1.4–1.7×. No source attack poses or chronology were rewritten.
- Walking follows master values: Brax 0.85 H/s, Nyxa 0.95 H/s; backward 80%. Combo approach uses walking speed instead of the former 60%-screen/second slide. Gait rates adjusted separately.
- Contact windows are attached to actual hand/elbow/knee/foot joints. Brax knee chain now uses three right-knee contacts plus the right uppercut, rather than selecting peaks of the reaching hands. Jab-cross clips now include both hands.
- Added capsule regions for head, torso and legs to avoid hits in empty corners of an enclosing rectangle. CPU checks every visited attack frame, including frames crossed at accelerated playback. One damage event per contact group remains enforced.
- Torso separation remains active during attacks, accounts for animated body position, and respects arena boundaries. Paired clinches retain their own logic.
- Facing remains fixed during a source attack. Input queue accepts one command only during the final 100 ms. Transition blending uses the simulation clock and therefore stops during pause/hitstop.
- Source fighters render once per display frame with fractional animation sampling for both participants.

Validation: audit-new-fighters.cjs, audit-contact-timing.cjs, audit-source-motion.mjs pass. Tests cover both facing directions, distance misses, finite actions, contact multiplicity, fast CPU frame traversal, master movement speed, locked-body separation, buffering, exact source joint/contact correspondence, and loop continuity. Guard foot travel stays below 6 pixels on the 1024×640 source canvas. Original mesh, texture and clip payloads unchanged from version 51.

Verification limit: no browser/GPU or physical iPhone run was available. These are numerical rig and game-logic checks, not a visual acceptance report.

Inherited limitations: supplied move list still does not fully match the production master. Brax has no supplied forward-walk clip (the previous backward-step mapping remains); dedicated idle, missing falls/jumps/grabs and matching reactions still need source assets. The two separate newly uploaded FBXs were inspected but not assigned to either fighter because their intended character/action was not specified.
