import fs from 'node:fs';
import path from 'node:path';
export function pruneUnusedClient(){
 let html=fs.readFileSync('backend/game.html','utf8');
 for(const match of html.matchAll(/\/assets\/menu\.[a-f0-9]{12}\.js/g)){html+=fs.readFileSync('backend/public'+match[0],'utf8');}
 for(const root of ['backend/public/assets','backend/dist/client/assets','dist/client/assets']){
  if(!fs.existsSync(root))continue;
  const visit=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   const file=path.join(dir,entry.name);
   if(entry.isDirectory())visit(file);
   else if(/\.[a-f0-9]{12}\.(?:js|css)$/.test(entry.name)&&!html.includes('/assets/'+path.relative(root,file)))fs.rmSync(file);
  }};visit(root);
 }
 // Layered build workspaces can retain obsolete route chunks. Remove only files
 // absent from the current manifest and unreferenced by every other output file.
 for(const root of ['backend/dist/server','dist/server']){
  const manifest=path.join(root,'.vite/manifest.json');if(!fs.existsSync(manifest))continue;
  const keep=new Set(Object.values(JSON.parse(fs.readFileSync(manifest,'utf8'))).map(x=>x.file));
  const texts=[];const scan=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())scan(f);else if(/\.(?:js|json)$/.test(e.name))texts.push([f,fs.readFileSync(f,'utf8')]);}};scan(root);
  const dir=path.join(root,'_next/static');if(!fs.existsSync(dir))continue;
  for(const name of fs.readdirSync(dir)){const file=path.join(dir,name);if(!name.endsWith('.js')||keep.has('_next/static/'+name))continue;if(!texts.some(([f,t])=>f!==file&&t.includes(name)))fs.rmSync(file);}
 }
}
pruneUnusedClient();
