import fs from 'node:fs';
import assert from 'node:assert/strict';
// Read the same six-action roster and configuration used by combat, never illustrated ratings.
const combat=fs.readFileSync('game/assets/combat.js','utf8');
const attacks=Function('return ('+combat.match(/const SOURCE_ATTACKS=(\{[^;]+\});/)[1]+')')();
const styles={BRAX:'BOKS · KICKBOXING',NYXA:'TECHNICZNE MUAY THAI',VEXA:'TAEKWONDO · KICKBOXING',KROV:'MUAY THAI',NINA:'CAPOEIRA',DANNY:'KICKBOXING'};
const labels={
 'Jab Cross (1)':'Jab–cross','Jab Cross':'Jab–cross','Body Jab Cross':'Proste na korpus','Lead Jab':'Jab',
 'Hook':'Sierpowy','Hook Punch':'Sierpowy','Punching':'Cios pięścią','Boxing':'Cios bokserski','Boxing (1)':'Seria bokserska','Boxing (2)':'Dwa proste',
 'Mma Kick':'Kopnięcie MMA','Mma Kick (1)':'Kopnięcie MMA','Mma Kick (1) (2)':'Mocne kopnięcie MMA','Kicking':'Mocne kopnięcie','Kicking (2)':'Kopnięcie frontalne',
 'Illegal Elbow Punch':'Łokieć','Illegal Knee':'Kolano','Uppercut':'Podbródkowy','Side Kick':'Kopnięcie boczne',
 'Roundhouse Kick (1)':'Kopnięcie okrężne','Flying Kick':'Kopnięcie z wyskoku','Martelo Do Chau Sem Mao':'Martelo z ziemi',
 'Uppercut Jab':'Podbródkowy + jab','Punch To Elbow Combo':'Pięści + łokcie','Martelo Do Chau':'Martelo z ziemi','Elbow Uppercut Combo':'Łokieć + podbródkowy','Elbow Punching':'Łokcie','Capoeira (1)':'Seria capoeiry'
};
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const name=s=>labels[s]||s;
let html=fs.readFileSync('game/index.html','utf8');
for(const [who,style] of Object.entries(styles)){
 const cfg=JSON.parse(fs.readFileSync('game/assets/'+who.toLowerCase()+'-new/config.json'));
 const moves=attacks[who];assert.equal(moves.length,who==='NINA'?8:6);
 for(const action of moves)assert(cfg[action]?.attack,who+': unavailable '+action);
 assert(cfg.BLOCK&&cfg.LEAN&&cfg.COMBO?.attack);
 const defense=who==='NINA'?'Ginga · unik · obrót w tył':'Blok · unik';
 const throws=cfg.THROW_ATTACKER?'Rzut przez bark':'Bez rzutu';
 const combo=who==='NINA'?cfg.COMBO.label:cfg.COMBO.sequence.map(s=>name(s.clip)).join(' → ');
 const total=c=>[...new Map(Object.values(c.hits||{}).map(h=>[h.group,h.damage])).values()].reduce((a,b)=>a+b,0);
 const strongest=bone=>Math.max(0,...moves.filter(a=>Object.values(cfg[a].hits||{}).every(h=>bone.test(h.bone||''))).map(a=>total(cfg[a])));
 const values=[['PIĘŚCI',strongest(/Hand$/)],['KOPNIĘCIA',strongest(/Foot$/)],['COMBO',total(cfg.COMBO)]];
 const details='<div class="fighter-card-details"><strong class="fighter-card-name">'+who+'</strong><small class="fighter-card-style">'+style+'</small><div class="fighter-stats">'+values.map(([label,value])=>'<div class="fighter-stat"><span>'+label+'</span><b aria-hidden="true">'+(value?'':'—')+'</b><i role="meter" aria-label="'+label+(value?': maksymalne obrażenia pełnego ataku':': brak tej techniki w zestawie')+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+value+'"><em style="width:'+Math.min(100,value)+'%"></em></i></div>').join('')+'</div></div>';

 const re=new RegExp('(<button id="card-'+who.toLowerCase()+'"[\\s\\S]*?)(<span class="roster-badge")');
 assert(re.test(html));
 html=html.replace(re,(_,start,badge)=>start.replace(/<div class="fighter-card-details">[\s\S]*$/,'').replace(/aria-label="[^"]*"/,'aria-label="'+escape('Wybierz '+who+'. '+style+'. Ataki: '+moves.map(a=>name(cfg[a].label)).join(', ')+'. '+defense+'. '+throws+'. Combo: '+combo)+ '"')+details+badge);
}
fs.writeFileSync('game/index.html',html);
console.log('Cards: real full-attack damage bars, shared 100 HP scale, all six fighters.');
