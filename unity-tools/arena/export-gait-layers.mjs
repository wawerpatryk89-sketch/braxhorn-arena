// Offline only: retain raw original leg quaternion samples, before guard/IK overlays.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {unpackClip} from '../../game/assets/fighter-source-core.js';
export function exportGaitLayers(clips,config,directory){
 const layers=[];
 for(const id of ['RUN','WALK_FORWARD','ADVENTURE_WALK']){
  const c=config[id];if(!c)continue;
  if(!c.clip||!clips[c.clip])throw Error('Missing raw gait '+id);
  const clip=unpackClip(clips[c.clip]);const tracks=[];
  for(const side of ['Left','Right'])for(const part of ['UpLeg','Leg','Foot','ToeBase']){
   const bone='mixamorig'+side+part,track=clip.tracks.find(t=>t.name===bone+'.quaternion');
   if(!track)throw Error('Missing raw gait bone '+id+'/'+bone);
   const times=Array.from(track.times),values=Array.from(track.values);
   if(values.length!==times.length*4||!times.length||[...times,...values].some(v=>!Number.isFinite(v))||times.some((t,i)=>i&&t<=times[i-1]))throw Error('Invalid raw gait samples '+id+'/'+bone);
   // Same Z reflection used by NativeFighterImporter.ImportAnimation.
   for(let i=0;i<values.length;i+=4){values[i]*=-1;values[i+1]*=-1;}
   tracks.push({bone,times,values});
  }
  layers.push({id,duration:c.duration||c.durations.reduce((a,b)=>a+b,0)/1000,start:c.start||0,clipDuration:clip.duration,tracks});
 }
 const bytes=Buffer.from(JSON.stringify({schema:1,layers}));fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'gait-layers.json'),bytes);
 return {file:'gait-layers.json',sha256:createHash('sha256').update(bytes).digest('hex'),count:layers.length};
}
