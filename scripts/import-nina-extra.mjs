import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';import {FBXLoader} from './source-import/FBXLoaderEight.mjs';
globalThis.window={URL:{createObjectURL:()=>''}};globalThis.document={createElementNS:()=>({addEventListener(){},removeEventListener(){},set src(v){}})};
const root='source-assets/nina-extra-20261013/',dst='source-assets/nina/clips-all.json.gz',raw=JSON.parse(zlib.gunzipSync(fs.readFileSync(dst))),audit=[];
for(const file of fs.readdirSync(root).filter(n=>n.endsWith('.fbx'))){const b=fs.readFileSync(root+file),m=new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');const c=m.animations[0];if(!c)throw Error('Missing animation');c.name='Nina Extra '+file.slice(0,-4);raw[c.name]=T.AnimationClip.toJSON(c);audit.push({name:c.name,duration:c.duration,tracks:c.tracks.length});}
fs.writeFileSync(dst,zlib.gzipSync(JSON.stringify(raw),{level:9}));console.log(JSON.stringify(audit,null,2));
