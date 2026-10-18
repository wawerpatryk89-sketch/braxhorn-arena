# Persistent torso contact correction

The former audits teleported fighters into contact and missed interruptions seen during ordinary exchanges. Added movement-driven approach coverage for all 36 ordered pairs versus both idle and active CPU.

Contact detection now also uses the body-region hurt capsules, excluding hands and feet. A 15% torso-envelope overlap counts as contact; 45% is deep overlap and separates immediately. Existing root and pelvis checks remain as fallbacks. Contact resets after 320 ms of sustained separation or immediately on a substantial retreat. This prevents transient pose/recoil distance changes from continuously restarting the 1.4 s deadline. Ground, knockdown, pause and intentional paired-grab exclusions remain.

Validation: 72 natural approach scenarios, 120 deadline scenarios including transient recoil regression, and 144 paired-contact scenarios. Passive CPU diagnostics also ran across all 36 pairs; no automatic push is required when fighters remain apart or execute an intentional throw/knockdown. Visual behavior on the user's phone remains unverified. No animation assets changed.
