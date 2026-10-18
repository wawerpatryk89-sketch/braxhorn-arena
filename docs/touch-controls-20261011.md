# Direction control correction

User reported stuck backward motion and excessive movement speed on iPhone. Pointer capture previously kept a held arrow active while a finger slid to the other arrow. Direction holds now use pointer ownership and coordinate hit-testing: slide changes direction, leaving the arrows stops, releasing/cancelling anywhere clears the owner. A newer opposite direction cancels the older held direction; its late release cannot cancel the new input. Guard remains a separate simultaneous touch.

Brax/Nyxa walking speed is 0.60/0.67 character heights per second (previously 0.85/0.95), about 29% slower. Backward walking stays 80% of forward speed. Source gait rates slow proportionally. Holding forward no longer automatically starts running. Two presses within 300 ms, with a release between them, start the supplied Brax run while the second press is held. Running is 1.4 times walking. Nyxa has no supplied run assigned, so remains in her forward step.

Verified in event-driven game harness for Brax and Nyxa: pointer-captured slide left→right, leaving/re-entering pad, document release, multiple fingers, stale release, lost capture, cancellation, blur, pause, keyboard direction replacement, sustained walk, double tap run, no backward sprint. Contact timing regression passes. Actual iPhone Safari execution unavailable here.
