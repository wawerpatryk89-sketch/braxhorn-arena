import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import './build-premium-stats.mjs';
import './build-compatibility.mjs';
const out='build';
fs.rmSync(out,{recursive:true,force:true});fs.cpSync('game',out,{recursive:true,filter:source=>path.basename(source)!=='config.json'&&!path.basename(source).startsWith('.')});
for(const entry of fs.readdirSync('game/assets').filter(n=>n.endsWith('-new'))){
 const dir=out+'/assets/'+entry,p=dir+'/clips.json.gz';if(!fs.existsSync(p))continue;
 const config=fs.readFileSync('game/assets/'+entry+'/config.json');fs.writeFileSync(dir+'/config.json.gz',zlib.gzipSync(config,{level:9}));
}
// Legacy hidden selector preloads now use the retained campaign portraits.
for(const name of ['brax-selection.gif','nyxa-selection.gif','vexa-selection.jpeg','danny-portrait.png'])fs.rmSync(out+'/assets/'+name,{force:true});
const loader=out+'/assets/fighter-source.js';let code=fs.readFileSync(loader,'utf8');
code=code.replace("/config.json?v='+(window.BRAX_COMPAT?.configs||'azrak-146'))", "/config.json.gz?v='+(window.BRAX_COMPAT?.configs||'azrak-146'),true)");
assert(code.includes('/config.json.gz?'),'metadata uses compressed config');fs.writeFileSync(loader,code);
const {packageFighters}=await import('./package-fighter-assets.mjs');packageFighters(out);
execFileSync('python3',['scripts/optimize-runtime-png.py'],{stdio:'inherit'});
const images=JSON.parse(execFileSync('python3',['scripts/pack-interface-images.py'],{encoding:'utf8'}));
// Apply removals in the owning process too: workspace copy layers can retain
// source PNG entries after the child encoder deletes them.
for(const name of Object.keys(images.replacements))fs.rmSync(out+'/assets/'+name,{force:true});
for(const name of ['brax-selection.gif','nyxa-selection.gif','vexa-selection.jpeg','danny-portrait.png','danny-portrait.webp'])fs.rmSync(out+'/assets/'+name,{force:true});
console.log(JSON.stringify({losslessWebpBytesSaved:images.losslessWebpBytesSaved,files:images.files}));
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
console.log(JSON.stringify({output:out,animationSamples:'source bytes unchanged in fighter-package',totalBytes:files(out).reduce((n,p)=>n+fs.statSync(p).size,0)}));
