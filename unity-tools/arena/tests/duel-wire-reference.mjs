// Frozen v271 validator, commit f355fe6ac6af41518fde420382512d49bd27d51a.
// This executable reference is independent of the native implementation.
import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
const MAX_DUEL_BYTES=262144;
const object=(v)=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function validSignal(s){return s==null||object(s)&&['offer','answer'].includes(s.type)&&typeof s.sdp==='string'&&s.sdp.length<=16000&&(s.candidates===undefined||Array.isArray(s.candidates)&&s.candidates.length<=24&&s.candidates.every((c)=>object(c)&&typeof c.candidate==='string'&&c.candidate.length<=2000&&(c.sdpMid==null||typeof c.sdpMid==='string'&&c.sdpMid.length<=256)&&(c.sdpMLineIndex==null||Number.isInteger(c.sdpMLineIndex)&&c.sdpMLineIndex>=0)));}
function validExtras(p){
 if(!object(p)||!validSignal(p.signal))return false;
 if(p.voice!=null&&(!object(p.voice)||!['yes','no',null,'pending',undefined].includes(p.voice.consent)||!validSignal(p.voice.description)))return false;
 if(p.sounds!==undefined&&(!Array.isArray(p.sounds)||p.sounds.length>64||!p.sounds.every((s)=>object(s)&&Number.isSafeInteger(s.id)&&s.id>=0&&typeof s.key==='string'&&s.key.length<=80&&Number.isFinite(s.volume)&&Number.isFinite(s.pitch))))return false;
 if(p.blood!=null){const b=p.blood;if(!object(b)||(b.size&&(!Number.isFinite(b.size.width)||b.size.width<=0||!Number.isFinite(b.size.height)||b.size.height<=0))||!Array.isArray(b.stains)||b.stains.length>100||!b.stains.every((s)=>object(s)&&[s.x,s.y,s.r].every(Number.isFinite)&&s.r>=0)||!Array.isArray(b.particles)||b.particles.length>96||!b.particles.every((p)=>object(p)&&['x','y','px','py','vx','vy','life','total','floor','r','gravity'].every(k=>Number.isFinite(p[k]))&&p.r>=0&&typeof p.color==='string'&&p.color.length<=80)||!Array.isArray(b.marks)||b.marks.length!==2||!b.marks.every(Number.isFinite)||!Array.isArray(b.damageMarks)||b.damageMarks.length!==2||!b.damageMarks.every((v)=>Array.isArray(v)&&v.length<=6&&v.every((m)=>object(m)&&Number.isInteger(m.cap)&&m.cap>=0&&Number.isFinite(m.u)&&Number.isFinite(m.severity)&&['head','body','leg'].includes(m.region))))return false;}
 return true;
}
function validInput(i){return validExtras(i)&&object(i.held)&&Object.keys(i.held).every(k=>['left','right','down','block','grab','sprint'].includes(k)&&typeof i.held[k]==='boolean')&&(i.visible===undefined||typeof i.visible==='boolean')&&(i.inputSeq===undefined||Number.isSafeInteger(i.inputSeq)&&i.inputSeq>=0)&&Array.isArray(i.events)&&i.events.length<=64&&i.events.every((e)=>object(e)&&Number.isSafeInteger(e.id)&&e.id>=0&&['punch','heavy','kick','kick2','special','grab','evade','left','right'].includes(e.kind)&&(e.grabHeld===undefined||typeof e.grabHeld==='boolean')&&(e.doubleTap===undefined||typeof e.doubleTap==='boolean'));}

const int=v=>Number.isSafeInteger(v)&&v>=0;
function validSnapshot(s){
 return validExtras(s)&&int(s.ack)&&int(s.snapshotId)&&s.snapshotId>0&&Array.isArray(s.actors)&&s.actors.length===2&&s.actors.every((a)=>a&&[a.x,a.y,a.face,a.hp,a.en,a.frame].every(Number.isFinite)&&a.x>=0&&a.x<=100&&Math.abs(a.y)<=1000&&Math.abs(a.face)===1&&a.hp>=0&&a.hp<=100&&a.en>=0&&a.en<=100&&a.frame>=0&&a.frame<10000&&typeof a.a==='string'&&/^[A-Z_0-9]{1,64}$/.test(a.a))&&s.state&&int(s.state.round)&&s.state.round>=1&&s.state.round<=3&&Number.isFinite(s.state.t)&&s.state.t>=0&&s.state.t<=60&&Array.isArray(s.state.wins)&&s.state.wins.length===2&&s.state.wins.every((n)=>int(n)&&n<=2)&&s.state.wins[0]+s.state.wins[1]<=s.state.round;
}

const rows=[];
const input={held:{},events:[]};
const actor={x:28,y:0,face:1,hp:100,en:0,a:'IDLE',frame:0};
const snapshot={ack:0,snapshotId:1,actors:[actor,{...actor,x:72,face:-1}],state:{round:1,t:60,wins:[0,0]}};
function add(type,payload,label){rows.push({type,payload,label,valid:!!(type==='input'?validInput(payload):validSnapshot(payload))});}
const copy=v=>JSON.parse(JSON.stringify(v));
function variations(type,base,path,values){for(const value of values){const p=copy(base);let target=p;for(const key of path.slice(0,-1))target=target[key];target[path.at(-1)]=value;add(type,p,path.join('.')+' = '+JSON.stringify(value));}}
const bad=[null,false,true,[],{},'', '1',-1,0,1,1.5,1e300];
for(const type of ['input','snapshot'])for(const p of bad)add(type,p,'root '+JSON.stringify(p));
add('input',input,'empty input');add('snapshot',snapshot,'initial snapshot');
for(const key of ['left','right','down','block','grab','sprint','unknown'])for(const value of [true,false,0,null,'false'])add('input',{...input,held:{[key]:value}},'held '+key);
for(const key of ['visible','inputSeq'])variations('input',input,[key],bad);
for(const kind of ['punch','heavy','kick','kick2','special','grab','evade','left','right','jump','energy',''])for(const id of [0,1,-1,1.5,9007199254740991,9007199254740992])add('input',{held:{},events:[{id,kind}]},'event '+kind+' '+id);
variations('input',{held:{},events:[{id:1,kind:'punch'}]},['events',0,'grabHeld'],bad);
variations('input',{held:{},events:[{id:1,kind:'punch'}]},['events',0,'doubleTap'],bad);
for(const count of [64,65])add('input',{held:{},events:Array.from({length:count},(_,id)=>({id,kind:'punch'}))},'queue '+count);
for(const key of ['x','y','hp','en','face','frame'])variations('snapshot',snapshot,['actors',0,key],[...bad,100,100.001,1000,-1000,1000.001,9999.9999999,10000]);
for(const key of ['ack','snapshotId'])variations('snapshot',snapshot,[key],[...bad,9007199254740991,9007199254740992]);
for(const key of ['round','t'])variations('snapshot',snapshot,['state',key],[...bad,2,3,4,60,60.001]);
for(const wins of [[0,0],[1,0],[2,0],[1,1],[2,2],[-1,0],[0],[],['1',0]])variations('snapshot',snapshot,['state','wins'],[wins]);
variations('snapshot',snapshot,['actors',0,'a'],['IDLE','COMBO_2','lowercase','A B','','A'.repeat(64),'A'.repeat(65),null]);
for(const type of ['input','snapshot']){
 const base=type==='input'?input:snapshot;
 for(const consent of ['yes','no','pending',null,false,1,'YES'])variations(type,base,['voice'],[{consent}]);
 for(const signal of [null,false,{}, {type:'offer',sdp:''},{type:'answer',sdp:'x'}, {type:'unknown',sdp:''},{type:'offer',sdp:'x'.repeat(16001)},{type:'offer',sdp:'',candidates:null}])variations(type,base,['signal'],[signal]);
 for(const sounds of [null,[],[{id:1,key:'punch',volume:1,pitch:1}],[{id:1,key:'punch',volume:'1',pitch:1}]])variations(type,base,['sounds'],[sounds]);
}
fs.writeFileSync(new URL('./duel-wire-reference.json.gz',import.meta.url),gzipSync(JSON.stringify({source:'f355fe6ac6af41518fde420382512d49bd27d51a',cases:rows})));
console.log('Frozen duel-wire cases:',rows.length);
