# Automatic contact in training

Reproduced failure: at close range with no direction held, no automatic contact occurred. Sparring AI could start an attack before the short contact timer completed. Movement could also cancel the small outward impulse.

Contact now depends on proximity alone and is checked before the CPU decision. It waits for an active ordinary attack to finish rather than clearing the proximity timer. Combo, recovery and airborne exclusions remain. The existing half-second defensive contact is followed by a 280 ms displacement of 0.18 fighter-world heights per fighter; voluntary movement/AI approach pauses until displacement completes. No throw or newly authored grab pose was added. The 2.5-second repeat cooldown remains.

Runtime checks: 288 training cases (six players × six CPUs × four behaviors × two directions), no direction button held, including hard sparring with immediate AI readiness. Each case must start and release contact and increase the gap by more than five percent of arena width. Original touch/direction attacks and contact edge tests also pass. Visual iPhone/Safari validation remains unavailable.
