# Correction to v100: mutual push; Nina hands only in combo

Both fighters now play CONTACT_PUSH on the same frame clock, then both play the full supplied Stumble Backwards fall and their existing get-up. There is no passive receiving fighter. CONTACT_RECEIVE is only a compatibility alias to exactly the same push clip and displacement. The unused passive clip is removed.

Source motion: supplied Pushing and Stumble Backwards. Preserve their local joint rotations on the shared Mixamo axes; the prior bind-pose delta double-rotated some arms. Scale hip translations for rig proportions. Pair spacing uses the sum of both fighters' measured hand reaches. Both retreat curves remain zero through the push and start together at 0.50 animation seconds. Deep overlap/physical pressure remains the trigger; passive proximity does not trigger.

Nina's eight ordinary attacks now all use feet: Chapa giratória, Armada to Esquiva, Chapa, Chapéu de couro, Rasteira, Armada, Meia lua, Martelo from the ground. Fist Fight B is referenced only by the combo, where its two punches lead into Chapa and Armada. Sprint inputs also select kicks for Nina.

Validation: 144 contact scenarios now additionally assert BOTH actors are CONTACT_PUSH on exactly the same frame; 72 natural approaches; six passive-proximity/pressure checks; 144 Nina matchup strikes; combo/roll checks; 48 full running attacks and eight Brax flips. Textured offline renders inspected for all six rigs in three pairs and saved in docs/qa/mutual-push. Source hand/feet-only assertions prevent the two reported regressions.

No iPhone Safari or live WebGL browser verification was available. Offline renders are not browser screenshots. Other attacks, controls and celebrations remain unchanged from v100 except the explicitly requested Nina correction.

Final clarification: both fall only after strong physical overlap/pressure. Timeline: push 0–0.50, complete source fall 0.50–2.00, fallen hold to 2.20, existing get-up to 4.20, guard blend to 4.40 seconds; playback rate 1.25. Baked poses 30 Hz, collision measurements 60 Hz. All six reach a ground pose and return upright; finite bone transforms and end height checked. Fall and recovery textured offline renders inspected. Version 101 was saved but deliberately never deployed because it lacked this clarified full fall.
