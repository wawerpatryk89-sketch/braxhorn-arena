import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('game/assets/combat.js','utf8');
const parse=(pattern)=>Function('return ('+source.match(pattern)[1]+')')();
const attacks=parse(/const SOURCE_ATTACKS=(\{[^;]+\});/);
const movement=parse(/function sourceMoveSpeed[^\n]*\*\((\{[^}]+\})\[who\]/);
const throws=parse(/z\.hp-\((\{[^}]+\})\[krovName\(a\)\]/);
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const display=n=>n==='BEAR'?'MIŚ':n==='DEMON'?'AZRAK':n;
const styles={BEAR:'SIŁA · WALKA W ZWARCIU',DEMON:'AKROBATYKA · KOPNIĘCIA',BRAX:'BOKS · KICKBOXING',NYXA:'TECHNICZNE MUAY THAI',VEXA:'TAEKWONDO · KICKBOXING',KROV:'MUAY THAI',NINA:'CAPOEIRA',DANNY:'KICKBOXING'};
const labels=['SIŁA CIOSÓW','SZYBKOŚĆ','ZASIĘG','MOBILNOŚĆ','KLINCZ / RZUTY'];
const descriptions=['Najmocniejszy podstawowy atak','Średni czas do pierwszego trafienia','Najdalszy aktywny zasięg podstawowego ataku','Prędkość poruszania się do przodu','Obrażenia skutecznego rzutu'];
const total=c=>[...new Map(Object.values(c.hits||{}).map(h=>[h.group,h.damage])).values()].reduce((a,b)=>a+b,0);
const data={};
for(const who of names){
 const cfg=JSON.parse(fs.readFileSync('game/assets/'+who.toLowerCase()+'-new/config.json'));
 const moves=attacks[who].map(a=>cfg[a]);assert(moves.every(c=>c?.attack));
 const startup=moves.map(c=>{const first=Math.min(...Object.keys(c.hits).map(Number));return c.durations.slice(0,first).reduce((n,d,i)=>n+d/((c.playbackRate||1)*(c.phaseTempo&&i<c.phaseTempo.first?c.phaseTempo.startup:1)*(who==='NINA'?.93:1)),0);});
 const reach=Math.max(...moves.flatMap(c=>Object.entries(c.hits).map(([frame,h])=>{const pivot=c.pivots?.[frame]??c.pivotX;return (h.box[0]+h.box[2]-(typeof pivot==='number'?pivot:c.pivotX))*c.scale;})));
 data[who]={style:styles[who],raw:[Math.max(...moves.map(total)),1000/(startup.reduce((a,b)=>a+b,0)/startup.length),reach,(movement[who]||.60)*(who==='NINA'?.93:1),cfg.THROW_ATTACKER&&!['NINA','DANNY'].includes(who)?(throws[who]||12):0]};
}
const maxima=labels.map((_,i)=>Math.max(...names.map(n=>data[n].raw[i])));
let html=fs.readFileSync('game/index.html','utf8');
for(const who of names){
 const values=data[who].raw.map((v,i)=>v?Math.max(1,Math.round(v/maxima[i]*10)):0);data[who].values=values;
 const details='<div class="fighter-card-details"><div class="fighter-card-heading"><strong class="fighter-card-name">'+display(who)+'</strong><small class="fighter-card-style">'+styles[who]+'</small></div><div class="fighter-stats">'+values.map((value,i)=>'<div class="fighter-stat" title="'+descriptions[i]+' · skala względem najlepszego zawodnika w tej cesze"><span>'+labels[i]+'</span><b>'+value+'<small>/10</small></b><i role="meter" aria-label="'+labels[i]+'" aria-valuemin="0" aria-valuemax="10" aria-valuenow="'+value+'">'+Array.from({length:10},(_,j)=>'<em class="stat-segment'+(j<value?' filled':'')+'" style="--segment:'+j+'"></em>').join('')+'</i></div>').join('')+'</div><small class="stat-caption">PORÓWNANIE ZAWODNIKÓW</small></div>';
 const re=new RegExp('(<button id="card-'+who.toLowerCase()+'"[\\s\\S]*?)(<span class="roster-badge")');assert(re.test(html));
 html=html.replace(re,(_,start,badge)=>start.replace(/aria-label="[^"]*"/,'aria-label="Wybierz '+display(who)+'. '+styles[who]+'"').replace(/<div class="fighter-card-details">[\s\S]*$/,'')+details+badge);
}
fs.writeFileSync('game/index.html',html);
fs.writeFileSync('docs/fighter-stat-method.json',JSON.stringify({scale:'10 = najwyższa wartość w aktualnym składzie; zaokrąglenie do pełnego segmentu. Nie zmienia parametrów walki.',labels,descriptions,maxima,data},null,2)+'\n');
console.log('Premium stats generated from the current combat configuration for all fighters.');
