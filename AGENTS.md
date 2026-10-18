# BRA X HORN — deployment-only policy

User instruction, 2026-10-18:
- Do not modify game code, balance, animations, clips, models, textures, configuration or UI. No incidental fixes or improvements.
- Only on the owner's explicit deployment instruction, deploy the specified commit from main in wawerpatryk89-sketch/braxhorn-arena, exactly as provided.
- Do not change tracked files, dependencies or lockfiles while deploying. Build outputs may only be produced by the selected commit's existing build process.
- Report hosting version, selected source commit and SHA-256 comparisons of served JS/CSS/HTML against the exact deployment artifact built from that commit. Do not claim source/build byte equivalence where compilation changes bytes.
- If deployment or validation fails, describe the error and stop. Do not repair anything without a new explicit instruction.
- Do not expose or commit credentials. Runtime secrets belong in environment variables. .env.example contains empty values only.
