import base64,gzip,hashlib,json,os,sys
m=json.load(open("deploy-chunks/MANIFEST.json"))
for p,c in m["configs"].items():
    b="".join(open(x["file"]).read() for x in c["parts"])
    raw=gzip.decompress(base64.b64decode(b))
    ok=hashlib.sha256(raw).hexdigest()==c["sha256"] and len(raw)==c["bytes"]
    print(("OK  " if ok else "BAD ")+p)
    if not ok: sys.exit(1)
    os.makedirs(os.path.dirname(p),exist_ok=True)
    open(p,"wb").write(raw)
