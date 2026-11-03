/* Rules for CPU identity, progression and survival. No renderer or network state. */
(()=>{
'use strict';
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
const roster=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const styles={
 BOSS:{range:.5,retreat:80,pressure:1.2,preferred:['HEAVY_PUNCH','HEAVY_KICK','UPPERCUT'],clinch:0},
 ZOMBIE:{range:.15,retreat:40,pressure:1.05,preferred:['LIGHT_PUNCH','HEAVY_PUNCH','UPPERCUT'],clinch:0},
 BEAR:{range:.30,retreat:300,pressure:.96,preferred:['HEAVY_PUNCH','SHOULDER','UPPERCUT'],clinch:1.2},
 DEMON:{range:.36,retreat:160,pressure:1.06,preferred:['LIGHT_PUNCH','HEAVY_KICK','UPPERCUT'],clinch:1.05},
 BRAX:{range:.20,retreat:100,pressure:1.10,preferred:['HEAVY_PUNCH','DOUBLE_PUNCH','UPPERCUT'],clinch:1.03},
 NYXA:{range:.55,retreat:240,pressure:.95,preferred:['LIGHT_KICK','CLINCH_KNEE','ELBOW'],clinch:.96},
 VEXA:{range:.85,retreat:330,pressure:1.00,preferred:['HEAVY_KICK','SPIN_KICK','FLYING_KICK'],clinch:.88},
 KROV:{range:.10,retreat:80,pressure:1.10,preferred:['ELBOW','UPPERCUT','HEAVY_PUNCH'],clinch:1.08},
 NINA:{range:.65,retreat:280,pressure:.98,preferred:['SPIN_KICK','MEIA_LUA','CRESCENT_KICK','GROUND_KICK'],clinch:.90},
 DANNY:{range:.35,retreat:220,pressure:1.02,preferred:['LIGHT_PUNCH','HEAVY_PUNCH','HOOK'],clinch:.94}
};
function chooseAttack(who,available,last,urgent,firstContact,random=Math.random){
 const s=styles[who]||styles.BRAX,list=available.filter(n=>n!==last);const choices=list.length?list:available;
 if(urgent)return [...choices].sort((a,b)=>firstContact(a)-firstContact(b))[0];
 const weights=choices.map(n=>s.preferred.includes(n)?3:1);let pick=random()*weights.reduce((a,b)=>a+b,0);
 return choices.find((n,i)=>(pick-=weights[i])<0)||choices.at(-1);
}
const challenges=[
 {id:'evade5',category:'defense',title:'Czysty unik',description:'Uniknij 5 ataków w jednym ćwiczeniu.',event:'evade',goal:5,drill:'repeat'},
 {id:'block8',category:'defense',title:'Żelazna garda',description:'Zablokuj 8 trafień. Wybierz zawodnika z gardą — Nina korzysta z uników.',event:'block',goal:8,drill:'repeat',exclude:['NINA']},
 {id:'break3',category:'defense',title:'Wyrwij się',description:'Zerwij 3 chwyty przyciskiem CHWYT w początkowym oknie.',event:'break',goal:3,drill:'grab'},
 {id:'evade10',category:'defense',title:'Nieuchwytny',description:'Uniknij 10 ataków podczas swobodnego sparingu.',event:'evade',goal:10,drill:'spar'},
 {id:'block20',category:'defense',title:'Mur nie do przejścia',description:'Zablokuj 20 trafień podczas sparingu. Nina nie ma gardy.',event:'block',goal:20,drill:'spar',exclude:['NINA']},
 {id:'break6',category:'defense',title:'Poza zasięgiem chwytu',description:'Wydostań się z 6 chwytów w jednym ćwiczeniu.',event:'break',goal:6,drill:'grab'},
 {id:'counter3',category:'attack',title:'Odpowiedź w tempo',description:'Traf 3 razy podczas powrotu rywala po niecelnym ataku.',event:'counter',goal:3,drill:'counter'},
 {id:'push3',category:'attack',title:'Przerwij napór',description:'Uzyskaj 3 mocne odepchnięcia po trafionych seriach.',event:'push',goal:3,drill:'bag'},
 {id:'hits12',category:'attack',title:'Dwanaście trafień',description:'Zadaj 12 czystych trafień podczas sparingu.',event:'hit',goal:12,drill:'spar'},
 {id:'kicks6',category:'attack',title:'Długi dystans',description:'Traf rywala 6 razy kopnięciami podczas sparingu.',event:'kick',goal:6,drill:'spar'},
 {id:'combohits5',category:'attack',title:'Pełna sekwencja',description:'Zadaj 5 trafień z ataku COMBO. Poczekaj na pełne naładowanie energii.',event:'combohit',goal:5,drill:'bag'},
 {id:'counter8',category:'attack',title:'Mistrz kontry',description:'Ukarz 8 niecelnych ataków rywala podczas jego powrotu.',event:'counter',goal:8,drill:'counter'},
 {id:'cleanwin',category:'wins',title:'Bez specjalnego',description:'Wygraj walkę na średnim poziomie bez użycia COMBO.',event:'cleanwin',goal:1},
 {id:'hardwin',category:'wins',title:'Próba mistrza',description:'Wygraj walkę na trudnym poziomie.',event:'hardwin',goal:1,difficulty:'hard'},
 {id:'healthywin',category:'wins',title:'Pełna kontrola',description:'Wygraj walkę i zachowaj co najmniej 60 punktów zdrowia w ostatniej rundzie.',event:'healthywin',goal:1},
 {id:'fastwin',category:'wins',title:'Błyskawiczna wygrana',description:'Wygraj całą walkę w czasie najwyżej 90 sekund aktywnej walki.',event:'fastwin',goal:1},
 {id:'cleanwinhard',category:'wins',title:'Siła podstaw',description:'Wygraj na trudnym poziomie bez użycia COMBO.',event:'cleanwin',goal:1,difficulty:'hard'},
 {id:'healthyhard',category:'wins',title:'Zimna krew',description:'Wygraj na trudnym poziomie z co najmniej 60 punktami zdrowia w ostatniej rundzie.',event:'healthywin',goal:1,difficulty:'hard'},
 {id:'survival3',category:'survival',title:'Pierwsza seria',description:'Pokonaj 3 rywali w jednej serii Survival na średnim poziomie.',event:'survival',goal:3,mode:'survival'},
 {id:'survival5',category:'survival',title:'Piątka bez przerwy',description:'Pokonaj 5 rywali w jednej serii Survival na średnim poziomie.',event:'survival',goal:5,mode:'survival'},
 {id:'survival10',category:'survival',title:'Dziesięciu pokonanych',description:'Pokonaj 10 rywali w jednej serii Survival na średnim poziomie.',event:'survival',goal:10,mode:'survival'},
 {id:'survivalhard3',category:'survival',title:'Stalowa seria',description:'Pokonaj 3 rywali w jednej serii Survival na trudnym poziomie.',event:'survival',goal:3,mode:'survival',difficulty:'hard'},
 {id:'survivalhard5',category:'survival',title:'Ostatni na arenie',description:'Pokonaj 5 rywali w jednej serii Survival na trudnym poziomie.',event:'survival',goal:5,mode:'survival',difficulty:'hard'},
 {id:'survivalhard10',category:'survival',title:'Legenda Survival',description:'Pokonaj 10 rywali w jednej serii Survival na trudnym poziomie.',event:'survival',goal:10,mode:'survival',difficulty:'hard'},
 {id:'bossfinal',category:'wins',title:'Ostatnie starcie',description:'Pokonaj bossa uzbrojonego w kij bejsbolowy.',event:'bosswin',goal:1,difficulty:'hard',opponent:'BOSS'}
];
const number=n=>Number.isFinite(n)?Math.max(0,Math.min(1000000,Math.floor(n))):0;
function createProgress(storage){
 const key='braxhorn.progress.v2',fresh=()=>Object.fromEntries(roster.map(n=>[n,{wins:0,bestSurvival:0,challenges:[]}]))
 const cleanName=n=>String(n||'').normalize('NFKC').replace(/[^\p{L}\p{N} ._-]/gu,'').trim().replace(/\s+/g,' ').slice(0,20);
 let data={version:2,name:'',profiles:Object.create(null),boards:Object.create(null)},saved=!!storage;
 const cleanFighters=input=>Object.fromEntries(roster.map(n=>{const f=input?.[n]||{};return[n,{wins:number(f.wins),bestSurvival:number(f.bestSurvival),challenges:[...new Set((Array.isArray(f.challenges)?f.challenges:[]).filter(id=>challenges.some(c=>c.id===id)))]}]}));
 const cleanRounds=r=>Array.isArray(r)&&r.length===2&&r.every(n=>Number.isInteger(n)&&n>=0&&n<=3)?r.slice():null;
 const validMode=m=>['fight','arcade','tournament','survival',...challenges.map(c=>'challenge:'+c.id)].includes(m);
 function boardKey(mode,difficulty){return mode+'|'+(['easy','normal','hard'].includes(difficulty)?difficulty:'normal');}
 function compare(a,b){return Number(b.completed)-Number(a.completed)||b.score-a.score||a.elapsed-b.elapsed||a.at-b.at;}
 try{const raw=JSON.parse(storage?.getItem(key)||'null');if(raw?.version===2){data.name=cleanName(raw.name);for(const [name,f]of Object.entries(raw.profiles||{}).slice(0,100)){const clean=cleanName(name);if(clean)data.profiles[clean]=cleanFighters(f);}for(const [k,list]of Object.entries(raw.boards||{})){const [mode,difficulty]=k.split('|');if(!validMode(mode)||!Array.isArray(list))continue;data.boards[boardKey(mode,difficulty)]=list.filter(x=>x&&roster.includes(x.fighter)&&cleanName(x.name)).map(x=>({name:cleanName(x.name),fighter:x.fighter,score:number(x.score),targetWins:number(x.targetWins)||5,rounds:cleanRounds(x.rounds),elapsed:Math.max(1,Math.min(86400000,Number(x.elapsed)||1)),completed:!!x.completed,at:Number.isFinite(x.at)?x.at:0,id:String(x.id||'').slice(0,80)})).sort(compare).slice(0,5);}}else{const old=JSON.parse(storage?.getItem('braxhorn.progress.v1')||'null');if(old?.version===1)data.profiles.GRACZ=cleanFighters(old.fighters);}}catch{}
 function current(){return data.profiles[data.name||'GRACZ']||=fresh();}
 function persist(){try{if(!storage?.setItem)throw Error('No storage');storage.setItem(key,JSON.stringify(data));saved=true;}catch{saved=false;}}
 return {get saved(){return saved;},get name(){return data.name;},setName(value){const name=cleanName(value);if(name.length<2)return false;if(!data.name&&data.profiles.GRACZ&&!data.profiles[name]){data.profiles[name]=data.profiles.GRACZ;delete data.profiles.GRACZ;}data.name=name;current();persist();return true;},fighter(n){return JSON.parse(JSON.stringify(current()[n]||current().BRAX));},win(n){if(current()[n]){current()[n].wins++;persist();}},survival(n,score){if(current()[n]){current()[n].bestSurvival=Math.max(current()[n].bestSurvival,number(score));persist();}},complete(n,id){const f=current()[n];if(f&&challenges.some(c=>c.id===id)&&!f.challenges.includes(id)){f.challenges.push(id);persist();return true;}return false;},record(mode,difficulty,result){if(!validMode(mode)||!roster.includes(result.fighter))return false;const k=boardKey(mode,difficulty),rows=data.boards[k]||=[];const previous=rows.findIndex(x=>x.id===result.id);if(previous>=0){if(number(result.score)<=rows[previous].score)return false;rows.splice(previous,1);}rows.push({name:data.name||'GRACZ',fighter:result.fighter,score:number(result.score),targetWins:number(result.targetWins)||5,rounds:cleanRounds(result.rounds),elapsed:Math.max(1,Math.min(86400000,Number(result.elapsed)||1)),completed:!!result.completed,at:Date.now(),id:String(result.id||'').slice(0,80)});rows.sort(compare);data.boards[k]=rows.slice(0,5);persist();return true;},top(mode,difficulty){return JSON.parse(JSON.stringify(data.boards[boardKey(mode,difficulty)]||[]));},snapshot(){return JSON.parse(JSON.stringify(data));}};
}
function createSurvival(player,random=Math.random,limit=10){
 limit=Number.isInteger(limit)&&limit>=1?limit:10;
 let previous=player;const nextOpponent=()=>{const choices=roster.filter(n=>n!==player&&n!==previous);return previous=choices[Math.floor(random()*choices.length)];};
 const run={mode:'survival',player,score:0,hp:100,finished:false,limit,opponent:limit===1?'BOSS':nextOpponent(),history:[],resultApplied:false};
 return Object.assign(run,{next(){return this.finished?null:this.opponent;},result(outcome,hp){if(this.finished||this.resultApplied)return;this.resultApplied=true;this.history.push({opponent:this.opponent,outcome});if(outcome==='win'){this.score++;if(this.opponent==='BOSS'){this.finished=true;this.champion=player;}this.hp=Math.min(100,Math.max(1,Number(hp)||1)+20);}else if(outcome==='draw')this.hp=Math.max(1,Number(hp)||1);else this.finished=true;},advance(){if(this.finished)return false;if(!this.resultApplied)return true;this.resultApplied=false;this.opponent=this.score===this.limit-1?'BOSS':nextOpponent();return true;}});
}
function leaderboard(document,progress){
 if(window.BRAX_ONLINE)return window.BRAX_ONLINE.leaderboard(document,progress);
 const $=id=>document.querySelector('#'+id),mode=$('recordsMode').value||'survival',difficulty=$('recordsDifficulty').value||'normal',rows=progress.top(mode,difficulty),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const time=ms=>Math.floor(ms/60000)+':'+String(Math.floor(ms/1000)%60).padStart(2,'0');
 const result=r=>mode==='survival'?r.score+' zwycięstw':mode==='arcade'?(r.completed?'Ukończone · ':'')+r.score+'/'+(r.targetWins||5):mode==='tournament'?(r.completed?'Mistrz':'Zakończone')+' · '+r.score+' wygr.':mode.startsWith('challenge:')?'Ukończone':r.rounds?r.rounds.join(' : '):'Wygrana · przewaga '+r.score+' rund';
 $('leaderboard').innerHTML=rows.length?'<table><thead><tr><th>#</th><th>Imię / pseudonim</th><th>Postać</th><th>Wynik</th><th>Czas</th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+escape(r.name)+'</td><td>'+escape(displayFighterName(r.fighter))+'</td><td>'+result(r)+'</td><td>'+time(r.elapsed)+'</td></tr>').join('')+'</tbody></table>':'<p>Brak zapisanych wyników w tej kategorii. Rozegraj pierwszą serię.</p>';
 $('rankingNote').textContent='TOP 5 na tym urządzeniu · '+(progress.name||'GRACZ')+'. '+(mode==='tournament'?'Najpierw tytuł, potem wygrane i średni czas walki.':mode.startsWith('challenge:')?'Wygrywa krótszy czas ukończenia.':'Najpierw wynik, przy remisie krótszy czas.');
}
function challengeCard(c,done=false,index=0){return '<span class="challenge-top"><b>'+String(index+1).padStart(2,'0')+'</b><small>'+(done?'UKOŃCZONE ✓':c.drill?'TRENING TECHNIKI':'PRÓBA WALKI')+'</small></span><strong>'+c.title+'</strong><span class="challenge-description">'+c.description+'</span><span class="challenge-bottom"><span>CEL · '+c.goal+'</span><b>'+(done?'POWTÓRZ':'ROZPOCZNIJ')+' →</b></span>';}
function records(progress){return roster.map(who=>{const f=progress.fighter(who),available=challenges.filter(c=>!(c.exclude||[]).includes(who)),done=available.filter(c=>f.challenges.includes(c.id)).length;return '<article class="progress-card"><img src="/assets/portraits/'+who.toLowerCase()+'.webp" alt="'+displayFighterName(who)+'"><header><b>'+displayFighterName(who)+'</b><small>'+done+'/'+available.length+' WYZWAŃ</small></header><div class="ui-progress" role="progressbar" aria-label="Wyzwania" aria-valuenow="'+done+'" aria-valuemax="'+available.length+'"><i style="width:'+done/available.length*100+'%"></i></div><div class="progress-numbers"><span><strong>'+f.wins+'</strong>'+((window.BRAX_UI?.plural(f.wins,'zwycięstwo','zwycięstwa','zwycięstw'))||'WYGRANE')+'</span><span><strong>'+f.bestSurvival+'</strong>REKORD SURVIVAL</span></div><div class="progress-medals">'+available.map(c=>'<span class="'+(f.challenges.includes(c.id)?'earned':'')+'" title="'+c.title+'" aria-label="'+c.title+': '+(f.challenges.includes(c.id)?'ukończone':'nieukończone')+'">'+(f.challenges.includes(c.id)?'✓':'·')+'</span>').join('')+'</div></article>';}).join('');}
window.BRAX_FEATURES={challengeCard,records,roster,styles,chooseAttack,challenges,createProgress,createSurvival,leaderboard};
})();
