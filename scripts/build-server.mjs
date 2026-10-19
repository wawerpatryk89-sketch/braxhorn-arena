import fs from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const run=(args,cwd='.')=>execFileSync(process.execPath,args,{cwd,stdio:'inherit'});
run(['--loader','./scripts/krov-three-loader.mjs','scripts/build-runtime.mjs']);execFileSync('python3',['scripts/finalize-runtime.py'],{stdio:'inherit'});
fs.rmSync('backend/public',{recursive:true,force:true});fs.mkdirSync('backend/public');fs.cpSync('build/assets','backend/public/assets',{recursive:true});fs.copyFileSync('build/index.html','backend/game.html');
// Content-addressed URLs prevent mixed client versions after a deployment.
let html=fs.readFileSync('backend/game.html','utf8');
const combat=fs.readFileSync('backend/public/assets/combat.js'),combatName='combat.'+createHash('sha256').update(combat).digest('hex').slice(0,12)+'.js';
fs.writeFileSync('backend/public/assets/'+combatName,combat);
const menuPath='backend/public/assets/menu.js';fs.writeFileSync(menuPath,fs.readFileSync(menuPath,'utf8').replaceAll('/assets/combat.js?v=133','/assets/'+combatName));
html=html.replace(/(["'])\/assets\/([^"'?]+\.(?:js|css))(?:\?[^"']*)?\1/g,(match,quote,name)=>{
 if(!['compatibility.js','blood-effects.js','ui-system.js','ui-system.css','roster-carousel.js','roster-carousel.css','menu-carousel.js','fighter-names.js','online.js','victory.js','arena-interface.js','premium-hub.js','roster.js','championship.js','arena-features.js','diagnostics.js','viewport.js','arena-catalog.js','arena-picker.js','arena-picker.css','arena-media.js','arena-media.css','menu.js','multiplayer.js','peer-link.js','rtc.js','voice-chat.js','screen-layout.js','menu-premium.css','voice-chat.css','tournaments.js','tournaments.css','code-pad.js','code-pad.css'].includes(name))return match;
 const source='backend/public/assets/'+name;if(!fs.existsSync(source))return match;
 const bytes=fs.readFileSync(source),hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
 const versioned=name.replace(/\.(js|css)$/,'.'+hash+'.$1');fs.writeFileSync('backend/public/assets/'+versioned,bytes);
 return quote+'/assets/'+versioned+quote;
});
fs.writeFileSync('backend/game.html',html);
run(['scripts/run-framework.mjs','build'],'backend');fs.rmSync('dist',{recursive:true,force:true});fs.cpSync('backend/dist','dist',{recursive:true});
fs.cpSync('backend/drizzle','drizzle',{recursive:true});

await import('./prune-unused-client.mjs');

await import('./prune-transfer-temporaries.mjs');

await import('./prune-packaged-media.mjs');
