# Brax: seven-animation integration (test only)

All seven original GIF byte hashes verified against DANE.json. ZIP central directory was truncated; local entries recovered with CRC verification. Selection GIF contains all 53 frames, including frames absent from the truncated PNG directory. No original animation pixels changed.

| Action | Playback | Contact |
|---|---|---|
| Idle guard | frames 0–7, 160 ms each, looping | none |
| Light punch | frames 8–14, 480 ms | frame 10 |
| Evade | 710 ms | evasion frames 3–6 |
| Heavy punch / counter | 810 ms | frame 9 |
| Low evade / uppercut | 755 ms | frame 6 |
| Heavy kick | 770 ms | frame 6 |
| Roundhouse | 855 ms | frames 9–10, one damage group |
| Selection celebration | original 53 frames / 6790 ms | selection only |

World roots and floor anchors are fixed throughout each new move, preserving the artist's weight shift. Combat scale is shared across these 600/672-pixel canvases. Per-frame durations are explicit in brax-data.js, maintained by scripts/integrate-brax-seven.py. Both player and opponent respect the light punch's start frame. Idle never enters the punch frames.

Evasion protects only its reviewed animation frames, for either fighter. No instant backward teleport for Brax's dedicated evade. Existing directional controls and other moves without new replacements are retained. Unreferenced replaced GIF payloads removed; original source pack untouched.

Verification: source pixel-hash and simulated combat regressions. Real iPhone playtest still required for subjective feel and frame pacing.
