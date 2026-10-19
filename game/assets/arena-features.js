/* Rules for CPU identity, progression and survival. No renderer or network state. */
(()=>{
'use strict';
const t=(key,params)=>window.BRAX_I18N.t('content.'+key,params),h=(key,params)=>window.BRAX_I18N.h('content.'+key,params);
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
const roster=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const styles={
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
 {id:'evade5',category:'defense',get title(){return t('challenge.evade5.title');},get description(){return t('challenge.evade5.description');},event:'evade',goal:5,drill:'repeat'},
 {id:'block8',category:'defense',get title(){return t('challenge.block8.title');},get description(){return t('challenge.block8.description');},event:'block',goal:8,drill:'repeat',exclude:['NINA']},
 {id:'break3',category:'defense',get title(){return t('challenge.break3.title');},get description(){return t('challenge.break3.description');},event:'break',goal:3,drill:'grab'},
 {id:'evade10',category:'defense',get title(){return t('challenge.evade10.title');},get description(){return t('challenge.evade10.description');},event:'evade',goal:10,drill:'spar'},
 {id:'block20',category:'defense',get title(){return t('challenge.block20.title');},get description(){return t('challenge.block20.description');},event:'block',goal:20,drill:'spar',exclude:['NINA']},
 {id:'break6',category:'defense',get title(){return t('challenge.break6.title');},get description(){return t('challenge.break6.description');},event:'break',goal:6,drill:'grab'},
 {id:'counter3',category:'attack',get title(){return t('challenge.counter3.title');},get description(){return t('challenge.counter3.description');},event:'counter',goal:3,drill:'counter'},
 {id:'push3',category:'attack',get title(){return t('challenge.push3.title');},get description(){return t('challenge.push3.description');},event:'push',goal:3,drill:'bag'},
 {id:'hits12',category:'attack',get title(){return t('challenge.hits12.title');},get description(){return t('challenge.hits12.description');},event:'hit',goal:12,drill:'spar'},
 {id:'kicks6',category:'attack',get title(){return t('challenge.kicks6.title');},get description(){return t('challenge.kicks6.description');},event:'kick',goal:6,drill:'spar'},
 {id:'combohits5',category:'attack',get title(){return t('challenge.combohits5.title');},get description(){return t('challenge.combohits5.description');},event:'combohit',goal:5,drill:'bag'},
 {id:'counter8',category:'attack',get title(){return t('challenge.counter8.title');},get description(){return t('challenge.counter8.description');},event:'counter',goal:8,drill:'counter'},
 {id:'cleanwin',category:'wins',get title(){return t('challenge.cleanwin.title');},get description(){return t('challenge.cleanwin.description');},event:'cleanwin',goal:1},
 {id:'hardwin',category:'wins',get title(){return t('challenge.hardwin.title');},get description(){return t('challenge.hardwin.description');},event:'hardwin',goal:1,difficulty:'hard'},
 {id:'healthywin',category:'wins',get title(){return t('challenge.healthywin.title');},get description(){return t('challenge.healthywin.description');},event:'healthywin',goal:1},
 {id:'fastwin',category:'wins',get title(){return t('challenge.fastwin.title');},get description(){return t('challenge.fastwin.description');},event:'fastwin',goal:1},
 {id:'cleanwinhard',category:'wins',get title(){return t('challenge.cleanwinhard.title');},get description(){return t('challenge.cleanwinhard.description');},event:'cleanwin',goal:1,difficulty:'hard'},
 {id:'healthyhard',category:'wins',get title(){return t('challenge.healthyhard.title');},get description(){return t('challenge.healthyhard.description');},event:'healthywin',goal:1,difficulty:'hard'},
 {id:'survival3',category:'survival',get title(){return t('challenge.survival3.title');},get description(){return t('challenge.survival3.description');},event:'survival',goal:3,mode:'survival'},
 {id:'survival5',category:'survival',get title(){return t('challenge.survival5.title');},get description(){return t('challenge.survival5.description');},event:'survival',goal:5,mode:'survival'},
 {id:'survival10',category:'survival',get title(){return t('challenge.survival10.title');},get description(){return t('challenge.survival10.description');},event:'survival',goal:10,mode:'survival'},
 {id:'survivalhard3',category:'survival',get title(){return t('challenge.survivalhard3.title');},get description(){return t('challenge.survivalhard3.description');},event:'survival',goal:3,mode:'survival',difficulty:'hard'},
 {id:'survivalhard5',category:'survival',get title(){return t('challenge.survivalhard5.title');},get description(){return t('challenge.survivalhard5.description');},event:'survival',goal:5,mode:'survival',difficulty:'hard'},
 {id:'survivalhard10',category:'survival',get title(){return t('challenge.survivalhard10.title');},get description(){return t('challenge.survivalhard10.description');},event:'survival',goal:10,mode:'survival',difficulty:'hard'}
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
function createSurvival(player,random=Math.random){
 let previous=player;const nextOpponent=()=>{const choices=roster.filter(n=>n!==player&&n!==previous);return previous=choices[Math.floor(random()*choices.length)];};
 const run={mode:'survival',player,score:0,hp:100,finished:false,opponent:nextOpponent(),history:[],resultApplied:false};
 return Object.assign(run,{next(){return this.finished?null:this.opponent;},result(outcome,hp){if(this.finished||this.resultApplied)return;this.resultApplied=true;this.history.push({opponent:this.opponent,outcome});if(outcome==='win'){this.score++;this.hp=Math.min(100,Math.max(1,Number(hp)||1)+20);}else if(outcome==='draw')this.hp=Math.max(1,Number(hp)||1);else this.finished=true;},advance(){if(this.finished)return false;if(!this.resultApplied)return true;this.resultApplied=false;this.opponent=nextOpponent();return true;}});
}
function leaderboard(document,progress){
 if(window.BRAX_ONLINE)return window.BRAX_ONLINE.leaderboard(document,progress);
 const $=id=>document.querySelector('#'+id),mode=$('recordsMode').value||'survival',difficulty=$('recordsDifficulty').value||'normal',rows=progress.top(mode,difficulty),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const time=ms=>Math.floor(ms/60000)+':'+String(Math.floor(ms/1000)%60).padStart(2,'0');
 const result=r=>mode==='survival'?h('ranking.survivalWins',{count:r.score}):mode==='arcade'?(r.completed?h('ranking.completed')+' · ':'')+r.score+'/'+(r.targetWins||5):mode==='tournament'?h('ranking.tournamentWins',{status:t(r.completed?'ranking.champion':'ranking.finished'),count:r.score}):mode.startsWith('challenge:')?h('ranking.completed'):r.rounds?r.rounds.join(' : '):h('ranking.roundAdvantage',{count:r.score});
 $('leaderboard').innerHTML=rows.length?'<table><thead><tr><th>#</th><th>'+h('ranking.name')+'</th><th>'+h('ranking.fighter')+'</th><th>'+h('ranking.result')+'</th><th>'+h('ranking.time')+'</th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+escape(r.name)+'</td><td>'+escape(displayFighterName(r.fighter))+'</td><td>'+result(r)+'</td><td>'+time(r.elapsed)+'</td></tr>').join('')+'</tbody></table>':'<p>'+h('ranking.empty')+'</p>';
 $('rankingNote').textContent=t('ranking.localNote',{name:progress.name||t('ranking.player'),sort:t(mode==='tournament'?'ranking.tournamentSort':mode.startsWith('challenge:')?'ranking.challengeSort':'ranking.scoreSort')});
}
function challengeCard(c,done=false,index=0){return '<span class="challenge-top"><b>'+String(index+1).padStart(2,'0')+'</b><small>'+h(done?'challenge.completedTitle':c.drill?'challenge.technique':'challenge.fightTrial')+'</small></span><strong>'+window.BRAX_I18N.escape(c.title)+'</strong><span class="challenge-description">'+window.BRAX_I18N.escape(c.description)+'</span><span class="challenge-bottom"><span>'+h('challenge.goal',{goal:c.goal})+'</span><b>'+h(done?'challenge.repeat':'challenge.start')+' →</b></span>';}
function records(progress){return roster.map(who=>{const f=progress.fighter(who),available=challenges.filter(c=>!(c.exclude||[]).includes(who)),done=available.filter(c=>f.challenges.includes(c.id)).length;return '<article class="progress-card"><img src="/assets/campaign-portraits/'+who.toLowerCase()+'.webp" alt="'+displayFighterName(who)+'"><header><b>'+displayFighterName(who)+'</b><small>'+h('progress.challengeCount',{done,total:available.length})+'</small></header><div class="ui-progress" role="progressbar" aria-label="'+h('progress.challenges')+'" aria-valuenow="'+done+'" aria-valuemax="'+available.length+'"><i style="width:'+done/available.length*100+'%"></i></div><div class="progress-numbers"><span><strong>'+f.wins+'</strong>'+h('progress.wins',{count:f.wins})+'</span><span><strong>'+f.bestSurvival+'</strong>'+h('progress.survivalRecord')+'</span></div><div class="progress-medals">'+available.map(c=>'<span class="'+(f.challenges.includes(c.id)?'earned':'')+'" title="'+window.BRAX_I18N.escape(c.title)+'" aria-label="'+window.BRAX_I18N.escape(c.title)+': '+h(f.challenges.includes(c.id)?'progress.done':'progress.notDone')+'">'+(f.challenges.includes(c.id)?'✓':'·')+'</span>').join('')+'</div></article>';}).join('');}
window.BRAX_FEATURES={challengeCard,records,roster,styles,chooseAttack,challenges,createProgress,createSurvival,leaderboard};
})();
