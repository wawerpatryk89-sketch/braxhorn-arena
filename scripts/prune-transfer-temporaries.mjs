import fs from 'node:fs';
import path from 'node:path';
// Transfer remnants are not game assets. Keep original source files intact.
for (const root of ['build/assets','backend/public/assets','backend/dist/client/assets','dist/client/assets']) {
 if (!fs.existsSync(root)) continue;
 function visit(dir) { for (const item of fs.readdirSync(dir,{withFileTypes:true})) {
  const file=path.join(dir,item.name);
  if(item.isDirectory()) visit(file);
  else if (/^\..+\.[A-Za-z0-9]{6}(?:\.[A-Za-z0-9]{6})*$/.test(item.name)) fs.rmSync(file);
 }}
 visit(root);
}

// The supplied original JPEG has exactly the same decoded RGB pixels as the
// lossless WebP and is smaller. Both originals remain in game/assets.
for (const root of ['backend/public/assets','backend/dist/client/assets','dist/client/assets']) {
 if (!fs.existsSync(root)) continue;
 fs.rmSync(path.join(root,'arena-nocny-targ.webp'),{force:true});
 const html=fs.readFileSync('backend/game.html','utf8');
 for(const name of ['menu.js','multiplayer.js','peer-link.js','voice-chat.js','screen-layout.js','menu-premium.css','voice-chat.css','tournaments.js','tournaments.css','code-pad.js','code-pad.css','combat.js']) {
  const hashed=fs.readdirSync(root).find(n=>n.startsWith(name.replace(/\.(js|css)$/,'.'))&&/\.[a-f0-9]{12}\.(js|css)$/.test(n));
  if(hashed && !html.includes('/assets/'+name)) fs.rmSync(path.join(root,name),{force:true});
 }
}
// Worker CSS is served from client/. Its server copy is not a JS module.
for (const base of ['backend/dist','dist']) {
 const dir=path.join(base,'server/_next/static/css');
 if(fs.existsSync(dir)) for(const name of fs.readdirSync(dir)) {
  const duplicate=path.join(base,'client/_next/static/css',name), file=path.join(dir,name);
  if(fs.existsSync(duplicate)&&fs.readFileSync(file).equals(fs.readFileSync(duplicate))) fs.rmSync(file);
 }
}
// Builds restored across workspaces can retain chunks from previous builds.
// The current Vite manifest and Worker entry identify the current chunk set.
for (const base of ['backend/dist','dist']) {
 const server=path.join(base,'server'),manifest=path.join(server,'.vite/manifest.json');
 if(!fs.existsSync(manifest)) continue;
 const keep=new Set(Object.values(JSON.parse(fs.readFileSync(manifest,'utf8'))).map(x=>x.file));
 const entries=['index.js','ssr/index.js'].filter(x=>fs.existsSync(path.join(server,x))).map(x=>fs.readFileSync(path.join(server,x),'utf8')).join('\n');
 const dir=path.join(server,'_next/static');
 for(const name of fs.readdirSync(dir)) if(name.endsWith('.js')&&!keep.has('_next/static/'+name)&&!entries.includes(name)) fs.rmSync(path.join(dir,name));
}
// Drizzle snapshots describe schema generation; production applies SQL migrations
// using _journal.json. Keep all SQL and the journal, omit generation-only copies.
for(const root of ['drizzle/meta','dist/.openai/drizzle/meta','backend/dist/.openai/drizzle/meta']) {
 if(fs.existsSync(root)) for(const name of fs.readdirSync(root)) if(/^\d+_snapshot\.json$/.test(name)) fs.rmSync(path.join(root,name));
}
// Current fighters use fighter-source.js JSON loading, never GLTFLoader.
// Preserve vendor originals in source; omit unused loader and its sole helper.
for(const root of ['backend/public/assets','backend/dist/client/assets','dist/client/assets']) for(const name of ['vendor/GLTFLoader.js','vendor/BufferGeometryUtils.js']) fs.rmSync(path.join(root,name),{force:true});

// Replaced arena originals remain in game/assets for recovery, not deployment.
for(const root of ['backend/public/assets','backend/dist/client/assets','dist/client/assets']) for(const name of ['rooftop.gif','jungle.gif','volcano.gif','arena-beach.mp4','arena-beach.jpeg','audio/arena-rooftop.mp3','audio/arena-jungle.mp3','audio/arena-volcano.mp3']) fs.rmSync(path.join(root,name),{force:true});
