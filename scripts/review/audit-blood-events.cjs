const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const env={window:{}};vm.runInNewContext(fs.readFileSync('game/assets/blood-effects.js','utf8'),env);let time=0;
const ctx=new Proxy({},{get:()=>()=>{}}),canvas=()=>({width:844,height:390,getContext:()=>ctx}),actor={width:100,config:{w:100},x:.5,face:1,pivot:0,floor:330,anchor:200,head:{x:0,y:0,r:12},capsules:[{region:'body',a:[0,40],b:[0,100],radius:12}]};
const create=()=>env.window.BRAX_BLOOD.create({canvas:canvas(),floorCanvas:canvas(),view:()=>({width:844,height:390}),now:()=>time,random:()=>.314159,reduced:()=>false});
const host=create(),guest=create(),same=()=>{assert.equal(JSON.stringify(host.snapshot()),JSON.stringify(guest.snapshot()));assert.equal(JSON.stringify(host.floorSnapshot()),JSON.stringify(guest.floorSnapshot()));assert.equal(host.level(0),guest.level(0));assert.equal(JSON.stringify(host.injuries(0)),JSON.stringify(guest.injuries(0)));};
host.draw([actor,actor]);guest.draw([actor,actor]);
for(const region of ['head','head','body','body']){host.hit(0,12,region,{x:422,y:130},1);guest.restoreEvents(host.networkEvents());guest.restoreEvents(host.networkEvents());same();}
for(let i=0;i<150;i++){time+=20;host.draw([actor,actor]);guest.draw([actor,actor]);same();}
host.hit(0,12,'head',{x:422,y:130},1);guest.restoreNetwork(JSON.parse(JSON.stringify(host.networkSnapshot())));same();
host.hit(0,12,'head',{x:422,y:130},1);guest.restoreEvents(host.networkEvents());same();
console.log('PASS seeded blood particles, floor stains, wounds, duplicate suppression, keyframe repair and next event');
