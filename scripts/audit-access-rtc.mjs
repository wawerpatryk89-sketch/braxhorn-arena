import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s.startsWith('.')&&!/\.[a-z]+$/i.test(s)){const u=new URL(s+'.ts',c.parentURL);if(fs.existsSync(u))return next(u.href,c);}return next(s,c);},load(url,c,next){if(url.endsWith('/challenges.json'))return{format:'module',source:'export default '+fs.readFileSync(new URL(url),'utf8'),shortCircuit:true};return next(url,c);}});
const {handleArena}=await import('../backend/lib/arena-api.ts');
const {handleTournaments}=await import('../backend/lib/tournament-api.ts');
const {handleDuel}=await import('../backend/lib/duel-api.ts');
const {handleRTC}=await import('../backend/lib/rtc-config.ts');
const sql=new DatabaseSync(':memory:');
for(const n of fs.readdirSync('backend/drizzle').filter(n=>n.endsWith('.sql')).sort())sql.exec(fs.readFileSync('backend/drizzle/'+n,'utf8'));
const statement=(q,a=[])=>({bind(...v){return statement(q,v);},async first(){return sql.prepare(q).get(...a)||null;},async all(){return{results:sql.prepare(q).all(...a)};},async run(){if(/^SELECT/i.test(q))return{results:sql.prepare(q).all(...a)};return{meta:{changes:Number(sql.prepare(q).run(...a).changes)}};}});
let batches=0,selects=0;
const db={prepare(q){selects++;return statement(q);},async batch(all){batches++;sql.exec('BEGIN');try{const r=[];for(const s of all)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
const owner={'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@test.invalid'},other={'oai-authenticated-user-id':'other','oai-authenticated-user-email':'other@test.invalid'},guest={cookie:'brax_player=00000000-0000-0000-0000-000000000001'};
async function call(fn,path,body,headers={},config='owner@test.invalid'){const r=await fn(new Request('https://game.test'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...headers},body:body?JSON.stringify(body):undefined}),db,config);return{status:r.status,body:await r.json()};}
const t=(a,h=guest,extra={})=>call(handleTournaments,'/api/tournaments',{action:a,...extra},h);
const arena=(a,h=guest,body)=>call(handleArena,'/api/arena?action='+a,body,h);
for(const h of [guest,other,{'oai-authenticated-user-email':'owner@test.invalid'}]){
 assert.equal((await t('create',h,{name:'WAWER',isOwner:true})).status,403,'names and request flags cannot grant organizer access');
 assert.equal((await arena('me',h)).body.isOwner,false);
}
assert.equal((await call(handleTournaments,'/api/tournaments',{action:'create'},owner,'')).status,403,'missing owner configuration fails closed');
const me=await arena('me',owner);assert.equal(me.body.isOwner,true);assert.equal(me.body.name,'WAWER');
assert.equal((await arena('me',{'oai-authenticated-user-id':'owner'})).body.isOwner,true,'stable subject persists after email changes');
for(const name of ['Wawer','wAWEr',' ＷＡＷＥＲ ','W a w e r','W.a_w-e-r','Wаwеr'])assert.equal((await arena('name',guest,{name})).status,403,name);
assert.equal((await arena('name',guest,{name:'Monisia'})).body.name,'Monisia');
const created=await t('create',owner,{name:'Test dostępu',capacity:4,startAt:Date.now()+3600000,intervalMinutes:30,timezone:'Europe/Warsaw'});assert.equal(created.status,200,JSON.stringify(created));
const code=created.body.tournament.code;
// Even a former guest creator loses administrative authority.
sql.prepare('UPDATE online_tournaments SET owner=? WHERE code=?').run('g:00000000-0000-0000-0000-000000000001',code);
for(const action of ['create','draw','schedule','restart','resolve','cancel','delete','addParticipant','removeParticipant'])for(const h of [guest,other])assert.equal((await t(action,h,{code})).status,403,action);
assert.equal((await t('detail',guest,{code})).body.organizer,false);
assert.equal((await t('register',guest,{code,fighter:'BRAX'})).status,200,'public participant registration remains available');
assert.equal((await t('detail',owner,{code})).body.organizer,true);
assert.equal((await t('cancel',owner,{code})).status,200);
// Public registration and organizer invitations share the same draw slots.
const invitational=(await t('create',owner,{name:'Zapisy i zaproszenia',capacity:4,startAt:Date.now()+3600000,intervalMinutes:30,timezone:'Europe/Zurich'})).body;
const ic=invitational.tournament.code;
let invited=await t('addParticipant',owner,{code:ic,name:'Monika',fighter:'NYXA'});assert.equal(invited.status,200);
const monika=invited.body.entries[0];assert.match(monika.inviteCode,/^[A-F0-9]{16}$/);
assert.equal((await t('detail',guest,{code:ic})).body.entries[0].inviteCode,undefined,'private invitation is not public');
assert.equal((await t('claim',guest,{inviteCode:monika.inviteCode})).body.ownEntry,monika.id);
assert.equal((await t('claim',other,{inviteCode:monika.inviteCode})).status,404,'used invitation cannot be stolen');
const jan=(await t('addParticipant',owner,{code:ic,name:'Jan',fighter:'DANNY'})).body.entries.find(e=>e.name==='Jan');
await t('addParticipant',owner,{code:ic,name:'Anna',fighter:'NINA'});
assert.equal((await t('register',owner,{code:ic,fighter:'BRAX'})).status,200);
assert.equal((await t('addParticipant',owner,{code:ic,name:'Nadmiar',fighter:'VEXA'})).status,409,'capacity includes invited slots');
const drawn=await t('draw',owner,{code:ic});assert.equal(drawn.status,200);
assert(drawn.body.fights.some(f=>[f.a,f.b].includes(monika.id)),'claimed participant enters draw');
assert(drawn.body.fights.some(f=>[f.a,f.b].includes(jan.id)),'invited participant enters draw');
assert.equal((await t('claim',other,{inviteCode:jan.inviteCode})).body.ownEntry,jan.id,'claim after drawing preserves bracket identity');
assert.equal((await t('removeParticipant',owner,{code:ic,entry:jan.id})).status,409,'drawn bracket cannot lose entrants');
await t('cancel',owner,{code:ic});
assert.equal((await t('delete',owner,{code:ic})).body.deleted,true);
for(const h of [guest,owner]){
 assert.equal((await t('detail',h,{code:ic})).status,404,'deleted tournament cannot reopen by code');
 assert(!(await t('list',h)).body.tournaments.some(t=>t.code===ic),'deleted tournament absent from all lists');
}
assert.equal((await t('claim',guest,{inviteCode:monika.inviteCode})).status,404);

// Legacy Wawer aliases are not shown as the owner, even before the guest returns.
sql.prepare('UPDATE players SET name=? WHERE id=?').run('WAWER','g:00000000-0000-0000-0000-000000000001');
const room=(await call(handleDuel,'/api/duel',{action:'create',fighter:'BRAX'},guest)).body;
assert.equal(room.hostName,'GRACZ');
const joined=(await call(handleDuel,'/api/duel',{action:'join',code:room.code,fighter:'NINA'},owner)).body;assert.equal(joined.guestName,'WAWER');
await call(handleDuel,'/api/duel',{...room,action:'sync',ready:true},guest);
const sync=await call(handleDuel,'/api/duel',{...joined,action:'sync',ready:true},owner);assert.equal(sync.body.status,'playing');
await call(handleDuel,'/api/duel',{...room,action:'sync',seq:3,snapshot:{ack:0,actors:[{},{}],state:{t:42}}},guest);
await call(handleDuel,'/api/duel',{...room,action:'sync',seq:2,snapshot:{ack:0,actors:[{},{}],state:{t:60}}},guest);
assert.equal((await call(handleDuel,'/api/duel',{...joined,action:'sync'},owner)).body.snapshot.state.t,42,'older state cannot overwrite newest packet');
const realFetch=globalThis.fetch;let calls=0;
globalThis.fetch=async(url,options)=>{calls++;assert.match(url,/\/turn\/keys\/key-id\/credentials\/generate-ice-servers$/);assert.equal(options.headers.Authorization,'Bearer permanent-private-token');assert.equal(JSON.parse(options.body).ttl,3600);return Response.json({iceServers:[{urls:['turn:relay.test:3478?transport=udp','turns:relay.test:443?transport=tcp','turn:relay.test:53'],username:'ephemeral-user',credential:'ephemeral-secret'}]});};
const config={BRAX_TURN_KEY_ID:'key-id',BRAX_TURN_API_TOKEN:'permanent-private-token'},rtc=(body,c=config,headers={})=>call(handleRTC,'/api/rtc',body,headers,c);
assert.equal((await rtc({code:room.code,token:'wrong'})).status,403);assert.equal(calls,0);
assert.equal((await rtc(room,{},{})).body.reason,'relay_not_configured');assert.equal(calls,0);
const relay=await rtc(room);assert.equal(relay.status,200);assert.equal(relay.body.relayAvailable,true);assert.equal(relay.body.iceServers[0].urls.length,2);assert(!JSON.stringify(relay).includes('permanent-private-token'));
await rtc(room);assert.equal(calls,1,'temporary credentials are cached');
assert.equal((await rtc(room,config,{origin:'https://other.test'})).status,403);
const meteredConfig={BRAX_METERED_TURN_USERNAME:'test-user',BRAX_METERED_TURN_PASSWORD:'test-password'};
const metered=await rtc(room,meteredConfig);assert.equal(metered.body.provider,'metered');assert.equal(metered.body.relayAvailable,true);assert.equal(metered.body.iceServers[1].urls.length,4);assert.equal(metered.body.iceServers[1].credential,'test-password');assert.equal((await rtc({...room,token:'invalid'},meteredConfig)).status,403);assert.equal((await rtc(room,meteredConfig,{origin:'https://other.test'})).status,403);
sql.prepare("UPDATE duel_rooms SET status='closed' WHERE code=?").run(room.code);assert.equal((await rtc(room)).status,403,'room authorization also enforced on credential cache hits');
globalThis.fetch=realFetch;sql.close();console.log('PASS owner identity, all organizer mutations, reserved aliases, public joins, legacy names, monotonic state, TURN room authorization and temporary-only credentials.');
