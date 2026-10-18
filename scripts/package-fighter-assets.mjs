// Separate immutable runtime payloads. Source files remain untouched.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
export function packageFighters(build='build',output='fighter-package'){
 fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
 const manifest=[],urls={};
 for(const dir of fs.readdirSync('game/assets').filter(n=>n.endsWith('-new')).sort()){
  const who=dir.slice(0,-4).toUpperCase();urls[who]={};
  for(const name of ['model.json.gz','clips.json.gz','color.webp','normal.webp','metalness.webp','roughness.webp']){
   const source=path.join('game/assets',dir,name),body=fs.readFileSync(source),sha256=createHash('sha256').update(body).digest('hex');
   const ext=name.endsWith('.gz')?'json.gz':'webp',file=dir+'-'+name.split('.')[0]+'.'+sha256+'.'+ext;
   fs.writeFileSync(path.join(output,file),body);
   assert.equal(createHash('sha256').update(fs.readFileSync(path.join(output,file))).digest('hex'),sha256);
   urls[who][name]='/api/fighter-media/'+file;manifest.push({who,name,file,source,sha256,bytes:body.length});
   fs.rmSync(path.join(build,'assets',dir,name),{force:true});
  }
 }
 const loader=path.join(build,'assets/fighter-source.js');let code=fs.readFileSync(loader,'utf8');
 const before="const url=n=>base+n+'?v=internet-duel-125';";
 assert(code.includes(before),'loader URL resolver located');
 code='const FIGHTER_PACKAGE='+JSON.stringify(urls)+';\n'+code.replace(before,"const url=n=>FIGHTER_PACKAGE[who][n];");fs.writeFileSync(loader,code);
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log(JSON.stringify({fighterPackageFiles:manifest.length,fighterPackageBytes:manifest.reduce((n,r)=>n+r.bytes,0),preservation:'SHA-256 exact source bytes',metadata:'local gzip; selected pair payloads only'}));
 return manifest;
}
if(process.argv[1]?.endsWith('package-fighter-assets.mjs'))packageFighters();
