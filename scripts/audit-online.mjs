import {minimumMatchTime} from '../backend/lib/ranking-time-policy.ts';
import {spawn,execFile} from 'node:child_process';import {promisify} from 'node:util';import assert from 'node:assert/strict';
const execute=promisify(execFile);
const legalTime=(mode,fighter,level,rounds=mode==='survival'?[1,0]:[2,0])=>Math.ceil(minimumMatchTime(mode,fighter,rounds,mode==='survival'?1:2,level)*1.6);
const survivalElapsed=legalTime('survival','BRAX','normal');
async function localSql(sql){await execute(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--command',sql],{cwd:'backend',timeout:30000});}
const child=spawn(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','dev','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--ip','127.0.0.1','--port','4301','--inspector-port','0'],{cwd:'backend',stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
const origin='http://127.0.0.1:4301',sessions=new Map();let checks=0;
async function call(session,action,body,extra={}){if(action==='finish'&&body?.elapsed>0)await localSql(`UPDATE matches SET started=started-240000 WHERE id='${body.match.replace(/[^a-f0-9-]/g,'')}' AND finished=0`);const headers={...(sessions.has(session)?{cookie:sessions.get(session)}:{}),...extra};if(body)headers['Content-Type']='application/json';const r=await fetch(origin+'/api/arena?action='+action,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined});const cookie=r.headers.get('set-cookie');if(cookie)sessions.set(session,cookie.split(';')[0]);return{status:r.status,body:await r.json()};}
try{
 for(let i=0;i<100;i++){try{await call('a','me');break;}catch{await new Promise(r=>setTimeout(r,200));}if(i===99)throw Error(output);}
 assert.equal((await call('a','name',{name:'AUDYT ONLINE A'})).status,200);checks++;
 const setup={mode:'survival',difficulty:'normal',fighter:'BRAX',challenge:'survival3',runId:'audit-'+crypto.randomUUID()};let last;
 for(let n=0;n<3;n++){const start=await call('a','start',setup);assert.equal(start.status,200,JSON.stringify(start));last=start.body.match;const finish={match:last,rounds:[1,0],elapsed:survivalElapsed,hp:80,specials:0};const saved=await call('a','finish',finish);assert.equal(saved.body.score,n+1,JSON.stringify(saved));const duplicate=await call('a','finish',finish);assert(duplicate.body.duplicate);checks+=2;}
 const done=await call('a','challenge',{match:last,challenge:'survival3',elapsed:survivalElapsed,count:3});assert.equal(done.status,200,JSON.stringify(done));checks++;
 const boardA=await call('a','board&mode=survival&difficulty=normal'),boardB=await call('b','board&mode=survival&difficulty=normal');assert(boardB.body.rows.some(r=>r.name==='AUDYT ONLINE A'&&r.score===3));assert(boardA.body.own);assert(!boardB.body.own);checks++;
 assert.equal((await call('b','finish',{match:last,rounds:[1,0],elapsed:survivalElapsed,hp:80,specials:0})).status,404);checks++;
 assert.equal((await call('a','start',{...setup,runId:'invalid',fighter:'HACK'})).status,400);checks++;
 assert.equal((await call('a','name',{name:'BAD'},{origin:'https://evil.invalid'})).status,403);checks++;
 const bad=await call('a','start',{mode:'fight',difficulty:'normal',fighter:'BRAX',runId:crypto.randomUUID()});assert.equal((await call('a','finish',{match:bad.body.match,rounds:[2,0],elapsed:-1,hp:80,specials:0})).status,400);checks++;
 const trusted={'oai-authenticated-user-id':'local-audit-account'};await call('a','me',null,trusted);const cross=await call('c','me',null,trusted);assert(cross.body.authenticated);assert(cross.body.fighters.BRAX.bestSurvival>=3);assert(cross.body.fighters.BRAX.challenges.includes('survival3'));checks++;

 for(const targetWins of [2,3]){const runId='tournament-'+crypto.randomUUID();for(let n=0;n<targetWins;n++){const started=await call('t'+targetWins,'start',{mode:'tournament',difficulty:'hard',fighter:'KROV',targetWins,runId});assert.equal(started.status,200);const duplicateStart=await call('t'+targetWins,'start',{mode:'tournament',difficulty:'hard',fighter:'KROV',targetWins,runId});assert.equal(duplicateStart.body.match,started.body.match);const saved=await call('t'+targetWins,'finish',{match:started.body.match,rounds:[2,0],roundsPlayed:2,elapsed:legalTime('tournament','KROV','hard'),hp:70,specials:0});assert.equal(saved.status,200);}const board=await call('t'+targetWins,'board&mode=tournament&difficulty=hard');assert.equal(board.body.own.completed,1);checks++;}
 const tiedRounds=await call('d','start',{mode:'fight',difficulty:'normal',fighter:'NYXA',runId:crypto.randomUUID()});assert.equal((await call('d','finish',{match:tiedRounds.body.match,rounds:[1,0],roundsPlayed:3,elapsed:135000,hp:70,specials:0})).status,200);checks++;
 const atomic=await call('atomic','start',{mode:'fight',difficulty:'easy',fighter:'VEXA',runId:crypto.randomUUID()});assert.equal(atomic.status,200);
 assert.match(atomic.body.match,/^[a-f0-9-]{36}$/);
 const atomicFinish={match:atomic.body.match,rounds:[2,0],roundsPlayed:2,elapsed:legalTime('fight','VEXA','easy'),hp:70,specials:0};
 // Force the final statement to fail inside real D1, then retry the same match.
 try{
  await localSql(`CREATE TRIGGER audit_result_failure BEFORE INSERT ON results WHEN NEW.id=(SELECT run_id FROM matches WHERE id='${atomic.body.match}') BEGIN SELECT RAISE(ABORT,'audit forced result failure'); END;`);
  assert.equal((await call('atomic','finish',atomicFinish)).status,500);checks++;
 }finally{await localSql('DROP TRIGGER IF EXISTS audit_result_failure;');}
 const retried=await call('atomic','finish',atomicFinish);assert.equal(retried.status,200);assert.equal(retried.body.score,1);assert(!retried.body.duplicate);checks++;
 assert.equal((await call('atomic','board&mode=fight&difficulty=easy')).body.own.score,2);checks++;
 console.log(JSON.stringify({pass:true,checks,evidence:['real Worker and local D1','world board visible in separate session','duplicate result does not inflate score','foreign match rejected','invalid time and fighter rejected','cross-origin write rejected','stable authenticated identity restores records and challenge','failed leaderboard write rolls back match and retry restores result']}));
}catch(e){console.error(e);console.error(output.slice(-3000));process.exitCode=1;}finally{child.kill('SIGTERM');}
