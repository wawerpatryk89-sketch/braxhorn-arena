"""Report CI capability without disclosing any credential or downloading Unity."""
import hashlib
import json
import os
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[2]
names = ("UNITY_LICENSE", "UNITY_EMAIL", "UNITY_PASSWORD", "UNITY_SERIAL")
present = {name: bool(os.environ.get(name, "").strip()) for name in names}
credentials = present["UNITY_EMAIL"] and present["UNITY_PASSWORD"]
activation = credentials and (present["UNITY_LICENSE"] or present["UNITY_SERIAL"])
lock = json.loads((root / "unity-tools/arena/source-lock.json").read_text())
entry = lock["toolSources"][0]
url = "https://braxhorn-p0-preview.wawerpatryk89.chatgpt.site/" + entry["path"]
asset_status = "unavailable"
try:
    request = urllib.request.Request(url, headers={"User-Agent": "Braxhorn-Arena-Migration/1.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read(2 * 1024 * 1024)
    asset_status = "verified" if hashlib.sha256(data).hexdigest() == entry["sha256"] else "wrong-baseline"
except Exception as error:
    # Exception text can contain URLs/headers. Log only its class and HTTP status.
    asset_status = type(error).__name__ + ":" + str(getattr(error, "code", "connection"))
report = {"credentialPresence": present, "activationInputsAvailable": activation,
          "publishedSourceProbe": asset_status, "scope": "CI preflight; no Unity build or device test"}
Path("arena-ci-preflight.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as summary:
    summary.write("### Arena Unity CI prerequisites\n```json\n" + json.dumps(report, indent=2) + "\n```\n")
with open(os.environ["GITHUB_OUTPUT"], "a") as output:
    output.write("activation=" + str(activation).lower() + "\n")
    output.write("source=" + str(asset_status == "verified").lower() + "\n")
