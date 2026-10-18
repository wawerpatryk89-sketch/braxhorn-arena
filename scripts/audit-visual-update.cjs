const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const html=fs.readFileSync('game/index.html','utf8'),combat=fs.readFileSync('game/assets/combat.js','utf8');
const attacks=Function('return '+combat.match(/const SOURCE_ATTACKS=(\{[^;]+\});/)[1])();
for(const [who,moves] of Object.entries(attacks)){
 if(!['BRAX','NYXA','VEXA','KROV','NINA','DANNY'].includes(who))continue;
 const cfg=JSON.parse(fs.readFileSync('game/assets/'+who.toLowerCase()+'-new/config.json'));
 const sum=c=>Object.values(c.hits||{}).reduce((m,h)=>m.set(h.group,h.damage),new Map());
 const total=c=>[...sum(c).values()].reduce((a,b)=>a+b,0);
 const maxFor=ending=>Math.max(0,...moves.filter(a=>Object.values(cfg[a].hits).every(h=>h.bone.endsWith(ending))).map(a=>total(cfg[a])));
 const damage=[maxFor('Hand'),maxFor('Foot'),total(cfg.COMBO)],method=JSON.parse(fs.readFileSync('docs/fighter-stat-method.json')),expected=method.data[who].values;assert.equal(method.data[who].raw[0],Math.max(...moves.map(a=>total(cfg[a]))),'displayed strength uses current basic attacks');
 if(who==='NINA')assert.equal(damage[0],0,'Nina uses feet for P1/P2; no invented fist power');
 const card=html.split('id="card-'+who.toLowerCase()+'"')[1].split('</button>')[0];
 assert.deepEqual([...card.matchAll(/aria-valuenow="(\d+)"/g)].map(m=>+m[1]),expected);assert(!card.includes('fighter-card-moves'));
}
const env={window:{}};vm.runInNewContext(fs.readFileSync('game/assets/arena-features.js','utf8'),env);const f=env.window.BRAX_FEATURES,p=f.createProgress();p.complete('BRAX','evade5');assert(f.records(p).includes('1/'+f.challenges.filter(c=>!c.exclude?.includes('BRAX')).length+' WYZWAŃ'));assert(f.challengeCard(f.challenges[0],true,0).includes('UKOŃCZONE'));assert(f.challengeCard(f.challenges[0],false,0).includes('ROZPOCZNIJ'));
console.log('PASS: six real-damage comparisons, no move lists, saved achievement status and challenge actions.');
