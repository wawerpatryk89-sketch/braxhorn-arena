/** Server-owned credentials and opaque sessions; passwords and bearer tokens never leave this module. */
export const SESSION_COOKIE='brax_session';
export const ENTRY_COOKIE='brax_entry';
export const DEFAULT_AVATAR='/assets/avatar-male.jpg';
export const SESSION_TTL=30*24*60*60*1000;
const encoder=new TextEncoder();
export function cookieValue(request:Request,name:string){return request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)||'';}
export function cookie(request:Request,name:string,value:string,maxAge:number){return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
export function addCookie(headers:Record<string,string>,value:string){
 // Web Headers accepts separate Set-Cookie values via append. Callers use responseHeaders() below.
 headers['Set-Cookie']=headers['Set-Cookie']?headers['Set-Cookie']+'\n'+value:value;
}
export function responseHeaders(values:Record<string,string>){const out=new Headers();for(const [key,value] of Object.entries(values)){if(key.toLowerCase()==='set-cookie')for(const c of value.split('\n'))out.append(key,c);else out.set(key,value);}return out;}
export function randomToken(){const bytes=crypto.getRandomValues(new Uint8Array(32));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
export async function tokenHash(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(token))),b=>b.toString(16).padStart(2,'0')).join('');}
export async function sessionPlayer(request:Request,db:any){
 const token=cookieValue(request,SESSION_COOKIE);if(!/^[a-f0-9]{64}$/.test(token))return null;
 return db.prepare('SELECT players.*,account_sessions.id AS session_id FROM account_sessions JOIN players ON players.id=account_sessions.player_id WHERE account_sessions.id=? AND account_sessions.expires>?').bind(await tokenHash(token),Date.now()).first();
}
export async function revokeSession(request:Request,db:any){const token=cookieValue(request,SESSION_COOKIE);if(/^[a-f0-9]{64}$/.test(token))await db.prepare('DELETE FROM account_sessions WHERE id=?').bind(await tokenHash(token)).run();}
export async function issueSession(request:Request,db:any,headers:Record<string,string>,playerId:string){
 await revokeSession(request,db);const token=randomToken(),now=Date.now();
 await db.batch([db.prepare('DELETE FROM account_sessions WHERE expires<?').bind(now),db.prepare('INSERT INTO account_sessions(id,player_id,created,expires) VALUES(?,?,?,?)').bind(await tokenHash(token),playerId,now,now+SESSION_TTL)]);
 addCookie(headers,cookie(request,SESSION_COOKIE,token,SESSION_TTL/1000));addCookie(headers,cookie(request,ENTRY_COOKIE,'local',SESSION_TTL/1000));
}
export function nickName(value:unknown){return typeof value==='string'?value.normalize('NFKC').trim().replace(/\s+/g,' '):'';}
export function nickKey(value:unknown){return nickName(value).toLowerCase();}
export function validNick(value:string){return value.length>=2&&value.length<=20&&/^[\p{L}\p{N} ._-]+$/u.test(value);}
export function validPassword(value:unknown):value is string{return typeof value==='string'&&value.length>=8&&value.length<=128&&encoder.encode(value).byteLength<=512;}
const ITERATIONS=100000;
export async function passwordHash(password:string,salt:string,iterations=ITERATIONS){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);const bytes=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export async function createPassword(password:string){const salt=randomToken();return {salt,hash:await passwordHash(password,salt),iterations:ITERATIONS};}
export async function verifyPassword(password:string,credential:any){
 // Unknown users pay the same PBKDF2 cost. No fast username-existence oracle on login.
 const salt=credential?.salt||'60fe4bfc21ce7f8a2a8c33ee9d7e2d81',iterations=credential?.iterations||ITERATIONS;
 const actual=await passwordHash(password,salt,iterations),expected=credential?.password_hash||'0'.repeat(64);let diff=actual.length^expected.length;
 for(let i=0;i<64;i++)diff|=(actual.charCodeAt(i)||0)^(expected.charCodeAt(i)||0);return diff===0&&!!credential;
}
