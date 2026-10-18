// Temporary migration deployment: new media APIs with the previous, self-contained
// client. Upload and verify immutable packs before publishing the new client.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const root=process.cwd(),dir=path.join(root,'.sites-runtime/media-bridge-source'),base='220e7e2298099e798ac7ebc0867fe537bc6a44fc';
fs.mkdirSync(dir,{recursive:true});const archive=execFileSync('git',['archive',base,'game','scripts','package.json'],{maxBuffer:700*1024*1024});execFileSync('tar',['-x','-C',dir],{input:archive});
fs.mkdirSync(path.join(dir,'docs/acceptance'),{recursive:true});if(!fs.existsSync(path.join(dir,'node_modules')))fs.symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir');
execFileSync(process.execPath,['--loader','./scripts/krov-three-loader.mjs','scripts/build-runtime.mjs'],{cwd:dir,stdio:'inherit'});execFileSync('python3',['scripts/finalize-runtime.py'],{cwd:dir,stdio:'inherit'});
fs.rmSync('backend/public',{recursive:true,force:true});fs.mkdirSync('backend/public');fs.mkdirSync('backend/public/assets',{recursive:true});execFileSync('python3',['-c','import shutil,sys;shutil.copytree(sys.argv[1],sys.argv[2],dirs_exist_ok=True)',path.join(dir,'build/assets'),'backend/public/assets']);fs.copyFileSync(path.join(dir,'build/index.html'),'backend/game.html');
execFileSync(process.execPath,['scripts/run-framework.mjs','build'],{cwd:'backend',stdio:'inherit'});fs.rmSync('dist',{recursive:true,force:true});fs.cpSync('backend/dist','dist',{recursive:true});fs.cpSync('backend/drizzle','drizzle',{recursive:true});await import('./prune-unused-client.mjs');await import('./prune-transfer-temporaries.mjs');
