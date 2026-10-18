import compatibility from '../backend/lib/build-compatibility.json' with {type:'json'};
import arenaNames from '../backend/lib/arena-list.json' with {type:'json'};
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s.startsWith('.')&&!/\.[a-z]+$/i.test(s)){const u=new URL(s+'.ts',c.parentURL);if(fs.existsSync(u))return next(u.href,c);}return next(s,c);}});
const {handleTournaments}=await import('../backend/lib/tournament-api.ts');
const {handleDuel}=await import('../backend/lib/duel-api.ts');
const sql=new DatabaseSync(':memory:');
for(const name of fs.readdirSync('backend/drizzle').filter(n=>n.endsWith('.sql')).sort())sql.exec(fs.readFileSync('backend/drizzle/'+name,'utf8'));
const db={prepare(query){return{bind(...args){return statement(query,args);},...statement(query,[])}} ,async batch(statements){sql.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
function statement(query,args){return{async first(){return sql.prepare(query).get(...args)||null;},async all(){return{results:sql.prepare(query).all(...args)};},async run(){if(/^SELECT/i.test(query))return{results:sql.prepare(query).all(...args)};const r=sql.prepare(query).run(...args);return{meta:{changes:Number(r.changes)}};}};}
let clock=Date.now();const actualNow=Date.now;Date.now=()=>clock;
const cookies=new Map(),names=['WAWER','Żaneta','Player 03','Same','Same','Rafał','Łukasz','Nina Test','Dziewiąty','Dziesiąty','Obcy'];
async function request(fn,user,body,url='https://game.test/api/tournaments',headers={}){const req=new Request(url,{method:'POST',headers:{'content-type':'application/json',cookie:cookies.get(user)||'',...(user===0?{'oai-authenticated-user-id':'owner-subject','oai-authenticated-user-email':'owner@test.invalid'}:{}),...headers},body:JSON.stringify({compat:compatibility,...body})});const res=await fn(req,db,'owner@test.invalid');if(res.headers.get('set-cookie'))cookies.set(user,res.headers.get('set-cookie').split(';')[0]);return{status:res.status,body:await res.json()};}
const t=(u,action,b={})=>request(handleTournaments,u,{action,...b});const duel=(u,b)=>request(handleDuel,u,b,'https://game.test/api/duel');
const ok=(r)=>{assert.equal(r.status,200,JSON.stringify(r));return r.body;};
for(let i=0;i<names.length;i++){const id=crypto.randomUUID();cookies.set(i,'brax_player='+id);sql.prepare('INSERT INTO players(id,name,created) VALUES(?,?,?)').run('g:'+id,names[i],clock);}
const host=ok(await duel(0,{action:'create',fighter:'VEXA'}));assert.equal(host.hostName,'WAWER');assert.equal((await duel(0,{action:'join',code:host.code,fighter:'BRAX'})).status,409);
const guest=ok(await duel(1,{action:'join',code:host.code,fighter:'NYXA'}));assert.equal(guest.guestName,'Żaneta');assert.equal(guest.hostName,'WAWER');assert.equal((await duel(2,{...host,token:'foreign',action:'sync'})).status,403);
const records=[];
for(let count=4;count<=10;count++){
 const created=ok(await t(0,'create',{name:'Test '+count,capacity:count,startAt:clock+3600000,intervalMinutes:30,timezone:'Europe/Zurich'})),code=created.tournament.code;
 for(let i=0;i<count;i++)ok(await t(i,'register',{code,fighter:['BRAX','NYXA','VEXA','KROV','NINA','DANNY'][i%6]}));
 assert.equal((await t(10,'register',{code,fighter:'BRAX'})).status,409);
 assert.equal((await t(1,'draw',{code})).status,403);
 let d=ok(await t(0,'draw',{code}));assert.equal(d.entries.length,count);assert.equal(d.fights.filter(f=>f.status!=='bye').length,count-1);assert.equal(new Set(d.fights.filter(f=>f.round===0).flatMap(f=>[f.a,f.b]).filter(Boolean)).size,count);
 assert.equal((await t(0,'draw',{code})).status,409);assert.equal((await t(10,'register',{code,fighter:'BRAX'})).status,409);
 const first=d.fights.find(f=>f.status==='scheduled');assert.equal((await t(10,'enter',{code,fight:first.id})).status,403);assert.equal((await t(0,'schedule',{code,fight:first.id,startAt:clock-1})).status,400);
 const findUser=id=>{const e=sql.prepare('SELECT player_id FROM tournament_entries WHERE id=?').get(id);return [...cookies.entries()].find(([,cookie])=>(cookie===cookies.get(0)?'u:owner-subject':'g:'+cookie.split('=')[1])===e.player_id)[0];};
 assert.equal((await t(findUser(first.a),'enter',{code,fight:first.id})).status,400,'early entry blocked');
 let played=0;
 while(d.tournament.status!=='completed'){
  const f=d.fights.find(f=>f.status==='scheduled');assert(f,'a scheduled fight must exist');clock=Math.max(clock,f.scheduledAt);const a=findUser(f.a),b=findUser(f.b),h=ok(await t(a,'enter',{code,fight:f.id})),g=ok(await t(b,'enter',{code,fight:f.id}));const arenaHost=ok(await duel(a,{...h,action:'sync'})).arena,arenaGuest=ok(await duel(b,{...g,action:'sync'})).arena;assert(arenaNames.includes(arenaHost));assert.equal(arenaGuest,arenaHost);
  assert.equal(h.code,g.code);assert.notEqual(h.token,g.token);assert.equal(h.role,'host');assert.equal(g.role,'guest');
  assert.equal((await duel(10,{action:'join',code:h.code,fighter:'BRAX'})).status,403);
  ok(await duel(a,{...h,action:'sync',ready:true}));ok(await duel(b,{...g,action:'sync',ready:true}));clock+=20000;
  assert.equal((await t(a,'enter',{code,fight:f.id})).status,409,'active simulation cannot be reset by reopening');
  const snapshot={snapshotId:1,ack:0,actors:[80,0].map((hp,i)=>({hp,x:30+i*40,y:0,face:i?-1:1,en:0,frame:0,a:'IDLE'})),state:{t:45,round:2,wins:[2,0],matchOver:true,ended:true}};
  ok(await duel(a,{...h,action:'sync',seq:1,snapshot}));
  assert.equal(ok(await duel(b,{...g,action:'result',score:[2,0]})).resultStatus,'pending');
  assert.equal(ok(await duel(a,{...h,action:'result',score:[2,0]})).resultStatus,'confirmed');
  assert.equal(ok(await duel(a,{...h,action:'result',score:[2,0]})).resultStatus,'confirmed');
  ok(await duel(a,{...h,action:'leave'}));assert.equal(ok(await duel(b,{...g,action:'result',score:[2,0]})).resultStatus,'confirmed','confirmation survives room close');
  d=ok(await t(0,'detail',{code}));played++;
 }
 assert.equal(played,count-1);assert(d.tournament.champion);assert.equal(sql.prepare('SELECT COUNT(*) n FROM duel_results WHERE code IN (SELECT room_code FROM tournament_fights WHERE tournament_id=?)').get(d.tournament.id).n,count-1);
 records.push({participants:count,fights:played,byes:d.fights.filter(f=>f.status==='bye').length,completed:true});
}
// Concurrent registration cannot overfill; duplicate same-name participants remain distinct.
let d=ok(await t(0,'create',{name:'Concurrency',capacity:4,startAt:clock+3600000,intervalMinutes:30,timezone:'Europe/Zurich'})),code=d.tournament.code;
const joined=await Promise.all(Array.from({length:6},(_,i)=>t(i,'register',{code,fighter:'BRAX'})));assert.equal(joined.filter(r=>r.status===200).length,4);
const draws=await Promise.all([t(0,'draw',{code}),t(0,'draw',{code})]);assert.equal(draws.filter(r=>r.status===200).length,1);d=ok(await t(0,'detail',{code}));assert.equal(d.fights.length,3);
const f=d.fights.find(f=>f.status==='scheduled'),aId=sql.prepare('SELECT player_id FROM tournament_entries WHERE id=?').get(f.a).player_id,bId=sql.prepare('SELECT player_id FROM tournament_entries WHERE id=?').get(f.b).player_id;
const find=id=>[...cookies.entries()].find(([,v])=>(v===cookies.get(0)?'u:owner-subject':'g:'+v.split('=')[1])===id)[0],a=find(aId),b=find(bId);clock=f.scheduledAt;
const h=ok(await t(a,'enter',{code,fight:f.id})),g=ok(await t(b,'enter',{code,fight:f.id}));const arenaHost=ok(await duel(a,{...h,action:'sync'})).arena,arenaGuest=ok(await duel(b,{...g,action:'sync'})).arena;assert(arenaNames.includes(arenaHost));assert.equal(arenaGuest,arenaHost);ok(await duel(a,{...h,action:'sync',ready:true}));ok(await duel(b,{...g,action:'sync',ready:true}));clock+=20000;ok(await duel(a,{...h,action:'sync',seq:1,snapshot:{snapshotId:1,ack:0,actors:[80,0].map((hp,i)=>({hp,x:30+i*40,y:0,face:i?-1:1,en:0,frame:0,a:'IDLE'})),state:{t:45,round:2,wins:[2,0],matchOver:true,ended:true}}}));
ok(await duel(a,{...h,action:'result',score:[2,0]}));assert.equal(ok(await duel(b,{...g,action:'result',score:[0,2]})).resultStatus,'disputed');d=ok(await t(0,'detail',{code}));assert.equal(d.fights.find(x=>x.id===f.id).status,'review');
assert.equal((await t(1,'resolve',{code,fight:f.id,winner:f.a,reason:'Nie jestem organizatorem'})).status,403);
d=ok(await t(0,'restart',{code,fight:f.id,startAt:clock+60000,reason:'Powtórka po niezgodności'}));assert.equal(d.fights.find(x=>x.id===f.id).attempt,2);assert.notEqual(d.fights.find(x=>x.id===f.id).code,h.code);
assert.equal(ok(await duel(a,{...h,action:'result',score:[2,0]})).resultStatus,'disputed','old attempt cannot advance new attempt');
d=ok(await t(0,'resolve',{code,fight:f.id,winner:f.a,reason:'Walkower po nieobecności rywala'}));assert.equal(d.fights.find(x=>x.id===f.id).winner,f.a);
assert.equal((await request(handleTournaments,0,{action:'cancel',code},undefined,{origin:'https://foreign.invalid'})).status,403);
// Moving a waiting fight keeps room expiry and all later slots valid.
let s=ok(await t(0,'create',{name:'Schedule audit',capacity:4,startAt:clock+3600000,intervalMinutes:30,timezone:'Europe/Zurich'}));
for(let i=0;i<4;i++)ok(await t(i,'register',{code:s.tournament.code,fighter:'NINA'}));
s=ok(await t(0,'draw',{code:s.tournament.code}));const sf=s.fights.find(x=>x.status==='scheduled');clock=sf.scheduledAt-300000;
const su=find(sql.prepare('SELECT player_id FROM tournament_entries WHERE id=?').get(sf.a).player_id),sr=ok(await t(su,'enter',{code:s.tournament.code,fight:sf.id}));
const moved=clock+7200000;s=ok(await t(0,'schedule',{code:s.tournament.code,fight:sf.id,startAt:moved,reason:'Nowy harmonogram'}));
assert.equal(s.tournament.startAt,moved);assert.equal(sql.prepare('SELECT expires FROM duel_rooms WHERE code=?').get(sr.code).expires,moved+7200000);
assert(s.fights.filter(x=>x.status!=='bye').every((x,i,a)=>i===0||x.scheduledAt>=a[i-1].scheduledAt+1800000));
sql.prepare("UPDATE tournament_fights SET status='playing' WHERE id=?").run(sf.id);
s=ok(await t(0,'restart',{code:s.tournament.code,fight:sf.id,startAt:moved+14400000,reason:'Powtórka i przesunięcie późniejszych walk'}));
assert(s.fights.filter(x=>x.status!=='bye').every((x,i,a)=>i===0||x.scheduledAt>=a[i-1].scheduledAt+1800000));
// In immediate mode the first winner waits; the final opens only after both results.
let q=ok(await t(0,'create',{name:'Immediate audit',capacity:4,startAt:clock+120000,intervalMinutes:0,timezone:'Europe/Zurich'}));
for(let i=0;i<4;i++)ok(await t(i,'register',{code:q.tournament.code,fighter:'BRAX'}));
q=ok(await t(0,'draw',{code:q.tournament.code}));let semis=q.fights.filter(x=>x.round===0);assert.equal(semis[0].scheduledAt,semis[1].scheduledAt);clock=q.tournament.startAt+200000;
q=ok(await t(0,'resolve',{code:q.tournament.code,fight:semis[0].id,winner:semis[0].a,reason:'Potwierdzenie testowe pierwszego półfinału'}));assert.equal(q.fights.find(x=>x.round===1).status,'waiting');
const tomorrow=clock+86400000;
q=ok(await t(0,'schedule',{code:q.tournament.code,fight:semis[1].id,startAt:tomorrow}));assert(q.fights.find(x=>x.round===1).scheduledAt>=tomorrow);clock=tomorrow+180000;
q=ok(await t(0,'resolve',{code:q.tournament.code,fight:semis[1].id,winner:semis[1].a,reason:'Potwierdzenie testowe drugiego półfinału'}));const final=q.fights.find(x=>x.round===1);assert.equal(final.status,'scheduled');assert.equal(final.scheduledAt,clock);
const finalist=find(sql.prepare('SELECT player_id FROM tournament_entries WHERE id=?').get(final.a).player_id);ok(await t(finalist,'enter',{code:q.tournament.code,fight:final.id}));
Date.now=actualNow;sql.close();console.log(JSON.stringify({pass:true,records,checks:['server-derived Polish nicknames','same-profile duel rejected','capacity race','single bracket draw','4–10 players/byes','private tournament seats','time gating','both result orders and duplicate result','persistent result after room closure','automatic advancement','conflict review','new attempt isolation','organizer-only decisions','cross-origin rejection']}));
