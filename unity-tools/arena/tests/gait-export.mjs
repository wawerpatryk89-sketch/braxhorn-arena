import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {exportGaitLayers} from '../export-gait-layers.mjs';
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'arena-gait-'));
try{
 const tracks=[];
 for(const side of ['Left','Right'])for(const part of ['UpLeg','Leg','Foot','ToeBase'])tracks.push({name:'mixamorig'+side+part+'.quaternion',type:'quaternion',times:[0,1],values:[0,0,0,1,.5,.5,.5,.5]});
 const clips={Walk:{duration:1,tracks}},config={WALK_FORWARD:{clip:'Walk',durations:[500,500],start:.1}};
 const result=exportGaitLayers(clips,config,folder),data=JSON.parse(fs.readFileSync(path.join(folder,result.file)));
 assert.equal(result.count,1);assert.equal(data.layers[0].duration,1);assert.equal(data.layers[0].start,.1);
 for(const track of data.layers[0].tracks){assert.deepEqual(track.times,[0,1]);assert.deepEqual(track.values,[0,0,0,1,-.5,-.5,.5,.5]);}
 assert.deepEqual(clips.Walk.tracks[0].values,[0,0,0,1,.5,.5,.5,.5],'source samples must remain untouched');
 assert.throws(()=>exportGaitLayers({Walk:{duration:1,tracks:tracks.slice(1)}},config,folder),/Missing raw gait bone/);
 const malformed=structuredClone(clips);malformed.Walk.tracks[0].times=[0,0];assert.throws(()=>exportGaitLayers(malformed,config,folder),/Invalid raw gait/);
 console.log('PASS raw gait export: all eight leg channels, handedness, duration/start preservation, immutable input and malformed-track rejection.');
}finally{fs.rmSync(folder,{recursive:true,force:true});}
