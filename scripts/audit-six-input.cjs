const{createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto'),cp=require('node:child_process');
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'],base='b6964bdfebc66fa7d3605592e83032a52f2ec092';
const code=fs.readFileSync('game/assets/combat.js','utf8'),moves=Function('return ('+code.match(/const SOURCE_ATTACKS=(\{[^;]+\});/)[1]+')')();
const controls=s=>s.slice(s.indexOf('<div id="controls"'),s.indexOf('<button id="trainingReset"'));
assert.equal(controls(fs.readFileSync('game/index.html','utf8')),controls(cp.execFileSync('git',['show',base+':game/index.html'],{maxBuffer:2e6}).toString()),'Control DOM changed');
(async()=>{let cases=0,separations=0;const results=[];
for(const [slot,name]of names.entries()){
 const g=await createGame(844,390,true),t=g.test,{B,O,S,K}=t;await g.start();t.selectSlot(slot,true);await g.flush();await t.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 const raw=JSON.parse(zlib.gunzipSync(fs.readFileSync('game/assets/'+name.toLowerCase()+'-new/clips.json.gz'))),signatures=[];
 for(const move of moves[name]){const c=t.CFG()[move];assert(c.attack&&Object.keys(c.hits).length);signatures.push(crypto.createHash('sha256').update(JSON.stringify((c.sequence||[{clip:c.clip}]).map(s=>raw[s.clip].tracks))).digest('hex'));}
 assert.equal(new Set(signatures).size,moves[name].length);
 for(const cpu of names){t.selectOpponent(cpu);t.setupOpponent();for(const face of [1,-1])for(let index=0;index<moves[name].length;index++){
  g.send('blur');g.proof.reset();S.training=true;S.trainingBehavior='idle';B.x=face===1?35:65;O.x=50;t.faceOpponents();
  const c=t.CFG()[moves[name][index]];O.x=B.x+B.face*t.attackDistance(c,t.opponentHurtbox(),B,O)*(moves[name][index]==='SHOULDER'?.65:1);t.faceOpponents();
  const direction=g.buttons.find(x=>x.dataset.hold===(face===1?'right':'left'));
  const kind=index<4?['punch','heavy','kick','kick2'][index]:['punch','heavy','kick','kick2'][index-4];
  if(index>=4){direction.dispatch('pointerdown',{pointerId:8});g.step(16);}
  const button=g.buttons.find(x=>x.dataset.tap===kind);button.dispatch('pointerdown',{pointerId:9});let separated=!!S.clinch?.contact;if(!separated)assert.equal(B.a,moves[name][index],name+' wrong action '+index+' facing '+face);
  button.dispatch('pointerup',{pointerId:9});if(index>=4)direction.dispatch('pointerup',{pointerId:8});
  g.step(4000,()=>{separated ||= !!S.clinch?.contact;});assert(O.hp<100||separated,name+' '+moves[name][index]+' missed without automatic separation '+cpu+' facing '+face);if(separated&&O.hp===100)separations++;assert(!B.lock&&!B.anim,'Control stuck');cases++;
 }}
 results.push({fighter:name,attacks:moves[name].map((action,i)=>({control:i<4?['P1','P2','K1','K2'][i]:'PRZÓD + '+['P1','P2','K1','K2'][i-4],action,clip:t.CFG()[action].clip}))});
 console.log('PASS',name,moves[name].length+' attacks through original touch controls, both sides, every opponent');
}
const p='game/assets/nina-new/config.json',now=JSON.parse(fs.readFileSync(p)),before=JSON.parse(cp.execFileSync('git',['show',base+':'+p],{maxBuffer:15e6}));assert.deepEqual(now.IDLE,before.IDLE);for(const a of moves.NINA)for(const h of Object.values(now[a].hits))assert(h.bone.endsWith('Foot'));
fs.writeFileSync('docs/six-attacks-input-proof-20261012.json',JSON.stringify({cases,mandatorySeparations:separations,originalControlsUnchanged:true,ninaIdleUnchanged:true,results},null,2));console.log('Mandatory close-range separations:',separations);console.log('PASS',cases,'direction/button cases (impact or mandatory close-range separation); original control DOM identical');
})().catch(e=>{console.error(e);process.exitCode=1});
