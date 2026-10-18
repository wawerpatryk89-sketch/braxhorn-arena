# Mobile feedback corrections

- Nina player and CPU: 0.93 multiplier for action tempo, locomotion cadence and movement speed; synchronized pair choreography retains its shared clock.
- Fighter intro starts preloading on character selection, before arena/start; source remains reused at playback.
- Result portrait is hidden until the requested image decodes, guarded by a request serial; winner art also preloads during celebration.
- Actual torso overlap lasting 2.6 seconds triggers mutual contact even without a held movement key, leaving time for the 0.4-second push before the requested 3-second cap. Deep pressure still triggers sooner; passive proximity alone does not.
- Residual push impulse is cleared on landing/down/get-up transitions. Downed fighters remain exempt from body separation, so walking towards them cannot move them.

Validation: audit-mobile-regressions (exact Nina ratio, selected intro source before start, stale image hidden until decode, approach stationary downed opponent, persistent contact capped); audit-contact-showcase (144 pair cases and 48 celebrations); audit-pressure-trigger (passive proximity/pressure). No physical iPhone browser verification available; network-dependent video start latency cannot be guaranteed eliminated by preloading.

Additional user correction: contact now sets both faces from root ordering at entry and holds opposite orientations throughout the pair, including locked actors. Renderer cancels any leftover presentation turn for mutual contact. Hands use two-bone IK against sampled opponent shoulders/upper torso at the shared animation time; height is capped to a reachable upper-body contact for shorter fighters. Shoulder samples are generated with build-contact-shoulders.mjs. No extra duplicate animation clips are added. audit-contact-showcase now starts every case with deliberately identical facing and locked fighters, asserting both opposite directions throughout.
