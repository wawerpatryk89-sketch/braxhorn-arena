import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {packageFighters} from './package-fighter-assets.mjs';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'brax-fighters-'));
try{
 fs.mkdirSync(tmp+'/build/assets',{recursive:true});fs.copyFileSync('game/assets/fighter-source.js',tmp+'/build/assets/fighter-source.js');
 const rows=packageFighters(tmp+'/build',tmp+'/package');assert.equal(rows.length,48);
 for(const row of rows){const bytes=fs.readFileSync(tmp+'/package/'+row.file);assert.deepEqual(bytes,fs.readFileSync(row.source));assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);assert(!fs.existsSync(tmp+'/build/assets/'+row.who.toLowerCase()+'-new/'+row.name));}
 for(const root of ['build/assets','backend/public/assets','dist/client/assets'])if(fs.existsSync(root))for(const row of rows)assert(!fs.existsSync(path.join(root,path.relative('game/assets',row.source))),'external payload retained in '+root);
 const original=fs.readFileSync('game/assets/fighter-source.js','utf8'),built=fs.readFileSync(tmp+'/build/assets/fighter-source.js','utf8');
 assert.equal(built.slice(built.indexOf('\n')+1).replace('const url=n=>FIGHTER_PACKAGE[who][n];',"const url=n=>base+n+'?v=internet-duel-125';"),original,'only payload URL resolver changes; animation and lazy pair unchanged');
 console.log('PASS fighter package: 48 byte-identical payloads, SHA-256 names, no payload in main build, original loader except URLs');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
