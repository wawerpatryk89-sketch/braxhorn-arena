// Explicitly remove external payloads from every deployment layer. Restored
// build workspaces can retain files even after replacing a parent directory.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const fighters=JSON.parse(fs.readFileSync('fighter-package/manifest.json','utf8'));
const moved=['arena-snow.mp4','arena-underground.mp4','metro.gif','harbor.gif','audio/arena-metro.mp3','audio/arena-harbor.mp3','audio/arena-nocny-targ.mp3'];
for(const root of ['build/assets','backend/public/assets','backend/dist/client/assets','dist/client/assets']){
 for(const row of fighters){const relative=path.relative('game/assets',row.source),file=path.join(root,relative);fs.rmSync(file,{force:true});assert(!fs.existsSync(file),'external fighter payload retained: '+file);}
 for(const relative of moved){const file=path.join(root,relative);fs.rmSync(file,{force:true});assert(!fs.existsSync(file),'external arena payload retained: '+file);}
}
console.log('PASS deployment layers: fighter and moved arena payloads excluded');
