'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('game/assets/combat.js','utf8');
new vm.Script(code,{filename:'combat.js'});
const start=code.indexOf('function entryStep(dt){'),end=code.indexOf('function poseFrameAt(',start);
assert(start>=0&&end>start,'intro entryStep source not found');
const entrySource=code.slice(start,end);
const states=['walk-in','dialogue','fist-bump','turn-away','walk-back','turn-in','existing-intro'];
let scenarios=0;
for(const left of [12,16,20,24])for(const height of [12,17]){
 const cfg={IDLE:{},WALK_FORWARD:{},INTRO:{}},B={x:left,face:1,a:'IDLE'},O={x:100-left,face:-1,a:'IDLE',cfg},S={entry:{phase:'walk-in',elapsed:0,originA:left,originB:100-left}};
 const seen=['walk-in'];let starts=0,finishes=0,previous='walk-in';
 const ctx={B,O,S,CFG:cfg,worldHPercent:()=>height,setPose:name=>{B.a=name},opponentPose:name=>{O.a=name},beginAction:name=>{assert.equal(name,'INTRO');B.anim={name};starts++},restore:()=>{},finishEntry:()=>{finishes++;S.entry=null}};
 vm.createContext(ctx);vm.runInContext(entrySource+';this.entryStep=entryStep;',ctx);
 for(let i=0;i<650&&S.entry;i++){
  ctx.entryStep(16);
  if(S.entry&&S.entry.phase!==previous){seen.push(S.entry.phase);previous=S.entry.phase;}
  if(S.entry?.phase==='walk-back')assert.equal(B.face,-1,'fighter A must face outward during return');
  if(S.entry?.phase==='walk-back')assert.equal(O.face,1,'fighter B must face outward during return');
  if(S.entry?.phase==='existing-intro'&&i>510){B.anim=null;O.a='IDLE';}
 }
 assert.deepEqual(seen,states);
 assert.equal(starts,1);
 assert.equal(finishes,1);
 assert.equal(B.face,1);assert.equal(O.face,-1);
 assert(Math.abs(B.x-left)<1e-8);assert(Math.abs(O.x-(100-left))<1e-8);
 scenarios++;
}
const a=code.indexOf('function buttonMove('),b=code.indexOf('function characterConfig(',a);
assert(a>=0&&b>a);
const scope={SOURCE_ATTACKS:{BRAX:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','DOUBLE_PUNCH','UPPERCUT','TEEP','CAPOEIRA']}};
vm.createContext(scope);vm.runInContext(code.slice(a,b)+';this.buttonMove=buttonMove;',scope);
for(const sprint of [false,true]){
 assert.equal(scope.buttonMove('BRAX',{},'punch',true,sprint,false),'DOUBLE_PUNCH');
 assert.equal(scope.buttonMove('BRAX',{},'heavy',true,sprint,false),'UPPERCUT');
 assert.equal(scope.buttonMove('BRAX',{},'punch',false,sprint,false),'LIGHT_PUNCH');
 assert.equal(scope.buttonMove('BRAX',{},'heavy',false,sprint,false),'HEAVY_PUNCH');
}
assert(code.includes('S.pendingCombo=true'),'combo buffering missing');
assert(code.includes('comboActivationVfx()'),'Brax activation VFX missing');
assert(code.includes('comboImpactVfx(e.contact'),'combo contact VFX missing');
console.log('PASS pre-fight choreography scenarios:',scenarios,'and Brax P1/P2 input mapping');
