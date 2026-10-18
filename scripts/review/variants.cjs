const fs=require('node:fs');
const baseline=JSON.parse(fs.readFileSync('docs/review-v147/before/balance.json'));
const reference=baseline.rows.filter(r=>!['NINA','BEAR','DEMON'].includes(r.who)).reduce((s,r)=>s+r.meanDps,0)/5;
function apply(g,variant){const parameters={};for(const who of ['BEAR','DEMON']){const cfg=g.context[who+'_3D'].config,actions=g.context.__REVIEW__.SOURCE_ATTACKS[who],rows=baseline.actions.filter(r=>r.who===who);let factor;
if(variant==='A')factor=reference/(rows.reduce((s,r)=>s+r.dps,0)/rows.length);
if(variant==='B'){let lo=1,hi=30;for(let i=0;i<60;i++){const mid=(lo+hi)/2,dps=rows.reduce((s,r)=>s+r.damage*1000/(r.duration+r.recovery*(mid-1)),0)/rows.length;if(dps>reference)lo=mid;else hi=mid;}factor=(lo+hi)/2;}
parameters[who]={variant,factor,reference};for(const action of actions){const c=cfg[action];if(!c?.attack)continue;if(variant==='A'){for(const hit of Object.values(c.hits))hit.damage=Math.max(1,Math.round(hit.damage*factor));}else if(variant==='B'){const frames=Object.keys(c.hits).map(Number);c.phaseTempo??={first:Math.min(...frames),last:Math.max(...frames),startup:1,recovery:1};c.phaseTempo.recovery/=factor*(who==='BEAR'&&action==='SHOULDER'?2:1);}}}return parameters;}
module.exports={apply,reference};
