// Local stand-in for the Cloudflare deployment: serves game/ and runs the real API handlers
// (arena, duel, tournaments, rtc) against an in-memory SQLite database shaped like D1.
// Usage: node --experimental-strip-types --experimental-sqlite --import ./scripts/local-server-hooks.mjs scripts/local-server.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const port=Number(process.argv[2]||8787);
const sqlite=new DatabaseSync(':memory:');
const migrations=JSON.parse(fs.readFileSync(path.join(root,'backend/drizzle/meta/_journal.json'),'utf8')).entries.map(e=>e.tag);
for(const tag of migrations)for(const sql of fs.readFileSync(path.join(root,'backend/drizzle',tag+'.sql'),'utf8').split('--> statement-breakpoint'))if(sql.trim())sqlite.exec(sql);

const norm=v=>v===undefined?null:typeof v==='boolean'?Number(v):v;
const plain=row=>row?Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==='bigint'?Number(v):v])):row;
class Statement{
 constructor(sql,args=[]){this.sql=sql;this.args=args;}
 bind(...args){return new Statement(this.sql,args.map(norm));}
 run(){const info=sqlite.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(info.changes),last_row_id:Number(info.lastInsertRowid)}};}
 async first(column){const row=plain(sqlite.prepare(this.sql).get(...this.args));return row?(column?row[column]:row):null;}
 async all(){return {success:true,results:sqlite.prepare(this.sql).all(...this.args).map(plain),meta:{}};}
 async raw(){return sqlite.prepare(this.sql).all(...this.args).map(r=>Object.values(plain(r)));}
 exec(){return /^\s*(select|with)\b/i.test(this.sql)&&!/\breturning\b/i.test(this.sql)?{success:true,results:sqlite.prepare(this.sql).all(...this.args).map(plain),meta:{}}:/\breturning\b/i.test(this.sql)?{success:true,results:sqlite.prepare(this.sql).all(...this.args).map(plain),meta:{changes:1}}:this.run();}
}
// D1 runs `.run()` asynchronously; keep the same shape.
Statement.prototype.run=(orig=>function(){return Promise.resolve(orig.call(this));})(Statement.prototype.run);
const runSync=function(){const info=sqlite.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(info.changes),last_row_id:Number(info.lastInsertRowid)}};};
const db={
 prepare:sql=>new Statement(sql),
 async batch(statements){sqlite.exec('BEGIN');try{const out=statements.map(s=>/^\s*(select|with)\b/i.test(s.sql)||/\breturning\b/i.test(s.sql)?{success:true,results:sqlite.prepare(s.sql).all(...s.args).map(plain),meta:{changes:/\breturning\b/i.test(s.sql)?1:0}}:runSync.call(s));sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}},
 async exec(sql){sqlite.exec(sql);return {count:1};}
};

const {handleArena}=await import('../backend/lib/arena-api.ts');
const {handleDuel}=await import('../backend/lib/duel-api.ts');
const {handleTournaments}=await import('../backend/lib/tournament-api.ts');
const {handleRTC}=await import('../backend/lib/rtc-config.ts');
const owner=process.env.BRAX_OWNER_EMAIL||'';
const api={'/api/arena':r=>handleArena(r,db,owner),'/api/duel':r=>handleDuel(r,db,owner),'/api/tournaments':r=>handleTournaments(r,db,owner),'/api/rtc':r=>handleRTC(r,db,{})};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.mp3':'audio/mpeg','.mp4':'video/mp4','.gz':'application/octet-stream','.webmanifest':'application/manifest+json'};

http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost:'+port);
  const handler=api[url.pathname];
  if(handler){
   const chunks=[];for await(const c of req)chunks.push(c);
   const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(typeof v==='string')headers.set(k,v);
   const request=new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
   const response=await handler(request);
   const out={};response.headers.forEach((v,k)=>{out[k]=v;});res.writeHead(response.status,out);res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  let file=path.join(root,'game',decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(path.join(root,'game'))||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('missing');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
 }catch(e){console.error(e);res.writeHead(500);res.end(String(e));}
}).listen(port,()=>console.log('BRAXHORN local server http://localhost:'+port));
