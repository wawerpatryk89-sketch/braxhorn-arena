// Test-candidate balance: only damage; original clips, timings and geometry preserved.
const fs=require('node:fs');
for(const [who,amounts] of Object.entries({BRAX:[6,6,6,6,6,6,12],KROV:[8,8,8,8,12]})){
 const path=`game/assets/${who.toLowerCase()}-new/config.json`,cfg=JSON.parse(fs.readFileSync(path)),asset=cfg.COMBO.asset;
 for(const c of Object.values(cfg).filter(c=>c.asset===asset))for(const hit of Object.values(c.hits))hit.damage=amounts[hit.group];
 fs.writeFileSync(path,JSON.stringify(cfg));
}
