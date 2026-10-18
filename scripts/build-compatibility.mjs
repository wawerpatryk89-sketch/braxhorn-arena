// Writes the multiplayer compatibility stamp: backend/lib/build-compatibility.json and game/assets/compatibility.js.
// protocol = wire protocol number (raise it when the network format changes).
// build    = SHA-256 of the client code that decides the fight (combat, multiplayer, peer link, rtc, fighter source).
// configs  = SHA-256 of the 8 fighter configs in roster order; the same value is the ?v= of every config URL (cache busting).
// Usage: node scripts/build-compatibility.mjs
import fs from 'node:fs';
import crypto from 'node:crypto';
const PROTOCOL=3;
const FIGHTERS=['brax','nyxa','vexa','krov','nina','danny','bear','demon'];
const CODE=['combat.js','multiplayer.js','peer-link.js','rtc.js','fighter-source.js'];
const sha=files=>{const h=crypto.createHash('sha256');for(const f of files){const b=fs.readFileSync(f);h.update(f.split('/').pop()+'\0'+b.length+'\0');h.update(b);}return h.digest('hex');};
const stamp={protocol:PROTOCOL,build:sha(CODE.filter(f=>fs.existsSync('game/assets/'+f)).map(f=>'game/assets/'+f)),configs:sha(FIGHTERS.map(f=>`game/assets/${f}-new/config.json`))};
fs.writeFileSync('backend/lib/build-compatibility.json',JSON.stringify(stamp,null,2)+'\n');
fs.writeFileSync('game/assets/compatibility.js','window.BRAX_COMPAT=Object.freeze('+JSON.stringify(stamp)+');\n');
console.log(JSON.stringify(stamp));
