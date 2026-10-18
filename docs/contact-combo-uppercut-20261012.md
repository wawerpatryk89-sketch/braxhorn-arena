# Contact, launch and Brax forward P2

Brax forward + P2 now selects UPPERCUT: the first uppercut and recovery from his supplied Uppercut Jab animation (0–1.25 s). Twelve damage, original controls, six distinct base moves. Combo unchanged except for its victim's displacement.

Every landed, unblocked combo finisher launches the victim toward the far arena edge, using the original FLY and landing animation plus world displacement. Krov's finisher now launches too, replacing its former automatic throw. Arena bounds keep both fighters visible without dragging the attacker along. Lethal combo hits finish flying and landing before the round/result screen. Ordinary strong attacks need accumulated impact of 46; pressure decays at six units/second. Ordinary knockdowns have a six-second cooldown after recovery. Combo finishers and KO are exempt; blocked hits never launch.

Pressing into body contact for 160 ms while neither fighter attacks or recovers starts a 500 ms contact hold in the existing supplied defensive poses, followed by a light 240 ms push apart. No new paired hand-grab animation was fabricated. Contact does no damage, does not throw and has a 2.5-second repeat cooldown. Manual throw restrictions for Nina and Danny remain. Escape input can end the contact early.

Validation: 432 original touch/direction attack cases; 144 combo approaches; 72 actual full combo flights (all pairs, both directions), lethal finishes on both player and CPU, blocked finishers and ordinary impact thresholds; 144 short contacts across all pairs, directions and arena edges. Build and syntax checks pass. These are runtime simulation tests; browser/iPhone rendering and tactile playtesting were unavailable.
