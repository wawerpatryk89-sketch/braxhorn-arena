"""Restore the exact public v271 inputs into an isolated build directory.

Every byte is checked against the migration lock. Never fall back to an older
GitHub asset or a changed live asset. No account, cookie or credential is used.
"""
import concurrent.futures
import hashlib
import json
import shutil
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "native-source"
BASE = "https://braxhorn-p0-preview.wawerpatryk89.chatgpt.site/"
lock = json.loads((ROOT / "unity-tools/arena/source-lock.json").read_text())

def restore(entry):
    relative = Path(entry["path"])
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError("Unsafe locked input path")
    output = DEST / relative
    expected = entry["sha256"]
    if output.is_file() and hashlib.sha256(output.read_bytes()).hexdigest() == expected:
        return str(relative)
    local = ROOT / relative
    if local.is_file() and hashlib.sha256(local.read_bytes()).hexdigest() == expected:
        data = local.read_bytes()
    else:
        if not str(relative).startswith("game/assets/"):
            raise ValueError("Missing local build input: " + str(relative))
        request = urllib.request.Request(BASE + str(relative).removeprefix("game/"),
                                        headers={"User-Agent": "Braxhorn-Arena-Migration/1.0"})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=90) as response:
                    data = response.read(128 * 1024 * 1024)
                break
            except (urllib.error.URLError, TimeoutError):
                if attempt == 2:
                    raise
                time.sleep(2 ** attempt)
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError("v271 SHA-256 mismatch: " + str(relative))
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".download")
    temporary.write_bytes(data)
    temporary.replace(output)
    return str(relative)

if __name__ == "__main__":
    entries = lock["sources"] + lock["toolSources"]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for index, path in enumerate(pool.map(restore, entries), 1):
            print(f"[{index}/{len(entries)}] SHA-256 verified: {path}", flush=True)
    for name in ("export-source.mjs", "validate-export.py", "source-lock.json"):
        destination = DEST / "unity-tools/arena" / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / "unity-tools/arena" / name, destination)
    loader = DEST / "scripts/krov-three-loader.mjs"
    loader.parent.mkdir(parents=True, exist_ok=True)
    loader.write_text("export async function resolve(s,c,n){if(s==='three')return {url:new URL('../game/assets/vendor/three.module.js',import.meta.url).href,shortCircuit:true};return n(s,c);}\n")
    (DEST / "package.json").write_text('{"private":true,"type":"module"}\n')
    print(f"Restored {len(entries)} exact inputs for site version {lock['sourceSiteVersion']}")
