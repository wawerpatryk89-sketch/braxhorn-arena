// Idempotent tuning of damage and recovery only; clips, hit windows and rig stay intact.
const fs=require('fs');
const tuning={BRAX:{LIGHT_PUNCH:{damage:[4,5]}},NYXA:{LIGHT_PUNCH:{damage:[5,5]},HEAVY_PUNCH:{damage:[12]},ELBOW:{damage:[10]},CLINCH_KNEE:{damage:[12]}},DANNY:{HEAVY_PUNCH:{seconds:.85}},NINA:{HEAVY_PUNCH:{seconds:.85},HEAVY_KICK:{seconds:.90},SPIN_KICK:{seconds:.85}}};
for(const [who,moves]of Object.entries(tuning)){
 const path=`game/assets/${who.toLowerCase()}-new/config.json`,cfg=JSON.parse(fs.readFileSync(path));
 for(const [move,tune]of Object.entries(moves))for(const c of Object.values(cfg).filter(c=>c.asset===cfg[move].asset)){
  if(tune.damage){const groups=[...new Set(Object.values(c.hits).map(h=>h.group))].sort((a,b)=>a-b);for(const h of Object.values(c.hits))h.damage=tune.damage[groups.indexOf(h.group)];}
  if(tune.seconds){const first=Math.min(...Object.keys(c.hits).map(Number)),last=Math.max(...Object.keys(c.hits).map(Number));const p=c.phaseTempo||{first,last,startup:1,recovery:1};const speed=(c.playbackRate||1)*1.1*(who==='NINA'?.93:1);const fixed=c.durations.reduce((s,ms,i)=>s+(i<=p.last?ms/1000/speed/(i<p.first?p.startup:1):0),0),rawRecovery=c.durations.slice(p.last+1).reduce((s,ms)=>s+ms/1000/speed,0);if(tune.seconds<=fixed)throw Error('Recovery target cannot shorten active motion');p.recovery=rawRecovery/(tune.seconds-fixed);c.phaseTempo=p;}
 }
 fs.writeFileSync(path,JSON.stringify(cfg));
}
