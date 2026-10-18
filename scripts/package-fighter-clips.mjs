import fs from 'node:fs';import zlib from 'node:zlib';
for(const who of ['brax','nyxa','vexa','krov','bear','nina','danny']){
 const base='game/assets/'+who+'-new/',source='source-assets/'+who+'/clips-all.json.gz';fs.mkdirSync('source-assets/'+who,{recursive:true});if(!fs.existsSync(source))fs.copyFileSync(base+'clips.json.gz',source);
 const all=JSON.parse(zlib.gunzipSync(fs.readFileSync(source))),config=JSON.parse(fs.readFileSync(base+'config.json')),used=new Set();
 for(const c of Object.values(config)){used.add(c.clip);if(c.gaitBlend)used.add(c.gaitBlend.clip);for(const seg of c.sequence||[])used.add(seg.clip);}
 const subset={};for(const name of used){if(!all[name])throw Error('Missing clip '+who+'/'+name);subset[name]=all[name];}
 const zipped=zlib.gzipSync(JSON.stringify(subset),{level:9});fs.writeFileSync(base+'clips.json.gz',zipped);const manifest=JSON.parse(fs.readFileSync(base+'manifest.json'));manifest.clips=[...used];manifest.allSourceClipCount=Object.keys(all).length;fs.writeFileSync(base+'manifest.json',JSON.stringify(manifest));console.log(who,used.size,'of',Object.keys(all).length,'runtime clips; all originals retained in',source,Math.round(zipped.length/1024**2*100)/100+' MiB');
}
