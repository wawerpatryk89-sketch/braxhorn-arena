/* Shared ICE configuration and incremental candidates for game and audio. */
(()=>{'use strict';
const fallback={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}],relayAvailable:false};
async function configure(room){const c=new AbortController(),timer=setTimeout(()=>c.abort(),6500);try{const r=await fetch('/api/rtc',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:room.code,token:room.token}),signal:c.signal});if(!r.ok)throw Error();return await r.json();}catch{return fallback;}finally{clearTimeout(timer);}}
function signaling(pc,onUpdate){
 let description=null,closed=false;const candidates=[],seen=new Set();
 pc.onicecandidate=e=>{if(closed)return;if(e.candidate&&candidates.length<24)candidates.push(e.candidate.toJSON?e.candidate.toJSON():e.candidate);onUpdate?.();};
 async function publish(value){candidates.length=0;await pc.setLocalDescription(value);if(!closed){description={type:pc.localDescription.type,sdp:pc.localDescription.sdp};onUpdate?.();}}
 async function add(remote){if(!pc.remoteDescription||closed)return;for(const c of (Array.isArray(remote?.candidates)?remote.candidates:[]).slice(0,24)){if(!c||typeof c.candidate!=='string'||c.candidate.length>2000)continue;const key=JSON.stringify(c);if(seen.has(key))continue;try{await pc.addIceCandidate(c);seen.add(key);}catch{}}}
 return{publish,add,get signal(){return description?{...description,candidates:candidates.slice()}:null;},close(){closed=true;pc.onicecandidate=null;}};
}
window.BRAX_RTC={configure,signaling,fallback};
})();
