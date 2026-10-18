/* Frame/input transport. HTTPS retains room authorization and result persistence. */
(()=>{'use strict';
// Lossless wire format: effect numbers retain IEEE-754 doubles; no particles or stains are removed.
const effectFields=['x','y','px','py','vx','vy','life','total','floor','r','gravity'];
function encodePacket(packet){
 const b=packet.data?.blood;
 if(packet.type!=='state'||!b||!Array.isArray(b.stains)||!Array.isArray(b.particles)||b.stains.length>100||b.particles.length>96)return JSON.stringify(packet);
 const colors=[...new Set(b.particles.map(p=>p.color))];
 if(!b.stains.every(p=>Object.keys(p).every(k=>['x','y','r'].includes(k))&&[p.x,p.y,p.r].every(Number.isFinite))||!b.particles.every(p=>Object.keys(p).every(k=>effectFields.includes(k)||k==='color')&&effectFields.every(k=>Number.isFinite(p[k]))&&typeof p.color==='string'))return JSON.stringify(packet);
 const {stains,particles,...rest}=b;
 const head=new TextEncoder().encode(JSON.stringify({...packet,data:{...packet.data,blood:rest},effects:{stains:stains.length,particles:particles.length,colors}}));
 const out=new ArrayBuffer(8+head.length+stains.length*24+particles.length*(effectFields.length*8+2)),v=new DataView(out);
 v.setUint32(0,0x42525831);v.setUint32(4,head.length);new Uint8Array(out,8,head.length).set(head);let offset=8+head.length;
 for(const s of stains)for(const k of ['x','y','r']){v.setFloat64(offset,s[k],true);offset+=8;}
 for(const p of particles){for(const k of effectFields){v.setFloat64(offset,p[k],true);offset+=8;}v.setUint16(offset,colors.indexOf(p.color),true);offset+=2;}
 return out;
}
function decodePacket(raw){
 if(typeof raw==='string'){if(raw.length>262144)throw Error('Invalid state size');return JSON.parse(raw);}
 if(!(raw instanceof ArrayBuffer)||raw.byteLength<8||raw.byteLength>262144)throw Error('Invalid state');
 const v=new DataView(raw),length=v.getUint32(4);if(v.getUint32(0)!==0x42525831||length>raw.byteLength-8)throw Error('Invalid state');
 const p=JSON.parse(new TextDecoder().decode(new Uint8Array(raw,8,length))),e=p.effects;
 if(p.type!=='state'||!p.data?.blood||!e||!Number.isInteger(e.stains)||e.stains<0||e.stains>100||!Number.isInteger(e.particles)||e.particles<0||e.particles>96||!Array.isArray(e.colors)||e.colors.length>96||!e.colors.every(c=>typeof c==='string')||8+length+e.stains*24+e.particles*(effectFields.length*8+2)!==raw.byteLength)throw Error('Invalid effects');
 let offset=8+length;const read=()=>{const n=v.getFloat64(offset,true);offset+=8;if(!Number.isFinite(n))throw Error('Invalid number');return n;};
 p.data.blood.stains=Array.from({length:e.stains},()=>({x:read(),y:read(),r:read()}));
 p.data.blood.particles=Array.from({length:e.particles},()=>{const n={};for(const k of effectFields)n[k]=read();const i=v.getUint16(offset,true);offset+=2;if(i>=e.colors.length)throw Error('Invalid color');n.color=e.colors[i];return n;});delete p.effects;return p;
}
function create({host,onState,onInput,rtc,onSignal}){
 if(!window.RTCPeerConnection)return null;
 const pc=new RTCPeerConnection({iceServers:rtc?.iceServers||window.BRAX_RTC.fallback.iceServers}),seen={state:0,input:0};
 const negotiation=window.BRAX_RTC.signaling(pc,onSignal);
 let restartTimer=null,restarts=0,restarting=false;
 let binary=false,channel=null,busy=false,closed=false,serial=0,lastMessage=-Infinity,lastPing=-Infinity,pendingPing=null,rtt=null,route=null,checkingRoute=false;
 function bind(c){channel=c;c.binaryType='arraybuffer';c.onmessage=e=>{try{const p=decodePacket(e.data);if(p.wire===1)binary=true;if(p.type==='ping'&&Number.isFinite(p.at)){if(c.readyState==='open'&&c.bufferedAmount===0)c.send(JSON.stringify({type:'pong',at:p.at,wire:1}));return;}if(p.type==='pong'){if(p.at===pendingPing){rtt=Math.max(0,performance.now()-pendingPing);pendingPing=null;}return;}if(!['state','input'].includes(p.type)||!Number.isSafeInteger(p.seq)||p.seq<=seen[p.type])return;seen[p.type]=p.seq;lastMessage=performance.now();if(host&&p.type==='input')onInput(p.data);if(!host&&p.type==='state')onState(p.data);}catch{}};}
 async function inspectRoute(){if(checkingRoute||closed||!pc.getStats)return;checkingRoute=true;try{const stats=await pc.getStats();let pair;stats.forEach(s=>{if(s.type==='transport'&&s.selectedCandidatePairId)pair=stats.get(s.selectedCandidatePairId);});if(!pair)stats.forEach(s=>{if(s.type==='candidate-pair'&&s.state==='succeeded'&&s.nominated)pair=s;});if(pair){const local=stats.get(pair.localCandidateId),remote=stats.get(pair.remoteCandidateId);route=local?.candidateType==='relay'||remote?.candidateType==='relay'?'relay':'direct';}}catch{}finally{checkingRoute=false;}}
 function recover(){if(closed||!host||restarting||restarts>=3||pc.connectionState==='connected')return;restarting=true;restarts++;Promise.resolve(pc.createOffer({iceRestart:true})).then(negotiation.publish).catch(()=>{}).finally(()=>{restarting=false;if(!closed&&pc.connectionState!=='connected')restartTimer=setTimeout(recover,8000);});}
 pc.onconnectionstatechange=()=>{clearTimeout(restartTimer);restartTimer=null;if(pc.connectionState==='connected'){restarts=0;return;}if(host&&['failed','disconnected'].includes(pc.connectionState))restartTimer=setTimeout(recover,pc.connectionState==='failed'?0:3000);};
 pc.ondatachannel=e=>bind(e.channel);
 if(host){bind(pc.createDataChannel('arena',{ordered:false,maxRetransmits:0}));pc.createOffer().then(negotiation.publish).catch(()=>{});}
 return{get signal(){return negotiation.signal;},get open(){return channel?.readyState==='open';},get route(){return route;},get rtt(){return rtt;},get alive(){return channel?.readyState==='open'&&performance.now()-lastMessage<750;},
  async accept(s){if(closed||busy||!s||typeof s.sdp!=='string'||s.sdp.length>16000||s.type!==(host?'answer':'offer'))return;busy=true;try{if(!pc.remoteDescription||pc.remoteDescription.sdp!==s.sdp){await pc.setRemoteDescription({type:s.type,sdp:s.sdp});if(!host)await negotiation.publish(await pc.createAnswer());}await negotiation.add(s);}catch{}finally{busy=false;}},
  send(type,data){if(closed||channel?.readyState!=='open'||channel.bufferedAmount>0)return false;try{channel.send(binary?encodePacket({type,seq:++serial,sentAt:performance.now(),data}):JSON.stringify({type,seq:++serial,sentAt:performance.now(),data}));const now=performance.now();if(now-lastPing>=1000){lastPing=pendingPing=now;inspectRoute();channel.send(JSON.stringify({type:'ping',at:now,wire:1}));}return true;}catch{return false;}},
  close(){closed=true;clearTimeout(restartTimer);pc.onconnectionstatechange=null;negotiation.close();channel?.close();pc.close();}
 };
}
window.BRAX_PEER={create};
})();
