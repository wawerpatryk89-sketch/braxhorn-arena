/* In-game text and date pads. Any remaining native text/date field (tournament name, participant
   name, fight time) becomes read-only and opens this pad instead of the phone's system keyboard. */
(()=>{'use strict';
const t=(key,params)=>window.BRAX_I18N.t('content.'+key,params),h=(key,params)=>window.BRAX_I18N.h('content.'+key,params);
const css=`#gamePad{position:absolute;inset:0;z-index:240;display:grid;place-items:center;background:#000b;padding:max(10px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}
#gamePad.off{display:none}
#gamePad .gp-card{width:min(760px,100%);max-height:100%;overflow:auto;background:#0b130e;border:1px solid #9adc7b66;border-radius:6px;padding:12px;display:flex;flex-direction:column;gap:8px;color:#e9f4de;font-family:inherit}
#gamePad header{display:flex;align-items:center;justify-content:space-between;gap:10px}
#gamePad h2{margin:0;font-size:16px;letter-spacing:.06em}
#gamePad output{display:block;min-height:40px;padding:8px 12px;border:1px solid #9adc7b88;border-radius:4px;background:#020805;font-size:20px;letter-spacing:.04em;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
#gamePad .gp-row{display:flex;gap:4px;justify-content:center}
#gamePad button{min-height:38px;min-width:0;flex:1 1 0;border:1px solid #59704c99;background:#0d1a11;color:#e5efd9;border-radius:4px;font:700 15px/1 inherit;touch-action:manipulation}
#gamePad button.gp-wide{flex:2 1 0}
#gamePad button.gp-on,#gamePad button.gp-ok{background:#b9f68a;color:#0d1a08;border-color:#d4ffaf}
#gamePad header button{flex:0 0 44px;height:44px}
#gamePad .gp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
@media(max-height:400px){#gamePad button{min-height:32px;font-size:13px}#gamePad output{min-height:34px;font-size:17px;padding:5px 10px}}`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const panel=document.createElement('section');panel.id='gamePad';panel.className='off';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
panel.innerHTML='<div class="gp-card"><header><h2 id="gamePadTitle"></h2><button type="button" data-gp="close" data-i18n-aria-label="content.keyboard.close">×</button></header><output id="gamePadValue" aria-live="polite"></output><div id="gamePadKeys"></div></div>';
(document.getElementById('game')||document.body).appendChild(panel);
const rows={upper:['QWERTYUIOP','ASDFGHJKL','ZXCVBNM','ĄĆĘŁŃÓŚŹŻ'],digits:['1234567890','-._ ']};
let target=null,mode='text',upper=true,numeric=false,draft='',when=null;
const pad=n=>String(n).padStart(2,'0');
const local=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dayLabel=date=>new Intl.DateTimeFormat(window.BRAX_I18N.locale,{weekday:'short',day:'2-digit',month:'2-digit'}).format(date);
function label(){return target?.closest('label')?.childNodes[0]?.textContent?.trim()||target?.getAttribute('aria-label')||target?.placeholder||t(mode==='date'?'keyboard.date':'keyboard.type');}
function key(text,attrs=''){return `<button type="button" ${attrs}>${text}</button>`;}
function draw(){
 const keys=document.getElementById('gamePadKeys'),out=document.getElementById('gamePadValue');
 if(mode==='date'){
  out.textContent=when?`${dayLabel(when)} · ${window.BRAX_I18N.time(when)}`:'—';
  const today=new Date();today.setHours(0,0,0,0);
  const dayButtons=Array.from({length:8},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()+i);const on=when&&d.toDateString()===new Date(when).toDateString();return key(i===0?t('keyboard.today'):i===1?t('keyboard.tomorrow'):dayLabel(d),`data-day="${i}" class="${on?'gp-on':''}"`);}).join('');
  keys.innerHTML=`<div class="gp-grid">${dayButtons}</div><div class="gp-row">${key('− 1 h','data-shift="-60" aria-label="'+h('keyboard.hourBefore')+'"')}${key('− 15 min','data-shift="-15" aria-label="'+h('keyboard.quarterBefore')+'"')}${key('+ 15 min','data-shift="15" aria-label="'+h('keyboard.quarterAfter')+'"')}${key('+ 1 h','data-shift="60" aria-label="'+h('keyboard.hourAfter')+'"')}</div><div class="gp-row">${key(h('keyboard.cancel'),'data-gp="close"')}${key(h('keyboard.save'),'data-gp="ok" class="gp-wide gp-ok"')}</div>`;
  return;
 }
 out.textContent=draft||' ';
 const set=numeric?rows.digits:rows.upper;
 const letters=set.map(r=>`<div class="gp-row">${[...r].map(c=>key(c===' '?'␣':(upper||numeric?c:c.toLocaleLowerCase(window.BRAX_I18N.locale)),`data-char="${c}"`)).join('')}</div>`).join('');
 keys.innerHTML=letters+`<div class="gp-row">${key(numeric?'ABC':'123','data-gp="numeric" aria-label="'+h('keyboard.numeric')+'"')}${key('⇧ '+(upper?'abc':'ABC'),'data-gp="shift" aria-label="'+h('keyboard.shift')+'"')}${key(h('keyboard.space'),'data-char=" " class="gp-wide"')}${key('⌫','data-gp="back" aria-label="'+h('keyboard.backspace')+'"')}${key(h('keyboard.save'),'data-gp="ok" class="gp-wide gp-ok"')}</div>`;
}
function commit(){if(!target)return;target.value=mode==='date'?(when?local(when):target.value):draft.trim();target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));}
function open(input){target=input;mode=input.dataset.gamePad;if(mode==='date'){const v=input.value?new Date(input.value):new Date(Date.now()+3600000);when=isNaN(v)?new Date(Date.now()+3600000):v;when.setMinutes(Math.round(when.getMinutes()/15)*15,0,0);}else{draft=input.value||'';upper=true;numeric=false;}
 document.getElementById('gamePadTitle').textContent=label().toUpperCase();panel.classList.remove('off');draw();panel.querySelector('[data-gp="ok"]')?.focus({preventScroll:true});}
function close(){panel.classList.add('off');target?.focus?.({preventScroll:true});target=null;}
panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!target)return;const max=Number(target.maxLength)>0?Number(target.maxLength):60;
 if(b.dataset.char!==undefined){if(draft.length<max)draft+=upper||numeric?b.dataset.char:b.dataset.char.toLocaleLowerCase(window.BRAX_I18N.locale);draw();return;}
 if(b.dataset.day!==undefined){const d=new Date();d.setHours(when.getHours(),when.getMinutes(),0,0);d.setDate(d.getDate()+Number(b.dataset.day));when=d;draw();return;}
 if(b.dataset.shift!==undefined){when=new Date(when.getTime()+Number(b.dataset.shift)*60000);draw();return;}
 const a=b.dataset.gp;if(a==='close')close();else if(a==='back'){draft=draft.slice(0,-1);draw();}else if(a==='shift'){upper=!upper;draw();}else if(a==='numeric'){numeric=!numeric;draw();}else if(a==='ok'){commit();close();}});
function attach(input){
 if(!input||input.dataset.gamePad||input.dataset.codePad||input.dataset.nativeInput==='true'||input.closest('#accountEntry,#accountRegister,#accountProfile')||input.id==='arenaSearch')return;
 const type=(input.getAttribute('type')||'text').toLowerCase();if(!['text','search','datetime-local','date','time',''].includes(type))return;
 input.dataset.gamePad=type.startsWith('date')||type==='time'?'date':'text';
 if(input.dataset.gamePad==='date'){input.type='text';input.dataset.originalType=type;if(input.value)input.value=input.value.slice(0,16);}
 input.readOnly=true;input.inputMode='none';input.setAttribute('aria-haspopup','dialog');
 input.addEventListener('click',e=>{e.preventDefault();input.blur();open(input);});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(input);}});
}
const scan=root=>root.querySelectorAll?.('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([readonly])').forEach(attach);
scan(document);new MutationObserver(list=>{for(const m of list)for(const n of m.addedNodes)if(n.nodeType===1){if(n.matches?.('input'))attach(n);scan(n);}}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('brax:language',()=>{if(!target||panel.classList.contains('off'))return;document.getElementById('gamePadTitle').textContent=label().toLocaleUpperCase(window.BRAX_I18N.locale);draw();});
window.BRAX_GAME_PAD={attach,open,close};
})();
