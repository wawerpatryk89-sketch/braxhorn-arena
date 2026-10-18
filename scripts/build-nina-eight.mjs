import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';import {rig} from '../game/assets/fighter-source-core.js';
const base='game/assets/nina-new/',read=p=>JSON.parse(zlib.gunzipSync(fs.readFileSync(p))),raw={...read(base+'clips.json.gz'),...read('source-assets/nina/clips-all.json.gz')},cfg=JSON.parse(fs.readFileSync(base+'config.json')),changed={};
const r=rig(new T.ObjectLoader().parse(read(base+'model.json.gz')),raw,'NINA');
function make(name,clip,extra={}){return changed[name]=cfg[name]={asset:'NINA_EIGHT_'+name,character:'NINA',label:clip.replace('Nina Extra ',''),sourceVersion:'nina-eight-20261013',clip,attack:false,gain:10,cost:0,w:1024,h:640,scale:1,pivotX:512,anchorY:550,mode:'ground',model3d:true,playbackRate:1.45,duration:raw[clip].duration,transitionMs:90,lockPlanarRoot:true,...extra};}
function attack(name,clip,start,duration,label,contacts){make(name,clip,{start,duration,label,contacts,attack:true});}
attack('LIGHT_PUNCH','Chapa-Giratoria',0,3,'Chapa giratória',[[2.30,'LeftFoot',13,.085,.10]]);
attack('HEAVY_PUNCH','Nina Extra Armada To Esquiva',0,4.0666666,'Armada z unikiem',[[1.317,'LeftFoot',14,.075,.09]]);
attack('LIGHT_KICK','Nina Extra Chapa 2',.10,1.25,'Chapa — kopnięcie frontalne',[[.55,'RightFoot',12,.07,.085]]);
attack('HEAVY_KICK','Nina Extra Chapaeu De Couro',.30,2.85,'Chapéu de couro — kopnięcie akrobatyczne',[[1.25,'LeftFoot',15,.075,.09]]);
attack('CRESCENT_KICK','Nina Extra Rasteira 2',0,2.45,'Rasteira — niskie podcięcie',[[.95,'RightFoot',10,.07,.09]]);
attack('SPIN_KICK','Nina Extra Armada',0,raw['Nina Extra Armada'].duration,'Armada — wysoki obrót',[[1.267,'LeftFoot',14,.07,.085]]);
attack('MEIA_LUA','Meia Lua De Frente',0,raw['Meia Lua De Frente'].duration,'Meia lua — szeroki łuk',[[.90,'LeftFoot',13,.07,.085]]);
attack('GROUND_KICK','Martelo Do Chau Sem Mao',0,raw['Martelo Do Chau Sem Mao'].duration,'Martelo — kopnięcie z ziemi',[[1.217,'RightFoot',15,.08,.09]]);
make('COMBO','Nina Extra Fist Fight B',{label:'Dwa proste → chapa → armada',attack:true,duration:3.5533333,playbackRate:1.5,comboGapPx:115,comboGapByOpponent:{NINA:135},comboFollowGapPx:115,finisherGroup:3,sequence:[{clip:'Nina Extra Fist Fight B',start:.55,duration:.82},{clip:'Nina Extra Chapa 2',start:.30,duration:1.05,blend:.10},{clip:'Nina Extra Armada',start:.15,duration:1.4833333,blend:.12},{clip:'Ginga Variation 3',duration:.2,blend:.2}],contacts:[[.30,'LeftHand',6,.055,.065],[.65,'RightHand',7,.055,.065],[1.17,'RightFoot',10,.07,.085],[2.987,'LeftFoot',16,.07,.085]]});
make('BACK_ROLL','Nina Extra Esquiva 1',{label:'Obrót w tył',start:1.3,duration:3.05,playbackRate:1.8,retreat:{from:.60,to:2.10,height:.64},gain:0,transitionMs:100});
const ginga=raw['Ginga Variation 3'].duration;
make('IDLE','Ginga Variation 3',{label:'Ginga i automatyczna esquiva',playbackRate:1,duration:ginga*2+1.8,sequence:[{clip:'Ginga Variation 3',duration:ginga},{clip:'Esquiva 3',start:.15,duration:1.8,blend:.20},{clip:'Ginga Variation 3',duration:ginga,blend:.22}],gain:0});
for(const c of Object.values(changed)){
 const frames=Math.ceil(c.duration*60),step=c.duration/frames;c.durations=Array(frames).fill(step*1000);c.boxes=[];c.hurtCapsules=[];c.footY=[];c.pushCenters=[];c.hits={};
 const airborne=[];
 for(let i=0;i<frames;i++){
  r.pose(c,i*step);const points=Object.keys(r.bones).map(n=>r.point(n));const box=[Math.min(...points.map(p=>p[0]))-25,Math.min(...points.map(p=>p[1]))-45,Math.max(...points.map(p=>p[0]))+25,Math.max(...points.map(p=>p[1]))+20];
  if(!box.every(Number.isFinite))throw Error('Invalid pose '+c.clip);c.boxes.push(box);c.footY.push(550);c.pushCenters.push([r.point('Hips')[0],40]);
  c.hurtCapsules.push([['head','Neck','Head',26],['body','Spine2','Hips',32],['leg','Hips','LeftLeg',21],['leg','LeftLeg','LeftFoot',17],['leg','Hips','RightLeg',21],['leg','RightLeg','RightFoot',17]].map(([region,a,b,radius])=>({region,a:r.point(a),b:r.point(b),radius})));
  for(const [group,[time,bone,damage,before,after]]of (c.contacts||[]).entries()){const peak=Math.round(time/step),first=before===undefined?peak-2:Math.ceil((time-before)/step),last=after===undefined?peak+1:Math.floor((time+after)/step);if(i>=first&&i<=last){const p=r.point(bone),radius=bone.includes('Foot')?24:bone==='LeftArm'?30:bone.endsWith('Leg')?25:19;c.hits[i]={box:[p[0]-radius,p[1]-radius,radius*2,radius*2],bone,damage,group};}}
  if(c===cfg.JUMP&&Math.max(...['LeftFoot','RightFoot','LeftToeBase','RightToeBase'].map(n=>r.point(n)[1]))<525)airborne.push(i);
 }
 if(c===cfg.JUMP)c.airFrames=[Math.min(...airborne),Math.max(...airborne)];
 c.union=[Math.min(...c.boxes.map(b=>b[0])),Math.min(...c.boxes.map(b=>b[1])),Math.max(...c.boxes.map(b=>b[2])),Math.max(...c.boxes.map(b=>b[3]))];if(c.attack)c.attackRangePx=Math.max(90,...Object.values(c.hits).map(h=>h.box[0]+h.box[2]-512));delete c.contacts;
 if(c.attack&&!c.sequence){const keys=Object.keys(c.hits).map(Number),first=Math.min(...keys),last=Math.max(...keys);if(!keys.length)throw Error('Missing attack contacts');c.phaseTempo={first,last,startup:Math.max(1,first*step/c.playbackRate/(c.clip==='Chapa-Giratoria'?.65:c.clip==='Martelo Do Chau Sem Mao'?.5:.25)),recovery:Math.max(1,(frames-last-1)*step/c.playbackRate/.4)};}
}

const labels={LIGHT_PUNCH:'Chapa giratória',HEAVY_PUNCH:'Armada z unikiem',LIGHT_KICK:'Chapa',HEAVY_KICK:'Chapéu de couro',CRESCENT_KICK:'Rasteira',SPIN_KICK:'Armada',MEIA_LUA:'Meia lua',GROUND_KICK:'Martelo z ziemi'};for(const[k,v]of Object.entries(labels))cfg[k].label=v;
const used=new Set();function collect(v){if(Array.isArray(v))v.forEach(collect);else if(v&&typeof v==='object'){if(v.clip)used.add(v.clip);Object.values(v).forEach(collect);}}collect(cfg);
fs.writeFileSync(base+'config.json',JSON.stringify(cfg));fs.writeFileSync(base+'clips.json.gz',zlib.gzipSync(JSON.stringify(Object.fromEntries(Object.entries(raw).filter(([k])=>used.has(k)))),{level:9}));const manifest=JSON.parse(fs.readFileSync(base+'manifest.json'));manifest.clips=[...used];manifest.sourceVersion='nina-eight-full-contact-20261013';fs.writeFileSync(base+'manifest.json',JSON.stringify(manifest));console.log('Nina eight attacks, hands-feet combo, backward roll, automatic ginga/esquiva');
