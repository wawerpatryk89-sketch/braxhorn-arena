(()=>{
'use strict';
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
const $=s=>document.querySelector(s),game=$('#game'),b=$('#brax'),bs=$('#bSprite'),ctx=bs.getContext('2d',{alpha:true,willReadFrequently:false}),start=$('#start'),hud=$('#hud'),controls=$('#controls'),pause=$('#pause'),screenButton=$('#screen'),pHp=$('#pHp'),energy=$('#energy'),clock=$('#clock'),combo=$('#combo'),stateLabel=$('#state'),call=$('#callout'),flash=$('#flash'),sparks=$('#sparks');
const ASSET_B64=window.BRAX_DATA?.assets||{};
let CFG=window.BRAX_3D.config;
const ASSET_SHA256=window.BRAX_DATA?.sha256||{};
const BRAX_CFG=window.BRAX_3D.config,NYXA_CFG=window.NYXA_3D.config;let playerCharacter='BRAX',selectedOpponent=null;
const FIGHTER_ACTION_SPEED=1.10,FIGHTER_MOVE_SPEED=1.20;
const CHARACTER_NAMES=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
// Six basic attacks per fighter. Combo, evasion and throws are separate actions.
// Button layout per fighter: [P1, P2, K1, K2, forward+P1, forward+P2, (forward+K1, forward+K2)].
// P1 is always the fighter's fastest strike; forward moves are the slower signature/wind-up strikes.
// Every entry is an existing clip with its own frame data; nothing here changes an animation.
const SOURCE_ATTACKS={DEMON:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','SHOULDER','UPPERCUT'],DANNY:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','HOOK','SIDE_KICK'],NINA:['LIGHT_KICK','HEAVY_PUNCH','MEIA_LUA','HEAVY_KICK','CRESCENT_KICK','SPIN_KICK','LIGHT_PUNCH','GROUND_KICK'],BEAR:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','SHOULDER','UPPERCUT'],BRAX:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','DOUBLE_PUNCH','UPPERCUT','TEEP','CAPOEIRA'],NYXA:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','LUNGE_PUNCH','ELBOW','CLINCH_KNEE','CROUCH_KICK'],KROV:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','ELBOW','UPPERCUT'],VEXA:['HEAVY_PUNCH','LIGHT_PUNCH','LIGHT_KICK','HEAVY_KICK','SPIN_KICK','FLYING_KICK']};
// One mapping for the local player, the host applying guest input and the guest's own prediction.
function buttonMove(who,cfg,kind,forward,sprint,down){const list=SOURCE_ATTACKS[who]||[];if(down&&kind==='heavy'&&cfg.ACROBATIC_PUNCH)return 'ACROBATIC_PUNCH';
 if(forward&&sprint){const move={punch:who==='NINA'?'LIGHT_KICK':list[0],heavy:who==='NINA'?'SPIN_KICK':list[1],kick:list[2],kick2:who==='VEXA'?'FLYING_KICK':who==='NINA'?'SPIN_KICK':list[3]}[kind];if(move)return move;}
 const index=(list.length>6?{punch:forward?4:0,heavy:forward?5:1,kick:forward?6:2,kick2:forward?7:3}:{punch:forward?4:0,heavy:forward?5:1,kick:2,kick2:3})[kind];return index===undefined?null:list[index]||null;}
function characterConfig(name){return characterRenderer(name)?.config;}
function characterRenderer(name){return window[name+'_3D'];}

const S={running:false,paused:false,ended:false,preFight:false,t:60,round:1,wins:[0,0],comboUses:0,comboApproach:false,comboReserved:false,cinematic:false,matchOver:false,last:performance.now(),acc:0,combo:0,comboT:0,introPlayed:false,difficulty:'normal',training:false,trainingBehavior:'move'};
const FEATURES=window.BRAX_FEATURES;
// Internet control bridge. Only the host advances combat; guests render snapshots.
const NET={active:false,host:false,hostName:'GRACZ',guestName:'GRACZ',held:{},events:[],ack:0,latest:null,previous:null,receivedAt:0,lastTap:null,combo:false,ready:false,connected:true,sounds:[],soundId:0,heard:0,snapshotId:0,renderFrom:null,buffer:[],localHeld:{},localEvent:0,prediction:null,inputs:[],jitter:[],lastArrival:null,lastSim:null};
function remoteOpponentStep(dt){
 if(S.preFight||S.ended||!NET.connected)return;
 const h=NET.held,dir=(h.right?1:0)-(h.left?1:0);
 for(const e of NET.events.splice(0)){if(e.id<=NET.ack)continue;NET.ack=e.id;
  if(S.clinch){if((e.kind==='evade'||e.kind==='grab')&&S.clinch.sourcePair&&!S.clinch.hit&&S.clinch.elapsed<=200)releaseClinch();continue;}
  if(O.locked||O.stun||O.downState)continue;
  if(e.kind==='left'||e.kind==='right'){const d=e.kind==='right'?1:-1,now=performance.now(),double=typeof e.double==='boolean'?e.double:NET.lastTap?.key===e.kind&&now-NET.lastTap.time<300;NET.lastTap={key:e.kind,time:now};O.sprintHeld=double&&d===O.face;if(double&&d===-O.face){const move=O.cfg.BACKFLIP?'BACKFLIP':O.cfg.BACK_ROLL?'BACK_ROLL':'QUICK_BACK';if(O.cfg[move])opponentPose(move,true);}continue;}
  if(e.kind==='evade'){O.evadeOrigin=combatSnapshot(O);opponentPose('LEAN',true);continue;}
  if(e.kind==='grab'){beginSourcePair(O);continue;}
  if(e.kind==='special'){if(O.en>=100&&O.comboUses<2&&!B.downState){O.en=0;O.comboUses++;NET.combo=true;}continue;}
  const forward=dir*O.face>0;let name;
  name=buttonMove(O.character,O.cfg,e.kind,forward,O.sprintHeld,h.down);
  if(name&&O.cfg[name]?.attack){opponentPose(name,true);if(forward&&!h.block&&SOURCE_ATTACKS[O.character].includes(name))O.strikeMotion={action:name,face:O.face,clock:0,weight:0,run:!!O.sprintHeld,legStrike:Object.values(O.cfg[name].hits).some(h=>/Foot|Leg|Toe/.test(h.bone||''))};}
 }
 movingStrikeStep(dt,dir,O);
 if(O.locked||O.stun||O.downState||O.pushTime>0||S.clinch)return;
 if(NET.combo){const c=O.cfg.COMBO,px=c.comboGapByOpponent?.[playerCharacter]??c.comboGapPx,reach=px?comboApproachGap(px,c,O.character):attackDistance(c,playerHurtbox()),distance=Math.abs(B.x-O.x);if(distance<=reach+.4){NET.combo=false;opponentPose('COMBO',true);}else{O.x+=O.face*Math.min(distance-reach,sourceMoveSpeed(O.character)*dt/1000);if(O.a!==forwardPose(O))opponentPose(forwardPose(O));}return;}
 if(h.block){if(O.character==='NINA'){opponentPose('LEAN',true);NET.held.block=false;}else{const a=h.down&&O.cfg.BLOCK_LOW?'BLOCK_LOW':'BLOCK';if(O.a!==a)opponentPose(a);}return;}
 if(dir){const run=O.sprintHeld&&dir===O.face&&O.cfg.RUN;O.x+=dir*sourceMoveSpeed(O.character,dir!==O.face)*(run?1.4:1)*dt/1000;const a=run?'RUN':dir===O.face?forwardPose(O):'WALK_BACK';if(O.a!==a)opponentPose(a);}else{O.sprintHeld=false;if(O.a!=='IDLE')opponentPose('IDLE');}
}
function networkSnapshot(keyframe=false){const v=arenaSize(),pack=f=>{const c=krovConfig(f)[f.a];return{actionId:f.attackSerial||0,x:f.x,y:f.y||0,face:f.face,hp:f.hp,en:f.en,a:f.a,frame:f.frame+(f===B?(B.anim?B.frameT:B.frameT-B.frame*c.durations[0]):O.time)/(c.durations[f.frame]||16),locked:f===B?!!B.anim:O.locked,...(f.stun||f.pushTime>0||f.downState||S.clinch?{controlBlocked:true}:{}),...(f.strikeMotion?{strikeMotion:f.strikeMotion}:{}),comboUses:f===B?S.comboUses:O.comboUses};};const packet={sentAt:Math.round(performance.now()),snapshotId:++NET.snapshotId,freeze:!!(S.paused||S.hitstop||S.clinch||S.preFight||S.ended),ack:NET.ack,sounds:NET.sounds.filter(e=>performance.now()-e.at<250).map(({at,...e})=>e),actors:[pack(B),pack(O)],state:{t:S.t,round:S.round,wins:S.wins.slice(),preFight:S.preFight,ended:S.ended,matchOver:S.matchOver,paused:S.paused,poseClock:S.poseClock||0,simTime:S.simTime||0,callout:call.classList.contains('show')?call.firstElementChild.textContent:''},camera:{z:S.comboCamera?.z||1,x:(S.comboCamera?.x||0)/v.width,y:(S.comboCamera?.y||0)/v.height},...(keyframe?{keyframe:true,blood:blood?.networkSnapshot?.()}:{bloodEvents:blood?.networkEvents?.()||[]})};for(const obj of [...packet.actors,packet.state,packet.camera])for(const key of Object.keys(obj))if(typeof obj[key]==='number')obj[key]=Math.round(obj[key]*1000)/1000;return packet;}
// Adaptive display timing follows the measured packet cadence and jitter, in local milliseconds.
function createNetworkTiming(){
 let previousLocal=null,previousRemote=null,interval=1000/30,jitter=0,delay=50;
 return{
  reset(){previousLocal=previousRemote=null;interval=1000/30;jitter=0;delay=50;},
  observe(local,remote){
   if(!Number.isFinite(local)||!Number.isFinite(remote)||previousRemote!==null&&remote<=previousRemote)return;
   if(previousLocal!==null){
    const sent=remote-previousRemote,arrived=local-previousLocal;
    if(sent>0&&sent<=250&&arrived>=0&&arrived<=1000){
     interval+=(sent-interval)*.12;
     jitter+=(Math.abs(arrived-sent)-jitter)*.15;
     const target=Math.max(32,Math.min(100,interval+5+jitter*1.8));
     // Grow promptly during jitter; release the extra buffer gradually after recovery.
     delay=target>delay?target:Math.max(target,delay-1);
    }
   }
   previousLocal=local;previousRemote=remote;
  },
  get delay(){return delay;},get interval(){return interval;},get jitter(){return jitter;}
 };
}
const networkTiming=createNetworkTiming();
// End adaptive display timing.
// Advance only the visual pose, bounded to 100 ms. Damage and outcomes stay authoritative.
function networkAdvanceFrame(n,c,who,elapsed,index){
 let frame=Math.min(c.durations.length-1,Math.floor(n.frame)),fraction=n.frame-frame;
 let remaining=Math.max(0,Math.min(100,elapsed)),guard=0;
 const walk=['WALK_FORWARD','WALK_BACK','APPROACH','RUN'].includes(n.a),loop=!n.locked&&(walk||n.a==='IDLE');
 if(!n.locked&&!loop)return n.frame;
 while(remaining>0&&guard++<120){
  const rate=walk?locomotionTempo(who,n.a):index===0&&!n.locked?FIGHTER_ACTION_SPEED*(who==='NINA'?.93:1):actionTempo(who,c,frame),duration=c.durations[frame]||16;
  const step=Math.min(remaining,(1-fraction)*duration/rate);fraction+=step*rate/duration;remaining-=step;
  if(fraction<.999999)break;
  if(frame===c.durations.length-1){if(!loop)return frame+.999;frame=0;}else frame++;
  fraction=0;
 }
 return frame+fraction;
}
// The guest never runs the host's start/pause handlers, so mirror the arena film from the received state.
function syncGuestArena(){if(!activeArena.video)return;const m=window.BRAX_ARENA_MEDIA?.current?.()||$('#arenaMotion'),live=!S.paused&&!S.preFight&&!S.ended&&!S.matchOver&&!document.hidden,now=performance.now();if(now-(NET.arenaSync||0)<700)return;if(live&&m?.paused){NET.arenaSync=now;arenaSound.resume();}else if(!live&&S.paused&&m&&!m.paused){NET.arenaSync=now;arenaSound.stop();}}
function networkRender(){const latest=NET.latest;if(!latest)return;const now=performance.now(),dt=Math.min(50,Math.max(0,now-(NET.renderAt??now)));NET.renderAt=now;
 const buffer=NET.buffer||[],candidate=latest.state.simTime+Math.min(100,Math.max(0,now-NET.receivedAt))-networkTiming.delay,target=Math.max(NET.renderTarget??candidate,candidate);NET.renderTarget=target;
 let p=buffer[0]||latest,prev=p,u=0;
 for(let j=1;j<buffer.length;j++){if(buffer[j].state.simTime>=target){prev=buffer[j-1];p=buffer[j];u=Math.max(0,Math.min(1,(target-prev.state.simTime)/(p.state.simTime-prev.state.simTime||1)));break;}prev=p=buffer[j];}
 const late=Math.min(100,Math.max(0,target-p.state.simTime));
 for(let i=0;i<2;i++){const f=i?O:B,cfg=i?O.cfg:CFG,author=i?latest:p;let n={...author.actors[i]},prior=prev.actors[i];
  if(!i&&p!==prev){n.x=prior.x+(n.x-prior.x)*u;n.y=prior.y+(n.y-prior.y)*u;if(prior.a===n.a&&prior.actionId===n.actionId)n.frame=prior.frame+(n.frame-prior.frame)*u;else if(u<1)n={...prior,x:n.x,y:n.y};}
  if(!i&&p===prev&&!p.freeze&&late){const q=buffer.at(-2),span=p.state.simTime-q?.state.simTime;if(span>0&&span<250&&q.actors[i].a===n.a&&['WALK_FORWARD','WALK_BACK','APPROACH','RUN'].includes(n.a))n.x+=Math.max(-.05,Math.min(.05,(n.x-q.actors[i].x)/span))*late;}
  let advance=i?Math.min(100,now-NET.receivedAt):late;
  const pred=NET.prediction;
  if(i&&pred){const confirmed=latest.ack>=pred.id;if(confirmed||now-pred.at>250||latest.freeze||n.controlBlocked||n.hp<f.hp){if(confirmed&&n.a===pred.a)NET.confirmedPrediction={a:n.a,actionId:n.actionId,frame:NET.renderedPose?.[1]?.frame||0};NET.prediction=null;}else{n.a=pred.a;n.frame=0;n.locked=true;n.actionId='local:'+pred.id;advance=now-pred.at;}}
  if(i&&!latest.freeze&&!n.controlBlocked&&!n.locked&&now-NET.receivedAt<=250){const dir=(NET.localHeld?.right?1:0)-(NET.localHeld?.left?1:0);if(dir){const run=dir===n.face&&!!O.cfg.RUN&&(n.a==='RUN'||NET.localRun);n.a=run?'RUN':dir===n.face?'WALK_FORWARD':'WALK_BACK';const speed=sourceMoveSpeed(O.character,dir!==n.face)*(run?1.4:1),expected=n.x+dir*speed*Math.min(100,now-NET.receivedAt)/1000,correction=latest.ack>=NET.localEvent?Math.max(-dt*.015,Math.min(dt*.015,expected-f.x)):0;n.x=f.x+dir*speed*dt/1000+correction;n.frame=NET.renderedPose?.[1]?.a===n.a?NET.renderedPose[1].frame:0;advance=dt;}else if(NET.localHeld&&['WALK_FORWARD','WALK_BACK','APPROACH','RUN'].includes(n.a))n.a='IDLE';}
  const c=cfg[n.a];if(!c)continue;
  const targetX=Math.max(0,Math.min(100,n.x));f.x=NET.renderedPose?.[i]?f.x+Math.max(-dt*.06,Math.min(dt*.06,targetX-f.x)):targetX;
  f.y=n.y;f.face=n.face;f.hp=n.hp;f.en=n.en;f.a=n.a;f.strikeMotion=n.strikeMotion;
  let frame=networkAdvanceFrame(n,c,i?O.character:playerCharacter,author.freeze?0:advance,i),rendered=NET.renderedPose?.[i];
  if(n.locked&&c.attack&&rendered?.a===n.a&&rendered.actionId===n.actionId)frame=Math.max(frame,rendered.frame);
  if(i&&NET.confirmedPrediction?.a===n.a&&NET.confirmedPrediction.actionId===n.actionId)frame=Math.max(frame,NET.confirmedPrediction.frame);
  (NET.renderedPose||=[])[i]={a:n.a,actionId:n.actionId,frame};f.frame=Math.max(0,Math.min(c.durations.length-1,Math.floor(frame)));const fraction=Math.max(0,Math.min(.999,frame-f.frame));if(i){O.time=fraction*c.durations[f.frame];O.locked=n.locked;O.comboUses=n.comboUses;}else{B.frameT=(n.locked?0:f.frame*c.durations[0])+fraction*c.durations[f.frame];B.anim=n.locked?{c}:null;B.lock=n.locked;S.comboUses=n.comboUses;}
 }
 if(NET.inputAt!=null&&NET.inputExpected&&(NET.inputExpected.action?O.a===NET.inputExpected.action&&O.a!==NET.inputPose:NET.inputExpected.direction*(O.x-NET.inputX)>.001&&['WALK_FORWARD','WALK_BACK','RUN'].includes(O.a))){NET.inputs.push(now-NET.inputAt);if(NET.inputs.length>600)NET.inputs.shift();NET.inputAt=null;}
 const effects=u<1?prev:p;if(effects.snapshotId!==(NET.effectsId||0)){NET.effectsId=effects.snapshotId;if(effects.blood)blood?.restoreNetwork?.(effects.blood);if(effects.bloodEvents)blood?.restoreEvents?.(effects.bloodEvents);for(const e of effects.sounds||[]){if(e&&e.id>NET.heard){NET.heard=e.id;if(['punch','kick','impact','heavy','step','land'].includes(e.key))fightAudio.play(e.key,e.volume,e.pitch);}}}
 Object.assign(S,p.state);S.running=true;S.cinematic=false;draw();updateComboBanner();captureReplay();syncGuestArena();
 const v=arenaSize(),next=p.camera||{z:1,x:0,y:0},before=prev?.camera||next,c=Object.fromEntries(['z','x','y'].map(k=>[k,before[k]+(next[k]-before[k])*u]));$('#combatStage').style.transform=`translate(${c.x*v.width}px,${c.y*v.height}px) scale(${c.z})`;
 game.classList.toggle('air-attack-enabled',!!O.cfg.ACROBATIC_PUNCH&&!S.ended);$('#playerName').textContent=NET.hostName+' · '+displayFighterName(playerCharacter);$('#opponentName').textContent=NET.guestName+' · '+displayFighterName(O.character)+' · TY';energy.style.width=O.en+'%';$('#comboCharge').textContent='COMBO '+Math.floor(O.en)+'% · '+O.comboUses+'/2';const special=document.querySelector('[data-tap=special]');if(special)special.disabled=O.en<100||O.comboUses>=2||S.ended||S.preFight;
 if(call.firstElementChild.textContent!==displayFighterName(p.state.callout||'')){call.classList.remove('show');void call.offsetWidth;}call.firstElementChild.textContent=displayFighterName(p.state.callout||'');call.classList.toggle('show',!!p.state.callout);
 if(S.matchOver&&!S.preFight){$('#mpConnection').textContent=S.wins[0]===S.wins[1]?'REMIS':(S.wins[1]>S.wins[0]?'WYGRYWASZ':'WYGRYWA RYWAL')+' · '+S.wins[1]+':'+S.wins[0];}
}
// The guest's combo meter sits under the guest's own health bar (right side).
function comboMeterSide(right){const m=document.querySelector('#hud .combo-meter'),side=document.querySelector(right?'#hud .side.right':'#hud .side:not(.right)');if(m&&side&&m.parentElement!==side)side.appendChild(m);}
window.BRAX_MULTIPLAYER_ENGINE={
 async start(role,r){networkTiming.reset();comboMeterSide(role==='guest');NET.hostName=r.hostName||'GRACZ';NET.guestName=r.guestName||'GRACZ';NET.active=true;NET.host=role==='host';NET.held={};NET.events=[];NET.ack=0;NET.combo=false;NET.latest=NET.previous=null;NET.buffer=[];NET.localHeld={};NET.prediction=NET.confirmedPrediction=null;NET.localEvent=0;NET.localRun=false;NET.arenaSync=0;NET.renderAt=null;NET.renderTarget=null;NET.lastSentAt=null;NET.inputs=[];NET.jitter=[];NET.lastArrival=NET.lastSim=null;NET.renderFrom=null;NET.renderedPose=null;NET.snapshotId=0;NET.effectsId=0;NET.connected=true;NET.sounds=[];NET.soundId=NET.heard=0;NET.remoteVisible=true;NET.ready=false;campaign=null;activeChallenge=null;selectedGameMode='fight';S.training=false;S.difficulty='normal';selectedSlot=CHARACTER_NAMES.indexOf(r.hostFighter);selectedOpponent=r.guestFighter;await window.BRAX_PREPARE_PAIR?.([r.hostFighter,r.guestFighter]);chooseArena(r.arena);await begin();updateKrovButtons();S.cinematic=false;S.preFight=true;S.paused=true;fighterFilm.pause();introFilm.classList.add('off');for(const id of ['start','selection','matchSetup','modeSettings','arenaSelection','fighterHelp','startFilm','copyrightNotice','campaignScreen','challengeHub','survivalScreen','challengesScreen','featurePanel','playerIdentity','trainingOptions','drillOptions','liveDrillPanel','fightObjective','matchEnd','victoryCinema','koReplay','fightLoadError','arenaLoadPanel','onlineTournaments','mpOnlineResult','uiChallengeResult','codePad'])$('#'+id)?.classList.add('off');window.BRAX_VICTORY?.close?.();$('#playerName').textContent=NET.hostName+' · '+displayFighterName(playerCharacter)+(NET.host?' · TY':'');$('#opponentName').textContent=NET.guestName+' · '+displayFighterName(O.character)+(!NET.host?' · TY':'');game.classList.add('multiplayer');game.classList.remove('training');controls.classList.remove('off');},
 go(){if(NET.ready)return;NET.ready=true;S.paused=false;if(NET.host)startCountdown();},
 input(i){if(!i||!i.held||!Array.isArray(i.events)||i.events.length>64||!i.events.every(e=>e&&Number.isSafeInteger(e.id)&&e.id>=0&&['punch','heavy','kick','kick2','special','grab','evade','left','right'].includes(e.kind)))return;NET.remoteVisible=i.visible!==false;NET.held={left:!!i.held.left,right:!!i.held.right,down:!!i.held.down,block:!!i.held.block};if(!i.visible)NET.held={};NET.events=i.events.filter(e=>e.id>NET.ack);if(S.clinch?.sourcePair&&!S.clinch.hit&&S.clinch.elapsed<=200){const e=NET.events.find(e=>e.kind==='evade'||e.kind==='grab');if(e){NET.ack=e.id;NET.events=NET.events.filter(x=>x.id>e.id);releaseClinch();}}},
 connection(ok){NET.connected=ok;if(NET.host&&NET.ready)S.paused=!ok||document.hidden||NET.remoteVisible===false;if(!ok){NET.held={};releaseInputs();}},
 localRun(kind){NET.localRun=!!kind&&(kind==='right'?1:-1)===O.face;},
 localInput(i){if(!NET.active||NET.host)return;if(!i.held?.left&&!i.held?.right)NET.localRun=false;const now=performance.now(),changed=JSON.stringify(i.held)!==JSON.stringify(NET.localHeld);NET.localHeld={...i.held};const fresh=(i.events||[]).filter(e=>e.id>NET.localEvent);if(changed||fresh.length){NET.inputAt=now;NET.inputPose=O.a;NET.inputX=O.x;NET.inputExpected=i.held.block?{action:i.held.down&&O.cfg.BLOCK_LOW?'BLOCK_LOW':'BLOCK'}:{direction:(i.held.right?1:0)-(i.held.left?1:0)};}
  for(const e of fresh){NET.localEvent=e.id;if(O.locked||NET.latest?.freeze||NET.latest?.actors[1]?.controlBlocked)continue;const dir=(i.held.right?1:0)-(i.held.left?1:0),forward=dir*O.face>0;let name;name=buttonMove(O.character,O.cfg,e.kind,forward,!!NET.localRun,i.held.down);if(name&&O.cfg[name]?.attack){NET.prediction={id:e.id,a:name,at:now};NET.inputExpected={action:name};}}
 },
 snapshot:networkSnapshot,
 // Reliable keyframe (own channel): only the full blood state is applied; motion comes from the fast frames.
 receiveKey(p){if(NET.host||!NET.active||!p?.keyframe||!p.blood||!Array.isArray(p.blood.stains)||!Array.isArray(p.blood.particles)||!Array.isArray(p.blood.marks)||!Array.isArray(p.blood.damageMarks)||p.blood.damageMarks.length!==2)return;if(!Number.isSafeInteger(p.snapshotId)||p.snapshotId<(NET.keyId||0))return;NET.keyId=p.snapshotId;blood?.restoreNetwork?.(p.blood);},
 receive(p){if(p?.bloodEvents&&(!Array.isArray(p.bloodEvents)||p.bloodEvents.length>8||!p.bloodEvents.every(e=>Array.isArray(e)&&e.length===10&&(e[9]===null||Array.isArray(e[9])&&e[9].length===3&&Number.isInteger(e[9][0])&&e[9][0]>=0&&Number.isFinite(e[9][1])&&e[9][1]>=0&&e[9][1]<=1&&Number.isInteger(e[9][2])&&e[9][2]>0)&&Number.isSafeInteger(e[0])&&e[0]>0&&[0,1].includes(e[1])&&Number.isFinite(e[2])&&e[2]>=4&&e[2]<=100&&[0,1,2].includes(e[3])&&(e[4]===null||Number.isFinite(e[4]))&&(e[5]===null||Number.isFinite(e[5]))&&Math.abs(e[6])===1&&Number.isSafeInteger(e[7])&&e[7]>=0&&e[7]<=4294967295&&Number.isFinite(e[8]))))return;if(!p||!Number.isSafeInteger(p.ack)||p.ack<0||!Array.isArray(p.state?.wins)||p.state.wins.length!==2||!p.state.wins.every(n=>Number.isInteger(n)&&n>=0&&n<=2)||!Number.isFinite(p.state.t)||p.state.t<0||p.state.t>60||(p.sounds!==undefined&&(!Array.isArray(p.sounds)||p.sounds.length>64))||(p.blood&&(!Array.isArray(p.blood.stains)||!Array.isArray(p.blood.particles)||!Array.isArray(p.blood.marks)||!Array.isArray(p.blood.damageMarks)||p.blood.damageMarks.length!==2||!p.blood.damageMarks.every(Array.isArray))))return;if(!Array.isArray(p?.actors)||p.actors.length!==2||!p.state||!Number.isSafeInteger(p.snapshotId)||p.snapshotId<1||p.snapshotId<=(NET.latest?.snapshotId||0))return;if(!p.actors.every((a,i)=>{const c=a&&(i?O.cfg:CFG)[a.a];return c&&[a.x,a.y,a.face,a.hp,a.en,a.frame].every(Number.isFinite)&&a.x>=0&&a.x<=100&&Math.abs(a.face)===1&&a.en>=0&&a.en<=100&&a.hp>=0&&a.hp<=100&&a.frame>=0&&a.frame<c.durations.length+1;}))return;if(!Number.isFinite(p.state.simTime)||p.state.simTime<(NET.lastSim??0))return;const at=performance.now();networkTiming.observe(at,p.sentAt);if(NET.lastArrival!=null&&Number.isFinite(p.sentAt)&&Number.isFinite(NET.lastSentAt)&&p.sentAt>=NET.lastSentAt){NET.jitter.push(Math.abs((at-NET.lastArrival)-(p.sentAt-NET.lastSentAt)));if(NET.jitter.length>600)NET.jitter.shift();}NET.lastArrival=at;NET.lastSentAt=p.sentAt;NET.lastSim=p.state.simTime;(NET.buffer||=[]).push(p);NET.buffer=NET.buffer.filter(q=>q.state.simTime>=p.state.simTime-500).slice(-32);NET.renderFrom=NET.latest?[{x:B.x,a:B.a},{x:O.x,a:O.a}]:null;NET.previous=NET.latest;NET.latest=p;NET.receivedAt=performance.now();},
 stop(){if(!NET.active)return;NET.active=false;comboMeterSide(false);NET.held={};NET.events=[];game.classList.remove('multiplayer');returnToSelectionNow();$('#selection').classList.add('off');$('#matchSetup').classList.remove('off');}
};

let progressStorage;try{progressStorage=window.localStorage;}catch{}
const progress=FEATURES.createProgress(progressStorage);
const DIFFICULTY={easy:{label:'ŁATWY',reaction:650,cooldown:3000,power:.6,speed:5.5,approach:.65,block:.22,grabChance:.04,grabCooldown:12000,breakChance:.12,breakReaction:185},normal:{label:'ŚREDNI',power:1,reaction:180,cooldown:280,speed:7,approach:.90,block:.60,grabChance:.07,grabCooldown:10000,breakChance:.4,breakReaction:155},hard:{label:'TRUDNY',power:1,reaction:100,cooldown:0,speed:8.5,approach:1.15,block:.86,grabChance:.10,grabCooldown:8000,breakChance:.7,breakReaction:110}};
const B={x:28,y:0,vy:0,face:1,jumpTime:null,moveHeld:0,pushTime:0,pushSpeed:0,hp:100,recover:0,en:0,a:'IDLE',phase:'IDLE',lock:false,ground:true,anim:null,frame:0,frameT:0,hitGroups:new Set()};
const K={left:false,right:false,block:false,down:false};
const decoded=new Map(),lru=[];const MAX_CACHE_BYTES=96*1024*1024;
let currentRender={name:'IDLE',asset:'BRAX_KNUCKLE_CRACK',frame:5,w:512,h:512,box:[149,114,362,469],scale:1,pivotX:256,anchorY:470};
function bytes64(s){const z=atob(s),u=new Uint8Array(z.length);for(let i=0;i<z.length;i++)u[i]=z.charCodeAt(i);return u}
function lzw(data,minCode,pixelCount){const clear=1<<minCode,end=clear+1,prefix=new Int16Array(4096),suffix=new Uint8Array(4096),stack=new Uint8Array(4097),out=new Uint8Array(pixelCount);for(let i=0;i<clear;i++)suffix[i]=i;let datum=0,bits=0,pos=0,oi=0,top=0,codeSize=minCode+1,mask=(1<<codeSize)-1,avail=clear+2,old=-1,first=0;while(oi<pixelCount){if(top===0){while(bits<codeSize){if(pos>=data.length)break;datum|=data[pos++]<<bits;bits+=8}if(bits<codeSize)break;let code=datum&mask;datum>>=codeSize;bits-=codeSize;if(code===clear){codeSize=minCode+1;mask=(1<<codeSize)-1;avail=clear+2;old=-1;continue}if(code===end)break;if(old<0){out[oi++]=suffix[code];old=code;first=code;continue}const inCode=code;if(code>=avail){stack[top++]=first;code=old}while(code>=clear){stack[top++]=suffix[code];code=prefix[code]}first=suffix[code];stack[top++]=first;if(avail<4096){prefix[avail]=old;suffix[avail]=first;avail++;if(avail===(1<<codeSize)&&codeSize<12){codeSize++;mask=(1<<codeSize)-1}}old=inCode}if(top)out[oi++]=stack[--top]}return out}
function decodeGif(key){if(window.DEMON_3D?.frames[key])return window.DEMON_3D.frames[key];if(window.DANNY_3D?.frames[key])return window.DANNY_3D.frames[key];if(window.NINA_3D?.frames[key])return window.NINA_3D.frames[key];if(window.BEAR_3D?.frames[key])return window.BEAR_3D.frames[key];if(window.VEXA_3D?.frames[key])return window.VEXA_3D.frames[key];if(window.BRAX_3D?.frames[key])return window.BRAX_3D.frames[key];if(window.NYXA_3D?.frames[key])return window.NYXA_3D.frames[key];if(window.KROV_3D?.frames[key])return window.KROV_3D.frames[key];if(decoded.has(key)){touch(key);return decoded.get(key)}const u=bytes64(ASSET_B64[key]);let p=0;const str=n=>{let r='';while(n--)r+=String.fromCharCode(u[p++]);return r},u16=()=>u[p++]|(u[p++]<<8),table=n=>{const a=new Uint8Array(n*3);a.set(u.subarray(p,p+n*3));p+=n*3;return a};if(str(3)!=='GIF')throw Error('GIF header');str(3);const w=u16(),h=u16(),packed=u[p++];p+=2;const gct=packed&128?table(1<<((packed&7)+1)):null;let gce={delay:100,trans:-1,disp:0},canvas=new Uint8ClampedArray(w*h*4),prev=null,frames=[];const dispose=()=>{if(!prev)return;if(prev.disp===2){for(let yy=prev.y;yy<prev.y+prev.h;yy++)for(let xx=prev.x;xx<prev.x+prev.w;xx++){let q=(yy*w+xx)*4;canvas[q]=canvas[q+1]=canvas[q+2]=canvas[q+3]=0}}else if(prev.disp===3&&prev.restore)canvas.set(prev.restore)};while(p<u.length){const b0=u[p++];if(b0===0x3b)break;if(b0===0x21){const lab=u[p++];if(lab===0xf9){const sz=u[p++];const gp=u[p++],d=u16(),tr=u[p++];p++;gce={delay:Math.max(20,d*10||100),trans:(gp&1)?tr:-1,disp:(gp>>2)&7};if(sz>4)p+=sz-4}else{while(p<u.length){const z=u[p++];if(!z)break;p+=z}}continue}if(b0!==0x2c)break;dispose();const x=u16(),y=u16(),iw=u16(),ih=u16(),ip=u[p++],lct=ip&128?table(1<<((ip&7)+1)):gct,inter=!!(ip&64),min=u[p++];let chunks=[],len=0;while(p<u.length){const z=u[p++];if(!z)break;chunks.push(u.subarray(p,p+z));len+=z;p+=z}const dat=new Uint8Array(len);let at=0;for(const c of chunks){dat.set(c,at);at+=c.length}let idx=lzw(dat,min,iw*ih);if(inter){const de=new Uint8Array(idx.length);let si=0;for(const [st,step] of [[0,8],[4,8],[2,4],[1,2]])for(let yy=st;yy<ih;yy+=step){de.set(idx.subarray(si,si+iw),yy*iw);si+=iw}idx=de}const restore=gce.disp===3?canvas.slice():null;for(let yy=0;yy<ih;yy++)for(let xx=0;xx<iw;xx++){const ci=idx[yy*iw+xx];if(ci===gce.trans)continue;const q=((y+yy)*w+(x+xx))*4,c=ci*3;if(lct&&c+2<lct.length){canvas[q]=lct[c];canvas[q+1]=lct[c+1];canvas[q+2]=lct[c+2];canvas[q+3]=255}}frames.push({pixels:canvas.slice(),duration:gce.delay});prev={disp:gce.disp,x,y,w:iw,h:ih,restore};gce={delay:100,trans:-1,disp:0}}const out={w,h,frames};decoded.set(key,out);touch(key);trimCache(key);return out}
function touch(k){const i=lru.indexOf(k);if(i>=0)lru.splice(i,1);lru.push(k)}
function trimCache(keep){const pins=new Set([keep,CFG[B.a]?.asset]);if(typeof O!=='undefined')pins.add(O.cfg[O.a]?.asset);let bytes=[...decoded.values()].reduce((n,a)=>n+a.w*a.h*a.frames.length*4,0);let guard=lru.length;while(bytes>MAX_CACHE_BYTES&&guard-->0){const k=lru.shift();if(pins.has(k)){lru.push(k);continue}const a=decoded.get(k);if(a){bytes-=a.w*a.h*a.frames.length*4;decoded.delete(k)}}}
function warmAnimations(){const keys=[CFG.IDLE.asset,O.cfg.IDLE.asset,CFG.LIGHT_PUNCH.asset,O.cfg.LIGHT_PUNCH.asset,CFG.WALK_FORWARD.asset,O.cfg.WALK_FORWARD.asset];let i=0;function next(){if(i>=keys.length||!S.running)return;decodeGif(keys[i++]);setTimeout(next,20)}setTimeout(next,0)}
function arenaSize(){const r=game.getBoundingClientRect();return {width:r.width||innerWidth,height:r.height||innerHeight}}
// Every new arena must declare its own ground line; never infer it from fighter pixels.
const ARENAS={...window.BRAX_ARENA_VIDEOS};
window.BRAX_ARENA_PICKER?.setSources(ARENAS);
let selectedArena='snow',activeArena=ARENAS.snow;
function groundY(){if(selectedArena==='nocny-targ'){const feet=window.BRAX_NIGHT_MARKET?.feet();if(Number.isFinite(feet))return feet;const {width,height}=arenaSize(),scaled=Math.max(height,width*941/1672);return (height-scaled)/2+scaled*780/941;}const {width,height}=arenaSize(),imageHeight=Math.max(height,width/(activeArena.aspect||16/9));return (height-imageHeight)/2+imageHeight*activeArena.ground}
function baseScale(){const {width,height}=arenaSize();return Math.max(.1,Math.min(height*1.10/512,width*.55/512,680/512,(groundY()-Math.max(54,height*.16))/(BRAX_CFG.IDLE.model3d&&(playerCharacter==='BRAX'||O.character==='BRAX')?390:356)))}
function groundInset(){return arenaSize().height-groundY()}
function cfgOf(name){return CFG[name]}
function frameBox(c,i){return c.boxes[Math.min(i,c.boxes.length-1)]}
function framePivotX(name,i,c){return c.pivots?.[Math.min(i,c.pivots.length-1)]??c.pivotX}
function frameAnchorY(name,i,c,box){if(c.syntheticJump)return c.anchorY;return !c.followJumpPhysics&&(c.mode==='air'||(c.liftFromFrames&&name!=='JUMP'))?c.anchorY:c.footY[Math.min(i,c.footY.length-1)]}
const colorFrames=new Map();
function displayPixels(frame,asset){if(!asset.startsWith('BRAX_SEVEN_'))return frame.pixels;if(colorFrames.has(frame))return colorFrames.get(frame);const out=new Uint8ClampedArray(frame.pixels);for(let i=0;i<out.length;i+=4){if(!out[i+3])continue;const r=out[i],g=out[i+1],b=out[i+2];if(r>g&&g>b){const weight=Math.min(1,(r-g)/18)*Math.min(1,(g-b)/12);out[i]=r+(g-r)*.55*weight;out[i+2]=b+(g-b)*.65*weight;}}colorFrames.set(frame,out);if(colorFrames.size>8)colorFrames.delete(colorFrames.keys().next().value);return out;}
function render(name,i){const c=cfgOf(name),a=decodeGif(c.asset),fi=Math.max(0,Math.min(i,a.frames.length-1)),f=a.frames[fi],box=frameBox(c,fi),sc=baseScale()*c.scale,piv=framePivotX(name,fi,c),anchor=frameAnchorY(name,fi,c,box);if(bs.width!==a.w||bs.height!==a.h){bs.width=a.w;bs.height=a.h}if(c.sourceVersion){}else if(c.model3d)characterRenderer(playerCharacter).render(ctx,c,isLegacyKrov(B)?fi+(B.anim?B.frameT:(B.frameT%(1000/60)))/(1000/60):fi,B.face);else ctx.putImageData(new ImageData(displayPixels(f,c.asset),a.w,a.h),0,0);bs.style.width=(a.w*sc)+'px';bs.style.height=(a.h*sc)+'px';bs.style.marginLeft=((B.face>=0?(a.w/2-piv):(piv-a.w/2))*sc)+'px';bs.style.bottom=(-((a.h-anchor)*sc))+'px';currentRender={name,asset:c.asset,frame:fi,w:a.w,h:a.h,box,scale:sc,pivotX:piv,anchorY:anchor}}
function drawStatic(name='IDLE'){render(name, B.frame||0)}
function setPose(name='IDLE'){B.comboConnection=null;B.strikeMotion=null;B.anim=null;B.a=name;B.phase=name;B.frame=0;B.frameT=0;B.hitGroups.clear();b.classList.toggle('blocking',name==='BLOCK');drawStatic(name);stateLabel.textContent=name}
function safeFit(name){if(cfgOf(name).sourceVersion)return;const c=cfgOf(name),sc=baseScale()*c.scale,p=framePivotX(name,B.frame,c),u=c.pivots?frameBox(c,B.frame):c.union,W=game.clientWidth||innerWidth;let left=(p-u[0])*sc,right=(u[2]-p)*sc;if(B.face<0)[left,right]=[right,left];let px=B.x/100*W,cl=Math.max(left+3,Math.min(W-right-3,px));B.x=cl/W*100}
function phaseFor(c,fi){const ks=Object.keys(c.hits).map(Number).sort((a,b)=>a-b);if(!c.attack)return'GESTURE';if(!ks.length)return'RECOVERY';if(c===CFG.COMBO){if(fi<ks[0])return'STARTUP';if(c.hits[String(fi)])return'ACTIVE';if(fi<ks[ks.length-1])return'RECOVERY';return'RECOVERY'}if(fi<ks[0])return'STARTUP';if(c.hits[String(fi)])return'ACTIVE';return'RECOVERY'}
function beginAction(name,onDone=null){const c=cfgOf(name);if(!c)return false;if(c.attack&&(S.preFight||!S.running||S.paused||S.ended||B.lock||B.stun))return false;if(c.attack){if(B.jumpTime!==null&&B.ground)return false;if(c.mode==='air'&&B.ground)return false;if(c.mode!=='air'&&!B.ground)return false}if(name==='COMBO'){if(!S.comboReserved)return false;S.comboReserved=false;S.matchSpecials=(S.matchSpecials||0)+1;}B.strikeMotion=(SOURCE_ATTACKS[playerCharacter]?.includes(name))&&c.sourceVersion&&B.ground&&B.jumpTime===null&&!K.block&&((K.right?1:0)-(K.left?1:0))===B.face?{action:name,face:B.face,clock:['RUN','WALK_FORWARD','APPROACH'].includes(B.a)?B.frameT:0,weight:0,run:!!B.sprintHeld,legStrike:Object.values(c.hits).some(h=>/Foot|Leg|Toe/.test(h.bone||''))}:null;B.lock=true;B.comboConnection=null;B.comboAborted=false;B.hitGroups.clear();if(c.attack){B.repeatCount=B.lastAttackName===name?(B.repeatCount||0)+1:1;B.lastAttackName=name;B.attackSerial=(B.attackSerial||0)+1;B.getupProtection=0;safeFit(name);}B.a=name;B.phase=c.attack?'STARTUP':'GESTURE';B.anim={name,c,a:decodeGif(c.asset),onDone};B.frame=c.startFrame||0;B.frameT=0;b.classList.remove('blocking');render(name,B.frame);stateLabel.textContent=c.label;return true}
function finishAction(){if(S.celebration?.started&&B===S.celebration.actor&&B.a===S.celebration.action){B.frame=CFG[B.a].durations.length-1;B.frameT=0;B.anim=null;B.lock=true;return;}if(advanceSourceDown(B)||isLegacyKrov(B)&&advanceKrovDown(B))return;const d=B.anim;B.anim=null;B.lock=false;if(d&&d.onDone){const cb=d.onDone;d.onDone=null;cb();return}restore();while(attackQueue.length){const next=attackQueue.shift();if(next==='JUMP'){jump();break}if(beginAction(next))break}}
function restore(){const stride=B.strikeMotion?.clock;B.lock=false;B.anim=null;B.hitGroups.clear();if(B.jumpTime!==null)setPose('JUMP');else if(K.block)setPose(K.down&&CFG.BLOCK_LOW?'BLOCK_LOW':'BLOCK');else if(B.sprintHeld&&((K.right?1:0)-(K.left?1:0))===B.face&&CFG.RUN)setPose('RUN');else setPose('IDLE');if(B.a==='RUN'&&stride!==undefined){B.frameT=stride%CFG.RUN.durations.reduce((a,b)=>a+b,0);B.frame=poseFrameAt('RUN',B.frameT);render('RUN',B.frame);}}
function actionStep(dt){if(!B.anim)return;let remaining=dt;while(B.anim&&remaining>0){const {name,c,a}=B.anim;const tempo=actionTempo(playerCharacter,c,B.frame),duration=c.durations[B.frame]||a.frames[B.frame].duration;const consumed=Math.min(remaining,Math.max(0,duration-B.frameT)/tempo);B.frameT+=consumed*tempo;remaining-=consumed;if(!S.preFight&&!S.ended){resolveKrovGrab();resolveKrovComboGrab();if(S.clinch)return;if(B.anim&&B.anim.name!==name)continue;resolvePlayerHit();if(!B.anim||B.anim.name!==name)return;if(S.hitstop>0&&c.sourceVersion)return;}if(B.frameT+1e-6<duration)break;B.frameT=0;B.frame++;if(B.frame>=c.durations.length){finishAction();continue}render(name,B.frame);fightAudio.frame(name,B.frame,B);if(!S.preFight&&!S.ended){resolveKrovGrab();resolveKrovComboGrab();if(S.clinch)return;if(B.anim&&B.anim.name!==name)continue;resolvePlayerHit();if(!B.anim||B.anim.name!==name)return;if(S.hitstop>0&&c.sourceVersion)return;}B.phase=phaseFor(c,B.frame)}}
function attackRect(box){const r=game.getBoundingClientRect(),rootX=r.left+B.x/100*r.width,rootY=r.bottom-groundInset()-B.y*.007*r.height,cr=currentRender,sc=cr.scale,p=cr.pivotX,aY=cr.anchorY,[x,y,w,h]=box;let l;if(B.face>=0)l=rootX+(x-p)*sc;else l=rootX-((x+w)-p)*sc;return{left:l,right:l+w*sc,top:rootY+(y-aY)*sc,bottom:rootY+(y+h-aY)*sc}}
function bodyHurtbox(f,c,name,frame){if(c.sourceVersion){const z=frameBox(c,frame);return fighterRect(f,c,[z[0],z[1],z[2]-z[0],z[3]-z[1]],c.anchorY);}const box=frameBox(c,frame),anchor=frameAnchorY(name,frame,c,box),nyxa=f===B?playerCharacter==='NYXA':O.character==='NYXA',width=(nyxa?190:130),cx=framePivotX(name,frame,c)-(nyxa?38:24),top=box[1]+(nyxa?35:22);return fighterRect(f,c,[cx-width/2,top,width,Math.max(24,box[3]-top-6)],anchor)}
function playerHurtbox(){return bodyHurtbox(B,CFG[B.a],B.a,B.frame)}
function rectHit(a,z){return!!a&&!!z&&a.left<z.right&&a.right>z.left&&a.top<z.bottom&&a.bottom>z.top}
function sourceContact(target,rect,pose=null,detail=false){
 const c=pose?.config||(target===B?CFG[B.a]:O.cfg[O.a]);target=pose||target;const caps=c.hurtCapsules?.[target.frame];
 if(!caps){const overlap=rectHit(rect,target===B?playerHurtbox():opponentHurtbox());return overlap?(detail?{region:'body',x:(rect.left+rect.right)/2,y:(rect.top+rect.bottom)/2}:'body'):null;}
 const x=(rect.left+rect.right)/2,y=(rect.top+rect.bottom)/2,r=(rect.right-rect.left)/2,scale=baseScale()*c.scale;
 for(const cap of caps){const a=fighterRect(target,c,[cap.a[0],cap.a[1],0,0],c.anchorY),b=fighterRect(target,c,[cap.b[0],cap.b[1],0,0],c.anchorY),dx=b.left-a.left,dy=b.top-a.top,len=dx*dx+dy*dy,u=len?Math.max(0,Math.min(1,((x-a.left)*dx+(y-a.top)*dy)/len)):0;
  if((x-a.left-u*dx)**2+(y-a.top-u*dy)**2<=(r+cap.radius*scale)**2){const cx=a.left+u*dx,cy=a.top+u*dy,length=Math.hypot(x-cx,y-cy),radius=cap.radius*scale,ratio=length?Math.min(1,radius/length):0;return detail?{region:cap.region,x:cx+(x-cx)*ratio,y:cy+(y-cy)*ratio}:cap.region;}
 }return null;
}
const attackQueue=[];
function bufferAction(name){if((isLegacyKrov(B)||CFG.IDLE.sourceVersion)&&B.anim){const c=B.anim.c,remaining=c.durations.slice(B.frame+1).reduce((a,d,i)=>a+d/actionTempo(playerCharacter,c,B.frame+1+i),0)+(c.durations[B.frame]-B.frameT)/actionTempo(playerCharacter,c,B.frame);if(remaining>100)return false;}if(!canInput()||!B.anim||!B.anim.c.attack||B.a==='COMBO'||attackQueue.length>=1)return false;if(name==='COMBO'&&B.en<100)return false;attackQueue.push(name);return true}
function doAttack(name){if(name==='COMBO')return startCombo();if(S.comboApproach)return false;if(B.lock)return bufferAction(name);return beginAction(name)}
function jump(){if(!CFG.JUMP)return false;if(B.lock){bufferAction('JUMP');return}if(!canInput()||B.jumpTime!==null||!B.ground)return;B.jumpTime=0;B.y=0;fightAudio.play('step',.25);setPose('JUMP');vib(15)}
function say(t,audio=true){if(audio)fightAudio.cue(t);call.firstElementChild.textContent=displayFighterName(t);call.classList.remove('show');void call.offsetWidth;call.classList.add('show')}
function reset(replayIntro=false){window.BRAX_NIGHT_MARKET?.destroy();if(selectedArena==='nocny-targ'&&S.running)window.BRAX_NIGHT_MARKET?.start($('#combatStage'),()=>fightAudio.play('thunder',.7));if(NET.active){NET.combo=false;NET.held={};NET.events=[];}S.comboCinema=null;S.comboCamera=null;koReplay?.cancel();blood?.clear(true);S.replayShown=false;releaseInputs();characterRenderer(playerCharacter)?.reset?.(ctx);characterRenderer(O.character)?.reset?.(opponentCtx);if(typeof O!=='undefined')resetOpponent();attackQueue.length=0;Object.assign(B,{x:28,y:0,vy:0,face:1,jumpTime:null,moveHeld:0,pushTime:0,pushSpeed:0,hp:100,recover:0,en:0,a:'IDLE',phase:'IDLE',lock:false,ground:true,anim:null,frame:0,frameT:0});B.hitGroups=new Set();S.entry=null;S.clinch=null;S.celebration=null;S.replaySounds=[];S.contactNeedsSeparation=false;S.grabAttempt=null;S.krovDash=null;B.downState=null;O.downState=null;B.getupProtection=O.getupProtection=0;B.grabProtection=O.grabProtection=0;B.airLaunches=O.airLaunches=0;B.airDamage=O.airDamage=0;B.impactPressure=O.impactPressure=0;B.hitSeries=O.hitSeries=null;B.comboConnection=O.comboConnection=null;B.reactionTier=O.reactionTier=0;B.evadeToken=O.evadeToken=null;B.evadeOrigin=null;S.koSlowMs=0;S.drillMs=0;B.recoilCooldown=O.recoilCooldown=0;B.cleanKickMs=O.cleanKickMs=0;B.cleanKickToken=O.cleanKickToken=null;B.knockdownCooldown=O.knockdownCooldown=0;S.contactMs=0;S.contactAwayMs=0;S.contactCooldown=0;S.contactPressure=0;S.bodyContactMs=0;S.contactHadAttack=false;S.t=60;S.comboUses=0;S.comboApproach=false;S.comboReserved=false;S.acc=0;S.hitstop=0;S.voiceCooldown=12000;B.stun=0;O.stun=0;B.repeatCount=0;B.lastAttackName=null;O.observedSerial=null;B.lastHitBlocked=O.lastHitBlocked=false;S.combo=0;S.comboT=0;combo.textContent='BRAXHORN';setPose('IDLE');B.x=entryCorner(B);O.x=entryCorner(O);draw();if(replayIntro)intro()}
function intro(){if(S.introPlayed)return;S.introPlayed=true;startFighterEntry(true);}
// Reserve room for the complete original greeting and gait at each screen edge.
function entryCorner(f){
 const cfg=krovConfig(f),width=arenaSize().width;
 const inset=Math.max(12,...['INTRO','APPROACH','WALK_FORWARD','IDLE'].filter(name=>cfg[name]).map(name=>{
  const c=cfg[name];return ((c.pivotX-c.union[0])*baseScale()*c.scale+8)/width*100;
 }));
 return f===B?inset:100-inset;
}
function startFighterEntry(greeting=false){
 releaseInputs();restore();opponentPose('IDLE');
 S.preFight=true;S.countdown=null;S.countStage=-1;S.audioWait=0;
 S.entry=greeting?{phase:'greeting'}:null;
 B.face=1;O.face=-1;B.x=entryCorner(B);O.x=entryCorner(O);
 characterVoice(playerCharacter);arenaSound.resume();fightAudio.unlock();call.firstElementChild.textContent='';
 if(greeting){opponentPose('INTRO',true);beginAction('INTRO',restore);}
 else finishEntry();
 draw();
}
function finishEntry(){
 // The actual fight starts at the two sides. Movement begins only after FIGHT.
 S.entry=null;restore();opponentPose('IDLE');
 S.countdown=0;S.countStage=-1;S.audioWait=0;
}
function entryStep(){
 if(S.entry&&!B.anim&&O.a!=='INTRO')finishEntry();
}
function poseFrameAt(name,time){const c=CFG[name];let t=time;for(let i=0;i<c.durations.length;i++){if(t<c.durations[i])return i;t-=c.durations[i]}return c.durations.length-1}
function motionStep(dt){if(B.anim)return;if(B.a==='WALK_FORWARD'||B.a==='WALK_BACK'||B.a==='APPROACH'||B.a==='RUN'||B.a==='IDLE'){const c=CFG[B.a];B.frameT=(B.frameT+dt*(B.a==='IDLE'?FIGHTER_ACTION_SPEED*(playerCharacter==='NINA'?.93:1):locomotionTempo(playerCharacter,B.a)))%c.durations.reduce((a,b)=>a+b,0);const fi=poseFrameAt(B.a,B.frameT);if(fi!==B.frame){B.frame=fi;render(B.a,fi);if(B.a!=='IDLE'&&(fi===0||fi===Math.floor(c.durations.length/2)))fightAudio.play('step',.17,.98+Math.random()*.04)}}else if(B.a==='JUMP'){const fi=poseFrameAt('JUMP',B.jumpTime||0);B.frame=fi;render('JUMP',fi)}}
// Apply the same visible arena limits to both fighters, including recovery and training.
function visibleLimits(f){const c=krovConfig(f)[f.a],i=Math.min(f.frame,c.boxes.length-1),box=c.boxes[i],next=c.boxes[Math.min(i+1,c.boxes.length-1)],p=framePivotX(f.a,i,c),sc=baseScale()*c.scale,W=arenaSize().width;const guard=S.clinch?.showcase?krovConfig(f).IDLE.union:null;let left=(p-Math.min(box[0],next[0])-0)*sc+8,right=(Math.max(box[2],next[2])-p)*sc+8;if(guard){left=Math.max(left,(p-guard[0])*sc+8);right=Math.max(right,(guard[2]-p)*sc+8);}if(f.face<0)[left,right]=[right,left];return{min:Math.max(8,left/W*100),max:Math.min(92,100-right/W*100)};}
function confineFighters(){if(!S.running)return;const bounds=[visibleLimits(B),visibleLimits(O)],low=Math.max(bounds[0].min-B.x,bounds[1].min-O.x),high=Math.min(bounds[0].max-B.x,bounds[1].max-O.x);if(S.clinch?.showcase&&low>high){for(const [i,f] of [B,O].entries()){const z=bounds[i];f.x=Math.max(z.min,Math.min(z.max,f.x));}return;}if(S.clinch||!B.downState&&!O.downState&&low<=high&&(B.a==='COMBO'||O.a==='COMBO')){const shift=low<=high?Math.max(low,Math.min(high,0)):(low+high)/2;B.x+=shift;O.x+=shift;return;}for(const [i,f]of [B,O].entries()){const z=bounds[i];f.x=z.min<=z.max?Math.max(z.min,Math.min(z.max,f.x)):(z.min+z.max)/2;}}
// A sprint carries into every basic strike; authored kicks retain their legs.
function movingStrikeStep(dt,dir,f=B){
 const m=f.strikeMotion;if(!m)return;
 if(!(f===B?f.anim:O.locked)||f.a!==m.action||f.stun||f.pushTime||(f===B&&!f.ground)||S.ended||S.preFight||S.clinch){f.strikeMotion=null;return;}
 const c=krovConfig(f)[f.a],gap=Math.abs(f.x-(f===B?O:B).x),minimum=worldHPercent()*.28;
 const allowed=dir===m.face&&f.face===m.face&&!(f===B?K.block:NET.held.block)&&gap>minimum;
 const speed=sourceMoveSpeed(krovName(f),false)*(m.run?1.4:.78);
 const amount=allowed?Math.min(speed*dt/1000,Math.max(0,gap-minimum)):0;
 // Never replace a striking leg with a running pose. Hands keep the running cycle.
 const travel=amount;
 f.x+=m.face*travel;m.clock+=dt*locomotionTempo(krovName(f),m.run&&krovConfig(f).RUN?'RUN':'WALK_FORWARD');
 const target=travel>0&&!m.legStrike?1:0;m.weight+=Math.max(-dt/100,Math.min(dt/100,target-m.weight));
}
// Collect both actors' legal contacts before applying reactions or declaring KO.
let contactBatch=null;
function combatSnapshot(f){return {...f,isPlayer:f===B,config:krovConfig(f)[f.a],guard:f===B?((K.block||isLegacyKrov(B)&&K.down)&&B.ground&&!B.lock&&!B.stun):['BLOCK','BLOCK_LOW'].includes(f.a),low:f===B?K.down:f.a==='BLOCK_LOW',evade:f===B&&playerEvadeTime>0};}
// Count both immunity-window evasion and a real geometric dodge. The same
// incoming hit group can advance the objective once, never once per frame.
function noteEvadedHit(actor,hit){const token='cpu-'+actor.attackSerial+':'+hit.group;if(B.evadeToken!==token){B.evadeToken=token;featureEvent('evade');}}
function geometricEvade(actor,target,rect,pose,hit){
 if(actor!==O||target!==B||!B.evadeOrigin)return;
 const defense=pose||combatSnapshot(B),c=defense.config,range=c.evadeFrames;
 if(defense.a!=='LEAN'||!range||defense.frame<range[0]||defense.frame>range[1])return;
 if(sourceContact(B,rect,B.evadeOrigin))noteEvadedHit(actor,hit);
}
function resolveCombatHit(actor){
 const player=actor===B,target=player?O:B,c=krovConfig(actor)[actor.a],groups=player?B.hitGroups:O.hits;
 if(!player&&(S.preFight||S.ended||O.stun))return;
 const hit=c.hits?.[String(actor.frame)],key=player?'damage-'+hit?.group:hit?.group;
 if(!hit||groups.has(key)||contactBatch?.events.some(e=>e.actor===actor&&e.serial===actor.attackSerial&&e.key===key))return;
 if(!contactBatch&&c.sourceVersion)separateFighters();
 const rect=fighterRect(actor,c,hit.box,frameAnchorY(actor.a,actor.frame,c,frameBox(c,actor.frame))),pose=contactBatch?.poses.get(target),contact=sourceContact(target,rect,pose,true),region=contact?.region;
 if(!region){geometricEvade(actor,target,rect,pose,hit);return;}
 const event={actor,target,c,hit,key,groups,rect,region,contact,name:actor.a,serial:actor.attackSerial,defense:pose||combatSnapshot(target),contactPoses:new Map([[actor,{...combatSnapshot(actor),frameT:0,time:0}],[target,pose||combatSnapshot(target)]])};
 if(contactBatch)contactBatch.events.push(event);else applyCombatHit(event);
}
function applyCombatHit(e){
 const {actor,target,c,hit,key,groups,rect,region,name,serial,defense}=e,player=actor===B;
 if(!S.training)captureReplay({poses:e.contactPoses,force:true});
 if(!damage(target,hit.damage,rect,{...hit,moveName:name,kickToken:(player?'player-':'cpu-')+serial,target:region,contactPoint:e.contact,comboPart:c.finisherGroup!==undefined,comboFinish:c.finisherGroup!==undefined&&hit.group===c.finisherGroup,defense}))return;
 if(!target.lastHitBlocked&&name==='COMBO'&&actor.a==='COMBO'&&!S.comboCinema)S.comboCinema={actor,serial,timeScale:1};
 holdSourceContact(c);groups.add(key);comboFinisher(actor,target,c,hit,target.lastHitBlocked);
 if(!target.lastHitBlocked){if(player){S.combo++;S.comboT=1400;}if(name!=='COMBO'&&(!player||S.comboUses<2)&&!groups.has('energy')){actor.en=Math.min(100,(actor.en||0)+(c.gain||5));groups.add('energy');}}
}
function physics(dt){
 if(!S.preFight&&!S.ended&&!S.hitstop&&!S.clinch)contactBatch={poses:new Map([[B,combatSnapshot(B)],[O,combatSnapshot(O)]]),events:[]};
 try{advancePhysics(dt);if(contactBatch){for(const e of contactBatch.events){const stop=S.hitstop||0;applyCombatHit(e);S.hitstop=Math.max(stop,S.hitstop||0);}}}
 finally{contactBatch=null;}
 if(!S.ended&&(B.hp<=0||O.hp<=0||!S.preFight&&!S.training&&S.t<=0))endRound();
}
function advancePhysics(dt){const moving=[B,O].map(f=>{const c=krovConfig(f)[f.a];return{f,c,frame:f.frame,elapsed:(f.frame+(f===B?B.frameT:O.time)/c.durations[f.frame])*c.durations[0]/1000};});physicsStep(dt);for(const z of moving){const{f,c}=z;if(c.contactRecoveryMotion&&krovConfig(f)[f.a]===c&&!S.hitstop&&!S.clinch){const t=(f.frame+(f===B?B.frameT:O.time)/c.durations[f.frame])*c.durations[0]/1000;f.x+=f.face*(contactRecoveryMotion(c,t)-contactRecoveryMotion(c,z.elapsed))*baseScale()*c.scale/arenaSize().width*100;if(z.elapsed<.56&&t>=.56)fightAudio.play('land',.42,.9);}if(c.retreat&&krovConfig(f)[f.a]===c&&!S.hitstop&&!S.preFight&&!S.ended&&!S.clinch){const time=(f.frame+(f===B?B.frameT:O.time)/c.durations[f.frame])*c.durations[0]/1000,a=c.retreat,ease=t=>{const u=Math.max(0,Math.min(1,(t-a.from)/(a.to-a.from)));return u*u*(3-2*u);};f.x-=f.face*(ease(time)-ease(z.elapsed))*worldHPercent()*a.height;}if(f===B&&B.strikeMotion||!c.advance||krovConfig(f)[f.a]!==c||S.hitstop>0||S.preFight||S.clinch)continue;const elapsed=(f.frame+(f===B?B.frameT:O.time)/c.durations[f.frame])*c.durations[0]/1000,a=c.advance,portion=t=>Math.max(0,Math.min(1,(t-a.from)/(a.to-a.from)));const distance=(portion(elapsed)-portion(z.elapsed))*a.px*baseScale()*c.scale/arenaSize().width*100;if(distance>0){f.x+=f.face*distance;separateFighters();}}separateFighters();confineFighters();separateFighters();}
function physicsStep(dt){if(S.cinematic)return;if(!S.preFight&&!S.ended){S.matchElapsed=(S.matchElapsed||0)+dt;if(!S.training)S.t=Math.max(0,S.t-dt/1000);O.retreatCooldown=Math.max(0,(O.retreatCooldown||0)-dt);O.grabCooldown=Math.max(0,(O.grabCooldown||0)-dt);O.comboCooldown=Math.max(0,(O.comboCooldown||0)-dt);if((!S.training||S.trainingBehavior==='spar')&&!S.hitstop&&!S.clinch)for(const f of [B,O])if(f.a!=='COMBO'&&(f===B?S.comboUses:f.comboUses)<2)f.en=Math.min(100,(f.en||0)+dt*.005);}contactClinchStep(dt);if(S.hitstop>0){S.hitstop=Math.max(0,S.hitstop-dt);return}S.contactCooldown=Math.max(0,(S.contactCooldown||0)-dt);for(const f of [B,O]){f.knockdownCooldown=Math.max(0,(f.knockdownCooldown||0)-dt);f.cleanKickMs=Math.max(0,(f.cleanKickMs||0)-dt);f.recoilCooldown=Math.max(0,(f.recoilCooldown||0)-dt);if(f.hitSeries){f.hitSeries.remaining-=dt;f.hitSeries.awayMs=pressureDisengaged(f)?(f.hitSeries.awayMs||0)+dt:0;if(f.hitSeries.remaining<=0||f.hitSeries.awayMs>=600)f.hitSeries=null;}f.getupProtection=Math.max(0,(f.getupProtection||0)-dt);f.grabProtection=Math.max(0,(f.grabProtection||0)-dt);if(f.pushTime>0){const spent=Math.min(dt,f.pushTime);f.x=Math.max(8,Math.min(92,f.x+f.pushSpeed*spent/1000));f.pushTime-=spent;}}if(S.clinch){clinchStep(dt);if(!S.training&&S.t<=0){releaseClinch();endRound();}return;}S.poseClock=(S.poseClock||0)+dt;krovDashStep(dt);B.stun=Math.max(0,(B.stun||0)-dt);O.stun=Math.max(0,(O.stun||0)-dt);const ss=dt/1000;S.voiceCooldown=Math.max(0,(S.voiceCooldown||0)-dt);faceOpponents();trackKrovCombo(dt);if(S.clinch)return;if(S.cpuPlayer){actionStep(dt);playerCpuStep(dt);}opponentStep(dt);if(S.ended||S.hitstop>0)return;
 if(S.preFight){actionStep(dt);if(CFG.IDLE.sourceVersion)motionStep(dt);entryStep(dt);if(S.countdown!==null&&S.countdown!==undefined){if(S.countdown>=0&&!fightAudio.countdownReady()&&(S.audioWait||0)<4000){S.audioWait=(S.audioWait||0)+dt;return}S.countdown+=dt;const stage=Math.floor(S.countdown/1000);if(stage!==S.countStage){S.countStage=stage;if(stage<0){}else if(stage<3)say(String(3-stage));else{S.countdown=null;S.preFight=false;releaseInputs();restore();say('FIGHT')}}}return}
 if(S.training){B.en=100;S.comboUses=0;for(const f of [B,O]){if(f.hp<=1){f.recover=(f.recover||0)+dt;if(f.recover>=1200){f.hp=100;f.recover=0}}else f.recover=0}}if(!S.training&&S.t<=0){endRound();if(S.ended)return}if(S.comboApproach){advanceCombo(dt);return}
 const dir=(K.right?1:0)-(K.left?1:0);B.moveHeld=dir&&!K.block&&!B.lock?(B.moveHeld||0)+dt:0;
 if(B.jumpTime!==null){B.jumpTime+=dt*(CFG.JUMP.model3d?1.375:1);const c=CFG.JUMP,total=c.durations.reduce((a,b)=>a+b,0),fi=poseFrameAt('JUMP',B.jumpTime);B.ground=c.airFrames?(fi<c.airFrames[0]||fi>c.airFrames[1]):c.model3d?(B.jumpTime<total*.2||B.jumpTime>total*.75):playerCharacter==='NYXA'?(fi<2||fi>=4):(fi<3||fi>=12);B.y=Math.max(0,c.anchorY-c.footY[fi])*baseScale()*c.scale/(.007*arenaSize().height);if(!B.ground)B.x+=dir*8.5*moveTempo(playerCharacter)*ss;if(B.jumpTime>=total){fightAudio.play('land',.48);B.jumpTime=null;B.ground=true;B.y=0;if(!B.lock)restore()}}
 if(!S.cpuPlayer&&!B.lock&&!B.stun&&!B.pushTime){if(B.jumpTime!==null){if(B.a!=='JUMP')setPose('JUMP')}else if(K.block||(isLegacyKrov(B)&&K.down)){const block=K.down&&CFG.BLOCK_LOW?'BLOCK_LOW':'BLOCK';if(B.a!==block)setPose(block)}else if(dir){const run=CFG.RUN&&dir===B.face&&(CFG.IDLE.sourceVersion?B.sprintHeld:B.moveHeld>550);B.x+=dir*(isLegacyKrov(B)?worldHPercent()*(run?1.20:dir===B.face?.75:.60):CFG.IDLE.sourceVersion?sourceMoveSpeed(playerCharacter,dir!==B.face)*(run?1.4:1):11.8*moveTempo(playerCharacter)*(run?1.6:1))*ss;const pose=run?'RUN':dir===B.face?forwardPose(B):'WALK_BACK';if(B.a!==pose)setPose(pose)}else if(B.a!=='IDLE')setPose('IDLE')}
 movingStrikeStep(dt,dir);
 if(playerCharacter==='BRAX'&&!CFG.COMBO.model3d&&B.a==='COMBO'&&B.frame>=8&&B.frame<=11&&!B.hitGroups.has('damage-0')){const hit=CFG.COMBO.hits[String(B.frame)],rect=attackRect(hit.box),target=opponentHurtbox(),gap=B.face>0?target.left-rect.right:rect.left-target.right;B.x+=B.face*Math.max(0,Math.min(90*ss,(gap+6)/arenaSize().width*100));}
 if(!S.cpuPlayer)actionStep(dt);if(S.hitstop>0)return;motionStep(dt);separateFighters();resolvePlayerHit();B.x=Math.max(8,Math.min(92,B.x));safeFit(B.a);S.comboT-=dt;if(S.comboT<=0&&S.combo){S.combo=0;combo.textContent='BRAXHORN'}}

// Context restoration never resumes the round without the player's pause control.
const lostContexts=new Set();
addEventListener('brax-context-lost',e=>{lostContexts.add(e.detail.character);if(S.running){S.paused=true;S.acc=0;releaseInputs();fightAudio.stop();arenaSound.stop();pause.textContent='▶';say('PRZYWRACANIE OBRAZU…',false);}});
addEventListener('brax-context-disposed',e=>lostContexts.delete(e.detail.character));
addEventListener('brax-context-restored',e=>{lostContexts.delete(e.detail.character);if(S.running&&!lostContexts.size){say('OBRAZ GOTOWY — WZNÓW GRĘ',false);draw();}});
const attackButtons=[...document.querySelectorAll('[data-tap]')];
function contactRenderConfig(f,c){
 if(f.a==='COMBO'&&f.comboAborted)c={...c,transitionKey:'combo-recovery',transitionMs:120};
 if(!S.clinch?.showcase||!c.mutualContact)return c;
 const other=f===B?O:B,oc=krovConfig(other)[other.a];
 const gap=Math.abs(other.x-f.x)*arenaSize().width/100/(baseScale()*c.scale)*3.25/640;
 return {...c,contactOpponent:{shoulders:oc.contactShoulders,gap,ratio:oc.scale/c.scale}};
}
function draw(){if(CFG.IDLE.sourceVersion){const c=contactRenderConfig(B,CFG[B.a]),fraction=B.anim?B.frameT/c.durations[B.frame]:(B.frameT-B.frame*c.durations[0])/c.durations[0];const renderer=characterRenderer(playerCharacter);renderer.render(ctx,B.strikeMotion?.weight>0?{...c,movingGait:{config:B.strikeMotion.run&&CFG.RUN?CFG.RUN:CFG.WALK_FORWARD||CFG.APPROACH,time:B.strikeMotion.clock/1000,weight:B.strikeMotion.weight}}:c,B.frame+Math.max(0,Math.min(1,fraction)),B.face,S.poseClock||0);}if(isLegacyKrov(B))render(B.a,B.frame);drawOpponent();const r=game.getBoundingClientRect();b.style.left=B.x+'%';b.style.bottom=(groundInset()+B.y*.007*r.height)+'px';b.classList.toggle('krov',isLegacyKrov(B));b.classList.toggle('leftface',B.face<0);b.classList.toggle('rightface',B.face>=0);pHp.style.width=B.hp+'%';energy.style.width=B.en+'%';$('#comboCharge').textContent=S.comboUses>=2?'COMBO 2/2':(B.en>=100?'COMBO GOTOWE':'COMBO '+Math.floor(B.en)+'%')+' · '+S.comboUses+'/2';attackButtons.forEach(el=>{if(el.dataset.tap==='grab'){const held=S.clinch?.sourcePair;const guest=NET.active&&!NET.host,localConfig=guest?O.cfg:CFG,ownSide=guest?'opponent':'player';el.classList.toggle('off',!localConfig.THROW_ATTACKER&&!(held&&S.clinch.attacker!==ownSide));el.textContent=held?(S.clinch.attacker===ownSide?'PUŚĆ':'ZERWIJ'):'CHWYT';el.title=held?'C lub U: zerwij w początkowym oknie':'CHWYT: rzut z bliska';}if(el.dataset.tap==='special'){const ready=B.en>=100&&S.comboUses<2&&!S.comboApproach&&!S.ended&&!S.preFight;el.disabled=!ready;el.classList.toggle('charging',!ready);el.classList.toggle('ready',ready);el.title=S.comboUses>=2?'Limit dwóch combo wykorzystany':ready?'Combo gotowe':'Combo ładuje się';}});clock.textContent=S.training?'∞':String(Math.ceil(S.t)).padStart(2,'0');$('#round').textContent=S.training?'TRENING':'RUNDA '+S.round+'/3';combo.textContent=S.combo>1?'TRAFIENIA '+S.combo:S.wins[0]+' : '+S.wins[1]}
// Presentation follows confirmed contact; simulation and both actors share one clock.
function activeComboCinema(){const e=S.comboCinema;if(!e)return false;const f=e.actor;if(S.ended||S.preFight||!S.running||f.a!=='COMBO'||f.attackSerial!==e.serial||!(f===B?B.anim:O.locked)){S.comboCinema=null;return false;}return true;}
// Combo plays at full speed; only the finisher gets one short slow-down (about 0.4 s of real time).
function comboTimeScale(){
 const e=S.comboCinema,f=e.actor,c=krovConfig(f).COMBO;
 if(e.finisherFrame===undefined){const frames=Object.entries(c.hits||{}).filter(([,h])=>h.group===c.finisherGroup).map(([i])=>Number(i));e.finisherFrame=frames.length?Math.min(...frames):Infinity;}
 if(e.slowMs===undefined&&f.frame>=e.finisherFrame){e.slowMs=380;e.kick=1;}
 const desired=e.slowMs>0?.4:1;if(e.slowMs>0)e.slowMs-=SIM_STEP;
 e.timeScale=(e.timeScale??1)+(desired-(e.timeScale??1))*.3;
 return e.timeScale;
}
// Banner with the fighter's portrait while a combo runs (local, host and guest alike).
let comboBannerEl=null,comboBannerKey=null;
function updateComboBanner(){
 if(!comboBannerEl){comboBannerEl=document.createElement('div');comboBannerEl.id='comboBanner';comboBannerEl.className='off';comboBannerEl.setAttribute('aria-hidden','true');const img=document.createElement('img'),box=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');img.alt='';img.draggable=false;small.textContent='COMBO';box.appendChild(small);box.appendChild(strong);comboBannerEl.appendChild(img);comboBannerEl.appendChild(box);comboBannerEl.parts={img,strong};game.appendChild(comboBannerEl);}
 const f=S.running&&!S.ended&&!S.preFight?(B.a==='COMBO'?B:O.a==='COMBO'?O:null):null,name=f?(f===B?playerCharacter:O.character):null,key=f?name+(f===B?':L':':R'):null;
 if(key===comboBannerKey)return;comboBannerKey=key;
 if(!f){comboBannerEl.classList.add('off');comboBannerEl.classList.remove('play');return;}
 comboBannerEl.parts.img.src='/assets/portraits/'+name.toLowerCase()+'.webp';comboBannerEl.parts.strong.textContent=displayFighterName(name);
 comboBannerEl.classList.toggle('right',f===O);comboBannerEl.classList.remove('off');comboBannerEl.classList.remove('play');void comboBannerEl.offsetWidth;comboBannerEl.classList.add('play');
}
function updateComboCamera(dt){
 const stage=$('#combatStage');if(!stage)return;
 const active=activeComboCinema()&&!S.ended&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const {width:W,height:H}=arenaSize();let z=1,tx=0,ty=0;
 if(active){const e=S.comboCinema,target=e.actor===B?O:B;
  // Capture a single composition. Animated limbs never resize the camera.
  if(!e.framing||e.framing.width!==W||e.framing.height!==H){
   const boxes=[B,O].map(f=>{const c=krovConfig(f)[f.a],q=c.boxes[Math.min(f.frame,c.boxes.length-1)],sc=baseScale()*c.scale,p=framePivotX(f.a,f.frame,c),x=f.x/100*W;return {left:x+(f.face>0?q[0]-p:p-q[2])*sc,right:x+(f.face>0?q[2]-p:p-q[0])*sc,top:groundY()+(q[1]-c.anchorY)*sc,bottom:groundY()+(q[3]-c.anchorY)*sc};});
   const l=Math.min(...boxes.map(b=>b.left))-30,r=Math.max(...boxes.map(b=>b.right))+30,t=Math.min(...boxes.map(b=>b.top))-22,bottom=Math.max(...boxes.map(b=>b.bottom))+18;
   e.framing={width:W,height:H,zoom:Math.max(1,Math.min(1.12,(W-28)/(r-l),(H-24)/(bottom-t))),x:(l+r)/2,y:(t+bottom)/2,root:(B.x+O.x)/200*W};
  }
  if(target.downState)e.releasing=true;
  if(!e.releasing){const f=e.framing,shift=(B.x+O.x)/200*W-f.root;
   // A dead zone absorbs tiny combat corrections; follow only actual travel.
   const follow=Math.sign(shift)*Math.max(0,Math.abs(shift)-W*.025);
   const kick=e.kick||0;z=f.zoom; // impact shows as a tiny shake only; the zoom itself never pumps
   tx=Math.max(W*(1-z),Math.min(0,W/2-z*(f.x+follow)))+(kick?(Math.random()-.5)*6*kick:0);ty=Math.max(H*(1-z),Math.min(0,H*.52-z*f.y))+(kick?(Math.random()-.5)*5*kick:0);if(kick)e.kick=kick<.02?0:kick*Math.exp(-dt/160);
  }
 }
 const c=S.comboCamera||{z:1,x:0,y:0},w=1-Math.exp(-dt/(active?110:200));c.z+=(z-c.z)*w;c.x+=(tx-c.x)*w;c.y+=(ty-c.y)*w;S.comboCamera=c;
 if(!active&&Math.abs(c.z-1)<.001){c.z=1;c.x=c.y=0;}stage.style.transform=`translate(${c.x}px,${c.y}px) scale(${c.z})`;
}
function koTimeScale(remaining){const t=Math.max(0,Math.min(1,(520-remaining)/520));return .28+.72*t*t*(3-2*t);}
const SIM_STEP=1000/60;
const frameSamples=[],workSamples=[];
window.__BRAX_DIAGNOSTICS__={sample(){return{role:NET.active?(NET.host?'host':'guest'):'offline',active:!!(S.running&&!S.paused&&!S.preFight&&!S.ended&&!S.cinematic&&!document.hidden),actors:[B,O].map((f,i)=>({x:f.x,yPercent:(f.y||0)/arenaSize().height*100,action:f.a,actionId:NET.active&&!NET.host?NET.renderedPose?.[i]?.actionId:f.attackSerial,frame:f.frame,attack:!!krovConfig(f)[f.a]?.attack}))};},report(){const quantile=(xs,p)=>{const a=[...xs].sort((a,b)=>a-b);return a.length?a[Math.min(a.length-1,Math.floor(a.length*p))]:null;};return{device:navigator.userAgent||null,viewport:arenaSize(),samples:frameSamples.length,frameMs:{p50:quantile(frameSamples,.5),p95:quantile(frameSamples,.95),p99:quantile(frameSamples,.99)},cpuFrameMs:{p95:quantile(workSamples,.95)},network:{interpolationMs:Math.round(networkTiming.delay*10)/10,adaptive:true,packetIntervalMs:Math.round(networkTiming.interval*10)/10,extrapolationLimitMs:100,inputSamples:NET.inputs.length,inputToVisibleMs:{p50:quantile(NET.inputs,.5),p95:quantile(NET.inputs,.95)},packetJitterMs:{p50:quantile(NET.jitter,.5),p95:quantile(NET.jitter,.95)}},jsHeapBytes:performance.memory?.usedJSHeapSize??null,heapNote:'JS heap only when supported; not GPU or total device memory',resources:(performance.getEntriesByType?.('resource')||[]).filter(x=>x.name.includes('/assets/')).map(x=>({name:x.name.split('/assets/')[1],duration:x.duration,transferSize:x.transferSize})),lostContexts:[...lostContexts]};},reset(){frameSamples.length=workSamples.length=NET.inputs.length=NET.jitter.length=0;}};
function loop(now){
 if(selectedArena==='nocny-targ'&&S.running&&!S.matchOver&&!window.BRAX_NIGHT_MARKET?.report().active)window.BRAX_NIGHT_MARKET?.start($('#combatStage'),()=>fightAudio.play('thunder',.7));
 if(selectedArena==='nocny-targ')window.BRAX_NIGHT_MARKET?.tick(now,{running:S.running,matchOver:S.matchOver,paused:S.paused,cinematic:S.cinematic,preFight:S.preFight,ended:S.ended,hidden:document.hidden,portrait:arenaSize().width<arenaSize().height,contextLost:lostContexts.size>0,replay:!!koReplay?.active});
 game.classList.toggle('air-attack-enabled',!!CFG.ACROBATIC_PUNCH&&S.running&&!S.preFight&&!S.ended);
 game.classList.toggle('paused',S.running&&S.paused&&!S.cinematic&&!S.ended&&!NET.active);
 if(NET.active&&!NET.host){const rawDt=now-S.last,started=performance.now();if(!document.hidden&&!lostContexts.size&&arenaSize().width>=arenaSize().height)networkRender();if(S.running&&!S.preFight&&!S.ended&&!document.hidden){frameSamples.push(rawDt);workSamples.push(performance.now()-started);if(frameSamples.length>3600){frameSamples.shift();workSamples.shift();}}S.last=now;requestAnimationFrame(loop);return;}
 const rawDt=now-S.last,started=performance.now(),dt=Math.max(0,Math.min(100,rawDt));S.last=now;const v=arenaSize();
 if(koReplay?.active){S.acc=0;if(!document.hidden&&v.width>=v.height)koReplay.step(dt);requestAnimationFrame(loop);return;}
 if(S.running&&!S.paused&&!document.hidden&&!lostContexts.size&&v.width>=v.height){
  S.acc=(S.acc||0)+dt;
  while(S.acc+1e-7>=SIM_STEP){S.acc-=SIM_STEP;
   const slow=S.koSlowMs>0&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   S.koSlowMs=Math.max(0,(S.koSlowMs||0)-SIM_STEP);
   const cinematicCombo=activeComboCinema();const elapsed=SIM_STEP*(cinematicCombo?comboTimeScale():slow?koTimeScale(S.koSlowMs):1);physics(elapsed);S.simTime=(S.simTime||0)+elapsed;captureReplay();if(NET.active&&NET.host)window.BRAX_NETWORK_STEP?.(networkSnapshot());
  }draw();updateComboCamera(dt);updateComboBanner();if(!S.preFight&&!S.cinematic&&!S.ended){frameSamples.push(rawDt);workSamples.push(performance.now()-started);if(frameSamples.length>3600){frameSamples.shift();workSamples.shift();}}
 }else S.acc=0;
 requestAnimationFrame(loop);
}

const O={character:'NYXA',cfg:NYXA_CFG,x:72,face:-1,hp:100,a:'IDLE',frame:0,time:0,locked:false,cooldown:1400,hits:new Set(),evadeTime:0};
const opponentEl=$('#opponent'),opponentSprite=$('#oSprite'),opponentCtx=opponentSprite.getContext('2d',{alpha:true});
let opponentRender=null,playerEvadeTime=0,roundRecovery=0;
function setupOpponent(){O.character=selectedOpponent||(playerCharacter==='BRAX'?'NYXA':'BRAX');O.cfg=characterConfig(O.character);$('#opponentName').textContent=(displayFighterName(O.character))+' · CPU';opponentSprite.setAttribute('aria-label',displayFighterName(O.character));resetOpponent()}
function resetOpponent(){Object.assign(O,{x:72,face:-1,hp:100,a:'IDLE',frame:0,time:0,locked:false,cooldown:DIFFICULTY[S.difficulty].cooldown,blockTime:0,observeMs:0,responded:false,counterReady:false,observed:null,lastAttack:null,attackUseCounts:{},tacticalRetreat:0,retreatCooldown:0,en:0,comboUses:0,comboCooldown:0,trainingMoveMs:0,trainingRetreat:false,grabCooldown:4000,recover:0,pushTime:0,pushSpeed:0});O.hits.clear();playerEvadeTime=0;roundRecovery=0;S.ended=false;opponentRender=null;}
function faceOpponents(){if(Math.abs(O.x-B.x)<.2)return;const face=O.x>B.x?1:-1;if(B.face!==face&&(!CFG.IDLE.sourceVersion||!B.lock)){B.face=face;render(B.a,B.frame)}if(!O.cfg.IDLE.sourceVersion||!O.locked)O.face=-face;}
function opponentPose(name,locked=false){O.comboConnection=null;O.strikeMotion=null;if(!O.cfg[name])name='IDLE';if(O.cfg[name].attack){if(S.cpuPlayer){O.repeatCount=O.lastAttackName===name?(O.repeatCount||0)+1:1;O.lastAttackName=name;}O.attackSerial=(O.attackSerial||0)+1;O.getupProtection=0;}O.a=name;O.comboAborted=false;O.frame=O.cfg[name].startFrame||0;O.time=0;O.locked=locked;O.hits.clear();opponentRender=null;}
function drawOpponent(){if(!S.running)return;const c=contactRenderConfig(O,O.cfg[O.a]),a=decodeGif(c.asset),fi=Math.min(O.frame,a.frames.length-1),sc=baseScale()*c.scale,anchor=frameAnchorY(O.a,fi,c,frameBox(c,fi)),pivot=framePivotX(O.a,fi,c);if(c.sourceVersion||isLegacyKrov(O)||!opponentRender||opponentRender.asset!==c.asset||opponentRender.frame!==fi||opponentRender.face!==O.face){if(opponentSprite.width!==a.w||opponentSprite.height!==a.h){opponentSprite.width=a.w;opponentSprite.height=a.h;}if(c.model3d)characterRenderer(O.character).render(opponentCtx,O.strikeMotion?.weight>0?{...c,movingGait:{config:O.strikeMotion.run&&O.cfg.RUN?O.cfg.RUN:O.cfg.WALK_FORWARD||O.cfg.APPROACH,time:O.strikeMotion.clock/1000,weight:O.strikeMotion.weight}}:c,c.sourceVersion?fi+O.time/c.durations[fi]:isLegacyKrov(O)?fi+O.time/(1000/60):fi,O.face,S.poseClock||0);else opponentCtx.putImageData(new ImageData(displayPixels(a.frames[fi],c.asset),a.w,a.h),0,0)}opponentSprite.style.width=a.w*sc+'px';opponentSprite.style.height=a.h*sc+'px';opponentSprite.style.marginLeft=((O.face>=0?(a.w/2-pivot):(pivot-a.w/2))*sc)+'px';opponentSprite.style.bottom=-(a.h-anchor)*sc+'px';opponentEl.style.left=O.x+'%';opponentEl.style.bottom=groundInset()+'px';opponentEl.classList.toggle('krov',isLegacyKrov(O));opponentEl.classList.toggle('leftface',O.face<0);opponentEl.classList.toggle('rightface',O.face>=0);$('#opponentHp').style.width=O.hp+'%';opponentRender={asset:c.asset,frame:fi,anchor,scale:sc,face:O.face};}
function fighterRect(f,c,box,anchor){const r=game.getBoundingClientRect(),sc=baseScale()*c.scale,x=r.left+f.x/100*r.width,y=r.bottom-groundInset()-(f===B||f.isPlayer?(f.y||0)*.007*r.height:0),[bx,by,bw,bh]=box,pivot=framePivotX(f.a,f.frame,c);const left=f.face>0?x+(bx-pivot)*sc:x-(bx+bw-pivot)*sc;return{left,right:left+bw*sc,top:y+(by-anchor)*sc,bottom:y+(by+bh-anchor)*sc}}
function opponentHurtbox(){return bodyHurtbox(O,O.cfg[O.a],O.a,O.frame)}
function contactFeedback(target,rect,blocked,point=null){const el=target===B?b:opponentEl;el.classList.remove('contact');void el.offsetWidth;el.classList.add('contact');setTimeout(()=>el.classList.remove('contact'),160);fightAudio.play(blocked?'heavy':'impact',blocked?.25:.6);if(!blocked)S.hitstop=42;const z=target===B?playerHurtbox():opponentHurtbox(),r=game.getBoundingClientRect();const x=(point?.x??(Math.max(rect.left,z.left)+Math.min(rect.right,z.right))/2)-r.left,y=(point?.y??(Math.max(rect.top,z.top)+Math.min(rect.bottom,z.bottom))/2)-r.top;for(let i=0;i<5;i++){const dot=document.createElement('i');dot.className='spark';dot.style.left=x+'px';dot.style.top=y+'px';dot.style.setProperty('--dx',(Math.cos(i*1.256)*25)+'px');dot.style.setProperty('--dy',(Math.sin(i*1.256)*25)+'px');sparks.appendChild(dot);setTimeout(()=>dot.remove(),450)}}
// Damage-weighted pressure is shared by both sides and all six styles.
// Each ordinary attack contributes at most 14 pressure, even if it has many hits.
// A clear gap of 35% of fighter height beyond both body radii, sustained 600ms.
function pressureDisengaged(target){
 const attacker=target===B?O:B;
 if(target&&(target.pushTime>0||target.stun>0||target.a.startsWith('HIT_')))return false;
 if(krovConfig(attacker)[attacker.a]?.attack)return false;
 const advancing=attacker===B?(B.cpuAdvance||((K.right?1:0)-(K.left?1:0))*B.face>0):['WALK_FORWARD','APPROACH','RUN'].includes(attacker.a);
 if(advancing)return false;
 const a=sourcePushBody(B),b=sourcePushBody(O);return Math.abs(a.x-b.x)>a.r+b.r+sourceHeight()*.35;
}
function recordCleanHit(target,amount,hit){
 let e=target.hitSeries;
 if(!e||e.remaining<=0)e=target.hitSeries={remaining:3500,pressure:0,actions:0,strongActions:0,hits:0,tokens:new Map()};
 const token=hit.kickToken??Symbol('hit');let action=e.tokens.get(token);
 if(!action){action={damage:0,hits:0};e.tokens.set(token,action);e.actions++;if(!hit.comboPart&&(/^(HEAVY_PUNCH|HEAVY_KICK|SPIN_KICK|UPPERCUT)$/.test(hit.moveName||'')||!hit.moveName&&amount>=12))e.strongActions=(e.strongActions||0)+1;}
 const before=Math.min(14,action.damage);action.damage+=amount;action.hits++;e.hits++;
 e.pressure+=Math.min(14,action.damage)-before;e.remaining=3500;
 // Every clean special finisher launches, even when earlier hits missed.
 // Ordinary pressure still respects the recovery cooldown.
 const comboLaunch=!!hit.comboFinish;
 const launch=comboLaunch||!(target.knockdownCooldown>0)&&(e.strongActions>=3||e.pressure>=36&&e.actions>=3);
 const push=(!target.recoilCooldown||!target.recoilStrong)&&e.pressure>=20&&e.actions>=2;
 return {launch:(!hit.comboPart||hit.comboFinish)&&launch,push:(!hit.comboPart||hit.comboFinish)&&push};
}
function hitRecoil(target,amount,strong=false){
 const attacker=target===B?O:B,direction=target.x===attacker.x?-target.face:Math.sign(target.x-attacker.x);
 const distance=worldHPercent()*(strong?.40:Math.min(.08,.025+amount*.0025));
 target.pushTime=strong?300:120;target.pushSpeed=direction*distance/(target.pushTime/1000);
 target.recoilCooldown=strong?900:160;target.recoilStrong=strong;
 // A wall consumes travel, never adds damage or another stun. Move the attacker
 // back by the unavailable part of a strong recoil so a corner cannot pin forever.
 if(strong){const limits=visibleLimits(target),room=direction>0?limits.max-target.x:target.x-limits.min,overflow=Math.max(0,distance-Math.max(0,room));
  if(overflow>0){attacker.pushTime=300;attacker.pushSpeed=-direction*overflow/.3;}
 }
}
function damage(target,amount,rect=null,hit={}){
 const amountHp=amount*(target===B&&!S.training&&!NET.active?DIFFICULTY[S.difficulty]?.power??1:1);amount=Number.isFinite(hit.impact)?hit.impact:amount;
 const config=krovConfig(target),isKrov=isLegacyKrov(target),region=(hit.target||'body').toLowerCase(),old=hit.defense?.config||config[target.a],fi=hit.defense?.frame??target.frame,defense=hit.defense||combatSnapshot(target);
 if(S.ended||defense.downState||defense.a==='GETUP'||defense.getupProtection>0)return false;
 const evasion=old.evadeFrames,evading=defense.evade||(evasion&&fi>=evasion[0]&&fi<=evasion[1]);
 if(evading&&(defense.a!=='LEAN'||region==='head')){if(target===B&&hit.kickToken==='cpu-'+O.attackSerial)noteEvadedHit(O,hit);return false;}
 const attacker=target===B?O:B,comboToken=(attacker===B?'player-':'cpu-')+attacker.attackSerial;
 const liveCombo=hit.comboPart&&hit.moveName==='COMBO'&&attacker.a==='COMBO'&&hit.kickToken===comboToken;
 const targetKey=target===B?'player':'opponent',connection=liveCombo&&attacker.comboConnection;
 const comboCommitted=connection&&connection.token===comboToken&&connection.target===targetKey&&connection.groups.size>=2;
 const guarding=defense.guard,low=defense.low,blocked=!comboCommitted&&guarding&&(low?region==='leg':region!=='leg');
 // Two distinct clean damage groups confirm this action only. Repeated frame
 // samples, guarded hits, another action and another target cannot confirm it.
 if(liveCombo&&!blocked&&Number.isFinite(hit.group)){
  const chain=connection&&connection.token===comboToken&&connection.target===targetKey?connection:(attacker.comboConnection={token:comboToken,target:targetKey,groups:new Set()});chain.groups.add(hit.group);
 }
 target.lastHitBlocked=blocked;
 const sourceRecovery=!!config.FLY;
 const counter=!blocked&&old.attack&&(target===B?defense.phase==='STARTUP':fi<Math.min(...Object.keys(old.hits).map(Number)));target.hp=Math.max(S.training?1:0,target.hp-(blocked?0:amountHp));
 if(rect)contactFeedback(target,rect,blocked,hit.contactPoint);
 if(blocked){target.hitSeries=null;if(target===B)featureEvent('block');}
 else{if(blood&&rect){const bounds=game.getBoundingClientRect();blood.hit(target===B?0:1,amount,region,{x:(hit.contactPoint?.x??(rect.left+rect.right)/2)-bounds.left,y:(hit.contactPoint?.y??(rect.top+rect.bottom)/2)-bounds.top},-target.face);}const pressure=recordCleanHit(target,amount,hit);if(target===O){featureEvent('hit');if((hit.moveName||'').includes('KICK')||['MEIA_LUA','TEEP','CAPOEIRA','CLINCH_KNEE'].includes(hit.moveName)||/Foot|Leg|Toe/.test(hit.bone||''))featureEvent('kick');if(hit.comboPart)featureEvent('combohit');const last=old.attack?Math.max(...Object.keys(old.hits).map(Number)):-1;if(old.attack&&fi>last&&![...O.hits].some(h=>typeof h==='number'))featureEvent('counter');if(pressure.push)featureEvent('push');}if(sourceRecovery)target.airDamage=(target.airDamage||0)+amountHp;if(S.grabAttempt?.attacker===(target===B?'player':'opponent'))S.grabAttempt=null;if(target===B)attackQueue.length=0;
  if(target.hp<=0){if(sourceRecovery&&hit.comboFinish)launchSource(target);else knockdown(target);}
  else if(sourceRecovery&&pressure.launch){launchSource(target,!!hit.comboFinish);}
  else if(hit.masterId==='K04'&&counter){knockdown(target);}
  else{const tier=pressure.push||amount>=13?3:amount>=9?2:1;target.stun=Math.max(target.stun||0,[0,90,130,170][tier]);const reaction=isKrov?`HIT_R${hit.strength||2}_${region.toUpperCase()}`:`HIT_R${tier}_${region==='head'?'HEAD':'BODY'}`;if(!target.a.startsWith('HIT_')||!(target===B?B.anim:O.locked)||tier>(target.reactionTier||0)){target.reactionTier=tier;krovPose(target,config[reaction]?reaction:config.HIT_BODY?'HIT_BODY':'IDLE');}if(pressure.push)hitRecoil(target,amount,true);else if(!hit.comboPart&&!target.recoilCooldown)hitRecoil(target,amount);if(target===O)O.cooldown=Math.max(O.cooldown,DIFFICULTY[S.difficulty].reaction);}
  if(pressure.launch&&!S.training){$('#koAccent').classList.add('impact');setTimeout(()=>$('#koAccent').classList.remove('impact'),220);}if(rect)S.hitstop=pressure.launch?60:pressure.push?48:amount>=13?42:30;
 }
 if(B.hp<=0||O.hp<=0){if(!S.training)koReplay?.mark();if(!S.training&&!S.koSlowMs){S.koSlowMs=700;$('#koAccent').classList.add('active');setTimeout(()=>$('#koAccent').classList.remove('active'),700);fightAudio.play('heavy',.62,.82);}if(!contactBatch)endRound();}return true;
}
function comboFinisher(attacker,target,c,hit,blocked){if(c.finisherGroup===undefined||hit.group!==c.finisherGroup||blocked||target.hp<=0)return;if(krovConfig(target).FLY)return; // Source launches are decided by connected damage in damage().
target.pushTime=220;target.pushSpeed=attacker.face*26;target.stun=Math.max(target.stun||0,380);if(target===O){opponentPose('FALL',true);O.cooldown=1100;}else{B.anim=null;B.lock=false;attackQueue.length=0;beginAction('FALL');}}
function holdSourceContact(c){if(!c.sourceVersion||!(S.hitstop>0))return;if(CFG.IDLE.sourceVersion&&B.anim)B.frameT=0;if(O.cfg.IDLE.sourceVersion)O.time=0;}
// Authored combo plays its full sequence on a block or miss. Actual hit reactions still interrupt it.
function resolvePlayerHit(){resolveCombatHit(B);}
function evade(){if(!canInput())return false;if(S.clinch){if(S.clinch.sourcePair)return sourcePairInput('evade');if(S.clinch.showcase||S.clinch.contact)return false;if(S.clinch.krov)return handleKrovClinchInput('evade');releaseClinch();return true;}if(isLegacyKrov(B)){if(!canInput()||B.lock||B.jumpTime!==null)return false;const direction=((K.right?1:0)-(K.left?1:0))*B.face;if(direction<0)return beginKrovDash(-1);return beginAction(K.down?'DUCK':'LEAN');}if(!canInput()||B.lock||B.jumpTime!==null)return false;playerEvadeTime=CFG.LEAN?.evadeFrames?0:340;if(!CFG.LEAN?.evadeFrames)B.x-=B.face*4;if(CFG.LEAN){B.evadeOrigin=combatSnapshot(B);return beginAction('LEAN');}setPose('WALK_BACK');return true;}
function resolveOpponentHit(){resolveCombatHit(O);}
function trainingMovement(dt){
 if(O.locked||O.stun||O.downState||S.clinch||O.pushTime>0||S.contactMs>0)return;
 const distance=Math.abs(O.x-B.x),near=worldHPercent()*.95,far=near+worldHPercent()*.45;
 // Keep a direction for a full step: no frame-by-frame forward/back oscillation.
 O.trainingMoveMs=Math.max(0,(O.trainingMoveMs||0)-dt);
 if(!O.trainingMoveMs){O.trainingRetreat=distance<near?true:distance>far?false:!O.trainingRetreat;O.trainingMoveMs=850;}
 if((O.x<11&&O.face>0)||(O.x>89&&O.face<0))O.trainingRetreat=false;
 const back=!!O.trainingRetreat,pose=back?'WALK_BACK':forwardPose(O);
 if(O.a!==pose)opponentPose(pose);
 O.x=Math.max(9,Math.min(91,O.x+O.face*(back?-1:1)*sourceMoveSpeed(O.character,back)*dt/1000));
}
function opponentStep(dt){playerEvadeTime=Math.max(0,playerEvadeTime-dt);if(S.ended){celebrationStep(dt);return;}const c=O.cfg[O.a],ds=c.durations;O.time+=dt*(O.a==='WALK_FORWARD'||O.a==='WALK_BACK'||O.a==='APPROACH'||O.a==='RUN'?locomotionTempo(O.character,O.a):actionTempo(O.character,c,O.frame));while(O.time>=ds[O.frame]){resolveOpponentHit();if(O.cfg[O.a]!==c||S.hitstop>0&&c.sourceVersion)return;O.time-=ds[O.frame];const previousTempo=actionTempo(O.character,c,O.frame);O.frame++;if(O.frame<ds.length)fightAudio.frame(O.a,O.frame,O);if(c.phaseTempo)O.time*=actionTempo(O.character,c,O.frame)/previousTempo;if(O.frame>=ds.length){if(O.locked){if(advanceSourceDown(O)||isLegacyKrov(O)&&advanceKrovDown(O))break;const recovering=O.a.startsWith('HIT_'),wasAttack=!!c.attack;if(wasAttack&&(!S.training||S.trainingBehavior==='spar')&&!(O.retreatCooldown>0)){O.tacticalRetreat=FEATURES.styles[O.character].retreat*({easy:1.4,normal:1,hard:.1})[S.difficulty];O.retreatCooldown=1200;}opponentPose('IDLE');O.blockTime=0;O.cooldown=recovering?({easy:300,normal:80,hard:0})[S.difficulty]:DIFFICULTY[S.difficulty].cooldown;break}O.frame=0}}
 if(S.preFight)return;if(O.observedSerial!==B.attackSerial){O.observedSerial=B.attackSerial;O.observeMs=0;O.responded=false;}if(B.anim?.c.attack)O.observeMs+=dt;resolveKrovGrab();
 resolveOpponentHit();if(S.hitstop>0&&c.sourceVersion)return;
 if(NET.active&&NET.host){remoteOpponentStep(dt);return;}
 if(S.training&&['repeat','counter','grab','bag'].includes(S.trainingBehavior)){trainingDrill(dt);return;}
 if(S.training&&S.trainingBehavior!=='spar'){if(S.trainingBehavior==='move'){trainingMovement(dt);return;}if(O.character==='NINA'&&S.trainingBehavior==='block'&&!O.locked&&B.anim?.c.attack&&O.observed!==B.anim&&Math.abs(O.x-B.x)<24){O.observed=B.anim;opponentPose('LEAN',true);return;}const pose=S.trainingBehavior==='block'&&O.character!=='NINA'?'BLOCK':'IDLE';if(O.a!==pose&&!O.locked)opponentPose(pose);return}cpuDecision(dt,O,B);}

// The same production policy drives either actor in deterministic CPU-CPU audits.
// cpuPlayer is never enabled by a game mode or network input.
function cpuLocked(f){return f===B?B.lock:O.locked;}
function cpuAnimation(f){return f===B?B.anim:O.locked?{c:O.cfg[O.a]}:null;}
function cpuPose(f,name,locked=false){
 if(f===O)return opponentPose(name,locked);
 K.block=name==='BLOCK'||name==='BLOCK_LOW';K.down=name==='BLOCK_LOW';
 if(name==='COMBO'){S.comboReserved=true;S.comboUses=f.comboUses;}
 if(locked){K.left=K.right=false;return beginAction(name);}setPose(name);
}
function cpuDecision(dt,actor,enemy){
if(cpuLocked(actor)||actor.stun||actor.pushTime>0||S.contactMs>0)return;const level=DIFFICULTY[S.difficulty];actor.cooldown-=dt;if(actor.blockTime>0){actor.blockTime-=dt;if(actor.blockTime<=0){if(S.difficulty==='hard')actor.counterReady=true;cpuPose(actor,'IDLE');actor.cooldown=Math.min(actor.cooldown,S.difficulty==='easy'?level.reaction:0);}return}if(cpuAnimation(enemy)?.c.attack&&enemy.frame>Math.max(...Object.keys(cpuAnimation(enemy).c.hits).map(Number)))actor.responded=true;if(cpuAnimation(enemy)?.c.attack&&!actor.responded&&!actor.counterReady){if(Math.abs(actor.x-enemy.x)<24&&actor.observeMs<level.reaction&&S.difficulty!=='easy'&&krovName(actor)!=='NINA')return;if(actor.observeMs>=level.reaction){actor.responded=true;if(Math.abs(actor.x-enemy.x)<24&&Math.random()<(krovName(actor)==='NINA'?level.block*.25:S.difficulty==='hard'&&enemy.repeatCount>=3?.98:level.block)){if(krovName(actor)==='NINA')cpuPose(actor,'LEAN',true);else{const defendingHit=Object.values(cpuAnimation(enemy).c.hits)[0],lowTarget=defendingHit&&defendingHit.box[1]+defendingHit.box[3]/2>cpuAnimation(enemy).c.anchorY-110;cpuPose(actor,lowTarget&&krovConfig(actor).BLOCK_LOW?'BLOCK_LOW':'BLOCK');const attack=cpuAnimation(enemy).c,last=Math.max(...Object.keys(attack.hits).map(Number)),remaining=attack.durations.slice(enemy.frame,last+1).reduce((a,b)=>a+b,0)/actionTempo(krovName(enemy),attack,enemy.frame);actor.blockTime=S.difficulty==='hard'?Math.max(260,Math.min(1400,remaining+100)):S.difficulty==='normal'?Math.max(260,Math.min(700,remaining+60)):260;}return}}}const distance=Math.abs(actor.x-enemy.x);
 // Choose from attacks actually in reach; a blocked short-punch approach must
 // never prevent an available kick. Recoveries and six original moves still apply.
 const repertoire=(krovConfig(actor).IDLE.sourceVersion?SOURCE_ATTACKS[krovName(actor)]:isLegacyKrov(actor)?['OVERHAND','BODY_HOOK','ELBOW','UPPERCUT','KNEE','LOW_KICK']:['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','UPPERCUT','COUNTER','DOUBLE_PUNCH']).filter(n=>krovConfig(actor)[n]?.attack);
 const leastUsed=Math.min(...repertoire.map(n=>actor.attackUseCounts?.[n]||0));
 const respondingToAttack=!!cpuAnimation(enemy)?.c.attack;
 const available=repertoire.filter(n=>(S.difficulty!=='hard'||respondingToAttack||actor.counterReady||(actor.attackUseCounts?.[n]||0)===leastUsed)&&!enemy.downState&&!(enemy.getupProtection>0)&&distance<=attackDistance(krovConfig(actor)[n],(enemy===B?playerHurtbox():opponentHurtbox()),actor,enemy));
 const style=FEATURES.styles[krovName(actor)],ranges=repertoire.map(n=>attackDistance(krovConfig(actor)[n],(enemy===B?playerHurtbox():opponentHurtbox()),actor,enemy)).sort((a,b)=>a-b),desired=ranges[Math.min(ranges.length-1,Math.floor((S.difficulty==='hard'?0:style.range)*(ranges.length-1)))]*.88;
 const combo=krovConfig(actor).COMBO,comboReady=combo?.attack&&actor.en>=100&&actor.comboUses<2&&actor.comboCooldown<=0&&S.difficulty!=='easy'&&!enemy.downState&&!(enemy.getupProtection>0);
 if(comboReady&&actor.cooldown<=0){
  const px=combo.comboGapByOpponent?.[krovName(enemy)]??combo.comboGapPx,reach=px?comboApproachGap(px,combo,krovName(actor)):attackDistance(combo,(enemy===B?playerHurtbox():opponentHurtbox()),actor,enemy);
  if(distance<=reach+.4){actor.en=0;actor.comboUses++;actor.comboCooldown=18000;cpuPose(actor,'COMBO',true);return;}
  const step=sourceMoveSpeed(krovName(actor))*level.approach*dt/1000;actor.x+=actor.face*Math.min(distance-reach,step);if(actor.a!==forwardPose(actor))cpuPose(actor,forwardPose(actor));return;
 }
 if(actor.tacticalRetreat>0&&!comboReady){const spent=Math.min(dt,actor.tacticalRetreat);actor.tacticalRetreat-=spent;const limit=visibleLimits(actor),room=actor.face>0?actor.x-limit.min:limit.max-actor.x;if(room>1&&distance<desired*1.25&&!enemy.downState){actor.x-=actor.face*sourceMoveSpeed(krovName(actor),true)*spent/1000;if(actor.a!=='WALK_BACK')cpuPose(actor,'WALK_BACK');return;}actor.tacticalRetreat=0;}
 if(actor.cooldown<=0&&available.length){
  if((krovConfig(actor).GRAB||krovConfig(actor).THROW_ATTACKER)&&Math.random()<level.grabChance&&beginClinch(actor))return;
  const varied=available.filter(n=>n!==actor.lastAttack),underPressure=(actor.counterReady||cpuAnimation(enemy)?.c.attack)&&S.difficulty!=='easy'&&(krovName(actor)!=='NINA'||S.difficulty==='hard'),list=underPressure?available:varied.length?varied:available;
  const firstContact=name=>{const c=krovConfig(actor)[name],frame=Math.min(...Object.keys(c.hits).map(Number));return c.durations.slice(0,frame).reduce((a,b)=>a+b,0)/actionTempo(krovName(actor),c,0);};
  const punishScore=name=>{const hits=Object.values(krovConfig(actor)[name].hits),damage=[...new Map(hits.map(h=>[h.group,h.damage])).values()].reduce((a,b)=>a+b,0);return damage/(firstContact(name)+100);};
  actor.lastAttack=S.difficulty==='hard'&&underPressure?[...list].sort((a,b)=>punishScore(b)-punishScore(a))[0]:FEATURES.chooseAttack(krovName(actor),list,actor.lastAttack,underPressure&&(actor.counterReady||S.difficulty==='hard'&&enemy.repeatCount>=3||Math.random()<({easy:.20,normal:.45,hard:.65})[S.difficulty]),firstContact);(actor.attackUseCounts||={})[actor.lastAttack]=(actor.attackUseCounts[actor.lastAttack]||0)+1;actor.counterReady=false;cpuPose(actor,actor.lastAttack,true);
 }else if(distance>desired){
  const speed=isLegacyKrov(actor)?worldHPercent()*.75:krovConfig(actor).IDLE.sourceVersion?sourceMoveSpeed(krovName(actor))*level.approach*style.pressure:level.speed*moveTempo(krovName(actor));
  actor.x+=actor.face*Math.min(distance-desired,speed*dt/1000);const pose=forwardPose(actor);if(actor.a!==pose)cpuPose(actor,pose);
 }else if(actor.a!=='IDLE')cpuPose(actor,'IDLE');actor.x=Math.max(9,Math.min(91,actor.x));
}

function playerCpuStep(dt){
 B.cpuAdvance=false;
 for(const key of ['retreatCooldown','grabCooldown','comboCooldown'])B[key]=Math.max(0,(B[key]||0)-dt);
 const locked=cpuLocked(B);
 if(B.cpuWasLocked&&!locked){const recovering=B.cpuLastLockedAction?.startsWith('HIT_');B.cooldown=recovering?({easy:300,normal:80,hard:0})[S.difficulty]:DIFFICULTY[S.difficulty].cooldown;if(CFG[B.cpuLastLockedAction]?.attack&&!(B.retreatCooldown>0)){B.tacticalRetreat=FEATURES.styles[playerCharacter].retreat*({easy:1.4,normal:1,hard:.1})[S.difficulty];B.retreatCooldown=1200;}}
 B.cpuWasLocked=locked;if(locked)B.cpuLastLockedAction=B.a;
 if(B.observedSerial!==O.attackSerial){B.observedSerial=O.attackSerial;B.observeMs=0;B.responded=false;}
 if(cpuAnimation(O)?.c.attack)B.observeMs=(B.observeMs||0)+dt;
 const before=B.x;cpuDecision(dt,B,O);B.cpuAdvance=(B.x-before)*B.face>0;K.right=B.x>before;K.left=B.x<before;if(cpuLocked(B)){B.cpuWasLocked=true;B.cpuLastLockedAction=B.a;}
}



const AI_CONTACT_DISTANCES={"BRAX":{"DEMON":{"LIGHT_PUNCH":210,"HEAVY_PUNCH":260,"LIGHT_KICK":280,"DOUBLE_PUNCH":180,"TEEP":235,"CAPOEIRA":255},"BRAX":{"CAPOEIRA":230},"NYXA":{"CAPOEIRA":255},"VEXA":{"CAPOEIRA":240},"KROV":{"CAPOEIRA":245},"NINA":{"CAPOEIRA":280},"DANNY":{"CAPOEIRA":260},"BEAR":{"CAPOEIRA":250}},"NYXA":{"DEMON":{"HEAVY_PUNCH":280,"LIGHT_KICK":280,"HEAVY_KICK":280,"ELBOW":195,"CLINCH_KNEE":230,"LUNGE_PUNCH":255,"CROUCH_KICK":280},"BRAX":{"LUNGE_PUNCH":245,"CROUCH_KICK":280},"NYXA":{"LUNGE_PUNCH":225,"CROUCH_KICK":280},"VEXA":{"LUNGE_PUNCH":240,"CROUCH_KICK":280},"KROV":{"LUNGE_PUNCH":230,"CROUCH_KICK":280},"NINA":{"LUNGE_PUNCH":255,"CROUCH_KICK":1},"DANNY":{"LUNGE_PUNCH":235,"CROUCH_KICK":280},"BEAR":{"LUNGE_PUNCH":240,"CROUCH_KICK":280}},"NINA":{"BEAR":{"CRESCENT_KICK":265},"BRAX":{"CRESCENT_KICK":280}},"DEMON":{"NINA":{"HEAVY_PUNCH":280}}};
function attackDistance(c,target,attacker=O,defender=B){const move=Object.keys(krovConfig(attacker)).find(name=>krovConfig(attacker)[name]===c),calibrated=AI_CONTACT_DISTANCES[krovName(attacker)]?.[krovName(defender)]?.[move];const reachPx=calibrated??c?.attackRangeByOpponent?.[krovName(defender)]??c?.attackRangePx;if(reachPx)return reachPx*baseScale()*c.scale/arenaSize().width*100*.94;if(!c?.hits||!Object.keys(c.hits).length)return 0;const reach=Math.min(...Object.entries(c.hits).map(([i,h])=>h.box[0]+h.box[2]-framePivotX('',Number(i),c)))*baseScale()*c.scale;const root=game.getBoundingClientRect().left+defender.x/100*arenaSize().width,near=attacker.face>0?root-target.left:target.right-root;return Math.max(1,(reach+near-12)/arenaSize().width*100)}
function sourcePushBody(f){
 const c=f===B?CFG[f.a]:O.cfg[f.a],p=c.pushCenters?.[f.frame];
 if(!p){const z=f===B?playerHurtbox():opponentHurtbox();return{x:(z.left+z.right)/2,r:(z.right-z.left)*.34};}
 // A stable pelvis envelope keeps bodies apart in every state. Extending a foot
 // or guard must not push a short-range punch outside its real contact radius.
 const z=fighterRect(f,c,[p[0],c.anchorY,0,0],c.anchorY);
 return{x:z.left,r:p[1]*baseScale()*c.scale};
}
// Maintain the established short elbow distance after a confirmed opening.
// Move only the attacker at a bounded approach speed; never pull the victim.
function trackKrovCombo(dt){
 for(const f of [B,O]){
  if(!['KROV','NINA'].includes(krovName(f))||f.a!=='COMBO'||f.stun)continue;
  const target=f===B?O:B,c=krovConfig(f).COMBO,groups=f===B?B.hitGroups:O.hits;
  if(!c.sourceVersion||!groups.has(f===B?'damage-'+(krovName(f)==='NINA'?0:1):(krovName(f)==='NINA'?0:1))||groups.has(f===B?'damage-'+c.finisherGroup:c.finisherGroup)||target.downState||!B.ground)continue;
  const follow=c.comboFollowGapByOpponent?.[krovName(target)];const gap=(target.x-f.x)*f.face,desired=(follow??c.comboFollowGapPx??c.comboGapByOpponent?.[krovName(target)]??c.comboGapPx)*baseScale()*c.scale/arenaSize().width*100;
  if(gap<=desired||gap>sourceHeight()/arenaSize().width*100*1.1)continue;
  f.x+=f.face*Math.min(gap-desired,sourceMoveSpeed(krovName(f))*.8*dt/1000);
  separateFighters();
 }
}
function contactTorso(f){
 const c=krovConfig(f)[f.a],caps=c.hurtCapsules?.[f.frame]?.filter(cap=>cap.region==='body');
 if(!caps?.length){const p=sourcePushBody(f);return{left:p.x-p.r,right:p.x+p.r};}
 let left=Infinity,right=-Infinity;const scale=baseScale()*c.scale;
 for(const cap of caps){for(const p of[cap.a,cap.b]){const q=fighterRect(f,c,[p[0],p[1],0,0],c.anchorY);left=Math.min(left,q.left-cap.radius*scale);right=Math.max(right,q.left+cap.radius*scale);}}
 return{left,right};
}
function contactClinchStep(dt){
 const resetContact=()=>{S.contactMs=0;S.contactPressure=0;S.bodyContactMs=0;S.contactAwayMs=0;};
 if(S.clinch||S.contactCooldown>0||B.grabProtection>0||O.grabProtection>0||B.pushTime>0||O.pushTime>0||!S.running||S.paused||S.preFight||S.ended||!B.ground||B.downState||O.downState||B.lock||O.locked||B.stun||O.stun||CFG[B.a].attack||O.cfg[O.a].attack){resetContact();return;}
 const playerForward=((K.right?1:0)-(K.left?1:0))*B.face>0,cpuForward=['WALK_FORWARD','APPROACH','RUN'].includes(O.a);
 const a=sourcePushBody(B),z=sourcePushBody(O),H=sourceHeight();
 if(!(playerForward||cpuForward)||Math.abs(z.x-a.x)>a.r+z.r+H*.05){resetContact();return;}
 S.bodyContactMs=(S.bodyContactMs||0)+dt;
 if(S.bodyContactMs<320)return;
 // No slot-based tie breaker: two advancing fighters separate symmetrically.
 if(playerForward&&cpuForward&&CFG.CONTACT_PUSH&&O.cfg.CONTACT_PUSH){beginShowcaseContact(false,B);S.clinch.mutual=true;S.clinch.rate=1;krovPose(O,'CONTACT_PUSH');resetContact();return;}
 if(CFG.CONTACT_PUSH&&O.cfg.CONTACT_RECEIVE)beginShowcaseContact(false,playerForward?B:O);
 resetContact();
}
function beginShowcaseContact(fall=false,attacker=null){
 const facing=O.x>=B.x?1:-1;B.face=facing;O.face=-facing;
 const playerForward=((K.right?1:0)-(K.left?1:0))*B.face>0,cpuForward=['WALK_FORWARD','APPROACH','RUN'].includes(O.a);
 if(!attacker&&playerForward===cpuForward)return false;
 const a=attacker||(playerForward?B:O),z=a===B?O:B;
 S.clinch={showcase:true,contact:true,attacker:a===B?'player':'opponent',elapsed:0,rate:1/Math.min(1,FEATURES.styles[krovName(a)].clinch),face:a.face,fall:fall&&!!krovConfig(z).CONTACT_FALL};
 S.hitstop=0;S.grabAttempt=null;S.krovDash=null;attackQueue.length=0;
 a.hitSeries=z.hitSeries=null;a.pushTime=z.pushTime=0;a.strikeMotion=z.strikeMotion=null;a.stun=z.stun=0;
 krovPose(a,'CONTACT_PUSH');krovPose(z,'CONTACT_RECEIVE');return true;
}
function showcaseContactStep(dt){
 const e=S.clinch,a=e.attacker==='player'?B:O,z=a===B?O:B;
 a.face=e.face;z.face=-e.face;e.elapsed+=dt;S.poseClock=(S.poseClock||0)+dt;
 const t=e.elapsed/1000*(e.rate||1),ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const distances={BRAX:.75,NYXA:.70,VEXA:.65,KROV:.80,NINA:.65,DANNY:.72},distance=(e.mutual?((distances[krovName(a)]||.7)+(distances[krovName(z)]||.7))/2:distances[krovName(a)]||.7)*worldHPercent();
 const travel=e.fall?0:distance*ease((t-.55)/.45),delta=travel-(e.travel||0);e.travel=travel;
 // Transfer blocked displacement to the pusher at a wall, preserving separation.
 const limit=visibleLimits(z),wanted=z.x+e.face*delta,placed=Math.max(limit.min,Math.min(limit.max,wanted));
 if(e.mutual){for(const f of[a,z]){const limit=visibleLimits(f);f.x=Math.max(limit.min,Math.min(limit.max,f.x-f.face*delta/2));}}else{z.x=placed;a.x-=wanted-placed;}
 for(const f of[a,z]){const c=krovConfig(f)[f.a],frame=Math.min(c.durations.length-1e-5,t/(c.durations[0]/1000));f.frame=Math.floor(frame);if(f===B){B.frameT=(frame-f.frame)*c.durations[0];render(B.a,B.frame);}else O.time=(frame-f.frame)*c.durations[0];}
 if(!e.sound&&t>=.55){e.sound=true;fightAudio.play('punch',.20,.85);}
 if(e.fall&&t>=.65){releaseShowcaseContact(z);return;}
 if(t>=1.2)releaseShowcaseContact();
}
function releaseShowcaseContact(fallen=null){
 S.clinch=null;S.contactMs=0;S.bodyContactMs=0;S.contactPressure=0;S.contactCooldown=1100;S.contactNeedsSeparation=false;attackQueue.length=0;
 for(const f of[B,O]){f.grabProtection=1100;f.pushTime=0;f.stun=0;}
 B.anim=null;B.lock=false;restore();opponentPose('IDLE');O.cooldown=Math.max(O.cooldown,DIFFICULTY[S.difficulty].reaction);
 if(fallen){fallen.downState={source:true,phase:'CONTACT_FALL'};krovPose(fallen,'CONTACT_FALL');}
}
function contactRecoveryMotion(c,t){
 const curve=c.contactRecoveryMotion;if(!curve?.length)return 0;
 const i=Math.min(curve.length-2,Math.max(0,Math.floor(t/3.9*(curve.length-1)))),a=curve[i],b=curve[i+1],u=Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0])));
 return a[1]+(b[1]-a[1])*u;
}
function releaseContactClinch(){
 S.clinch=null;S.contactMs=0;S.contactCooldown=2500;releaseInputs();B.lock=false;B.anim=null;restore();opponentPose('IDLE');
 for(const f of [B,O]){f.stun=0;f.pushTime=0;f.grabProtection=700;}
 O.cooldown=Math.max(O.cooldown,DIFFICULTY[S.difficulty].reaction);
}
function separateFighters(){
 if(!B.ground||S.clinch||B.downState||O.downState)return;
 if(!CFG.IDLE.sourceVersion&&!O.cfg.IDLE.sourceVersion){if(B.lock||O.locked||B.a==='COMBO')return;const width=arenaSize().width,pr=playerHurtbox(),op=opponentHurtbox(),gap=((pr.right-pr.left)+(op.right-op.left))*.34/width*100,actual=(O.x-B.x)*B.face;if(actual<gap){const push=gap-actual;if(S.training)B.x-=B.face*push;else{B.x-=B.face*push*.5;O.x+=B.face*push*.5}B.x=Math.max(8,Math.min(92,B.x));O.x=Math.max(8,Math.min(92,O.x));}return;}
 const a=sourcePushBody(B),z=sourcePushBody(O),face=B.face,overlap=a.r+z.r-(z.x-a.x)*face;if(overlap<=0)return;
 const push=overlap/arenaSize().width*100,ba=CFG[B.a].attack,oa=O.cfg[O.a].attack;
 // Walking contact transfers only a small part of the step to the other fighter.
 // It causes no damage, throw, launch or automatic clinch.
 const forward=f=>['WALK_FORWARD','APPROACH','RUN'].includes(f.a);
 const playerPressing=forward(B)&&((K.right?1:0)-(K.left?1:0))*B.face>0,opponentPressing=forward(O);
 if(playerPressing||opponentPressing)S.contactPressure=(S.contactPressure||0)+overlap;
 const share=ba&&!oa?1:oa&&!ba?0:playerPressing&&!opponentPressing?.85:opponentPressing&&!playerPressing?.15:.5;
 const bx=B.x,ox=O.x;B.x=Math.max(8,Math.min(92,B.x-face*push*share));O.x=Math.max(8,Math.min(92,O.x+face*push*(1-share)));
 const remaining=push-(bx-B.x)*face-(O.x-ox)*face;if(remaining>0){if(O.x===8||O.x===92)B.x=Math.max(8,Math.min(92,B.x-face*remaining));else O.x=Math.max(8,Math.min(92,O.x+face*remaining));}
}
function sourceHeight(){const c=BRAX_CFG.IDLE;return(640/3.25*1.7)*c.scale*baseScale();}
function forwardPose(f){const cfg=krovConfig(f),other=f===B?O:B,threshold=f.a==='APPROACH'?1.3:1.55;return cfg.APPROACH&&Math.abs(f.x-other.x)>sourceHeight()/arenaSize().width*100*threshold?'APPROACH':'WALK_FORWARD';}
function sourceMoveSpeed(who,back=false){return (who==='NINA'?.93:1)*FIGHTER_MOVE_SPEED*sourceHeight()/arenaSize().width*100*({BRAX:.60,NYXA:.67,VEXA:.73,KROV:.58,BEAR:.54,NINA:.70,DANNY:.66}[who]||.60)*(back?.8:1);}
function locomotionTempo(who,name){const c=characterConfig(who)[name];if(!c?.sourceVersion)return moveTempo(who);return (who==='NINA'?.93:1)*FIGHTER_MOVE_SPEED*(c.gaitRate||1);}
function moveTempo(character){if(character==='VEXA')return 1.14;if(character==='BRAX'&&BRAX_CFG.IDLE.sourceVersion)return 1;if(character==='NYXA'&&NYXA_CFG.IDLE.sourceVersion)return 1.08;if(character==='KROV')return 1;return character==='NYXA'?(NYXA_CFG.IDLE.model3d?1.6104:1.22):(BRAX_CFG.IDLE.model3d?1.3:1)}
function actionTempo(character,c,frame){if(c.contactRecovery)return 1;return (character==='NINA'?.93:1)*FIGHTER_ACTION_SPEED*baseActionTempo(character,c,frame);}
function baseActionTempo(character,c,frame){if(c.sourceVersion){const p=c.phaseTempo,m=p?(frame<p.first?p.startup:frame>p.last?p.recovery:1):1;return(c.playbackRate||1)*m;}if(character==='KROV')return c.playbackRate||1;if(c.model3d&&character==='BRAX')return c.playbackRate|| (c.attack?1.8:c===BRAX_CFG.HIT_BODY?2:1.15);if(c===NYXA_CFG.GRAB)return 1;if(c.model3d)return c.playbackRate?c.playbackRate*1.1:c.attack?1.595:c===NYXA_CFG.HIT_BODY?1.65:1.15;if(character==='NYXA'&&c===NYXA_CFG.HIT_BODY)return 2.4;return character==='NYXA'&&c.attack?1.22:1}
function startCombo(){if(!canInput()||B.lock||B.en<100||S.comboUses>=2||!B.ground||B.jumpTime!==null||B.a==='COMBO')return false;releaseInputs();B.anim=null;B.lock=false;B.en=0;S.comboUses++;S.comboReserved=true;if(isLegacyKrov(B)){S.comboApproach=false;return beginAction('COMBO')}if(playerCharacter==='BRAX'&&!CFG.COMBO.model3d){S.comboApproach=false;return beginAction('COMBO')}S.comboApproach=true;setPose(forwardPose(B));return true}
// Vexa's opening fist otherwise stops 1–2 screen pixels short of the real capsule.
// Adjust approach only: master poses, timing and damage shapes remain unchanged.
function comboApproachGap(px,c,who){return Math.max(0,px*baseScale()*c.scale-(who==='VEXA'?2:0))/arenaSize().width*100;}
function advanceCombo(dt){faceOpponents();const pose=forwardPose(B);if(B.a!==pose)setPose(pose);const c=CFG.COMBO,comboGap=c.comboGapByOpponent?.[O.character]??c.comboGapPx,reach=Math.min(...Object.entries(c.hits).map(([i,h])=>h.box[0]+h.box[2]-framePivotX('',Number(i),c)))*baseScale()*c.scale,z=opponentHurtbox(),root=game.getBoundingClientRect().left+O.x/100*arenaSize().width,near=B.face>0?root-z.left:z.right-root,gap=(comboGap?comboApproachGap(comboGap,c,playerCharacter):Math.max(16,reach+near-12)/arenaSize().width*100),target=Math.max(8,Math.min(92,O.x-B.face*gap)),delta=target-B.x,speed=(c.sourceVersion?sourceMoveSpeed(playerCharacter):60*moveTempo(playerCharacter))*dt/1000;B.x+=Math.sign(delta)*Math.min(Math.abs(delta),speed);motionStep(dt);const a=sourcePushBody(B),zBody=sourcePushBody(O),touching=(zBody.x-a.x)*B.face<=a.r+zBody.r+1;separateFighters();if(Math.abs(delta)<=speed+.1||touching){S.comboApproach=false;beginAction('COMBO')}}
function startCountdown(){controls.classList.remove('off');startFighterEntry(false);}
function endRound(){
 if(S.ended||S.training||contactBatch)return;if([B,O].some(f=>f.downState?.lethal&&['FLY','FLY_LAND'].includes(f.downState.phase)))return;
 S.ended=true;S.comboApproach=false;S.comboReserved=false;roundRecovery=0;releaseInputs();attackQueue.length=0;
 const winner=B.hp===O.hp?-1:B.hp>O.hp?0:1;if(winner>=0)S.wins[winner]++;
 S.matchOver=campaign?.mode==='survival'||S.wins.some(n=>n>=2)||S.round>=3;
 const celebratedWinner=S.matchOver?(S.wins[0]===S.wins[1]?-1:S.wins[0]>S.wins[1]?0:1):winner;
 const actor=celebratedWinner<0?null:celebratedWinner===0?B:O,cfg=actor?krovConfig(actor):null;
 const action=actor?(S.matchOver&&cfg.WIN_MATCH?'WIN_MATCH':cfg.WIN_ROUND?'WIN_ROUND':cfg.WIN?'WIN':null):null;
 S.celebration={actor,action,elapsed:0,started:false,finished:false};
 if(S.matchOver&&actor){const image=new Image();image.src=resultPortrait(krovName(actor));image.decode?.().catch(()=>{});}
 controls.classList.add('off');say(winner<0?'REMIS':(winner===0?playerCharacter:O.character));
}
function celebrationStep(dt){
 const e=S.celebration;if(!e||e.finished)return;e.elapsed+=dt;roundRecovery=e.elapsed;
 // Let the losing fighter finish the existing fall; victory never changes the score again.
 actionStep(dt);
 if(O.locked){const c=O.cfg[O.a];O.time+=dt*actionTempo(O.character,c,O.frame);
  while(O.time>=c.durations[O.frame]){O.time-=c.durations[O.frame];if(O.frame<c.durations.length-1)O.frame++;else{if(e.actor===O&&e.started){O.time=0;break;}if(!advanceSourceDown(O)&&isLegacyKrov(O))advanceKrovDown(O);break;}}
 }
 if(!e.started&&e.elapsed>=300){
  e.started=true;e.startedAt=e.elapsed;
  if(e.actor&&e.action){const f=e.actor,c=krovConfig(f)[e.action];f.stun=0;f.pushTime=0;f.downState=null;if(f===B){B.jumpTime=null;B.y=0;B.ground=true;}krovPose(f,e.action);e.duration=c.durations.reduce((n,d,i)=>n+d/actionTempo(krovName(f),c,i),0);}
  else e.duration=700;
 }
 if(e.started&&e.elapsed-e.startedAt>=e.duration+450){e.finished=true;const finish=()=>{if(S.matchOver)showMatchResult();else{S.round++;reset(false);controls.classList.remove('off');startCountdown();}};finish();}
}
let blood=window.BRAX_BLOOD?.create({canvas:$('#bloodEffects'),floorCanvas:$('#bloodFloor'),view:arenaSize,now:()=>S.simTime||0});
let koReplay=window.BRAX_REPLAY?.create({now:()=>S.simTime||0,sound:e=>fightAudio.play(e.key,e.volume,e.pitch),canvas:$('#koReplayCanvas'),overlay:$('#koReplay'),skip:$('#koReplaySkip'),label:$('#koReplayLabel'),view:arenaSize,background:()=>activeArena.video?(window.BRAX_ARENA_MEDIA?.current?.()||$('#arenaMotion')):$('#arena'),render:(f,context)=>characterRenderer(f.character).render(context,f.config,f.frame,f.face,f.clock)});
function captureReplay(options={}){if((!koReplay&&!blood)||!S.running||S.preFight||S.cinematic)return;const height=arenaSize().height;const actors=[B,O].map((original,index)=>{const f=options.poses?.get(original)||original,player=index===0;const config=contactRenderConfig(f,f.config||krovConfig(f)[f.a]),scale=baseScale()*config.scale,anchor=frameAnchorY(f.a,f.frame,config,frameBox(config,f.frame)),fraction=options.force?0:player?(B.anim?B.frameT/config.durations[B.frame]:(B.frameT-B.frame*config.durations[0])/config.durations[0]):O.time/config.durations[O.frame];const head=config.hurtCapsules?.[f.frame]?.find(c=>c.region==='head');return{capsules:config.hurtCapsules?.[f.frame]||[],injuries:blood?.injuries?.(player?0:1)||[],occludedHead:['BLOCK','BLOCK_LOW','CONTACT_PUSH','CONTACT_RECEIVE','THROW_ATTACKER','THROW_VICTIM'].includes(f.a),wound:blood?.level(player?0:1)||0,head:head?{x:(head.a[0]+head.b[0])/2,y:(head.a[1]+head.b[1])/2,r:head.radius}:null,character:krovName(original),config:player&&B.strikeMotion?.weight>0?{...config,movingGait:{config:B.strikeMotion.run&&CFG.RUN?CFG.RUN:CFG.WALK_FORWARD||CFG.APPROACH,time:B.strikeMotion.clock/1000,weight:B.strikeMotion.weight}}:config,frame:f.frame+Math.max(0,Math.min(1,fraction)),face:f.face,clock:S.poseClock||0,x:f.x/100,width:config.w*scale,height:config.h*scale,pivot:framePivotX(f.a,f.frame,config)*scale,anchor:anchor*scale,floor:height-groundInset()-(player?B.y*.007*height:0)};});if(!options.force)blood?.draw(actors);if(!S.training)koReplay?.capture(actors,{particles:blood?.snapshot()||[],stains:blood?.floorSnapshot()||[],sounds:S.replaySounds||[],force:!!options.force});S.replaySounds=[];return actors;}
let resultArtRequest=0;
function showMatchResult(afterReplay=false){if(NET.active){controls.classList.add('off');return;}if(!afterReplay&&!S.training&&(B.hp<=0||O.hp<=0)&&!S.replayShown){S.replayShown=true;arenaSound.stop();releaseInputs();if(koReplay?.play(()=>showMatchResult(true)))return;}recordMatchProgress();arenaSound.stop();$('#resultText').textContent=S.wins[0]===S.wins[1]?'REMIS':displayFighterName(S.wins[0]>S.wins[1]?playerCharacter:O.character)+' WYGRYWA';const tied=S.wins[0]===S.wins[1],champion=S.wins[0]>S.wins[1]?playerCharacter:O.character;$('#resultText').textContent=tied?'REMIS':displayFighterName(champion);$('#resultKicker').textContent=tied?'WYRÓWNANA WALKA':S.wins[0]>S.wins[1]?'WYGRYWASZ':'WYGRYWA PRZECIWNIK';$('#resultScore').textContent=S.wins[0]+' : '+S.wins[1];$('#resultNames').textContent=displayFighterName(playerCharacter)+' — '+displayFighterName(O.character);const art=$('#resultArt'),request=++resultArtRequest;art.style.visibility='hidden';art.src=tied?'':resultPortrait(champion);art.alt=tied?'':displayFighterName(champion);if(!tied)Promise.resolve(art.decode?.()).then(()=>{if(request===resultArtRequest)art.style.visibility='visible';}).catch(()=>{});$('#matchEnd').setAttribute('data-fighter',tied?'':champion);$('#matchEnd').setAttribute('data-outcome',tied?'draw':S.wins[0]>S.wins[1]?'win':'loss');$('#resultArt').classList.toggle('off',tied);game.classList.add('match-over');$('#matchEnd').classList.remove('off');campaignResult()}

const fighterFilm=$('#fighterFilm'),introFilm=$('#introFilm'),filmPlay=$('#filmPlay');
let filmFinishing=false;function finishFilm(){if(!S.cinematic||filmFinishing)return;if(fightLoading){filmFinishPending=true;$('#filmStatus').textContent='PRZYGOTOWANIE WALKI…';return;}filmFinishing=true;const finish=()=>{filmFinishing=false;finishFilmNow()};if(window.BRAX_TRANSITION)window.BRAX_TRANSITION.run(finish);else finish()}
function finishFilmNow(){if(!S.cinematic)return;fighterFilm.pause();S.cinematic=false;S.paused=false;pause.textContent='Ⅱ';fightAudio.unlock();introFilm.classList.add('off');filmPlay.classList.add('off');controls.classList.remove('off');S.last=performance.now();playArenaMotion();showFighterHelp()}
const FIGHTER_FILMS={BRAX:'/assets/brax-intro-20261007.mp4',NYXA:'/assets/nyxa-intro-20261007.mp4',DANNY:'/assets/danny-intro-20261011.mp4',NINA:'/assets/nina-intro-20261011.mp4',KROV:'/assets/krov-intro-20261011.mp4',VEXA:'/assets/vexa-intro-20261011.mp4'};
function preloadFighterFilm(who){if(!who||S.cinematic)return;const src=FIGHTER_FILMS[who];if(!src)return;fighterFilm.preload='auto';if(fighterFilm.getAttribute('src')!==src){fighterFilm.src=src;fighterFilm.load?.();}}
function playIntroFilm(){if(!FIGHTER_FILMS[playerCharacter]){S.cinematic=true;S.preFight=true;finishFilm();return;}S.cinematic=true;S.preFight=true;releaseInputs();controls.classList.add('off');introFilm.classList.remove('off');filmPlay.classList.add('off');$('#filmStatus').textContent='';if(fighterFilm.getAttribute('src')!==FIGHTER_FILMS[playerCharacter])fighterFilm.src=FIGHTER_FILMS[playerCharacter];fighterFilm.currentTime=0;fighterFilm.muted=$('#titleAudio').muted;(window.BRAX_PLAY_VIDEO?window.BRAX_PLAY_VIDEO(fighterFilm,()=>S.cinematic):fighterFilm.play()).catch(()=>{if(S.cinematic)filmPlay.classList.remove('off')});warmAnimations()}
fighterFilm.addEventListener('ended',finishFilm);$('#filmSkip').addEventListener('click',finishFilm);
filmPlay.addEventListener('click',()=>{S.paused=false;pause.textContent='Ⅱ';if(fighterFilm.error)fighterFilm.load();(window.BRAX_PLAY_VIDEO?window.BRAX_PLAY_VIDEO(fighterFilm,()=>S.cinematic):fighterFilm.play()).then(()=>{$('#filmStatus').textContent='';filmPlay.classList.add('off')}).catch(()=>{$('#filmStatus').textContent='Nie udało się odtworzyć filmu. Spróbuj ponownie lub pomiń.'})});
fighterFilm.addEventListener('error',()=>{$('#filmStatus').textContent='Nie udało się wczytać filmu. Spróbuj ponownie lub pomiń.';filmPlay.classList.remove('off')});
document.addEventListener('visibilitychange',()=>{if(!S.cinematic)return;if(document.hidden)fighterFilm.pause();else (window.BRAX_PLAY_VIDEO?window.BRAX_PLAY_VIDEO(fighterFilm,()=>S.cinematic):fighterFilm.play()).then(()=>filmPlay.classList.add('off')).catch(()=>filmPlay.classList.remove('off'))});
$('#rematch').addEventListener('click',()=>{if(campaign){campaignBoard();return;}blood?.clear();S.matchElapsed=0;S.matchSpecials=0;S.matchId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);S.resultRecorded=false;S.round=1;S.wins=[0,0];S.matchOver=false;S.paused=false;pause.textContent='Ⅱ';$('#matchEnd').classList.add('off');game.classList.remove('match-over');reset(false);S.challengeRun=activeChallenge?{id:activeChallenge,count:0,done:false}:null;startOnlineMatch();arenaSound.resume();startCountdown()});
function returnToSelection(){if(window.BRAX_TRANSITION){window.BRAX_TRANSITION.run(returnToSelectionNow);return}returnToSelectionNow()}
function returnToSelectionNow(){window.BRAX_ARENA_MEDIA?.release();window.BRAX_NIGHT_MARKET?.destroy();for(const id of ['survivalScreen','challengesScreen'])$('#'+id).classList.add('off');koReplay?.cancel();blood?.clear();liveDrillOpen=false;closeFighterHelp(false);$('#featurePanel').classList.add('off');window.BRAX_VICTORY?.close();window.BRAX_ARENA_MEDIA?.pause?.();$('#arenaMotion').pause();arenaLaunchPending=false;campaign=null;$('#matchSetup').classList.add('off');$('#arenaSelection').classList.add('off');$('#modeSettings').classList.add('off');$('#campaignScreen').classList.add('off');$('#rematch').textContent='REWANŻ ↻';if(S.clinch)releaseClinch();fighterFilm.pause();S.cinematic=false;S.running=false;S.ended=false;S.matchOver=false;S.paused=false;releaseInputs();fightAudio.stop();arenaSound.stop();introFilm.classList.add('off');$('#matchEnd').classList.add('off');game.classList.remove('match-over');hud.classList.add('off');controls.classList.add('off');pause.classList.add('off');screenButton.classList.add('off');$('#fightMenu').classList.add('off');game.classList.add('menu-open');$('#selection').classList.remove('off');selectSlot(selectedSlot,true);fitViewport();menuAudio.start()}
function exitToMainMenu(){if(NET.active){window.BRAX_MULTIPLAYER?.leave();return;}returnToSelectionNow();game.classList.remove('paused');$('#selection').classList.add('off');$('#matchSetup').classList.remove('off');}
$('#pauseExit').addEventListener('click',exitToMainMenu);$('#filmExit').addEventListener('click',exitToMainMenu);
$('#returnSelection').addEventListener('click',returnToSelection);$('#fightMenu').addEventListener('click',returnToSelection);

function standalone(){return !!navigator.standalone||!!window.matchMedia?.('(display-mode: standalone)').matches||!!window.matchMedia?.('(display-mode: fullscreen)').matches}
function screenState(){const active=!!document.fullscreenElement||!!document.webkitFullscreenElement||standalone();screenButton.classList.toggle('off',!S.running||active||!(document.fullscreenEnabled||document.webkitFullscreenEnabled));return active}
async function full(){if(screenState())return true;const target=document.documentElement,enter=target.requestFullscreen||target.webkitRequestFullscreen;let entered=false;if(enter){try{await enter.call(target,{navigationUI:'hide'});entered=!!document.fullscreenElement||!!document.webkitFullscreenElement}catch{}}if(entered){try{await screen.orientation?.lock?.('landscape')}catch{}}screenState();return entered}
function fitViewport(){const {width:w,height:h}=window.BRAX_VIEWPORT.fit();window.BRAX_NIGHT_MARKET?.resize();game.style.setProperty('--key',Math.max(44,Math.min(60,h*.115,w/10))+'px');if(w<h&&S.running)releaseInputs();if(B.anim)render(B.a,B.frame);else drawStatic(B.a);safeFit(B.a);draw();screenState()}
// Krov uses one clock for animation, contact windows and controller buffering.
let lastMoveTap={key:null,time:-1000};
function worldHPercent(){return 1.7*640/3.05*BRAX_CFG.IDLE.scale*baseScale()/arenaSize().width*100;}
function updateKrovButtons(){
 const localCharacter=NET.active&&!NET.host?O.character:playerCharacter,localConfig=NET.active&&!NET.host?O.cfg:CFG;
 for(const el of document.querySelectorAll('[data-hold]'))if(el.dataset.hold==='block')el.classList.toggle('off',localCharacter==='NINA');
 const kinds=['punch','heavy','kick','kick2'],labels=['P1','P2','K1','K2'],moves=SOURCE_ATTACKS[localCharacter]||[];
 for(const el of attackButtons){
  const index=kinds.indexOf(el.dataset.tap);let label;
  if(index>=0){label=labels[index]+': '+localConfig[moves[index]].label;const extra=moves.length>6?{0:4,1:5,2:6,3:7}:{0:4,1:5};if(extra[index]!==undefined)label+='; przód + '+labels[index]+': '+localConfig[moves[extra[index]]].label;}
  else if(el.dataset.tap==='special')label='COMBO: '+localConfig.COMBO.label;
  else if(el.dataset.tap==='evade')label='Unik';
  else if(el.dataset.tap==='grab')label=localConfig.THROW_ATTACKER?'Chwyt / rzut / zerwanie':'Zerwij chwyt przeciwnika';
  if(label){el.title=label;el.setAttribute('aria-label',label);}
 }
}
function beginKrovDash(direction){if(!canInput()||B.lock||B.jumpTime!==null||S.clinch)return false;const forward=direction>0,distance=worldHPercent()*(forward?.30:.25);S.krovDash={elapsed:0,start:B.x,distance:distance*B.face*(forward?1:-1)};return beginAction(forward?'DASH_FORWARD':'DASH_BACK');}
function krovDashStep(dt){const e=S.krovDash;if(!e)return;if(B.a!=='DASH_BACK'&&B.a!=='DASH_FORWARD'){S.krovDash=null;return;}e.elapsed+=dt;const u=Math.min(1,e.elapsed/240),wanted=e.start+e.distance*u*u*(3-2*u);const minGap=worldHPercent()*.30;if(e.distance*B.face>0){const bound=O.x-B.face*minGap;B.x=B.face>0?Math.min(wanted,bound):Math.max(wanted,bound);}else B.x=wanted;B.x=Math.max(8,Math.min(92,B.x));if(e.elapsed>=400)S.krovDash=null;}
function isLegacyKrov(f){return krovName(f)==='KROV'&&!krovConfig(f).IDLE.sourceVersion;}
function krovName(f){return f===B?playerCharacter:O.character;}
function krovConfig(f){return f===B?CFG:O.cfg;}
function krovPose(f,name){if(f===B){B.anim=null;B.lock=false;beginAction(name);}else opponentPose(name,true);}

function commitSourceRoot(f){const c=krovConfig(f)[f.a];if(!c?.sourceVersion||!c.rootTravelPx)return;f.x+=f.face*c.rootTravelPx*baseScale()*c.scale/arenaSize().width*100;}
function advanceSourceDown(f){if(!f.downState?.source)return false;const phase=f.downState.phase;if(phase==='KO_HOLD'){f.frame=0;return true;}
 commitSourceRoot(f);
 if(phase==='FLY_LAND'&&f.downState.lethal){f.hp=0;f.downState.phase='KO_HOLD';krovPose(f,'KO_HOLD');endRound();return true;}
 const next=f.hp<=0&&phase!=='FLY'?'KO_HOLD':({FALL:'LAND',LAND:'DOWN',DOWN:'GETUP',THROW_DOWN:'GETUP',FLY:'FLY_LAND',FLY_LAND:'FLY_DOWN',FLY_DOWN:'GETUP'})[phase];
 if(next){if(['LAND','DOWN','FLY_DOWN','GETUP'].includes(next)){f.pushTime=0;f.pushSpeed=0;}f.downState.phase=next;krovPose(f,next);return true;}f.downState=null;f.stun=0;f.cleanKickMs=0;f.cleanKickToken=null;f.impactPressure=0;f.knockdownCooldown=3500;f.getupProtection=350;if(S.training&&f.airLaunches>=2){f.airLaunches=0;f.hp=100;}return false;
}
function beginSourcePair(a,fromCombo=false){if(!NET.active&&a===O&&!fromCombo&&O.grabCooldown>0)return false;if(['NINA','DANNY'].includes(krovName(a)))return false;const z=a===B?O:B,ac=krovConfig(a),zc=krovConfig(z);if(!ac.THROW_ATTACKER||!zc.THROW_VICTIM){if(a===B)stateLabel.textContent='BRAK DOPASOWANEJ PARY CHWYTU';return false;}
 if(!S.running||S.paused||S.preFight||S.ended||S.cinematic||S.clinch||(!fromCombo&&(a===B?B.lock||B.stun:O.locked||O.stun))||B.jumpTime!==null||!B.ground||a.downState||z.downState||z.getupProtection>0||z.grabProtection>0)return false;
 const c=ac.THROW_ATTACKER,W=arenaSize().width,desired=(c.pairGapByOpponent?.[krovName(z)]??c.pairGapPx)*baseScale()*c.scale/W*100,gap=(z.x-a.x)*a.face,tolerance=fromCombo?worldHPercent()*.08:Math.max(worldHPercent()*.18,(sourcePushBody(a).r+sourcePushBody(z).r)/W*100-desired+worldHPercent()*.18);
 if(gap<=0||gap>desired+tolerance||(fromCombo&&Math.abs(gap-desired)/2>tolerance)){if(a===B)stateLabel.textContent='POZA ZASIĘGIEM CHWYTU';return false;}
 // Paired choreography shares stage orientation and depth; only a small initial correction is allowed.
 const correction=(gap-desired)*a.face/2;
 a.getupProtection=0;a.pushTime=z.pushTime=0;a.stun=z.stun=0;attackQueue.length=0;releaseInputs();
 if(a===O)O.grabCooldown=DIFFICULTY[S.difficulty].grabCooldown;const level=DIFFICULTY[S.difficulty],cpuCanBreak=!NET.active&&a===B&&(!S.training||S.trainingBehavior==='spar');S.clinch={sourcePair:true,alignment:correction,aligned:0,attacker:a===B?'player':'opponent',elapsed:0,actionElapsed:0,hit:false,cpuBreakAt:cpuCanBreak&&Math.random()<level.breakChance?level.breakReaction:null};krovPose(a,'THROW_ATTACKER');krovPose(z,'THROW_VICTIM');confineFighters();return true;
}
function sourcePairInput(kind){
 const e=S.clinch;if(!e?.sourcePair||!canInput()||e.hit||e.elapsed>200)return false;
 if(kind==='evade'||kind==='grab'){if(e.attacker==='opponent')featureEvent('break');releaseClinch();return true;}
 return false;
}
function sourcePairStep(dt){const e=S.clinch,a=e.attacker==='player'?B:O,z=a===B?O:B;e.elapsed+=dt;S.poseClock=(S.poseClock||0)+dt;const u=Math.min(1,e.elapsed/180),aligned=(e.alignment||0)*u*u*(3-2*u),shift=aligned-(e.aligned||0);a.x+=shift;z.x-=shift;e.aligned=aligned;
 // One AI decision per throw; the scheduled reaction must fall inside the same 200 ms window as player input.
 if(e.cpuBreakAt!==null&&e.cpuBreakAt!==undefined&&!e.hit&&e.cpuBreakAt<=200&&e.elapsed>=e.cpuBreakAt){releaseClinch();return;}
 // No frozen decision frame; a stalled pair must release within two seconds.
 if(e.elapsed>=2000){releaseClinch();return;}
 if(!Number.isFinite(e.actionElapsed))e.actionElapsed=0;
 e.actionElapsed+=dt;const c=krovConfig(a).THROW_ATTACKER,t=Math.min(c.duration,e.actionElapsed/1000*c.playbackRate*FIGHTER_ACTION_SPEED),f=t/(c.durations[0]/1000);
 for(const actor of [a,z]){actor.frame=Math.min(krovConfig(actor)[actor.a].durations.length-1,Math.floor(f));if(actor===B){B.frameT=(f-Math.floor(f))*c.durations[0];render(B.a,B.frame);}else O.time=(f-Math.floor(f))*c.durations[0];}
 // Both clips use the same source time. Damage is a single event at landing, not during the lift.
 if(t>=1.2&&!e.hit){e.hit=true;z.hp=Math.max(S.training?1:0,z.hp-({BRAX:12,NYXA:11,VEXA:9,KROV:14,BEAR:15}[krovName(a)]||12));fightAudio.play('land',.65);if(z.hp<=0&&!S.training){koReplay?.mark();S.koSlowMs=700;S.hitstop=48;}}
 if(t>=c.duration){commitSourceRoot(a);commitSourceRoot(z);S.clinch=null;if(a===B){B.anim=null;B.lock=false;restore();}else{opponentPose('IDLE');O.cooldown=DIFFICULTY[S.difficulty].cooldown;}z.downState={source:true,phase:'THROW_DOWN'};krovPose(z,'THROW_DOWN');if(B.hp<=0||O.hp<=0)endRound();}
}

function advanceKrovDown(f){if(!f.downState)return false;const c=krovConfig(f),phase=f.downState.phase;if(f.hp<=0){if(c.KO_HOLD){f.downState.phase='KO_HOLD';krovPose(f,'KO_HOLD');return true;}return false;}
 const next={FALL:'LAND',LAND:'DOWN',DOWN:'GETUP'}[phase];if(next&&c[next]){f.downState.phase=next;krovPose(f,next);return true;}f.downState=null;f.stun=0;return false;}
function launchSource(f,fullArena=true){if(f.downState||f.getupProtection>0)return false;f.hitSeries=null;if(f===B){B.jumpTime=null;B.ground=true;B.y=0;}f.airLaunches=(f.airLaunches||0)+1;f.cleanKickMs=0;f.cleanKickToken=null;f.impactPressure=0;f.airDamage=0;f.downState={source:true,phase:'FLY',lethal:!S.training&&f.hp<=0};f.stun=0;if(f===B)attackQueue.length=0;krovPose(f,'FLY');
 // Keep the supplied flight pose. Add only world displacement to its native root travel.
 const c=krovConfig(f).FLY,seconds=c.durations.reduce((a,b)=>a+b,0)/1000/actionTempo(krovName(f),c,0),direction=-f.face;
 const natural=f.face*(c.rootTravelPx||0)*baseScale()*c.scale/arenaSize().width*100;
 const limits=visibleLimits(f),destination=Math.max(limits.min,Math.min(limits.max,f.x+direction*worldHPercent()*(fullArena?1.6:1.4)));
 const extra=direction*Math.max(0,(destination-f.x-natural)*direction);
 f.pushTime=seconds*1000;f.pushSpeed=extra/seconds;return true;}
function knockdown(f,alreadyDown=false){f.hitSeries=null;if(f===B){B.jumpTime=null;B.ground=true;B.y=0;}if(krovConfig(f).GETUP?.sourceVersion){f.downState={source:true,phase:f.hp<=0?'KO':alreadyDown?'DOWN':'FALL'};f.stun=0;f.pushTime=0;if(f===B)attackQueue.length=0;krovPose(f,f.downState.phase);return;}if(krovName(f)!=='KROV'){krovPose(f,krovConfig(f).FALL?'FALL':'HIT_BODY');f.stun=Math.max(f.stun||0,600);return;}f.downState={phase:alreadyDown?'LAND':'FALL'};f.stun=0;if(f===B)attackQueue.length=0;krovPose(f,f.downState.phase);}
function beginKrovGrab(attacker){const target=attacker===B?O:B;if(!S.running||S.paused||S.preFight||S.ended||S.clinch||S.grabAttempt||B.lock||O.locked||!B.ground||B.jumpTime!==null||B.stun||O.stun)return false;S.grabAttempt={attacker:attacker===B?'player':'opponent',checked:false};krovPose(attacker,'GRAB_TRY');return true;}
function confirmKrovGrab(attacker,combo=false){const target=attacker===B?O:B;if(target.hp<=0||target.a==='BLOCK'||target.a==='BLOCK_LOW'||(target===B&&K.block)||!B.ground||B.jumpTime!==null||target.downState||target.a==='FALL'||target.a==='KO'||target.a==='GETUP')return false;const H=worldHPercent(),gap=Math.abs(target.x-attacker.x),desired=H*.32;if(gap>H*.40||Math.abs(gap-desired)>H*.08)return false;attacker.x=target.x-attacker.face*desired;S.grabAttempt=null;S.clinch={krov:true,attacker:attacker===B?'player':'opponent',elapsed:0,combo,decision:false,action:null,hit:false};releaseInputs();attacker.stun=target.stun=0;if(combo){if(attacker===B){B.anim=null;B.lock=true;B.a='COMBO';B.frame=114;}else{O.a='COMBO';O.frame=114;O.locked=true;}}else krovPose(attacker,'GRAB');krovPose(target,krovConfig(target).GRAB_DEFENDER?'GRAB_DEFENDER':'BLOCK');return true;}
function resolveKrovGrab(){const e=S.grabAttempt;if(!e)return;const a=e.attacker==='player'?B:O;if(a.a!=='GRAB_TRY'){S.grabAttempt=null;return;}if(a.frame>=13&&a.frame<=15&&!e.checked){e.checked=true;if(confirmKrovGrab(a))return;}if(a.frame>15)e.checked=true;}
function resolveKrovComboGrab(){if(!isLegacyKrov(B)||B.a!=='COMBO'||B.frame<114||S.clinch||B.hitGroups.has('grab-checked'))return;B.hitGroups.add('grab-checked');if(!confirmKrovGrab(B,true)){B.anim=null;B.lock=false;beginAction('COMBO_MISS');}}
function handleKrovClinchInput(kind){const e=S.clinch;if(!e?.krov)return false;const owns=e.attacker==='player';if(!owns){if(kind==='grab'&&e.elapsed<=200){releaseClinch();return true;}return false;}if(e.action||e.combo||e.elapsed<200)return false;const direction=((K.right?1:0)-(K.left?1:0))*B.face;if(kind==='kick2'||kind==='kick')return startKrovClinchAction('knee');if(kind==='grab'){if(K.down)return startKrovClinchAction('throw');if(direction<0)return startKrovClinchAction('push');releaseClinch();return true;}if(kind==='evade'){releaseClinch();return true;}return false;}
function startKrovClinchAction(kind){const e=S.clinch;if(!e?.krov||e.action||e.elapsed<200)return false;const a=e.attacker==='player'?B:O,z=a===B?O:B;if(e.elapsed+(kind==='throw'?42:kind==='knee'?19:27)/60*1000>1200){releaseClinch();return false;}e.action=kind;e.actionElapsed=0;e.hit=false;krovPose(a,kind==='throw'?'CLINCH_THROW':kind==='knee'?'CLINCH_KNEE':'CLINCH_PUSH');const name=kind==='throw'?'CLINCH_THROW_DEFENDER':kind==='push'?'CLINCH_PUSH_DEFENDER':'GRAB_DEFENDER';krovPose(z,krovConfig(z)[name]?name:kind==='throw'?'FALL':'BLOCK');return true;}
function pairedFrame(f,frame,T){const c=krovConfig(f)[f.a];f.frame=Math.min(c.durations.length-1,Math.floor(frame*(c.durations.length/T)));if(f===B)render(B.a,B.frame);else opponentRender=null;}
function krovClinchStep(dt){const e=S.clinch;if(!e)return;e.elapsed+=dt;const a=e.attacker==='player'?B:O,z=a===B?O:B;
 if(e.combo){const f=Math.min(153,114+Math.floor(e.elapsed/(1000/60)));a.frame=f;if(a===B)render('COMBO',f);else opponentRender=null;if(f>=126&&z.a!=='CLINCH_THROW_DEFENDER'&&krovConfig(z).CLINCH_THROW_DEFENDER)krovPose(z,'CLINCH_THROW_DEFENDER');if(f>=126)pairedFrame(z,f-114,42);if(f>=145&&!e.hit){e.hit=true;z.hp=Math.max(S.training?1:0,z.hp-12);contactFeedback(z,z===B?playerHurtbox():opponentHurtbox(),false);}if(f>=153){S.clinch=null;finishKrovPair(a,z,true);}
 return;}
 if(!e.action){pairedFrame(a,Math.floor(e.elapsed/(1000/60))%12,12);pairedFrame(z,Math.floor(e.elapsed/(1000/60))%12,12);if(e.elapsed>=1200){releaseClinch();return;}if(a===O&&e.elapsed>=280&&!e.decision){e.decision=true;startKrovClinchAction(Math.random()<.5?'knee':'throw');}return;}
 e.actionElapsed+=dt;const T=e.action==='throw'?42:e.action==='knee'?43:27,f=Math.min(T-1,Math.floor(e.actionElapsed/(1000/60)));pairedFrame(a,f,T);pairedFrame(z,f,T);const contact=e.action==='throw'?31:e.action==='knee'?16:8;
 if(f>=contact&&!e.hit){e.hit=true;if(e.action==='push'){z.pushTime=250;z.pushSpeed=a.face*worldHPercent()*.80/.25;}else{z.hp=Math.max(S.training?1:0,z.hp-(e.action==='throw'?15:10));contactFeedback(z,z===B?playerHurtbox():opponentHurtbox(),false);}}
 if(e.action==='knee'&&f>=19){S.clinch=null;a.hitGroups?.add('damage-0');a.hits?.add(0);if(a===B){B.anim={name:B.a,c:CFG[B.a],a:decodeGif(CFG[B.a].asset),onDone:null};B.frameT=0;}else O.time=0;if(z===B){B.anim=null;B.lock=false;restore();}else opponentPose('IDLE');if(B.hp<=0||O.hp<=0)endRound();return;}if(e.actionElapsed>=T/60*1000){const thrown=e.action==='throw';S.clinch=null;finishKrovPair(a,z,thrown);}
}
function finishKrovPair(a,z,thrown){a.stun=0;if(a===B){B.anim=null;B.lock=false;restore();}else opponentPose('IDLE');if(thrown)knockdown(z,true);else{if(z===B){B.anim=null;B.lock=false;restore();}else opponentPose('IDLE');}if(B.hp<=0||O.hp<=0)endRound();}

function beginClinch(attacker=B){if(['NINA','DANNY'].includes(krovName(attacker)))return false;if(krovConfig(attacker).THROW_ATTACKER?.sourceVersion)return beginSourcePair(attacker);if(!(attacker===B?CFG:O.cfg).GRAB&&!(attacker===B?CFG:O.cfg).GRAB_TRY)return false;if((attacker===B?playerCharacter:O.character)==='KROV')return beginKrovGrab(attacker);const target=attacker===B?O:B;if(!S.running||S.paused||S.preFight||S.ended||S.clinch||B.lock||O.locked||!B.ground||B.jumpTime!==null||B.stun||O.stun||(target===O?O.a==='BLOCK':K.block))return false;const a=attacker===B?playerHurtbox():opponentHurtbox(),z=target===B?playerHurtbox():opponentHurtbox(),gap=Math.max(0,attacker.face>0?z.left-a.right:a.left-z.right),height=a.bottom-a.top;if(gap>height*.35){if(attacker===B)stateLabel.textContent='POZA ZASIĘGIEM KLINCZU';return false;}releaseInputs();S.clinch={elapsed:0,attacker:attacker===B?'player':'opponent'};if(attacker===B){beginAction('GRAB');opponentPose('BLOCK',true);}else{opponentPose('GRAB',true);beginAction('BLOCK');}return true;}
function releaseClinch(){if(!S.clinch)return;if(S.clinch.showcase){releaseShowcaseContact();return;}if(S.clinch.contact){releaseContactClinch();return;}const paired=S.clinch.sourcePair;if(paired)for(const f of [B,O])f.grabProtection=350;const krov=S.clinch.krov;S.clinch=null;B.lock=false;B.anim=null;O.locked=false;releaseInputs();if(krov){for(const f of [B,O]){const cfg=krovConfig(f);if(cfg.CLINCH_RELEASE)krovPose(f,'CLINCH_RELEASE');else if(f===B)restore();else opponentPose('IDLE');f.pushTime=300;f.pushSpeed=-f.face*worldHPercent()*.15/.3;}}else{restore();opponentPose('IDLE');B.x=Math.max(8,Math.min(92,B.x-B.face*3));O.x=Math.max(8,Math.min(92,O.x-O.face*3));}O.cooldown=DIFFICULTY[S.difficulty].cooldown;}

function clinchStep(dt){if(S.clinch.showcase){showcaseContactStep(dt);return;}if(S.clinch.contact){const e=S.clinch;e.elapsed+=dt;if(e.elapsed>=180&&!e.recoiling){e.recoiling=true;for(const f of[B,O]){f.pushTime=480;f.pushSpeed=-f.face*worldHPercent()*.40/.48;}}if(e.elapsed>=660)releaseContactClinch();return;}if(S.clinch.sourcePair)return sourcePairStep(dt);if(S.clinch.krov)return krovClinchStep(dt);const e=S.clinch;e.elapsed+=dt;if(e.attacker==='player'){B.frame=Math.min(CFG.GRAB.durations.length-1,Math.floor(e.elapsed/CFG.GRAB.durations[0]));render('GRAB',B.frame);}else{O.frame=Math.min(O.cfg.GRAB.durations.length-1,Math.floor(e.elapsed/O.cfg.GRAB.durations[0]));}if(e.elapsed>=1200)releaseClinch();}
let fightLoading=false,filmFinishPending=false;
$('#retryFightLoad').addEventListener('click',async()=>{if(fightLoading)return;try{await begin();}catch{/* begin restores the visible recovery dialog. */}});
$('#cancelFightLoad').addEventListener('click',()=>{$('#fightLoadError').classList.add('off');returnToSelectionNow();});
async function begin(){if(fightLoading||selectedSlot>=CHARACTER_NAMES.length)return;window.BRAX_NIGHT_MARKET?.destroy();fightLoading=true;$('#fightLoadError').classList.add('off');filmFinishPending=false;playerCharacter=CHARACTER_NAMES[selectedSlot];if(FEATURES.challenges.find(c=>c.id===activeChallenge)?.drill==='grab'&&['NINA','DANNY'].includes(selectedOpponent||''))selectOpponent('KROV');S.running=false;menuAudio.stop();$('#campaignScreen').classList.add('off');if(!NET.active)playIntroFilm();try{if(activeArena.remote)await window.BRAX_ARENA_MEDIA?.prepare(activeArena.video,$('#arenaMotion'));if(window.BRAX_PREPARE_PAIR)await window.BRAX_PREPARE_PAIR([CHARACTER_NAMES[selectedSlot],selectedOpponent||(CHARACTER_NAMES[selectedSlot]==='BRAX'?'NYXA':'BRAX')]);for(const who of new Set([CHARACTER_NAMES[selectedSlot],selectedOpponent]))if((who==='BEAR'||who==='VEXA'||who==='KROV'||who==='NINA')&&!characterRenderer(who))window[who+'_3D']=await import('/assets/'+who.toLowerCase()+'3d.js?v=capoeira-danny-20261011').then(m=>m.prepare());}catch(error){if(error?.name==='AbortError'){fightLoading=false;return;}console.error('BRAXHORN model load:',error?.stack||String(error));$('#fightLoadError [role=status]').textContent=/ARENA_MEDIA/.test(error?.message||'')?'Nie udało się pobrać areny. Sprawdź połączenie i spróbuj ponownie. Twój wybór pozostaje zapisany.':/WebGL.*context/i.test(error?.message||'')?'Nie udało się uruchomić grafiki 3D. Zamknij inne karty i uruchom grę ponownie w przeglądarce z obsługą WebGL. Twój wybór pozostaje zapisany.':'Nie udało się pobrać zawodnika. Sprawdź połączenie i spróbuj ponownie. Twój wybór pozostaje zapisany.';stateLabel.textContent='Nie udało się wczytać zawodnika. Wybierz arenę ponownie.';fightLoading=false;fighterFilm.pause();S.cinematic=false;introFilm.classList.add('off');controls.classList.add('off');$('#fightLoadError').classList.remove('off');$('#retryFightLoad').focus?.();throw error;}fightLoading=false;playerCharacter=CHARACTER_NAMES[selectedSlot];CFG=characterConfig(playerCharacter);updateKrovButtons();$('#playerPortrait').innerHTML=fighterPortrait(playerCharacter);$('#playerName').textContent=(displayFighterName(playerCharacter))+' · TY';bs.setAttribute('aria-label',displayFighterName(playerCharacter));setupOpponent();const selectedDrillAttack=$('#trainingAttack').value;$('#trainingAttack').innerHTML=SOURCE_ATTACKS[O.character].map(n=>'<option value="'+n+'">'+safeText(labels[O.cfg[n].label]||O.cfg[n].label)+'</option>').join('');if(SOURCE_ATTACKS[O.character].includes(selectedDrillAttack))$('#trainingAttack').value=selectedDrillAttack;$('#opponentPortrait').innerHTML=fighterPortrait(O.character);game.classList.remove('arena-picker-open');fightAudio.unlock();$('#arenaSelection').classList.add('off');menuAudio.stop();full();$('#selection').classList.add('off');game.classList.remove('menu-open');start.classList.add('off');hud.classList.remove('off');controls.classList.remove('off');pause.classList.remove('off');$('#fightMenu').classList.remove('off');S.running=true;S.paused=false;S.last=performance.now();S.introPlayed=false;S.round=1;S.wins=[0,0];S.matchOver=false;$('#matchEnd').classList.add('off');game.classList.remove('match-over');$('#fightObjective').classList.add('off');fitViewport();blood?.clear();window.BRAX_NIGHT_MARKET?.resetMeasurement();reset(false);S.matchSpecials=0;S.matchElapsed=0;S.matchId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);S.resultRecorded=false;S.replayShown=false;S.challengeRun=activeChallenge?{id:activeChallenge,count:campaign?.score||0,done:campaign?.challengeDone||false}:null;if(campaign?.mode==='survival')B.hp=campaign.hp;startOnlineMatch();arenaSound.select();controls.classList.add('off');warmAnimations();if(filmFinishPending){filmFinishPending=false;finishFilm()}screenState()}
function vib(x){try{navigator.vibrate?.(x)}catch{}}
function playerButtonAttack(kind){if(CFG.IDLE.sourceVersion){
 if(!canInput())return false;if(S.clinch?.showcase){if(kind!=='grab'||S.clinch.elapsed>=550||['NINA','DANNY'].includes(playerCharacter)||!CFG.THROW_ATTACKER)return false;releaseShowcaseContact();B.grabProtection=O.grabProtection=0;return beginSourcePair(B);}if(S.clinch?.sourcePair)return sourcePairInput(kind);if(kind==='evade')return evade();if(kind==='special')return startCombo();if(kind==='grab')return beginSourcePair(B);if(B.jumpTime!==null||!B.ground)return false;
 const forward=((K.right?1:0)-(K.left?1:0))*B.face>0;
 const move=buttonMove(playerCharacter,CFG,kind,forward,B.sprintHeld,K.down);return move?doAttack(move):false;
 }
if(!canInput())return false;if(S.clinch&&(S.clinch.krov||isLegacyKrov(B)))return handleKrovClinchInput(kind);if(kind==='grab')return beginClinch();if(isLegacyKrov(B)){if(kind==='evade')return evade();if(kind==='special')return startCombo();if(!B.ground||B.jumpTime!==null)return false;const direction=((K.right?1:0)-(K.left?1:0))*B.face;const name=kind==='punch'?['UPPERCUT','OVERHAND','ELBOW'][direction+1]:({heavy:'BODY_HOOK',kick:'LOW_KICK',kick2:'KNEE'})[kind];return name?doAttack(name):false;}if(K.block&&kind==='heavy')return beginClinch();if(kind==='evade')return evade();if(kind==='special')return startCombo();const direction=((K.right?1:0)-(K.left?1:0))*B.face,nyxa=playerCharacter==='NYXA';if(!B.ground)return kind==='punch'?doAttack('JUMP_PUNCH'):false;const moves=nyxa?{punch:['HOOK','LIGHT_PUNCH','PUNCH_CHAIN'],heavy:['COUNTER','HEAVY_PUNCH','PUNCH_CHAIN'],kick:['SPIN_KICK','LIGHT_KICK','SPIN_KICK'],kick2:['CROUCH_KICK','HEAVY_KICK','CROUCH_KICK']}:{punch:['UPPERCUT','LIGHT_PUNCH','DOUBLE_PUNCH'],heavy:['COUNTER','HEAVY_PUNCH','CHAIN_STRIKES'],kick:['LIGHT_KICK','LIGHT_KICK','LIGHT_KICK'],kick2:['HEAVY_KICK','HEAVY_KICK','HEAVY_KICK']};if(!moves[kind])return false;const crouch={punch:'CROUCH_PUNCH',heavy:nyxa?'CROUCH_PUNCH':'HEAVY_STOMP',kick:'CROUCH_KICK',kick2:'CROUCH_KICK'};return doAttack(K.block?crouch[kind]:moves[kind][direction+1])}
let selectedSlot=0,selectionTouch=null,selectionMoved=false,selectionRequest=0;
const selectionAssets=['/assets/campaign-portraits/brax.webp','/assets/campaign-portraits/nyxa.webp','/assets/campaign-portraits/vexa.webp','/assets/fighter-cards-reference.jpeg','/assets/nina-card-pro.png','/assets/campaign-portraits/danny.webp','/assets/campaign-portraits/bear.webp','/assets/campaign-portraits/demon.webp'];
const selectionReady=selectionAssets.map(src=>{const img=new Image();img.src=src;return img.decode().then(()=>true).catch(()=>false)});
function selectSlot(index,immediate=false){selectedSlot=(index%CHARACTER_NAMES.length+CHARACTER_NAMES.length)%CHARACTER_NAMES.length;window.BRAX_ROSTER?.sync(selectedSlot);preloadFighterFilm(CHARACTER_NAMES[selectedSlot]);const slot=selectedSlot,request=++selectionRequest,fighter=$('#selectionFighter'),actions=$('#selectionActions'),button=$('#chooseFighter');button.disabled=true;fighter.classList.toggle('switching',!immediate);actions.classList.toggle('switching',!immediate);const apply=()=>{if(request!==selectionRequest)return;const nyxa=slot===1;fighter.classList.toggle('nyxa',nyxa);$('#selectionImage').src=selectionAssets[slot];$('#selectionImage').alt=displayFighterName(CHARACTER_NAMES[slot]);$('#selectionName').textContent=displayFighterName(CHARACTER_NAMES[slot]);button.setAttribute('aria-label','Zatwierdź zawodnika i przeciwnika');fighter.classList.remove('off');actions.classList.remove('off');const ready=$('#selectionImage').decode?.()||Promise.resolve();ready.catch(()=>{}).then(()=>{if(request!==selectionRequest)return;requestAnimationFrame(()=>{fighter.classList.remove('switching');actions.classList.remove('switching');button.disabled=false})})};if(immediate){apply();return}Promise.all([selectionReady[slot],new Promise(r=>setTimeout(r,145))]).then(apply)}
$('#selection').addEventListener('pointerdown',e=>{if(e.target.closest('#rosterBoard'))return;const button=e.target.closest('button');if(button&&button.id!=='chooseFighter')return;selectionMoved=false;selectionTouch={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};(button||$('#selection')).setPointerCapture(e.pointerId)});
$('#selection').addEventListener('pointerup',e=>{if(!selectionTouch||selectionTouch.id!==e.pointerId)return;const p=selectionTouch;selectionTouch=null;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.abs(dx)>=45&&Math.abs(dx)>Math.abs(dy)*1.3&&performance.now()-p.t<900){selectionMoved=true;e.preventDefault();selectSlot(selectedSlot+(dx<0?1:-1))}});
$('#selection').addEventListener('pointercancel',()=>{selectionTouch=null;selectionMoved=true});
$('#previousFighter').addEventListener('click',()=>selectSlot(selectedSlot-1));$('#nextFighter').addEventListener('click',()=>selectSlot(selectedSlot+1));

let activeChallenge=null,launchingChallenge=false,helpWasPaused=false,helpWasPreFight=false,helpRevisit=false,helpPending=false,liveDrillOpen=false,drillWasPaused=false;
const safeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function startOnlineMatch(){if(NET.active)return;window.BRAX_ONLINE?.start({mode:campaign?.mode||(S.training?'training':'fight'),difficulty:S.difficulty,fighter:playerCharacter,challenge:activeChallenge,targetWins:campaign?.mode==='tournament'&&campaign.rounds[0].some(m=>m.a===campaign.player&&!m.b)?2:3,matchId:S.matchId,runId:campaign?(campaign.onlineId||=S.matchId+'-series'):S.matchId});}
function featureEvent(event){
 const run=S.challengeRun,definition=FEATURES.challenges.find(c=>c.id===run?.id);
 if(!run||run.done||!definition||definition.event!==event||(definition.exclude||[]).includes(playerCharacter))return;
 run.count=Math.min(definition.goal,run.count+1);
 if(run.count>=definition.goal){run.done=true;if(campaign)campaign.challengeDone=true;window.BRAX_ONLINE?.challenge(run.id,S.matchElapsed,run.count); progress.complete(playerCharacter,run.id);progress.record('challenge:'+run.id,S.difficulty,{id:S.matchId+'-'+run.id,fighter:playerCharacter,score:1,elapsed:S.matchElapsed,completed:true});}
 updateObjective();
}
function updateObjective(){const run=S.challengeRun,c=FEATURES.challenges.find(c=>c.id===run?.id),el=$('#fightObjective');el.classList.toggle('off',!c);if(c)el.textContent=(run.done?'✓ UKOŃCZONE · ':'')+c.title+' '+run.count+'/'+c.goal;}
function recordMatchProgress(){if(NET.active)return;if(S.resultRecorded||S.training)return;S.resultRecorded=true;window.BRAX_ONLINE?.finish({rounds:S.wins.slice(),roundsPlayed:S.round,elapsed:S.matchElapsed,hp:B.hp,specials:S.matchSpecials});if(S.wins[0]>S.wins[1]){progress.win(playerCharacter);if(S.difficulty==='hard')featureEvent('hardwin');if(B.hp>=60)featureEvent('healthywin');if(S.matchElapsed<=90000)featureEvent('fastwin');if(!S.matchSpecials&&S.difficulty!=='easy')featureEvent('cleanwin');if(!campaign)progress.record('fight',S.difficulty,{id:S.matchId,fighter:playerCharacter,score:S.wins[0]-S.wins[1],rounds:S.wins.slice(),elapsed:S.matchElapsed,completed:true});}if(campaign){campaign.elapsed=(campaign.elapsed||0)+(S.matchElapsed||0);campaign.played=(campaign.played||0)+1;}}
function recordCampaign(){if(campaign?.mode==='survival'){if(campaign.score>0)progress.record('survival',S.difficulty,{id:campaign.runId||(campaign.runId=S.matchId+'-run'),fighter:campaign.player,score:campaign.score,elapsed:campaign.elapsed||1,completed:false});return;}if(!campaign?.finished||campaign.recorded)return;campaign.recorded=true;const survival=campaign.mode==='survival',wins=survival?campaign.score:campaign.history.filter(h=>h.outcome==='win').length;progress.record(campaign.mode,S.difficulty,{id:campaign.runId||(campaign.runId=S.matchId+'-run'),fighter:campaign.player,targetWins:campaign.opponents?.length,score:wins,completed:survival?false:campaign.champion===campaign.player,elapsed:campaign.mode==='tournament'?(campaign.elapsed||1)/Math.max(1,campaign.played||1):campaign.elapsed||1});}

function survivalBoard(){
 const opponent=campaign.next();$('#campaignTitle').textContent='SURVIVAL';$('#campaignScreen').classList.remove('tournament-layout');$('#campaignBracket').classList.remove('arcade-path');
 $('#campaignMatchup').innerHTML='<span class="matchup-fighter"><i class="mini-portrait">'+campaignPortrait(campaign.player)+'</i><b>'+displayFighterName(campaign.player)+'</b></span><em>VS</em><span class="matchup-fighter"><i class="mini-portrait">'+campaignPortrait(opponent)+'</i><b>'+displayFighterName(opponent||'KONIEC')+'</b></span>';
 $('#campaignStatus').textContent='ZWYCIĘSTWA: '+campaign.score+' · REKORD: '+progress.fighter(campaign.player).bestSurvival;
 $('#campaignBracket').innerHTML='<div class="survival-summary"><strong>'+campaign.score+'</strong><span>POKONANYCH RYWALI</span><p>'+(campaign.finished?'Seria zakończona. Spróbuj pobić swój rekord.':'ZDROWIE NA KOLEJNĄ WALKĘ: '+Math.round(campaign.hp)+'/100')+'</p></div>';
 $('#campaignNote').textContent='Jedna runda na rywala. Po wygranej odzyskujesz 20 zdrowia. Przegrana kończy serię.';
 $('#campaignStart').textContent=campaign.finished?'NOWA SERIA':'KOLEJNA WALKA →';$('#campaignScreen').classList.remove('off');
}
const labels={
 'Jab Cross (1)':'Jab–cross','Jab Cross':'Jab–cross','Body Jab Cross':'Proste na korpus','Lead Jab':'Jab',
 'Hook':'Sierpowy','Hook Punch':'Sierpowy','Punching':'Cios pięścią','Boxing':'Cios bokserski','Boxing (1)':'Seria bokserska','Boxing (2)':'Dwa proste',
 'Mma Kick':'Kopnięcie MMA','Mma Kick (1)':'Kopnięcie MMA','Mma Kick (1) (2)':'Mocne kopnięcie MMA','Kicking':'Mocne kopnięcie','Kicking (2)':'Kopnięcie frontalne',
 'Illegal Elbow Punch':'Łokieć','Illegal Knee':'Kolano','Uppercut':'Podbródkowy','Side Kick':'Kopnięcie boczne',
 'Roundhouse Kick (1)':'Kopnięcie okrężne','Flying Kick':'Kopnięcie z wyskoku','Martelo Do Chau Sem Mao':'Martelo z ziemi',
 'Uppercut Jab':'Podbródkowy + jab','Punch To Elbow Combo':'Pięści + łokcie','Martelo Do Chau':'Martelo z ziemi','Elbow Uppercut Combo':'Łokieć + podbródkowy','Elbow Punching':'Łokcie','Capoeira (1)':'Seria capoeiry'
};

function helpRows(who,config){const keys=SOURCE_ATTACKS[who],inputs=['P1','P2','K1','K2','PRZÓD + P1','PRZÓD + P2','PRZÓD + K1','PRZÓD + K2'];return keys.map((key,i)=>({input:inputs[i],key,label:labels[config[key].label]||config[key].label})).concat(config.ACROBATIC_PUNCH?[{input:'DÓŁ + P2',key:'ACROBATIC_PUNCH',label:config.ACROBATIC_PUNCH.label}]:[]);}
function showFighterHelp(revisit=false){
 const helpCharacter=NET.active&&!NET.host?O.character:playerCharacter,helpConfig=NET.active&&!NET.host?O.cfg:CFG;
 if(helpPending)return;helpRevisit=revisit;helpWasPreFight=S.preFight;$('#helpContinue').textContent=revisit?'WRÓĆ DO PAUZY →':'ROZPOCZNIJ WALKĘ →';helpWasPaused=S.paused;helpPending=true;S.paused=true;S.preFight=true;releaseInputs();controls.classList.add('off');
 $('#fighterHelpTitle').textContent=displayFighterName(helpCharacter)+' · STEROWANIE';
 $('#fighterHelpMoves').innerHTML=helpRows(helpCharacter,helpConfig).map(row=>'<div><b>'+row.input+'</b><span>'+safeText(row.label)+'</span></div>').join('');
 const canThrow=!['NINA','DANNY'].includes(helpCharacter)&&!!helpConfig.THROW_ATTACKER;
 $('#fighterHelpDefense').textContent=helpCharacter==='NINA'?'U: unik. Dwa dotknięcia od rywala: obrót w tył. Bez gardy i rzutu.':'U: unik · przytrzymaj tarczę: garda wysoka · gest w dół: garda niska.';
 $('#fighterHelpCombo').textContent='COMBO: '+helpConfig.COMBO.label+'. Pełna energia, 2× na rundę. Ostatni czysty cios wyrzuca i powala (krótkie zwolnienie). Seria mocnych trafień też wyrzuca; blok ją przerywa.'+(canThrow?' CHWYT: rzut z bliska. Zerwanie: U lub CHWYT w pierwszych 0,2 s.':' Bez rzutu; U lub CHWYT zrywa chwyt rywala w pierwszych 0,2 s.');
 $('#fighterHelpMovement').textContent='◀ ▶: ruch. Dwa naciśnięcia do rywala: bieg; podczas biegu atak zachowuje rozpęd. Dwa naciśnięcia od rywala: '+(helpConfig.BACKFLIP||helpConfig.BACK_ROLL||helpConfig.QUICK_BACK).label+'. U: osobny unik. PRZÓD + atak: dodatkowy cios.'+(helpConfig.ACROBATIC_PUNCH?' DÓŁ + P2: '+helpConfig.ACROBATIC_PUNCH.label+'.':'');
 $('#helpPortrait').src='/assets/campaign-portraits/'+helpCharacter.toLowerCase()+'.webp';
 $('#helpFighterName').textContent=displayFighterName(helpCharacter);
 $('#helpFighterStyle').textContent=({BRAX:'BOKS · KICKBOXING',NYXA:'TECHNICZNE MUAY THAI',VEXA:'TAEKWONDO · KICKBOXING',KROV:'MUAY THAI',NINA:'CAPOEIRA',DANNY:'KICKBOXING',BEAR:'SIŁA · WALKA W ZWARCIU',DEMON:'AKROBATYKA · KOPNIĘCIA'})[helpCharacter];
 $('#helpKeyboardDefense').textContent=helpCharacter==='NINA'?'D: unik':'D: garda wysoka · D + ↓: garda niska';
 $('#helpControlsImage').src='/assets/controls-guide'+(['NINA','DANNY'].includes(helpCharacter)?'-'+helpCharacter.toLowerCase():'')+'.png';
 $('#helpControlsImage').alt=displayFighterName(helpCharacter)+' — układ sterowania. U: unik; strzałki: ruch. P2 u góry, P1 po lewej, K2 po prawej, K1 na dole, COMBO pośrodku.'+(helpCharacter==='NINA'?' Bez gardy i rzutu.':helpCharacter==='DANNY'?' Garda, bez rzutu.':' Chwyt i garda po lewej.');
 window.BRAX_INTERFACE?.helpTab('touch');
 const challenge=FEATURES.challenges.find(c=>c.id===activeChallenge);$('#fighterHelpGoal').textContent=challenge?challenge.description:campaign?.mode==='survival'?'SURVIVAL: jedna runda, zachowujesz zdrowie; +20 po wygranej.':'';
 $('#fighterHelp').classList.remove('off');$('#helpContinue').focus?.();
}
function closeFighterHelp(startFight=true){if(!helpPending)return;helpPending=false;$('#fighterHelp').classList.add('off');S.paused=helpWasPaused;S.last=performance.now();if(helpRevisit){S.preFight=helpWasPreFight;controls.classList.remove('off');$('#pauseHelp').focus?.();return;}if(startFight){S.paused=false;controls.classList.remove('off');intro();updateObjective();}}
$('#helpContinue').addEventListener('click',()=>closeFighterHelp());
$('#pauseHelp').addEventListener('click',()=>{if(S.running&&S.paused&&!S.cinematic&&!S.ended&&!liveDrillOpen)showFighterHelp(true);});
function openFeatures(kind){
 const isChallenges=kind==='challenges';$('#featureTitle').textContent=isChallenges?'WYZWANIA TECHNICZNE':'RANKING ŚWIATOWY';
 $('#liveDrillPanel').classList.add('off');$('#featureChallenges').classList.toggle('off',!isChallenges);$('#featureRecords').classList.toggle('off',isChallenges);$('#recordsTools').classList.toggle('off',isChallenges);if(!isChallenges)FEATURES.leaderboard(document,progress);
 if(isChallenges){for(const [i,c] of FEATURES.challenges.entries())$('#challenge-'+c.id).innerHTML=FEATURES.challengeCard(c,progress.fighter(CHARACTER_NAMES[selectedSlot]).challenges.includes(c.id),i);window.BRAX_INTERFACE?.openChallenges(progress,CHARACTER_NAMES[selectedSlot]);return;}
 else $('#featureRecords').innerHTML=FEATURES.records(progress);
 $('#progressNotice').textContent=progress.saved?'Wyniki online są wspólne dla wszystkich graczy. Osiągnięcia nie zwiększają siły postaci.':'Zapis jest niedostępny. Wyniki pozostaną tylko do zamknięcia gry.';$('#featurePanel').classList.remove('off');
}
function startChallenge(id){$('#challengeHub')?.classList.add('off');$('#challengesScreen').classList.add('off');const c=FEATURES.challenges.find(c=>c.id===id);if(!c)return;launchingChallenge=true;activeChallenge=id;selectGameMode(c.mode||(c.drill?'training':'fight'));launchingChallenge=false;if(c.drill){S.trainingBehavior=c.drill;$('#trainingDrill').value=c.drill;}else{S.difficulty=c.difficulty||'normal';selectMode(S.difficulty);}$('#featurePanel').classList.add('off');$('#trainingOptions').classList.add('off');$('#difficultyOptions').classList.add('off');$('#modeSettingsTitle').textContent=c.title;$('#modeDescription').textContent=c.description;$('#survivalScreen').classList.add('off');$('#modeSettings').classList.add('off');$('#matchSetup').classList.add('off');$('#selection').classList.remove('off');menuAudio.start();}
for(const c of FEATURES.challenges)$('#challenge-'+c.id).addEventListener('click',()=>window.BRAX_HUB.inspect(c,()=>startChallenge(c.id)));
$('#survivalMode').addEventListener('click',()=>selectGameMode('survival'));
$('#challengesMode').addEventListener('click',()=>openFeatures('challenges'));
$('#achievementsMode').addEventListener('click',()=>openFeatures('records'));
for(const id of ['recordsMode','recordsDifficulty'])$('#'+id).addEventListener('change',()=>FEATURES.leaderboard(document,progress));
$('#closeFeatures').addEventListener('click',()=>{if(liveDrillOpen){liveDrillOpen=false;S.paused=drillWasPaused;S.last=performance.now();}$('#featurePanel').classList.add('off');});
$('#trainingSettings').addEventListener('click',()=>{if(!S.training||!S.running||helpPending||S.cinematic)return;drillWasPaused=S.paused;S.paused=true;liveDrillOpen=true;releaseInputs();$('#featureTitle').textContent='TRENING · '+displayFighterName(O.character);for(const id of ['featureChallenges','featureRecords','recordsTools'])$('#'+id).classList.add('off');$('#liveDrillPanel').classList.remove('off');$('#liveTrainingDrill').value=S.trainingBehavior;$('#liveTrainingDrill').disabled=!!S.challengeRun;$('#liveTrainingAttack').innerHTML=SOURCE_ATTACKS[O.character].map(n=>'<option value="'+n+'">'+safeText(labels[O.cfg[n].label]||O.cfg[n].label)+'</option>').join('');$('#liveTrainingAttack').value=$('#trainingAttack').value||'LIGHT_PUNCH';$('#liveTrainingAttack').parentElement?.classList.toggle('off',!['repeat','counter'].includes(S.trainingBehavior));$('#progressNotice').textContent=S.challengeRun?'Zachowanie rywala wynika z celu wyzwania. Zamknij, aby kontynuować.':'Zamknij ten ekran, aby wznowić ćwiczenie.';$('#featurePanel').classList.remove('off');});
$('#liveTrainingDrill').addEventListener('change',()=>{if(S.challengeRun)return;S.trainingBehavior=$('#liveTrainingDrill').value;$('#liveTrainingAttack').parentElement?.classList.toggle('off',!['repeat','counter'].includes(S.trainingBehavior));S.drillMs=0;});
$('#liveTrainingAttack').addEventListener('change',()=>{$('#trainingAttack').value=$('#liveTrainingAttack').value;S.drillMs=0;});
$('#trainingDrill').addEventListener('change',()=>{const mode=$('#trainingDrill').value;if(['repeat','counter','grab','bag'].includes(mode))S.trainingBehavior=mode;else S.trainingBehavior='move';S.drillMs=0;});
function trainingDrill(dt){
 if(O.locked||O.stun||O.pushTime>0||S.clinch||B.downState||B.getupProtection>0)return;
 if(S.trainingBehavior==='bag'){if(O.a!=='IDLE')opponentPose('IDLE');return;}
 const requested=$('#trainingAttack').value||'LIGHT_PUNCH',move=SOURCE_ATTACKS[O.character].includes(requested)?requested:'LIGHT_PUNCH';
 const distance=Math.abs(O.x-B.x),desired=S.trainingBehavior==='grab'?worldHPercent()*.34:attackDistance(O.cfg[move],playerHurtbox())*.90;
 if(distance>desired+.15){O.x+=O.face*Math.min(distance-desired,sourceMoveSpeed(O.character)*dt/1000);if(O.a!==forwardPose(O))opponentPose(forwardPose(O));return;}
 if(O.a!=='IDLE')opponentPose('IDLE');S.drillMs=(S.drillMs||0)+dt;
 if(S.drillMs<(S.trainingBehavior==='counter'?1300:1000))return;S.drillMs=0;
 if(S.trainingBehavior==='grab'){if(!beginSourcePair(O)){S.drillMs=500;if(['NINA','DANNY'].includes(O.character)){$('#fightObjective').classList.remove('off');$('#fightObjective').textContent='Ćwiczenie chwytu wymaga rywala: BRAX, NYXA, VEXA, KROV, MIŚ lub AZRAK.';}}}
 else opponentPose(move,true);
}

let selectedGameMode='fight',campaign=null,arenaLaunchPending=false;
function campaignTitle(){if(selectedGameMode==='survival')return'SURVIVAL';return selectedGameMode==='arcade'?'ARCADE':selectedGameMode==='tournament'?'TURNIEJ':'WALKA 1 VS 1'}
function selectGameMode(mode){if(!launchingChallenge)activeChallenge=null;selectedGameMode=mode;window.BRAX_ROSTER?.setMode(mode);campaign=null;selectMode(mode==='training'?'training':S.difficulty);for(const [id,key] of [['fightMode','fight'],['arcadeMode','arcade'],['tournamentMode','tournament'],['mode-training','training']])$('#'+id).setAttribute('aria-pressed',String(mode===key));$('#modeSettings').classList.remove('off');if(mode==='survival')window.BRAX_INTERFACE?.openSurvival(progress,S.difficulty);}
const resultPortrait=name=>'/assets/result-portraits/'+name.toLowerCase()+'.webp';
const modelPortrait=name=>'/assets/portraits/'+name.toLowerCase()+'.webp';
const fighterPortrait=name=>name?'<img src="'+modelPortrait(name)+'" alt="'+displayFighterName(name)+'" draggable="false">':'<div class="campaign-unknown">?</div>';
const campaignPortrait=name=>name?'<img src="/assets/campaign-portraits/'+name.toLowerCase()+'.webp" alt="'+displayFighterName(name)+'" draggable="false">':'<div class="campaign-unknown">?</div>';
function campaignBoard(){
 if(campaign.mode==='survival'){survivalBoard();return;}
 const opponent=campaign.next(),win=campaign.champion===campaign.player;
 $('#campaignTitle').textContent=campaignTitle();$('#campaignMatchup').innerHTML='<span class="matchup-fighter"><i class="mini-portrait">'+campaignPortrait(campaign.player)+'</i><b>'+displayFighterName(campaign.player)+'</b></span><em>VS</em><span class="matchup-fighter"><i class="mini-portrait">'+campaignPortrait(opponent||campaign.champion)+'</i><b>'+displayFighterName(opponent||campaign.champion||'KONIEC')+'</b></span>';
 $('#campaignStatus').textContent=campaign.finished?(win?'MISTRZ: '+displayFighterName(campaign.player):'KONIEC · '+(campaign.champion?'ZWYCIĘZCA: '+displayFighterName(campaign.champion):'SPRÓBUJ PONOWNIE')):(campaign.mode==='arcade'?'WALKA '+(campaign.index+1)+' / '+campaign.opponents.length:campaign.rounds.length===3?'FINAŁ':campaign.rounds.length===2?'PÓŁFINAŁ':'RUNDA 1')+' · '+displayFighterName(campaign.player)+' VS '+displayFighterName(opponent);
 $('#campaignScreen').classList.toggle('tournament-layout',campaign.mode==='tournament');const bracket=$('#campaignBracket');bracket.textContent='';bracket.classList.toggle('arcade-path',campaign.mode==='arcade');
 if(campaign.mode==='arcade'){
  for(const [i,name] of campaign.opponents.entries()){const card=document.createElement('div'),done=i<campaign.index,current=i===campaign.index;card.className='campaign-fighter'+(done?' completed':current?' current':'');card.innerHTML='<div class="campaign-portrait">'+campaignPortrait(name)+'</div><b class="campaign-number">'+String(i+1).padStart(2,'0')+'</b><div class="campaign-fighter-caption"><small>'+(done?'✓ POKONANY':current?(campaign.eliminated?'✕ PRZEGRANA':'NASTĘPNA WALKA'):'PRZED TOBĄ')+'</small><strong>'+displayFighterName(name)+'</strong></div>';bracket.appendChild(card);}
 }else{
  bracket.innerHTML=window.BRAX_CHAMPIONSHIP.tournamentView(campaign);
 }
 $('#campaignNote').textContent=campaign.mode==='tournament'?'Walki między zawodnikami CPU są symulowane.':'Pokonaj siedmiu różnych przeciwników.';
 $('#campaignStart').textContent=campaign.finished?'ZAGRAJ OD NOWA':'WALCZ →';
 $('#campaignScreen').classList.remove('off');
}
async function launchCampaign(){
 if(['arcade','tournament','survival'].includes(selectedGameMode)){
  campaign=selectedGameMode==='survival'?FEATURES.createSurvival(CHARACTER_NAMES[selectedSlot]):window.BRAX_CHAMPIONSHIP.create(selectedGameMode,CHARACTER_NAMES[selectedSlot],CHARACTER_NAMES);
  $('#arenaSelection').classList.add('off');
  if(selectedGameMode==='tournament'){campaignBoard();return;}
  // Arcade chooses the first rival and starts directly from the selected arena.
  selectOpponent(campaign.next());
 }
 await begin();
}
function campaignResult(){if(!campaign)return;if(campaign.mode==='survival'){campaign.result(S.wins[0]===S.wins[1]?'draw':S.wins[0]>S.wins[1]?'win':'loss',B.hp);progress.survival(playerCharacter,campaign.score);if(S.wins[0]>S.wins[1])featureEvent('survival');recordCampaign();$('#rematch').textContent=campaign.finished?'WYNIK SURVIVAL →':'NASTĘPNY RYWAL →';$('#resultKicker').textContent='SURVIVAL · ZWYCIĘSTWA '+campaign.score;return;}campaign.result(S.wins[0]===S.wins[1]?'draw':S.wins[0]>S.wins[1]?'win':'loss');recordCampaign();$('#rematch').textContent=campaign.mode==='tournament'?'DRABINKA →':campaign.finished?'PODSUMOWANIE →':'DALEJ →';if(campaign.champion===campaign.player){$('#resultKicker').textContent=campaign.mode==='arcade'?'ARCADE UKOŃCZONE':'MISTRZ TURNIEJU';window.BRAX_VICTORY?.show(campaign,$('#titleAudio').muted);}}
$('#campaignStart').addEventListener('click',async()=>{const button=$('#campaignStart');if(button.disabled)return;button.disabled=true;$('#campaignBack').disabled=true;try{if(campaign.finished)campaign=selectedGameMode==='survival'?FEATURES.createSurvival(CHARACTER_NAMES[selectedSlot]):window.BRAX_CHAMPIONSHIP.create(selectedGameMode,CHARACTER_NAMES[selectedSlot],CHARACTER_NAMES);if(campaign.mode==='survival')campaign.advance();selectOpponent(campaign.next());if(['arcade','tournament','survival'].includes(campaign.mode))chooseArena(randomArena());await begin();$('#campaignScreen').classList.add('off');}catch{$('#campaignStatus').textContent='Nie udało się wczytać walki. Spróbuj ponownie.';}finally{button.disabled=false;$('#campaignBack').disabled=false;}});
$('#campaignBack').addEventListener('click',()=>{$('#campaignScreen').classList.add('off');returnToSelection();});
$('#arcadeMode').addEventListener('click',()=>selectGameMode('arcade'));
$('#tournamentMode').addEventListener('click',()=>selectGameMode('tournament'));
function selectMode(mode){if(mode==='training')selectedGameMode='training';else if(selectedGameMode==='training')selectedGameMode='fight';for(const [id,key] of [['fightMode','fight'],['arcadeMode','arcade'],['tournamentMode','tournament'],['mode-training','training']])$('#'+id).setAttribute('aria-pressed',String(selectedGameMode===key));S.training=mode==='training';if(!S.training&&DIFFICULTY[mode])S.difficulty=mode;for(const key of ['easy','normal','hard','training'])$('#mode-'+key).setAttribute('aria-pressed',String(key===mode));game.classList.toggle('training',S.training);$('#trainingOptions').classList.toggle('off',!S.training);$('#difficultyOptions').classList.toggle('off',S.training);$('#fightMode').setAttribute('aria-pressed',String(!S.training&&selectedGameMode==='fight'));$('#drillOptions').classList.add('off');$('#modeSettingsTitle').textContent=S.training?'TRENING':campaignTitle();$('#modeChoice').textContent=S.training?'TRENING':campaignTitle();$('#modeDescription').textContent=S.training?'Bez limitu czasu · wybierz zachowanie rywala':({easy:'Spokojne tempo · więcej czasu na reakcję',normal:'Zrównoważona walka',hard:'Szybsze reakcje · częstsza obrona'})[mode];}
for(const mode of ['easy','normal','hard','training'])$('#mode-'+mode).addEventListener('click',()=>selectMode(mode));
$('#fightMode').addEventListener('click',()=>selectGameMode('fight'));
$('#mode-training').addEventListener('click',()=>{activeChallenge=null;selectGameMode('training');});
$('#openModeSettings').addEventListener('click',()=>{if(selectedGameMode==='survival')window.BRAX_INTERFACE?.openSurvival(progress,S.difficulty);else $('#modeSettings').classList.remove('off');});
$('#closeModeSettings').addEventListener('click',()=>$('#modeSettings').classList.add('off'));
for(const behavior of ['move','block','spar'])$('#training-'+behavior).addEventListener('click',()=>{S.trainingBehavior=behavior;for(const key of ['move','block','spar'])$('#training-'+key).setAttribute('aria-pressed',String(key===behavior));});
$('#trainingReset').addEventListener('click',()=>{if(!S.training)return;releaseInputs();reset(false);blood?.clear();if(S.challengeRun){S.challengeRun={id:S.challengeRun.id,count:0,done:false};S.matchElapsed=0;S.matchId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);startOnlineMatch();updateObjective();}B.en=100;S.preFight=false;S.paused=false;pause.textContent='Ⅱ';fightAudio.unlock();arenaSound.resume();});
function playArenaMotion(){arenaSound.resume();}
function chooseArena(key){if(!ARENAS[key])return;window.BRAX_ARENA_PICKER?.select(key);window.BRAX_ARENA_MEDIA?.release();window.BRAX_NIGHT_MARKET?.destroy();selectedArena=key;activeArena=ARENAS[key];game.classList.toggle('night-market',key==='nocny-targ');game.classList.toggle('video-arena',!!activeArena.remote);$('#arena').onerror=activeArena.fallback?function(){this.onerror=null;this.src=activeArena.fallback;}:null;$('#arena').src=activeArena.src;const motion=$('#arenaMotion');motion.pause();motion.classList.toggle('off',!activeArena.video);if(activeArena.video){motion.poster=activeArena.src;motion.muted=true;motion.currentTime=0;if(activeArena.remote){motion.preload='none';motion.removeAttribute?.('src');motion.load?.();}else{motion.preload='auto';motion.src=activeArena.video;playArenaMotion();}}else{motion.removeAttribute?.('src');motion.load?.();}for(const id of Object.keys(ARENAS))$('#arena-'+id).setAttribute('aria-pressed',String(id===key));}
$('#backFighter').addEventListener('click',()=>{arenaLaunchPending=false;const change=()=>{game.classList.remove('arena-picker-open');$('#arenaSelection').classList.add('off');$('#selection').classList.remove('off');menuAudio.start()};if(window.BRAX_TRANSITION)window.BRAX_TRANSITION.run(change);else change()});
function showArenaSelection(){if(selectedSlot>=CHARACTER_NAMES.length)return;if(window.BRAX_TRANSITION){window.BRAX_TRANSITION.run(showArenaSelectionNow);return}showArenaSelectionNow()}
function selectOpponent(character){selectedOpponent=character;}

function randomArena(){const choices=Object.keys(ARENAS).filter(key=>key!==selectedArena);return choices[Math.floor(Math.random()*choices.length)];}
function showArenaSelectionNow(){for(const id of ['survivalScreen','challengesScreen'])$('#'+id).classList.add('off');arenaLaunchPending=false;if(window.BRAX_ROSTER)selectedOpponent=window.BRAX_ROSTER.opponent;$('#modeSettings').classList.add('off');selectOpponent(selectedOpponent||(selectedSlot===0?'NYXA':'BRAX'));
 if(['arcade','tournament','survival'].includes(selectedGameMode)){
  arenaLaunchPending=true;chooseArena(randomArena());
  $('#selection').classList.add('off');$('#matchSetup').classList.add('off');$('#arenaSelection').classList.add('off');
  const launching=launchCampaign();
  launching.catch(()=>{arenaLaunchPending=false;$('#selection').classList.remove('off');$('#arenaSelection').classList.add('off');});
  return window.BRAX_TRANSITION&&S.cinematic?window.BRAX_TRANSITION.videoReady(fighterFilm):launching;
 }
 game.classList.add('arena-picker-open');$('#selection').classList.add('off');$('#matchSetup').classList.add('off');$('#arenaSelection').classList.remove('off');chooseArena(selectedArena);const film=FIGHTER_FILMS[CHARACTER_NAMES[selectedSlot]];fighterFilm.preload='auto';if(film&&fighterFilm.getAttribute('src')!==film){fighterFilm.src=film;fighterFilm.load?.();}window.BRAX_PREPARE_PAIR?.(['arcade','tournament','survival'].includes(selectedGameMode)?[CHARACTER_NAMES[selectedSlot]]:[CHARACTER_NAMES[selectedSlot],selectedOpponent]).catch(()=>{});menuAudio.start();}
function setupTransition(change){if(window.BRAX_TRANSITION)window.BRAX_TRANSITION.run(change);else change()}
$('#setupBack').addEventListener('click',()=>setupTransition(()=>{$('#matchSetup').classList.add('off');start.classList.remove('off');game.classList.remove('arena-picker-open');menuAudio.start()}));
$('#setupNext').addEventListener('click',()=>setupTransition(()=>{$('#modeSettings').classList.add('off');$('#matchSetup').classList.add('off');$('#selection').classList.remove('off');game.classList.remove('arena-picker-open');menuAudio.start()}));
for(const key of Object.keys(ARENAS))$('#arena-'+key).addEventListener('click',()=>{if(arenaLaunchPending)return;arenaLaunchPending=true;fightAudio.unlock();if(window.BRAX_TRANSITION)window.BRAX_TRANSITION.run(async()=>{chooseArena(key);const launching=launchCampaign();launching.catch(()=>{arenaLaunchPending=false;});if(!S.cinematic)await launching;if(S.cinematic)return window.BRAX_TRANSITION.videoReady(fighterFilm)});else{chooseArena(key);launchCampaign().catch(()=>{arenaLaunchPending=false;})}});
// Native touch scrolling goes left to reveal subsequent thumbnails. Mouse drag mirrors it.
const arenaStrip=$('#arenaStrip');$('#arenaPrevious').addEventListener('click',()=>arenaStrip.scrollBy({left:-arenaStrip.clientWidth/3,behavior:'smooth'}));$('#arenaNext').addEventListener('click',()=>arenaStrip.scrollBy({left:arenaStrip.clientWidth/3,behavior:'smooth'}));let arenaDrag=null,arenaDragged=false;
arenaStrip.addEventListener('pointerdown',e=>{arenaDragged=false;if(window.BRAX_ARENA_PICKER||e.pointerType!=='mouse')return;arenaDrag={id:e.pointerId,x:e.clientX,scroll:arenaStrip.scrollLeft};});
arenaStrip.addEventListener('pointermove',e=>{if(!arenaDrag||e.pointerId!==arenaDrag.id)return;const dx=e.clientX-arenaDrag.x;if(Math.abs(dx)>6){arenaDragged=true;arenaStrip.setPointerCapture(e.pointerId);arenaStrip.scrollLeft=arenaDrag.scroll-dx;}});
for(const event of ['pointerup','pointercancel'])arenaStrip.addEventListener(event,()=>{arenaDrag=null;});
arenaStrip.addEventListener('click',e=>{if(arenaDragged){e.preventDefault();e.stopPropagation();arenaDragged=false;}},true);

// Recorded effects are decoded once; one unlocked Web Audio context supports mobile playback.
const fightAudio=(()=>{
 const C=window.AudioContext||window.webkitAudioContext;
 const files={gong:'gong','brax-ready':'brax-ready','nyxa-ready':'nyxa-ready','brax-taunt1':'brax-taunt1','brax-taunt2':'brax-ready','nyxa-taunt1':'nyxa-taunt1','nyxa-taunt2':'nyxa-taunt2',fight:'fight',three:'3',two:'2',one:'1',punch:'swish',kick:'kick-swish',impact:'impact',heavy:'heavy',step:'step',land:'land',thunder:'night-market-thunder'};
 const buffers=new Map(),voices=new Set();let ac=null,master=null,muted=false,voice=null;
 const proof={played:[],ready:[],errors:[]};
 function setup(){if(ac||!C)return;try{ac=new C();master=ac.createGain();master.gain.value=muted?0:.8;const limiter=ac.createDynamicsCompressor();limiter.threshold.value=-10;limiter.ratio.value=5;master.connect(limiter);limiter.connect(ac.destination);
  for(const file of new Set(Object.values(files))){const keys=Object.keys(files).filter(key=>files[key]===file);fetch('/assets/audio/'+file+'.mp3').then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer()}).then(x=>ac.decodeAudioData(x)).then(b=>{for(const key of keys){buffers.set(key,b);proof.ready.push(key)}}).catch(()=>proof.errors.push(...keys));}
 }catch{ac=null;}}
 function unlock(){setup();if(ac?.state==='suspended')ac.resume().catch(()=>{});}
 function stop(){for(const s of voices){try{s.stop()}catch{}}voices.clear();voice=null;arenaSound.duck(false);}
 function play(key,volume=1,pitch=1,isVoice=false){if(NET.active&&NET.host&&!isVoice&&['punch','kick','impact','heavy','step','land'].includes(key)){NET.sounds.push({id:++NET.soundId,key,volume,pitch,at:performance.now()});NET.sounds=NET.sounds.slice(-24);}if(S.running&&!S.preFight&&!S.training&&!S.cinematic&&!koReplay?.active&&!isVoice&&['punch','kick','impact','heavy','step','land'].includes(key)){(S.replaySounds||=[]).push({key,volume,pitch});if(S.replaySounds.length>32)S.replaySounds.shift();}if(muted||document.hidden||S.paused)return false;const buffer=buffers.get(key);if(!ac||ac.state!=='running'||!buffer)return false;
  if(isVoice&&voice){try{voice.stop()}catch{}}if(isVoice)arenaSound.duck(true);
  const src=ac.createBufferSource(),gain=ac.createGain();src.buffer=buffer;src.playbackRate.value=pitch;gain.gain.value=volume;src.connect(gain);gain.connect(master);voices.add(src);if(isVoice)voice=src;src.onended=()=>{voices.delete(src);src.disconnect();gain.disconnect();if(voice===src){voice=null;arenaSound.duck(false)}};src.start();proof.played.push({key,at:performance.now()});if(proof.played.length>80)proof.played.shift();return true;
 }
 function frame(name,index,actor=B){const c=krovConfig(actor)[name],hit=c.hits?.[String(index)],groups=actor===B?actor.hitGroups:actor.hits;if(!hit||groups.has('sound-'+hit.group))return;groups.add('sound-'+hit.group);const kick=/Foot|Leg|Toe|Knee/i.test(hit.bone||'')||(!hit.bone&&/KICK|KNEE|STOMP|ROUNDHOUSE/.test(name));play(kick?'kick':'punch',kick?.66:.54,.96+Math.random()*.08);}
 function cue(t){if(t==='FIGHT'){play('gong',.5);arenaSound.resume()}const key={'3':'three','2':'two','1':'one','FIGHT':'fight'}[t];if(key)play(key,.94,1,true);}
 function mute(value){muted=value;if(master)master.gain.value=muted?0:.8;if(muted)stop();else unlock();}
 game.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();ac?.suspend?.()}else unlock()});
 function countdownReady(){return muted||!C||['three','two','one','fight','gong'].every(key=>buffers.has(key))}
 setup();return{unlock,play,frame,cue,mute,stop,proof,countdownReady};
})();

const arenaSound=(()=>{const a=$('#arenaAudio'),motion=$('#arenaMotion');let muted=false,ducked=false;function level(){a.volume=ducked?.045:.13;motion.volume=ducked?.05:.16;window.BRAX_ARENA_MEDIA?.sound?.(motion.volume,muted)}function select(){a.pause();motion.muted=muted;level();if(activeArena.video||activeArena.audio===null){a.removeAttribute?.('src');return;}a.src=typeof activeArena.audio==='string'?activeArena.audio:'/assets/audio/arena-'+selectedArena+'.mp3';a.currentTime=0;}let autoMuted=false;function playVideo(){return Promise.resolve(window.BRAX_ARENA_MEDIA?.resume?window.BRAX_ARENA_MEDIA.resume():window.BRAX_PLAY_VIDEO?window.BRAX_PLAY_VIDEO(motion,()=>S.running&&!S.paused&&!S.cinematic):motion.play());}function unlock(){if(!autoMuted)return;autoMuted=false;if(!muted){motion.muted=false;window.BRAX_ARENA_MEDIA?.sound?.(motion.volume,false);}}for(const type of ['touchend','click','keydown','pointerdown'])addEventListener(type,unlock,true);function resume(){if(!S.running||S.paused||S.cinematic||S.matchOver||document.hidden)return;if(activeArena.video){const sound=muted||autoMuted;motion.muted=sound;window.BRAX_ARENA_MEDIA?.sound?.(motion.volume,sound);playVideo().catch(()=>{if(sound)return;autoMuted=true;motion.muted=true;window.BRAX_ARENA_MEDIA?.sound?.(motion.volume,true);return playVideo().catch(()=>{});});}else if(!muted&&activeArena.audio!==null)a.play().catch(()=>{});}function stop(){a.pause();window.BRAX_ARENA_MEDIA?.pause?.();motion.pause()}function mute(v){muted=v;a.muted=motion.muted=v;window.BRAX_ARENA_MEDIA?.sound?.(motion.volume,v);if(activeArena.video){if(!v)resume()}else if(v)stop();else resume()}function duck(v){ducked=v;level()}return{select,resume,stop,mute,duck}})();
function characterVoice(character,kind='ready'){if(S.paused||S.ended||document.hidden)return;fightAudio.play(character.toLowerCase()+'-'+kind,.8,1,true)}
const menuAudio=(()=>{const music=$('#titleAudio'),crowd=$('#crowdAudio'),impact=$('#startAudio'),button=$('#menuSound');let muted=!!window.BRAX_BOOT?.muted;music.muted=crowd.muted=impact.muted=muted;fightAudio.mute(muted);arenaSound.mute(muted);music.volume=.72;crowd.volume=.68;impact.volume=.52;const play=a=>{try{if(a.paused!==false)a.play?.()?.catch?.(()=>{})}catch{}};function startSound(hit=false){if(muted||S.running||window.BRAX_START_FILM?.active)return;const selection=hit||start.classList.contains('off');if(game.classList.contains('arena-picker-open')){crowd.pause?.();play(music)}else if(selection){music.pause?.();play(crowd)}else{crowd.pause?.();play(music)}if(hit){impact.currentTime=0;play(impact)}}function stop(){music.pause?.();crowd.pause?.();impact.pause?.()}button.addEventListener('click',()=>{muted=!muted;fightAudio.mute(muted);arenaSound.mute(muted);music.muted=crowd.muted=impact.muted=muted;$('#fighterFilm').muted=muted;button.textContent=muted?'🔇':'🔊';button.setAttribute?.('aria-label',muted?'Włącz dźwięk':'Wycisz dźwięk');if(muted)stop();else startSound()});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});game.addEventListener('pointerup',()=>{if(!S.running)startSound()});return {start:startSound,stop}})();

let namePending=false;
function askPlayerName(){namePending=true;$('#playerNickname').value=progress.name;$('#identityError').textContent='';$('#playerIdentity').classList.remove('off');window.BRAX_INTERFACE?.openKeyboard();}
$('#identityBack').addEventListener('click',()=>{namePending=false;$('#playerIdentity').classList.add('off');$('#go').focus?.();});
async function acceptPlayerName(){if(!namePending||$('#identityContinue').disabled)return;let verified=$('#playerNickname').value;$('#identityContinue').disabled=true;try{verified=await window.BRAX_ONLINE.saveName(verified);}catch(e){$('#identityError').textContent=e.message;return;}finally{$('#identityContinue').disabled=false;}if(!progress.setName(verified)){$('#identityError').textContent='Wpisz od 2 do 20 znaków: litery, cyfry, spacje, kropka, _ lub -.';return;}namePending=false;$('#playerIdentity').classList.add('off');if(window.BRAX_START_FILM)window.BRAX_START_FILM.play(showSelection);else showSelection();}
$('#identityContinue').addEventListener('click',acceptPlayerName);$('#playerNickname').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();acceptPlayerName();}});
function showSelection(){selectSlot(0,true);menuAudio.start(true);full();start.classList.add('off');$('#selection').classList.add('off');$('#matchSetup').classList.remove('off')}$('#go').addEventListener('click',()=>{full();askPlayerName()});$('#chooseFighter').addEventListener('click',()=>{if(!selectionMoved)showArenaSelection()});$('#backTitle').addEventListener('click',()=>{const change=()=>{$('#selection').classList.add('off');$('#matchSetup').classList.remove('off');menuAudio.start()};if(window.BRAX_TRANSITION)window.BRAX_TRANSITION.run(change);else change()});screenButton.addEventListener('click',()=>full());document.addEventListener('fullscreenchange',fitViewport);document.addEventListener('webkitfullscreenchange',fitViewport);window.visualViewport?.addEventListener('pageshow',fitViewport);addEventListener('resize',fitViewport);window.visualViewport?.addEventListener('scroll',fitViewport);pause.addEventListener('click',()=>{if(helpPending||namePending||liveDrillOpen||lostContexts.size)return;releaseInputs();S.paused=!S.paused;if(S.paused){window.BRAX_INTERFACE?.syncPause();fightAudio.stop();arenaSound.stop();$('#arenaMotion').pause()}else{fightAudio.unlock();arenaSound.resume();playArenaMotion()}game.classList.toggle('paused',S.running&&S.paused&&!S.cinematic&&!S.ended&&!NET.active);if(S.paused)$('#pauseResume').focus?.();else pause.focus?.();pause.textContent=S.paused?'▶':'Ⅱ';S.last=performance.now();say(S.paused?'PAUZA':'FIGHT',false)});
function canInput(){if(NET.active&&!NET.host)return false;if(lostContexts.size)return false;const v=arenaSize();return S.running&&!S.paused&&!S.preFight&&!S.ended&&!S.comboApproach&&!S.cinematic&&!B.stun&&v.width>=v.height}
const inputResets=[];
function releaseInputs(){attackQueue.length=0;B.sprintHeld=false;lastMoveTap={key:null,time:0,released:false};for(const reset of inputResets)reset();g=null;for(const key of Object.keys(K))K[key]=false;document.querySelectorAll('#controls button').forEach(x=>x.classList.remove('active'))}
const heldPointers=new Map(),holdButtons=[...document.querySelectorAll('[data-hold]')];
function paintHolds(){for(const x of holdButtons)x.classList.toggle('active',[...heldPointers.values()].some(p=>p.key===x.dataset.hold));}
function beginBackflip(){const name=CFG.BACKFLIP?'BACKFLIP':CFG.BACK_ROLL?'BACK_ROLL':CFG.QUICK_BACK?'QUICK_BACK':null;if(!name||!canInput()||B.lock||B.jumpTime!==null||!B.ground||S.clinch||B.pushTime)return false;B.sprintHeld=false;return beginAction(name);}
function directionPress(k,tap=true){const now=performance.now(),same=tap&&lastMoveTap.key===k&&lastMoveTap.released&&now-lastMoveTap.time<300;K.left=k==='left';K.right=k==='right';B.sprintHeld=!!(same&&CFG.RUN&&(k==='right'?1:-1)===B.face);lastMoveTap={key:k,time:now,released:false};if(same&&(k==='right'?1:-1)===-B.face){beginBackflip();lastMoveTap={key:null,time:now,released:false};}if(isLegacyKrov(B)&&same)beginKrovDash((k==='right'?1:-1)*B.face);}
function endHold(e){const p=heldPointers.get(e.pointerId);if(!p)return;heldPointers.delete(e.pointerId);if(p.key&&![...heldPointers.values()].some(x=>x.key===p.key)){K[p.key]=false;if(p.directional){B.sprintHeld=false;lastMoveTap.released=true;}}paintHolds();}
inputResets.push(()=>heldPointers.clear());
for(const x of holdButtons){x.addEventListener('pointerdown',e=>{e.preventDefault();if(!canInput()||heldPointers.has(e.pointerId))return;const k=x.dataset.hold,directional=k==='left'||k==='right';if(directional){for(const p of heldPointers.values())if(p.directional){p.key=null;p.directional=false;}directionPress(k);}else {if(k==='block'&&playerCharacter==='NINA'){evade();return;}K[k]=true;}heldPointers.set(e.pointerId,{key:k,directional});try{x.setPointerCapture(e.pointerId);}catch{}paintHolds();});for(const event of ['pointerup','pointercancel','lostpointercapture'])x.addEventListener(event,endHold);}
document.addEventListener('pointermove',e=>{const p=heldPointers.get(e.pointerId);if(!p?.directional)return;const button=document.elementFromPoint?.(e.clientX,e.clientY)?.closest('button'),key=button?.dataset.hold,k=key==='left'||key==='right'?key:null;if(k===p.key)return;e.preventDefault();if(p.key)K[p.key]=false;B.sprintHeld=false;lastMoveTap={key:null,time:0,released:false};p.key=k;if(k&&canInput())directionPress(k,false);else{p.key=null;K.left=K.right=false;}paintHolds();},{passive:false});
for(const event of ['pointerup','pointercancel']){document.addEventListener(event,endHold);addEventListener(event,endHold);}
document.querySelectorAll('[data-tap]').forEach(x=>{const kind=x.dataset.tap;let pointer=null;inputResets.push(()=>{pointer=null});x.addEventListener('pointerdown',e=>{e.preventDefault();if(!canInput()||pointer!==null)return;pointer=e.pointerId;x.setPointerCapture(e.pointerId);x.classList.add('active');playerButtonAttack(kind)});const off=e=>{if(e.pointerId!==pointer)return;pointer=null;x.classList.remove('active')};['pointerup','pointercancel','lostpointercapture'].forEach(y=>x.addEventListener(y,off))});
addEventListener('keydown',e=>{if(!canInput())return;const key=e.key.toLowerCase();if(['arrowleft','arrowright','a','s','d','f','q','e','g','c','arrowdown'].includes(key))e.preventDefault();if(e.repeat)return;if(key==='arrowleft')directionPress('left');if(key==='arrowright')directionPress('right');if(key==='arrowdown')K.down=true;if(key==='c')playerButtonAttack('grab');if(key==='d'){if(playerCharacter==='NINA')evade();else K.block=true;};if(key==='f')playerButtonAttack('heavy');if(key==='g')playerButtonAttack('kick2');if(key==='a')playerButtonAttack('punch');if(key==='s')playerButtonAttack('kick');if(key==='q')playerButtonAttack('special');if(key==='e'||key==='u')playerButtonAttack('evade')});
addEventListener('keyup',e=>{const key=e.key.toLowerCase();if(key==='arrowleft'||key==='arrowright'){const k=key==='arrowleft'?'left':'right';if(K[k]){K[k]=false;B.sprintHeld=false;lastMoveTap.released=true;}}if(key==='d')K.block=false;if(key==='arrowdown')K.down=false});
addEventListener('blur',releaseInputs);
document.addEventListener('visibilitychange',()=>{if(document.hidden){window.BRAX_ARENA_MEDIA?.pause?.();$('#arenaMotion').pause();arenaSound.stop();releaseInputs();if(S.running&&!S.paused){S.paused=true;window.BRAX_INTERFACE?.syncPause();pause.textContent='▶'}}});
let g=null;game.addEventListener('pointerdown',e=>{if(!canInput()||e.target.closest('button'))return;g={x:e.clientX,y:e.clientY,t:performance.now()}});game.addEventListener('pointerup',e=>{if(!canInput()||!g||e.target.closest('button')){g=null;return}let dx=e.clientX-g.x,dy=e.clientY-g.y,dt=performance.now()-g.t;g=null;if(dt>500)return;if(Math.abs(dx)<24&&Math.abs(dy)<24&&dt<230)return;if(Math.abs(dy)>45&&Math.abs(dy)>Math.abs(dx)*1.15){if(dy>0){if(playerCharacter==='NINA'){evade();return;}K.block=true;K.down=true;setTimeout(()=>{K.down=false;if(!document.querySelector('[data-hold=block]')?.classList.contains('active'))K.block=false},330)}}else if(Math.abs(dx)>55){let k=dx>0?'right':'left';if(heldPointers.size)return;directionPress(k,false);setTimeout(()=>{if(!document.querySelector('[data-hold='+k+']')?.classList.contains('active'))K[k]=false},250)}else if(dt<230)playerButtonAttack('punch')});
game.addEventListener('pointercancel',()=>{g=null});
addEventListener('pageshow',fitViewport);addEventListener('resize',fitViewport);addEventListener('orientationchange',()=>{requestAnimationFrame(fitViewport);setTimeout(fitViewport,200)});addEventListener('contextmenu',e=>e.preventDefault());
window.__BRAX_PROOF__={build:'internet-duel-125',assetSha256:ASSET_SHA256,state:()=>({mode:S.training?'training':'match',difficulty:S.difficulty,trainingBehavior:S.trainingBehavior,round:S.round,wins:S.wins.slice(),comboUses:S.comboUses,comboApproach:S.comboApproach,cinematic:S.cinematic,matchOver:S.matchOver,character:playerCharacter,opponent:{character:O.character,x:O.x,face:O.face,hp:O.hp,action:O.a},running:S.running,paused:S.paused,preFight:S.preFight,time:S.t,worldGroundY:(game.getBoundingClientRect().bottom-groundInset()),brax:{x:B.x,y:B.y,face:B.face,hp:B.hp,energy:B.en,action:B.a,phase:B.phase,frame:B.frame,ground:B.ground,hurtbox:playerHurtbox()}}),attack:n=>doAttack(String(n||'').toUpperCase()),jump,reset,actions:Object.keys(CFG),availableActions:()=>Object.keys(CFG),currentHitbox:()=>{const c=CFG[B.a],h=c&&c.hits[String(B.frame)];return h?attackRect(h.box):null},selectedSlot:()=>selectedSlot,selectedArena:()=>selectedArena,audio:()=>fightAudio.proof,queuedAttacks:()=>attackQueue.slice(),frameAnchor:()=>currentRender.anchorY,groundContact:()=>({floor:groundY(),feet:groundY()-B.y*.007*arenaSize().height+(currentRender.box[3]-currentRender.anchorY)*currentRender.scale,airborne:!B.ground})};

$('#chooseFighter').textContent='DALEJ →';window.BRAX_ROSTER?.bind(index=>selectSlot(index,true));game.classList.add('menu-open');menuAudio.start();setPose('IDLE');fitViewport();requestAnimationFrame(loop);if(window.BRAX_BOOT){const boot=window.BRAX_BOOT;boot.dispose();if(boot.multiplayer){window.BRAX_ENGINE_READY=true;return;}selectedSlot=boot.slot;S.difficulty=boot.difficulty||'normal';S.trainingBehavior=boot.behavior||'move';selectGameMode(boot.mode||'fight');activeChallenge=boot.challenge||null;if(boot.drillAttack)$('#trainingAttack').value=boot.drillAttack;selectSlot(selectedSlot,true);showArenaSelection()}window.BRAX_ENGINE_READY=true;})();
