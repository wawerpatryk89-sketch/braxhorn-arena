# CPU balance and training contact

All six CPU fighters share difficulty policy: easy reaction 380 ms / decision cooldown 900 ms / defense chance .22; normal 180 / 280 / .60; hard 130 / 100 / .86. Actual animation windups/recovery still apply. Nina retains her existing evasive move with a reduced defensive selection rate, and varied foot attacks. Other fighters can favor a fast counter under pressure. No new animation, control or damage multiplier was introduced.

Repeated hits no longer restart an already-playing hit-reaction clip from its first frame. Damage and brief stun still apply to both sides. Recovery returns to idle and allows a level-dependent next decision instead of trapping CPU in a defensive loop. Medium and hard CPU can spend earned energy on at most two combos per round with an 18-second minimum interval. Throw cooldowns remain 12/10/8 seconds.

Active-pressure simulation: one seeded 45-second relentless Brax jab/approach scenario per CPU and difficulty, health replenished to keep observing behavior. Aggregate CPU damage dealt: easy 172, normal 460, hard 683. Damage received: 2229, 1953, 1675. This demonstrates aggregate separation, not calibrated human win rates; individual styles and random action order still vary (Nina easy outperformed normal in this particular pressure scenario). Raw results are in cpu-active-pressure-20261012.json.

Checks passed: 108 passive-target matchup/difficulty cases with actual CPU hits; 432 original touch/direction attacks; 72 CPU combos; 72 player combo launches plus KO/block/down thresholds; 288 automatic training proximity cases. Original control DOM and Nina idle preserved. No real Safari/iPhone visual or human playtesting was available.
