# Brax: supplied guard, recovery and shoulder throw

Source files were verified against all 65 rest-pose bones of Brax (maximum difference 5.17e-8). No mesh, texture, logo, skeleton or weights changed. Both Fighting Idle files have identical animation data; only one is bound.

- IDLE now plays Fighting Idle with a 120 ms seam blend, retaining source poses.
- Sweep Fall supplies FALL/LAND/DOWN and KO. Kip Up supplies GETUP, 650 ms gameplay duration, followed by 350 ms protection. KO holds on the ground.
- Shoulder Throw Aggressor/Victim use one clock, source interval 2.3–3.8 seconds (approach walk omitted), 1.8x playback. Both retain source skeletal choreography, common depth/orientation, and relative root trajectory. Landing at source 3.5 seconds deals 12 HP once.
- Close range: C enters the grip. Down+C queues the throw after the 200 ms defender escape window. Defender C within that window escapes. No decision within 350 ms releases; total grip plus throw remains below 1.2 s.
- This supplied move is a shoulder throw; it is not presented as the master document's exact Brax side-topple choreography.
- Pair currently enabled only BRAX versus BRAX, in both player/CPU roles. Other rigs are rejected, not given a mismatching block animation. Universal four-fighter retargeting is not complete.
- Rockin' Shackle B is retained as source but not bound; partner A is absent.
- Camera crop for victim is shifted with matching sprite pivot so long throw travel is not cut off. This changes only offscreen framing, not world placement or model proportions.

Validation: numeric skeleton and seam/contact checks, two-direction pair simulation, one landing event, escape window, distant rejection, recovery for both fighters, and KO hold. Side-view skeleton contact sheet inspected. No GPU/browser/iPhone visual QA: supported control-browser capability unavailable. Existing known combat clipping and appearance issues outside this change are not claimed fixed.
