/* Fighter selection on phones: all eight portraits in one row; one tap selects for the active role
   (YOU / OPPONENT). The big card always shows the fighter chosen for that role. */
(()=>{'use strict';
const t=(key,params)=>window.BRAX_I18N.t('content.'+key,params),h=(key,params)=>window.BRAX_I18N.h('content.'+key,params);
const $=id=>document.getElementById(id);
const board=$('rosterBoard'),slot=$('rosterInstruction');if(!board||!slot)return;
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const label=n=>window.BRAX_FIGHTER_NAME?.(n)||n;
const strip=document.createElement('div');strip.id='rosterStrip';strip.setAttribute('role','group');strip.setAttribute('aria-label',t('roster.fighters'));
strip.innerHTML=names.map((n,i)=>`<button type="button" data-index="${i}" aria-label="${label(n)}"><img src="/assets/portraits/${n.toLowerCase()}.webp" alt="" draggable="false"><span>${label(n)}</span></button>`).join('');
slot.after(strip);slot.classList.add('roster-instruction-sr');
function paint(){strip.setAttribute('aria-label',t('roster.fighters'));const s=window.BRAX_ROSTER?.state?.();if(!s)return;const auto=['arcade','tournament','survival'].includes(s.mode);
 strip.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('is-player',s.player===i);b.classList.toggle('is-opponent',!auto&&s.opponent===i);b.setAttribute('aria-pressed',String(s[s.role]===i));});
 strip.dataset.role=s.role;}
strip.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const card=$('card-'+names[+b.dataset.index].toLowerCase());card?.click();requestAnimationFrame(paint);});
for(const id of ['rosterPlayer','rosterOpponent'])$(id)?.addEventListener('click',()=>requestAnimationFrame(paint));
new MutationObserver(()=>requestAnimationFrame(paint)).observe(board,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
const css=document.createElement('style');css.textContent=`
#rosterPrev,#rosterNext{display:none!important}
#rosterTrack{overflow:hidden!important;touch-action:none!important;scroll-behavior:auto}
#rosterTrack .roster-card:not(.ui-focused){visibility:hidden}
.roster-instruction-sr{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap}
#rosterStrip{display:flex;gap:6px;align-items:stretch;flex:1 1 auto;min-width:0;max-width:calc(100% - 150px);overflow:hidden}
#rosterStrip button{position:relative;flex:1 1 0;min-width:0;max-width:64px;aspect-ratio:1;padding:0;border:2px solid #59704c88;border-radius:6px;background:#0b130e;overflow:hidden;touch-action:manipulation}
#rosterStrip img{width:100%;height:100%;object-fit:cover;object-position:center 18%;display:block}
#rosterStrip span{position:absolute;left:0;right:0;bottom:0;padding:1px 0;font:800 9px/1.2 inherit;letter-spacing:.04em;text-align:center;color:#fff;background:linear-gradient(transparent,#000c)}
#rosterStrip button.is-player{border-color:#b9f68a;box-shadow:0 0 0 1px #b9f68a}
#rosterStrip button.is-opponent{border-color:#ff5a4e;box-shadow:0 0 0 1px #ff5a4e}
#rosterStrip button.is-player.is-opponent{border-color:#b9f68a;box-shadow:0 0 0 2px #ff5a4e}
#rosterStrip[data-role=opponent] button[aria-pressed=true]{transform:translateY(-2px)}
#rosterStrip[data-role=player] button[aria-pressed=true]{transform:translateY(-2px)}`;
document.head.appendChild(css);
window.addEventListener('brax:language',paint);paint();window.BRAX_ROSTER_STRIP={paint};
})();
