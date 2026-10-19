// Real account handlers against SQLite/D1 and an isolated in-memory R2 bucket.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s.startsWith('.')&&!/\.[a-z]+$/i.test(s)){const u=new URL(s+'.ts',c.parentURL);if(fs.existsSync(u))return next(u.href,c);}return next(s,c);}});
const {handleAccount,playerAvatar}=await import('../backend/lib/account-api.ts');
const {playerIdentity}=await import('../backend/lib/player-identity.ts');
const sqlite=new DatabaseSync(':memory:');
for(const tag of JSON.parse(fs.readFileSync('backend/drizzle/meta/_journal.json','utf8')).entries.map(v=>v.tag)){
 if(tag==='0009_player_language')sqlite.prepare('INSERT INTO players(id,name,created) VALUES(?,?,?)').run('u:before-language','Before language',1);
 sqlite.exec(fs.readFileSync('backend/drizzle/'+tag+'.sql','utf8'));
}
assert.equal(sqlite.prepare('SELECT language FROM players WHERE id=?').get('u:before-language').language,'pl','additive language migration defaults existing players to Polish');
const statement=(q,args=[])=>({bind(...values){return statement(q,values);},async first(){return sqlite.prepare(q).get(...args)||null;},async all(){return{results:sqlite.prepare(q).all(...args)};},async run(){return {meta:{changes:Number(sqlite.prepare(q).run(...args).changes)}};}});
const db={prepare:statement,async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const objects=new Map(),bucket={async put(key,bytes,meta){objects.set(key,{bytes:new Uint8Array(bytes),meta});return{size:bytes.length};},async get(key){const value=objects.get(key);return value?{body:value.bytes,size:value.bytes.length}:null;}};
const owner={'oai-authenticated-user-id':'existing-owner','oai-authenticated-user-email':'owner@example.invalid'};
const cookies=response=>response.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
async function call(action,body={},cookie='',extra={}){const request=new Request('https://game.test/api/account?action='+action,{method:'POST',headers:{'content-type':'application/json',cookie,...extra},body:JSON.stringify(body)});const response=await handleAccount(request,db,bucket,'owner@example.invalid');return {response,status:response.status,body:await response.json(),cookie:cookies(response)};}
async function me(cookie='',extra={}){const response=await handleAccount(new Request('https://game.test/api/account?action=me',{headers:{cookie,...extra}}),db,bucket,'owner@example.invalid');return await response.json();}
const guest=await call('guest');assert.equal(guest.status,200);assert.equal(guest.body.player.authenticated,false);assert.match(guest.body.player.name,/^GOŚĆ-[0-9A-F]{4}$/);assert.equal(guest.body.player.language,'pl');
assert.equal((await call('avatar',{avatar:'female'},guest.cookie)).status,401);
assert.equal((await call('language',{language:'en'},guest.cookie)).status,401,'guest cannot persist account language');
const a=await call('register',{nick:'Żółw Jeden',password:'private-test-password-A',avatar:'male'});assert.equal(a.status,201,JSON.stringify(a.body));assert.match(a.body.player.id,/^a:/);assert.equal(a.body.player.name,'Żółw Jeden');assert.equal(a.body.player.avatar,'/assets/avatar-male.jpg');
assert.equal(a.body.player.language,'pl','registration defaults to Polish');
const sessionCookies=a.response.headers.getSetCookie();assert(sessionCookies.some(c=>c.startsWith('brax_session=')&&c.includes('HttpOnly')&&c.includes('Secure')&&c.includes('SameSite=Lax')));
const credential=sqlite.prepare('SELECT * FROM account_credentials WHERE player_id=?').get(a.body.player.id);assert.equal(credential.iterations,100000);assert(!JSON.stringify(credential).includes('private-test-password-A'));assert.equal(credential.password_hash.length,64);
const token=a.cookie.match(/brax_session=([^;]+)/)[1];assert(!JSON.stringify(sqlite.prepare('SELECT * FROM account_sessions').all()).includes(token),'only hash is stored');
assert.equal((await me(a.cookie)).player.id,a.body.player.id);
assert.equal((await call('register',{nick:' żÓŁW   JEDEN ',password:'another-password',avatar:'female'})).status,409,'normalized nickname uniqueness');
for(const nick of ['WAWER','W.a_w-e-r','ＷＡＷＥＲ'])assert.equal((await call('register',{nick,password:'another-password',avatar:'male'})).status,409);
const b=await call('register',{nick:'Osoba Druga',password:'private-test-password-B',avatar:'female',language:'en'});assert.equal(b.status,201);assert.equal(b.body.player.avatar,'/assets/avatar-female.jpg');assert.equal(b.body.player.language,'en','registration can store English');
const languageRow=sqlite.prepare('SELECT * FROM players WHERE id=?').get(a.body.player.id);
const savedLanguage=await call('language',{language:'en',playerId:b.body.player.id},a.cookie);assert.equal(savedLanguage.status,200);assert.equal(savedLanguage.body.saved,true);assert.equal(savedLanguage.body.player.id,a.body.player.id);assert.equal(savedLanguage.body.player.language,'en');
assert.deepEqual({...sqlite.prepare('SELECT * FROM players WHERE id=?').get(a.body.player.id)},{...languageRow,language:'en'},'language updates only its own player column');
assert.deepEqual(sqlite.prepare('SELECT * FROM account_credentials WHERE player_id=?').get(a.body.player.id),credential,'language does not change password credentials');
for(const language of ['de','EN','',null,42,{},[]]){const invalid=await call('language',{language},a.cookie);assert.equal(invalid.status,400);assert.equal(invalid.body.code,'invalid_language');}
assert.equal((await call('language',{},a.cookie)).body.code,'invalid_language');
assert.equal((await call('register',{nick:'Invalid language',password:'another-password',avatar:'male',language:'de'},'',{'cf-connecting-ip':'192.0.2.90'})).body.code,'invalid_language');
assert.equal((await call('language',{language:'pl'},a.cookie,{origin:'https://evil.test'})).status,403,'language uses existing same-origin CSRF guard');
assert.equal((await call('language',{language:'pl'},a.cookie,{'sec-fetch-site':'cross-site'})).status,403,'cross-site language mutation rejected');
assert.equal((await me(a.cookie)).player.language,'en','invalid and cross-site changes did not save');
assert.equal((await call('language',{language:'pl',playerId:a.body.player.id},b.cookie)).status,200);assert.equal((await me(a.cookie)).player.language,'en','body playerId cannot change another account language');assert.equal((await me(b.cookie)).player.language,'pl','accounts keep independent preferences');
const forged=await call('avatar',{avatar:'female',playerId:b.body.player.id},a.cookie);assert.equal(forged.status,200);assert.equal(forged.body.player.id,a.body.player.id);assert.equal(forged.body.player.language,'en');assert.equal(sqlite.prepare('SELECT avatar FROM players WHERE id=?').get(b.body.player.id).avatar,'/assets/avatar-female.jpg');
const csrf=await call('avatar',{avatar:'male'},a.cookie,{origin:'https://evil.test'});assert.equal(csrf.status,403);
assert.equal((await call('login',{nick:'Żółw Jeden',password:'incorrect'})).status,401);
const login=await call('login',{nick:'ŻÓŁW JEDEN',password:'private-test-password-A'});assert.equal(login.status,200);assert.equal(login.body.player.id,a.body.player.id);assert.equal(login.body.player.language,'en','second device login restores saved language');
assert.equal((await call('language',{language:'pl'},login.cookie)).status,200);assert.equal((await me(a.cookie)).player.language,'pl','language saved on second device reaches original session');assert.equal((await call('language',{language:'en'},a.cookie)).status,200);assert.equal((await me(login.cookie)).player.language,'en');
const logout=await call('logout',{},login.cookie,owner);assert.equal(logout.status,200);assert.equal(logout.body.player.authenticated,false);assert.equal(logout.body.player.language,'pl');assert.equal((await me(login.cookie)).player.authenticated,false,'logout revokes bearer on server');assert.equal((await me(logout.cookie,owner)).player.authenticated,false,'logout suppresses platform fallback');
const relogin=await call('login',{nick:'Żółw Jeden',password:'private-test-password-A'});assert.equal(relogin.body.player.id,a.body.player.id);assert.equal(relogin.body.player.avatar,'/assets/avatar-female.jpg');assert.equal(relogin.body.player.language,'en','language survives logout/login');
assert.equal((await call('password',{password:'private-new-password'},relogin.cookie)).status,401,'password changes require current password');
const changed=await call('password',{password:'private-new-password',currentPassword:'private-test-password-A'},relogin.cookie);assert.equal(changed.status,200);assert.equal(changed.body.player.language,'en');assert.equal((await me(a.cookie)).player.authenticated,false,'password change revokes other sessions');assert.equal((await call('login',{nick:'Żółw Jeden',password:'private-test-password-A'})).status,401);assert.equal((await call('login',{nick:'Żółw Jeden',password:'private-new-password'})).status,200);
// Legacy player and history are preserved and cannot be claimed by registering the old nickname.
sqlite.prepare('INSERT INTO players(id,name,created) VALUES(?,?,?)').run('u:legacy','Starszy Gracz',1);sqlite.prepare('INSERT INTO results(id,owner,mode,difficulty,fighter,score,elapsed,completed,created) VALUES(?,?,?,?,?,?,?,?,?)').run('legacy-result','u:legacy','fight','normal','BRAX',2,60000,1,1);
assert.equal((await call('register',{nick:'starszy gracz',password:'another-password',avatar:'male'})).status,409);
const old=await me('',{'oai-authenticated-user-id':'legacy'});assert.equal(old.player.id,'u:legacy');assert.equal(old.player.avatar,'/assets/avatar-male.jpg');assert.equal(old.player.language,'pl');
assert.equal((await call('language',{language:'en'},'',{'oai-authenticated-user-id':'legacy'})).status,200);assert.equal((await call('legacy',{},'',{'oai-authenticated-user-id':'legacy'})).body.player.language,'en','legacy sign-in restores stored language');
const linked=await call('password',{password:'legacy-strong-password'},'',{'oai-authenticated-user-id':'legacy'});assert.equal(linked.status,200);assert.equal(linked.body.player.id,'u:legacy');
const oldLocal=await call('login',{nick:'Starszy Gracz',password:'legacy-strong-password'});assert.equal(oldLocal.body.player.id,'u:legacy');assert.equal(sqlite.prepare('SELECT owner FROM results WHERE id=?').get('legacy-result').owner,'u:legacy');
const oldOwner=await me('',owner);assert.equal(oldOwner.player.isOwner,true);const ownerPassword=await call('password',{password:'owner-strong-password'},'',owner);assert.equal(ownerPassword.status,200);const localOwner=await call('login',{nick:'WAWER',password:'owner-strong-password'});assert.equal(localOwner.body.player.id,'u:existing-owner');assert.equal(localOwner.body.player.isOwner,true);assert.equal((await me(localOwner.cookie)).player.isOwner,true);assert.equal((await me(b.cookie,owner)).player.isOwner,false,'platform owner header cannot elevate unrelated local account');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAABmJLR0QA/wD/AP+gvaeTAAAAwElEQVR4nO3RMQEAIAzAsIF/z0NGHjQKej0zO7bZ/A7gpoFNA5sGNg1sGtg0sGlg08CmgU0DmwY2DWwa2DSwaWDTwKaBTQObBjYNbBrYNLBpYNPAppFNA5sGNg1sGtg0sGlg08CmgU0DmwY2DWwa2DSwaWDTwKaBTQObBjYNbBrYNLBpYNPAppFNA5sGNg1sGtg0sGlg08CmgU0DmwY2DWwa2DSwaWDTwKaBTQObBjYNbBrYNLBpYNPAppFNA5sGNg1sGtg0sGkAL4sB/zODwWcAAAAASUVORK5CYII=','base64');
// This fixture's IEND and dimensions exercise format validation; browser test uses a real canvas-encoded JPEG.
const upload=await handleAccount(new Request('https://game.test/api/account?action=avatar',{method:'PUT',headers:{cookie:b.cookie,'content-type':'image/png'},body:png}),db,bucket,'owner@example.invalid');assert.equal(upload.status,200,await upload.clone().text());const uploadBody=await upload.json();assert.equal(uploadBody.player.language,'pl');const uploaded=uploadBody.player.avatar;assert.match(uploaded,/^\/api\/player-avatar\/[a-f0-9]{64}\.png$/);assert.equal(objects.size,1);assert.equal((await me(b.cookie)).player.avatar,uploaded);
const served=await playerAvatar(new Request('https://game.test'+uploaded),bucket,uploaded.split('/').pop());assert.equal(served.status,200);assert.equal(served.headers.get('X-Content-Type-Options'),'nosniff');assert.equal(served.headers.get('Content-Type'),'image/png');
const svg=await handleAccount(new Request('https://game.test/api/account?action=avatar',{method:'PUT',headers:{cookie:b.cookie,'content-type':'image/svg+xml'},body:'<svg xmlns="http://www.w3.org/2000/svg"></svg>'}),db,bucket);assert.equal(svg.status,415);
const oversized=await handleAccount(new Request('https://game.test/api/account?action=avatar',{method:'PUT',headers:{cookie:b.cookie,'content-type':'image/jpeg'},body:new Uint8Array(512*1024+1)}),db,bucket);assert.equal(oversized.status,413);
sqlite.prepare('UPDATE account_sessions SET expires=0 WHERE player_id=?').run(b.body.player.id);assert.equal((await me(b.cookie)).player.authenticated,false,'expiry is enforced server-side');
let limited;for(let i=0;i<11;i++)limited=await call('login',{nick:'Missing Nick',password:'wrong-password'},'',{'cf-connecting-ip':'192.0.2.'+(i+5)});assert.equal(limited.status,429);
sqlite.close();console.log('PASS account credentials, unique normalized names, server sessions/revocation/expiry, guest identity, legacy preservation/owner linking, CSRF, own-profile-only mutations, language defaults/validation/two-device persistence, avatar R2 upload/format/size, rate limits.');
