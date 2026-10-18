import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';import assert from 'node:assert/strict';import {handleArena} from '../backend/lib/arena-api.ts';import {handleDuel} from '../backend/lib/duel-api.ts';
const sqlite=new DatabaseSync(':memory:');for(const f of fs.readdirSync('backend/drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync('backend/drizzle/'+f,'utf8'));
const db={prepare(q){const make=(args=[])=>({async first(){return sqlite.prepare(q).get(...args)||null},async all(){return{results:sqlite.prepare(q).all(...args)}},async run(){const s=sqlite.prepare(q);return /^SELECT/i.test(q)?{results:s.all(...args)}:{results:[],meta:{changes:Number(s.run(...args).changes)}}}});return{...make(),bind(...args){return make(args)}}},async batch(writes){sqlite.exec('BEGIN');try{const r=[];for(const w of writes)r.push(await w.run());sqlite.exec('COMMIT');return r}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const call=async b=>{const r=await handleDuel(new Request('https://game.test/api/duel',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}),db);return{status:r.status,body:await r.json()};};


const cookie='12345678-1234-1234-1234-123456789012',owner='g:'+cookie;
const arena=async (action,b)=>{const r=await handleArena(new Request('https://game.test/api/arena?action='+action,{method:'POST',headers:{cookie:'brax_player='+cookie},body:JSON.stringify(b)}),db);return{status:r.status,body:await r.json()}};
sqlite.prepare('INSERT INTO players(id,name,created) VALUES(?,?,?)').run(owner,'Tester',Date.now());
sqlite.prepare('INSERT INTO runs(id,owner,client,mode,difficulty,fighter,started,updated) VALUES(?,?,?,?,?,?,?,?)').run('run-race',owner,'same-run','survival','normal','BRAX',Date.now(),Date.now());
const prepare=db.prepare.bind(db);let waiting=[],reads=0;
db.prepare=(q)=>{const statement=prepare(q);if(q.startsWith('SELECT id FROM matches WHERE run_id=')){
const bind=statement.bind;statement.bind=(...args)=>{const bound=bind(...args),first=bound.first;bound.first=async()=>{const observed=await first();return new Promise(resolve=>{waiting.push(()=>resolve(observed));if(++reads===2)waiting.forEach(f=>f())})};return bound};}
return statement};
const starts=await Promise.all([arena('start',{mode:'survival',difficulty:'normal',fighter:'BRAX',runId:'same-run'}),arena('start',{mode:'survival',difficulty:'normal',fighter:'BRAX',runId:'same-run'})]);assert(starts.every(x=>x.status===200));assert.equal(starts[0].body.match,starts[1].body.match);
console.log('unfinished matches',sqlite.prepare('SELECT id,run_id,finished FROM matches').all());
db.prepare=prepare;
sqlite.prepare('DELETE FROM matches').run();
sqlite.prepare("UPDATE runs SET mode='fight' WHERE id='run-race'").run();
sqlite.prepare('INSERT INTO matches(id,run_id,started) VALUES(?,?,?)').run('one-match','run-race',Date.now()-20000);
waiting=[];reads=0;
db.prepare=(q)=>{const statement=prepare(q);if(q.startsWith('SELECT matches.*,runs.owner')){const bind=statement.bind;statement.bind=(...args)=>{const bound=bind(...args),first=bound.first;bound.first=async()=>{const observed=await first();return new Promise(resolve=>{waiting.push(()=>resolve(observed));if(++reads===2)waiting.forEach(f=>f())})};return bound};}return statement};
const batch=db.batch.bind(db);let queue=Promise.resolve();db.batch=ws=>{const result=queue.then(()=>batch(ws));queue=result.catch(()=>{});return result};
const finishes=await Promise.all([arena('finish',{match:'one-match',rounds:[2,0],roundsPlayed:2,elapsed:10000,hp:90,specials:0}),arena('finish',{match:'one-match',rounds:[0,2],roundsPlayed:2,elapsed:10000,hp:0,specials:0})]);assert(finishes.every(x=>x.status===200));assert.equal(finishes.filter(x=>x.body.duplicate).length,1);
console.log('match authoritative',sqlite.prepare('SELECT finished,wins,losses FROM matches').all());
console.log('run overwritten',sqlite.prepare('SELECT score,matches,closed FROM runs').all());
console.log('leaderboard',sqlite.prepare('SELECT score,completed FROM results').all());

assert.equal(sqlite.prepare('SELECT score FROM runs').get().score,1);assert.equal(sqlite.prepare('SELECT matches FROM runs').get().matches,1);assert.equal(sqlite.prepare('SELECT score FROM results').get().score,2);db.prepare=prepare;
const setup={mode:'arcade',difficulty:'normal',fighter:'BRAX',runId:'arcade-seven'};
for(let n=1;n<=7;n++){const start=await arena('start',setup);assert.equal(start.status,200);assert.equal(start.body.targetWins,7);sqlite.prepare('UPDATE matches SET started=? WHERE id=?').run(Date.now()-30000,start.body.match);const end=await arena('finish',{match:start.body.match,rounds:[2,0],roundsPlayed:2,elapsed:20000,hp:80,specials:0});assert.equal(end.status,200);assert.equal(end.body.score,n);assert.equal(sqlite.prepare("SELECT closed FROM runs WHERE client='arcade-seven'").get().closed,Number(n===7));}
assert.equal((await arena('start',setup)).status,409);
console.log('PASS atomic starts, conflicting finishes, seven Arcade wins, closed series rejects eighth match');

const freshSetup={mode:'survival',difficulty:'hard',fighter:'BEAR',runId:'concurrent-new-run'};const fresh=await Promise.all([arena('start',freshSetup),arena('start',freshSetup)]);assert(fresh.every(r=>r.status===200));assert.equal(fresh[0].body.match,fresh[1].body.match);assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM runs WHERE client='concurrent-new-run'").get().n,1);console.log('PASS concurrent creation creates exactly one run and one match');
