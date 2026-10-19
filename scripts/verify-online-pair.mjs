// Run the two-client browser story against an isolated, in-memory local database.
import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['--experimental-strip-types','--experimental-sqlite','--import','./scripts/local-server-hooks.mjs','scripts/local-server.mjs','8787'],{stdio:['ignore','pipe','pipe'],env:process.env});
try{
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('Local API startup timed out')),8000);
  server.once('exit',code=>{clearTimeout(timeout);reject(Error('Local API exited: '+code));});
  server.stderr.on('data',data=>process.stderr.write(data));
  server.stdout.on('data',data=>{if(String(data).includes('http://localhost:8787')){clearTimeout(timeout);resolve();}});
 });
 console.log('Local API ready; starting the two-client browser story.');
 await import('./ui-online-pair.mjs');
}finally{server.kill();}
