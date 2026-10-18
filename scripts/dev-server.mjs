import {spawn} from 'node:child_process';
import fs from 'node:fs';
const syncHtml=()=>fs.copyFileSync('game/index.html','backend/game.html');
syncHtml();
fs.watch('game/index.html',syncHtml);
const child=spawn(process.execPath,['scripts/run-framework.mjs','dev',...process.argv.slice(2)],{cwd:'backend',stdio:'inherit',env:process.env});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>child.kill(sig));child.on('exit',code=>process.exit(code??0));
