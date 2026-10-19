import {uiErrorBody,uiFailure} from './ui-errors';
const basic=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}];
const cache=new Map<string,{expires:number,data:any}>();
export async function handleRTC(request:Request,db:any,config:any={}){
 const headers={'Cache-Control':'no-store','Vary':'Cookie'};
 const reply=(data:any,status=200)=>Response.json(data,{status,headers});
 try{
  const origin=request.headers.get('origin');
  if(request.method!=='POST')return reply(uiErrorBody(uiFailure('unknown_action'),'unknown_action'),405);
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return reply(uiErrorBody(uiFailure('request_origin_short'),'request_origin_short'),403);
  const raw=await request.text();if(raw.length>1024)return reply(uiErrorBody(uiFailure('data_too_large'),'data_too_large'),413);
  let body;try{body=JSON.parse(raw);}catch{return reply(uiErrorBody(uiFailure('data_invalid'),'data_invalid'),400);}
  if(!body||!/^[A-F0-9]{8}$/.test(body.code)||typeof body.token!=='string')return reply(uiErrorBody(uiFailure('room_invalid'),'room_invalid'),400);
  const room=await db.prepare("SELECT host_key,guest_key FROM duel_rooms WHERE code=? AND expires>? AND status<>'closed'").bind(body.code,Date.now()).first();
  if(!room||![room.host_key,room.guest_key].filter(Boolean).includes(body.token))return reply(uiErrorBody(uiFailure('room_forbidden'),'room_forbidden'),403);
  if(config.BRAX_METERED_TURN_USERNAME&&config.BRAX_METERED_TURN_PASSWORD){
   return reply({relayAvailable:true,provider:'metered',iceServers:[
    {urls:'stun:stun.relay.metered.ca:80'},
    {urls:['turn:standard.relay.metered.ca:80','turn:standard.relay.metered.ca:80?transport=tcp','turn:standard.relay.metered.ca:443','turns:standard.relay.metered.ca:443?transport=tcp'],username:config.BRAX_METERED_TURN_USERNAME,credential:config.BRAX_METERED_TURN_PASSWORD}
   ]});
  }
  if(!config.BRAX_TURN_KEY_ID||!config.BRAX_TURN_API_TOKEN)return reply({iceServers:basic,relayAvailable:false,reason:'relay_not_configured',reasonCode:'relay_not_configured',reasonParams:{}});
  const existing=cache.get(body.token);if(existing&&existing.expires>Date.now())return reply(existing.data);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
  try{
   const response=await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/'+encodeURIComponent(config.BRAX_TURN_KEY_ID)+'/credentials/generate-ice-servers',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.BRAX_TURN_API_TOKEN},body:JSON.stringify({ttl:3600}),signal:controller.signal});
   if(!response.ok)throw Error('relay');
   const result:any=await response.json();
   const iceServers=(result.iceServers||[]).map((s:any)=>({urls:(Array.isArray(s.urls)?s.urls:[s.urls]).filter((u:any)=>typeof u==='string'&&/^(stun|turn|turns):/.test(u)&&!/:53(?:\?|$)/.test(u)),...(s.username?{username:s.username,credential:s.credential}:{})})).filter((s:any)=>s.urls.length);
   if(!iceServers.some((s:any)=>s.urls.some((u:string)=>/^turns?:/.test(u))))throw Error('relay');
   const data={iceServers,relayAvailable:true};
   for(const [key,value] of cache)if(value.expires<=Date.now())cache.delete(key);
   if(cache.size>=200)cache.delete(cache.keys().next().value!);
   cache.set(body.token,{expires:Date.now()+1800000,data});return reply(data);
  }finally{clearTimeout(timer);}
 }catch{return reply({iceServers:basic,relayAvailable:false,reason:'relay_unavailable',reasonCode:'relay_unavailable',reasonParams:{}});}
}
