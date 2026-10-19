/* Opt-in diagnostics only: no simulation writes, asset changes or network sends. */
(()=>{'use strict';
const t=(key,params)=>window.BRAX_I18N.t('content.'+key,params),h=(key,params)=>window.BRAX_I18N.h('content.'+key,params);
const quantile=(xs,p)=>{const a=xs.slice().sort((a,b)=>a-b);return a.length?a[Math.min(a.length-1,Math.floor(a.length*p))]:null;};
function collector(limit=3600){let frames=[],steps=[[],[]],changes=[[],[]],last=null,backwards=[0,0],trace=[],previousSteps=[null,null];
 const push=(a,n)=>{a.push(n);if(a.length>limit)a.shift();};
 return{sample(now,state){if(!state?.active){last=null;previousSteps=[null,null];return;}push(trace,{rafTimestampMs:now,role:state.role,actors:state.actors});if(last&&last.role===state.role&&now>last.now){push(frames,now-last.now);state.actors.forEach((a,i)=>{const b=last.actors[i],dx=Math.abs(a.x-b.x);if(previousSteps[i]!=null)push(changes[i],Math.abs(dx-previousSteps[i]));previousSteps[i]=dx;push(steps[i],dx);if(a.attack&&a.action===b.action&&a.actionId===b.actionId&&a.frame<b.frame)backwards[i]+=b.frame-a.frame;});}last={...state,now};},
 reset(){frames=[];steps=[[],[]];changes=[[],[]];backwards=[0,0];last=null;trace=[];previousSteps=[null,null];},
 report(){const stats=a=>({samples:a.length,p95:quantile(a,.95),max:a.length?Math.max(...a):null});return{clock:'requestAnimationFrame timestamp; foreground active combat only',trace:trace.slice(),fps:frames.length?1000*frames.length/frames.reduce((s,n)=>s+n,0):null,frameMs:stats(frames),actors:steps.map((a,i)=>({stepXArenaPercent:stats(a),stepChangeArenaPercent:stats(changes[i]),rewoundAttackFrames:backwards[i]}))};}};
}
window.BRAX_DIAGNOSTIC_COLLECTOR={create:collector};
let panel=null,output=null,meter=null,lastPaint=0,taps=[],open=false,rafId=null;
const n=(value,d=1)=>Number.isFinite(value)?value.toFixed(d):'—';
function report(){return{schema:1,createdAt:new Date().toISOString(),userAgent:navigator.userAgent,raf:meter?.report(),engine:window.__BRAX_DIAGNOSTICS__?.report(),link:window.BRAX_LINK_DIAGNOSTICS?.()||{role:'offline',pingMs:null}};}
function paint(now){if(!open)return;const engine=window.__BRAX_DIAGNOSTICS__,state=engine?.sample();meter.sample(now,state);if(now-lastPaint>=500){lastPaint=now;const r=report(),m=r.raf,net=r.engine?.network,link=r.link,role=state?.role||link.role;
 output.textContent=[t('diagnostics.title',{role:['host','guest','offline'].includes(role)?t('diagnostics.role.'+role):role}),t('diagnostics.fps',{fps:n(m.fps),frame:n(m.frameMs.p95)}),t('diagnostics.ping',{ping:n(link.pingMs),transport:link.transport||t('diagnostics.none')}),t('diagnostics.jitter',{jitter:n(net?.packetJitterMs?.p95)}),t('diagnostics.input',{input:n(net?.inputToVisibleMs?.p95),samples:net?.inputSamples||0}),t('diagnostics.guestStep',{p95:n(m.actors[1].stepXArenaPercent.p95,3),max:n(m.actors[1].stepXArenaPercent.max,3)}),t('diagnostics.rewound',{count:m.actors[1].rewoundAttackFrames}),t('diagnostics.samples',{count:m.frameMs.samples})].join('\n');
 }rafId=requestAnimationFrame(paint);}
function toggle(){if(open){open=false;panel.remove();cancelAnimationFrame(rafId);return;}open=true;meter=collector();lastPaint=0;panel=document.createElement('aside');panel.id='braxDiagnostics';panel.setAttribute('data-i18n-aria-label','content.diagnostics.label');panel.setAttribute('aria-label',t('diagnostics.label'));panel.style.cssText='position:fixed;z-index:10000;top:env(safe-area-inset-top,0px);left:env(safe-area-inset-left,0px);max-width:95vw;background:#000d;color:#b8ffbc;padding:8px;font:11px/1.35 monospace;pointer-events:auto;border:1px solid #58775b';
 output=document.createElement('pre');output.style.cssText='margin:0;white-space:pre-wrap;pointer-events:none';panel.appendChild(output);
 for(const [label,fn] of [['diagnostics.reset',()=>{meter.reset();window.__BRAX_DIAGNOSTICS__?.reset();}],['diagnostics.json',()=>{const blob=new Blob([JSON.stringify(report(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='braxhorn-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}],['diagnostics.close',toggle]]){const b=document.createElement('button');b.dataset.i18n='content.'+label;b.textContent=t(label);b.style.cssText='font:11px monospace;padding:8px;margin:4px 4px 0 0;color:white;background:#183b20;border:1px solid #58775b';b.addEventListener('click',e=>{e.stopPropagation();fn();});panel.appendChild(b);}
 document.body.appendChild(panel);rafId=requestAnimationFrame(paint);}
// Existing title artwork, roster wordmark or the BRAXHORN text in the fight HUD.
document.addEventListener('pointerup',e=>{const t=e.target;if(t.closest?.('#braxDiagnostics')||t.closest?.('button'))return;if(!t.closest?.('#accountEntry .account-reference, .roster-heading, #combo'))return;const now=performance.now();taps=taps.filter(x=>now-x<2500);taps.push(now);if(taps.length===5){taps=[];toggle();}});
window.addEventListener('brax:language',()=>{lastPaint=0;});
window.BRAX_DIAGNOSTIC_OVERLAY={toggle,report};
})();
