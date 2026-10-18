/* Cosmetic overlay: original fighters and combat damage remain unchanged. */
(()=>{'use strict';
const MAX_PARTICLES=96,MAX_WOUNDS=6,MAX_STAINS=100;
function injuries(ctx,f,sx,sy,width){
 const scale=f.width/f.config.w;
 for(const m of f.injuries||[]){
  if(m.region==='head')continue;
  const cap=f.capsules?.[m.cap];if(!cap||cap.region!==m.region)continue;
  const px=cap.a[0]+(cap.b[0]-cap.a[0])*m.u,py=cap.a[1]+(cap.b[1]-cap.a[1])*m.u;
  const x=f.x*width+f.face*(px*scale-f.pivot)*sx,y=(f.floor-f.anchor+py*scale)*sy,r=Math.max(2,cap.radius*scale*Math.min(sx,sy)*.52);
  ctx.save();ctx.globalAlpha=.30+.07*(m.severity||1);ctx.fillStyle='#403346';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.22;ctx.fillStyle='#94363f';ctx.beginPath();ctx.arc(x+r*.18,y,r*.67,0,Math.PI*2);ctx.fill();
  ctx.restore();
 }
}
function wound(ctx,f,sx,sy,width){
 injuries(ctx,f,sx,sy,width);
 if(!f.wound||!f.head||f.occludedHead)return;
 const h=f.head,scale=f.width/f.config.w,x=f.x*width+f.face*(h.x*scale-f.pivot)*sx,y=(f.floor-f.anchor+h.y*scale)*sy,r=Math.max(1,h.r*scale*Math.min(sx,sy)),level=Math.min(MAX_WOUNDS,f.wound);
 ctx.save();ctx.lineCap='round';
 // Fixed local positions follow the authored head capsule, including closeups.
 const marks=[[-.28,.18,.34],[.24,-.12,.28],[-.12,.48,.26],[.38,.32,.24],[-.35,-.22,.22],[.12,.64,.20]];
 for(let i=0;i<level;i++){
  const [dx,dy,size]=marks[i],px=x+f.face*dx*r,py=y+dy*r;
  ctx.globalAlpha=.28+level*.045;ctx.fillStyle=i%2?'#572533':'#501b2c';ctx.beginPath();ctx.arc(px,py,r*size,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.85;ctx.strokeStyle='#6b0c17';ctx.lineWidth=Math.max(1.3,r*.18);ctx.beginPath();ctx.moveTo(px-r*.18,py-r*.07);ctx.lineTo(px+r*.2,py+r*.06);ctx.stroke();
  ctx.globalAlpha=.65;ctx.strokeStyle='#c53a3c';ctx.lineWidth=Math.max(.65,r*.07);ctx.beginPath();ctx.moveTo(px-r*.12,py-r*.08);ctx.lineTo(px+r*.13,py);ctx.stroke();
  if(i>1){ctx.globalAlpha=.7;ctx.strokeStyle='#981b26';ctx.lineWidth=Math.max(.8,r*.1);ctx.beginPath();ctx.moveTo(px,py+r*.04);ctx.lineTo(px+f.face*r*.03,py+r*(.2+i*.025));ctx.stroke();}
 }
 ctx.restore();
}
function create({canvas,floorCanvas,view,now=()=>performance.now(),random=Math.random,reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}){
 let stains=[],particles=[],marks=[0,0],damageMarks=[[],[]],headHits=[0,0],regionHits=[{},{}],lastActors=[],last=now(),events=[],eventId=0,seenEvent=0;
 function clear(keepMarks=false){particles=[];events=[];if(!keepMarks){stains=[];marks=[0,0];damageMarks=[[],[]];headHits=[0,0];regionHits=[{},{}];}last=now();canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);if(floorCanvas){const v=view(),c=floorCanvas.getContext('2d');c.clearRect(0,0,floorCanvas.width,floorCanvas.height);paintFloor(c,stains,v.width,v.height);}}
 function hit(role,damage,region,point,direction,event){
  if(!event){const v=view();event={id:++eventId,at:now(),role,damage,region,point:point?{x:point.x/v.width,y:point.y/v.height}:null,direction,seed:Math.floor(random()*4294967296)>>>0,floor:(lastActors[role]?.floor??v.height*.82)/v.height};events.push(event);events=events.slice(-8);}
  let rng=event.seed;const roll=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
  if(!Number.isFinite(damage)||damage<4)return;
  if(region==='head'){headHits[role]++;marks[role]=Math.min(MAX_WOUNDS,Math.floor(headHits[role]/2));}
  const actor=lastActors[role];
  if(point&&actor&&region!=='head'){
   const scale=actor.width/actor.config.w,v=view(),x=((point.x-actor.x*v.width)*actor.face+actor.pivot)/scale,y=(point.y-actor.floor+actor.anchor)/scale;
   let nearest=event.injury?{cap:event.injury[0],u:event.injury[1],region,distance:0}:null;for(const [i,c] of (actor.capsules||[]).entries()){if(event.injury||c.region!==region)continue;const dx=c.b[0]-c.a[0],dy=c.b[1]-c.a[1],u=Math.max(.15,Math.min(.85,((x-c.a[0])*dx+(y-c.a[1])*dy)/(dx*dx+dy*dy||1))),distance=(x-c.a[0]-u*dx)**2+(y-c.a[1]-u*dy)**2;if(!nearest||distance<nearest.distance)nearest={cap:i,u,region,distance};}
   if(nearest){const n=regionHits[role][nearest.cap]=event.injury?.[2]??(regionHits[role][nearest.cap]||0)+1;event.injury=[nearest.cap,nearest.u,n];if(n>=2){const old=damageMarks[role].find(m=>m.cap===nearest.cap);if(old)old.severity=Math.min(3,Math.floor(n/2));else damageMarks[role]=[...damageMarks[role],{cap:nearest.cap,u:nearest.u,region,severity:1}].slice(-6);}}
  }
  if(!point||region!=='head')return;
  const floor=event.floor*view().height;
  if(reduced()){stains.push({x:point.x/view().width,y:floor/view().height,r:(4+damage*.2)/390});stains=stains.slice(-MAX_STAINS);return;}
  const size=Math.max(.8,Math.min(1.8,view().height/390)),power=Math.min(1.5,damage/12),count=Math.min(14,4+Math.ceil(damage/2));
  for(let i=0;i<count;i++){
   const life=1800+roll()*400;
   particles.push({x:point.x,y:point.y,px:point.x,py:point.y,vx:direction*(40+roll()*65)*size*(.7+power*.3),vy:(-65+roll()*70)*size,life,total:life,floor,r:(1.1+roll()*1.5)*size,color:i%4?'#a91d27':'#d54845',gravity:700*size,stainScale:2+roll()*2});
  }
  particles=particles.slice(-MAX_PARTICLES);
 }
 function draw(actors){
  const v=view();if(canvas.width!==Math.round(v.width)||canvas.height!==Math.round(v.height)){canvas.width=Math.max(1,Math.round(v.width));canvas.height=Math.max(1,Math.round(v.height));}
  const ctx=canvas.getContext('2d'),t=now(),dt=Math.max(0,Math.min(50,t-last));last=t;ctx.clearRect(0,0,canvas.width,canvas.height);
  lastActors=actors;
  if(floorCanvas){if(floorCanvas.width!==canvas.width||floorCanvas.height!==canvas.height){floorCanvas.width=canvas.width;floorCanvas.height=canvas.height;}const fc=floorCanvas.getContext('2d');fc.clearRect(0,0,v.width,v.height);paintFloor(fc,stains,v.width,v.height);}
  for(let i=0;i<actors.length;i++)wound(ctx,{...actors[i],wound:marks[i],injuries:damageMarks[i]},1,1,v.width);
  for(const p of particles){p.life-=dt;p.px=p.x;p.py=p.y;p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vy+=p.gravity*dt/1000;if(p.life>0&&p.y>=p.floor){stains.push({x:Math.max(0,Math.min(1,p.x/v.width)),y:p.floor/v.height,r:p.r*(p.stainScale??3)/v.height});p.life=0;}}
  stains=stains.slice(-MAX_STAINS);
  paintParticles(ctx,particles);
  ctx.globalAlpha=1;particles=particles.filter(p=>p.life>0);
 }
 function networkEvents(){return events.filter(e=>now()-e.at<250).map(e=>[e.id,e.role,e.damage,e.region==='head'?0:e.region==='body'?1:2,e.point?.x??null,e.point?.y??null,e.direction,e.seed,e.floor,e.injury||null]);}
 function restoreEvents(data){for(const a of data){if(a[0]<=seenEvent)continue;seenEvent=a[0];const v=view(),event={id:a[0],role:a[1],damage:a[2],region:['head','body','leg'][a[3]],point:a[4]===null?null:{x:a[4],y:a[5]},direction:a[6],seed:a[7],floor:a[8],injury:a[9]};hit(event.role,event.damage,event.region,event.point?{x:event.point.x*v.width,y:event.point.y*v.height}:null,event.direction,event);}}
 return{hit,draw,clear,networkEvents,restoreEvents,networkSnapshot:()=>({size:view(),stains,particles,marks,damageMarks,eventId,headHits,regionHits}),restoreNetwork:data=>{seenEvent=data.eventId??seenEvent;headHits=data.headHits||headHits;regionHits=data.regionHits||regionHits;stains=(data.stains||[]).slice(-100);const v=view(),sx=v.width/(data.size?.width||v.width),sy=v.height/(data.size?.height||v.height);particles=(data.particles||[]).slice(-96).map(p=>({...p,x:p.x*sx,px:p.px*sx,vx:p.vx*sx,y:p.y*sy,py:p.py*sy,vy:p.vy*sy,floor:p.floor*sy,gravity:p.gravity*sy,r:p.r*sy}));marks=(data.marks||[0,0]).map(n=>Math.max(0,Math.min(6,n)));damageMarks=(data.damageMarks||[[],[]]).map(a=>a.slice(-6));},floorSnapshot:()=>stains.map(p=>({...p})),snapshot:()=>particles.map(p=>({...p})),injuries:i=>damageMarks[i].map(m=>({...m})),level:i=>marks[i],get count(){return particles.length;}};
}
function paintParticles(ctx,particles,sx=1,sy=1){for(const p of particles||[]){
 ctx.globalAlpha=Math.max(0,Math.min(.95,p.life/180));ctx.strokeStyle='#630b18';ctx.lineWidth=p.r*1.5*Math.min(sx,sy);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.px*sx,p.py*sy);ctx.lineTo(p.x*sx,p.y*sy);ctx.stroke();ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x*sx,p.y*sy,p.r*Math.min(sx,sy),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
function paintFloor(ctx,stains,width,height){for(const s of stains||[]){const x=s.x*width,y=s.y*height,r=Math.max(2,s.r*height);ctx.save();ctx.globalAlpha=.86;ctx.fillStyle='#650d19';ctx.beginPath();ctx.ellipse(x,y,r,r*.28,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b12230';ctx.globalAlpha=.72;ctx.beginPath();ctx.ellipse(x-r*.12,y-r*.04,r*.68,r*.16,-.1,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.8;ctx.fillStyle='#8f1422';for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x+(i-1)*r*.9,y+(i%2?.35:-.28)*r,r*.17,r*.09,0,0,Math.PI*2);ctx.fill();}ctx.restore();}}
window.BRAX_BLOOD={create,wound,paintParticles,paintFloor};
})();
