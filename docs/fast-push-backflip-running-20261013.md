# Quick contact, Brax backflip, running strikes, victory checks

Based on published v98 / source 19ecd7223c80201e2457230beb35d213eb64212a.

Contact: deep torso overlap initiates the existing authored push immediately. Sustained lighter contact triggers at 500 ms instead of 1400 ms. The same animation, root displacement and sound timeline play at 1.8x, making the paired release last 1 second instead of 1.8 seconds. A 700 ms cooldown limits repeat contact while allowing deep overlap to resolve. No contact damage, automatic throw or crossing.

Brax: a released-and-repressed backward direction within 300 ms triggers BACKFLIP on keyboard or touch. Backward is opponent-relative. The existing supplied Krov Backflip is retargeted to the Brax skeleton without mesh/material changes, with guard transitions and 0.60 H backward travel during its aerial section. Runtime approximately 1.375 s. A single press, slow taps or an ongoing committed attack do not trigger it. Arena bounds apply. No added damage or invulnerability.

Running: forward double tap now has a RUN state for all six fighters. Nyxa, Nina and Danny previously lacked it; the existing supplied Sprint clip was retargeted to their rigs. All six basic attacks carry forward sprint movement through the real direction/button mapping. Hand attacks layer the run cycle on legs only; leg attacks retain their original authored leg motion. Contact timing and authored attack data are unchanged. Direction release stops travel; body collision and arena limits still constrain it. Running resumes without an idle reset.

Victory: existing round/match animations are present on all six rigs. Match celebration selects the overall score winner, including a drawn final round; an overall draw has no winner. Celebration waits for its animation before the result overlay. Player height/jump state resets before celebration.

Validation (Node simulation, actual combat code with mock DOM; skeletal math using vendored Three.js):
- 144 paired contact cases: all 36 ordered matchups, both facings, center/corners.
- 72 natural approach cases: all ordered matchups, passive and active CPU.
- 120 contact deadline/recoil/retreat cases, including hitstop.
- 48 round/match celebrations: player/CPU, time/KO.
- 48 real-input sprint attack cases and 8 backflip cases: keyboard/touch, both facings, center/corners.
- Touch/keyboard direction regression checks for Brax, Nyxa, Vexa and Krov.
- 2462 sampled animation poses: finite transforms, floor clearance, backflip inversion/guard return, unchanged hand contact paths; existing action configurations unchanged.
- Six-rig round/match clip continuity audit passed.

Browser/WebGL playback and physical iPhone/Safari testing were not available in this session. These results validate logic and skeleton transforms, not subjective visual quality or device performance.
