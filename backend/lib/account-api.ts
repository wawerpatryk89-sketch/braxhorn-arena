import {playerIdentity} from './player-identity';
import {reservedName} from './owner-policy';
import {addCookie,cookie,createPassword,DEFAULT_AVATAR,ENTRY_COOKIE,issueSession,nickKey,nickName,responseHeaders,revokeSession,SESSION_COOKIE,tokenHash,validNick,validPassword,verifyPassword,randomToken} from './account-session';
const MAX_IMAGE=512*1024;
const fail=(message:string,status=400,code='')=>Object.assign(new Error(message),{status,code});
const preset=(value:unknown)=>value==='female'?'/assets/avatar-female.jpg':value==='male'?DEFAULT_AVATAR:null;
async function limitedBody(request:Request,max:number){
 const declared=Number(request.headers.get('content-length')||0);if(declared>max)throw fail('Przesyłany plik lub formularz jest zbyt duży.',413);
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw fail('Przesyłany plik lub formularz jest zbyt duży.',413);}chunks.push(value);}}finally{reader.releaseLock();}
 const out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.byteLength;}return out;
}
async function jsonBody(request:Request){
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw fail('Nieprawidłowy format formularza.',415);
 try{const data=JSON.parse(new TextDecoder().decode(await limitedBody(request,4096)));if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch(error:any){if(error.status)throw error;throw fail('Nieprawidłowe dane formularza.');}
}
function sameOrigin(request:Request){
 const origin=request.headers.get('origin');let wrong=false;try{wrong=!!origin&&new URL(origin).origin!==new URL(request.url).origin;}catch{wrong=true;}
 if(wrong||request.headers.get('sec-fetch-site')==='cross-site')throw fail('Niedozwolone źródło żądania.',403);
}
async function rateLimit(db:any,request:Request,action:string,key:string,maximum:number,period=15*60*1000){
 const now=Date.now(),ip=request.headers.get('cf-connecting-ip')||'unknown';
 // Retain only a one-way fingerprint, never an entered password or raw address.
 const id=await tokenHash(action+':'+key+':'+(action==='login-nick'?'all-addresses':ip));
 await db.prepare('DELETE FROM account_rate_limits WHERE expires<=?').bind(now).run();
 await db.prepare('INSERT INTO account_rate_limits(id,attempts,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN expires<=? THEN 1 ELSE attempts+1 END,expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END').bind(id,now+period,now,now).run();
 const row=await db.prepare('SELECT attempts FROM account_rate_limits WHERE id=?').bind(id).first();
 if(row.attempts>maximum)throw fail('Zbyt wiele prób. Poczekaj 15 minut i spróbuj ponownie.',429,'rate_limit');
}
async function nickOwner(db:any,key:string,except=''){
 const found=await db.prepare('SELECT id FROM players WHERE nick_key=? AND id<>?').bind(key,except).first();if(found)return found.id;
 // Reserve old ChatGPT nicknames without changing any historical owner IDs or display names.
 const old=await db.prepare("SELECT id,name FROM players WHERE id LIKE 'u:%' AND id<>? AND name<>'GRACZ'").bind(except).all();
 return old.results.find((row:any)=>nickKey(row.name)===key)?.id||null;
}
function dimensions(bytes:Uint8Array){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),text=(a:number,b:number)=>String.fromCharCode(...bytes.subarray(a,b));
 if(bytes.length>=33&&bytes[0]===137&&text(1,4)==='PNG'&&text(12,16)==='IHDR'&&text(bytes.length-8,bytes.length-4)==='IEND')return {type:'image/png',extension:'png',width:view.getUint32(16),height:view.getUint32(20)};
 if(bytes.length>=30&&text(0,4)==='RIFF'&&text(8,12)==='WEBP'&&view.getUint32(4,true)+8===bytes.length){
  const chunk=text(12,16);if(chunk==='VP8X')return {type:'image/webp',extension:'webp',width:1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16),height:1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16)};
  if(chunk==='VP8L'&&bytes[20]===47)return {type:'image/webp',extension:'webp',width:1+bytes[21]+((bytes[22]&63)<<8),height:1+(bytes[22]>>6)+(bytes[23]<<2)+((bytes[24]&15)<<10)};
  if(chunk==='VP8 '&&bytes[23]===157&&bytes[24]===1&&bytes[25]===42)return {type:'image/webp',extension:'webp',width:view.getUint16(26,true)&16383,height:view.getUint16(28,true)&16383};
 }
 if(bytes.length>12&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217){
  let pos=2;while(pos+4<bytes.length){if(bytes[pos++]!==255)break;while(bytes[pos]===255)pos++;const marker=bytes[pos++];if(marker===217||marker===218)break;if(marker===216||marker===1||(marker>=208&&marker<=215))continue;const length=view.getUint16(pos);if(length<2||pos+length>bytes.length)break;
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&length>=7)return {type:'image/jpeg',extension:'jpg',height:view.getUint16(pos+3),width:view.getUint16(pos+5)};pos+=length;
  }
 }
 return null;
}
export async function handleAccount(request:Request,db:any,bucket:any,ownerEmail=''){
 const headers:Record<string,string>={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
 const reply=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:responseHeaders(headers)});
 try{
  if(!db)throw fail('Konta są chwilowo niedostępne. Spróbuj ponownie.',503);
  const action=new URL(request.url).searchParams.get('action')||'me';
  if(!['GET','POST','PUT'].includes(request.method))throw fail('Nieznane działanie.',404);
  if(request.method!=='GET')sameOrigin(request);
  const player=await playerIdentity(request,db,headers,ownerEmail);
  if(request.method==='GET'&&action==='me')return reply({player,authenticated:player.authenticated});
  if(request.method==='PUT'&&action==='avatar'){
   if(!player.authenticated)throw fail('Zaloguj się, aby zmienić awatar.',401);
   if(!bucket)throw fail('Nie udało się zapisać zdjęcia. Spróbuj ponownie.',503);
   await rateLimit(db,request,'avatar',player.id,30);
   const bytes=await limitedBody(request,MAX_IMAGE),image=dimensions(bytes);
   if(!image||request.headers.get('content-type')?.split(';')[0]!==image.type)throw fail('Wybierz poprawny obraz JPEG, PNG lub WebP.',415);
   if(image.width<64||image.height<64||image.width>1024||image.height>1024||image.width*image.height>1024*1024)throw fail('Zatwierdź kadr zdjęcia o rozmiarze od 64 do 1024 pikseli.');
   const file=randomToken()+'.'+image.extension,key='player-avatars/'+file;
   await bucket.put(key,bytes,{httpMetadata:{contentType:image.type,cacheControl:'public, max-age=31536000, immutable'}});
   const avatar='/api/player-avatar/'+file;
   await db.prepare('UPDATE players SET avatar=? WHERE id=?').bind(avatar,player.id).run();
   return reply({player:{...player,avatar},saved:true});
  }
  if(request.method!=='POST')throw fail('Nieznane działanie.',404);
  const body=await jsonBody(request);
  if(action==='register'){
   await rateLimit(db,request,'register','all',8);
   const name=nickName(body.nick),key=nickKey(name),avatar=preset(body.avatar);
   if(!validNick(name))throw fail('Nick musi mieć od 2 do 20 znaków: litery, cyfry, spacje, kropki, podkreślenia lub myślniki.');
   if(!validPassword(body.password))throw fail('Hasło musi mieć od 8 do 128 znaków.');
   if(!avatar)throw fail('Wybierz gotowy awatar lub przygotuj własne zdjęcie.');
   if(reservedName(name)||await nickOwner(db,key))throw fail('Ten nick jest już zajęty. Wybierz inny lub zaloguj się na istniejące konto.',409,'nick_taken');
   const id='a:'+crypto.randomUUID(),password=await createPassword(body.password),now=Date.now();
   try{await db.batch([
    db.prepare('INSERT INTO players(id,name,nick_key,avatar,created) VALUES(?,?,?,?,?)').bind(id,name,key,avatar,now),
    db.prepare('INSERT INTO account_credentials(player_id,password_hash,salt,iterations,created,updated) VALUES(?,?,?,?,?,?)').bind(id,password.hash,password.salt,password.iterations,now,now)
   ]);}catch(error:any){if(/unique|constraint/i.test(String(error?.message)))throw fail('Ten nick jest już zajęty. Wybierz inny.',409,'nick_taken');throw error;}
   await issueSession(request,db,headers,id);
   return reply({player:{id,name,avatar,authenticated:true,isOwner:false,ownerId:player.ownerId,hasPassword:true},authenticated:true},201);
  }
  if(action==='login'){
   const name=nickName(body.nick),key=nickKey(name);
   await rateLimit(db,request,'login','all',50);await rateLimit(db,request,'login-nick',key,10);
   if(!validNick(name)||typeof body.password!=='string'||body.password.length>128)throw fail('Nieprawidłowy nick lub hasło.',401,'invalid_credentials');
   const row=await db.prepare('SELECT players.*,account_credentials.password_hash,account_credentials.salt,account_credentials.iterations FROM players JOIN account_credentials ON account_credentials.player_id=players.id WHERE players.nick_key=?').bind(key).first();
   if(!await verifyPassword(body.password,row))throw fail('Nieprawidłowy nick lub hasło.',401,'invalid_credentials');
   await issueSession(request,db,headers,row.id);
   return reply({player:{id:row.id,name:row.name,avatar:row.avatar||DEFAULT_AVATAR,authenticated:true,isOwner:row.id===player.ownerId,ownerId:player.ownerId,hasPassword:true},authenticated:true});
  }
  if(action==='logout'||action==='guest'){
   await revokeSession(request,db);addCookie(headers,cookie(request,SESSION_COOKIE,'',0));addCookie(headers,cookie(request,ENTRY_COOKIE,action==='guest'?'guest':'out',31536000));
   // Ignore both stale local cookies and platform headers for this response after explicit logout.
   const anonymous=new Headers(request.headers);anonymous.delete('oai-authenticated-user-id');anonymous.delete('oai-authenticated-user-email');anonymous.set('cookie',(request.headers.get('cookie')||'').split(';').filter(v=>!v.trim().startsWith(SESSION_COOKIE+'=')&&!v.trim().startsWith(ENTRY_COOKIE+'=')).join(';')+'; '+ENTRY_COOKIE+'=guest');
   const guest=await playerIdentity(new Request(request.url,{headers:anonymous}),db,headers,ownerEmail);
   return reply({player:guest,authenticated:false,loggedOut:action==='logout'});
  }
  if(action==='legacy'){
   if(!request.headers.get('oai-authenticated-user-id'))throw fail('Zaloguj się przez dotychczasowe konto ChatGPT.',401,'legacy_login_required');
   await revokeSession(request,db);addCookie(headers,cookie(request,SESSION_COOKIE,'',0));addCookie(headers,cookie(request,ENTRY_COOKIE,'legacy',31536000));
   const legacyHeaders=new Headers(request.headers);legacyHeaders.set('cookie',(request.headers.get('cookie')||'').split(';').filter(v=>!v.trim().startsWith(SESSION_COOKIE+'=')&&!v.trim().startsWith(ENTRY_COOKIE+'=')).join(';')+'; '+ENTRY_COOKIE+'=legacy');
   const legacy=await playerIdentity(new Request(request.url,{headers:legacyHeaders}),db,headers,ownerEmail);return reply({player:legacy,authenticated:true});
  }
  if(action==='avatar'){
   if(!player.authenticated)throw fail('Zaloguj się, aby zmienić awatar.',401);
   const avatar=preset(body.avatar);if(!avatar)throw fail('Wybierz dostępny awatar.');
   await db.prepare('UPDATE players SET avatar=? WHERE id=?').bind(avatar,player.id).run();return reply({player:{...player,avatar},saved:true});
  }
  if(action==='password'){
   if(!player.authenticated)throw fail('Zaloguj się, aby ustawić hasło.',401);
   await rateLimit(db,request,'password',player.id,10);
   if(!validPassword(body.password))throw fail('Hasło musi mieć od 8 do 128 znaków.');
   const existing=await db.prepare('SELECT * FROM account_credentials WHERE player_id=?').bind(player.id).first();
   if(existing&&(typeof body.currentPassword!=='string'||!await verifyPassword(body.currentPassword,existing)))throw fail('Aktualne hasło jest nieprawidłowe.',401,'invalid_credentials');
   const key=nickKey(player.name);if(!validNick(player.name)||reservedName(player.name)&&!player.isOwner)throw fail('Ustaw poprawny nick w profilu przed dodaniem hasła.');
   if(await nickOwner(db,key,player.id))throw fail('Ten nick jest używany przez inne starsze konto. Zmień nick przed dodaniem hasła.',409,'nick_taken');
   const password=await createPassword(body.password),now=Date.now();
   await db.batch([
    db.prepare('UPDATE players SET nick_key=? WHERE id=?').bind(key,player.id),
    db.prepare('INSERT INTO account_credentials(player_id,password_hash,salt,iterations,created,updated) VALUES(?,?,?,?,?,?) ON CONFLICT(player_id) DO UPDATE SET password_hash=excluded.password_hash,salt=excluded.salt,iterations=excluded.iterations,updated=excluded.updated').bind(player.id,password.hash,password.salt,password.iterations,now,now),
    db.prepare('DELETE FROM account_sessions WHERE player_id=?').bind(player.id)
   ]);await issueSession(request,db,headers,player.id);return reply({player:{...player,hasPassword:true},saved:true});
  }
  throw fail('Nieznane działanie.',404);
 }catch(error:any){return reply({error:error.status?error.message:'Nie udało się zapisać danych konta. Spróbuj ponownie.',...(error.code?{code:error.code}:{})},error.status||500);}
}
export async function playerAvatar(request:Request,bucket:any,file:string){
 if(!/^[a-f0-9]{64}\.(jpg|png|webp)$/.test(file)||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});
 if(!bucket)return new Response('Unavailable',{status:503});
 const object=await bucket.get('player-avatars/'+file);if(!object)return new Response('Not found',{status:404});
 const headers={'Content-Type':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.png')?'image/png':'image/webp','Content-Length':String(object.size),'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"};
 return new Response(request.method==='HEAD'?null:object.body,{headers});
}
