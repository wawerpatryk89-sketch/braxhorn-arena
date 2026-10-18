const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const elements=new Map();let plays=0,loads=0,reject=false;
function el(id){if(!elements.has(id)){const classes=new Set(['off']);elements.set(id,{textContent:'',handlers:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},addEventListener(k,f){this.handlers[k]=f},focus(){document.activeElement=this},removeAttribute(k){delete this[k]},pause(){},load(){loads++},play(){plays++;return reject?Promise.reject(Error('autoplay')):Promise.resolve()}})}return elements.get(id)}
const document={getElementById:el,activeElement:null},window={};vm.runInNewContext(fs.readFileSync('game/assets/victory.js','utf8'),{window,document});vm.runInNewContext(fs.readFileSync('game/assets/championship.js','utf8'),{window});
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY'];
(async()=>{assert.equal(plays,0);assert(!el('victoryVideo').src);
for(const player of names)for(const mode of ['arcade','tournament']){
 const run=window.BRAX_CHAMPIONSHIP.create(mode,player,names,()=>.4);
 while(!run.finished){assert.equal(window.BRAX_VICTORY.show(run),false);run.next();run.result('win')}
 assert(window.BRAX_VICTORY.show(run,true));assert.equal(el('victoryVideo').src,'/assets/victory/'+player.toLowerCase()+'.mp4');assert.equal(el('victoryVideo').muted,true);assert.equal(window.BRAX_VICTORY.show(run),false);
 el('victoryVideo').handlers.ended();assert(el('victoryCinema').classList.contains('off'));assert(!el('victoryVideo').src);
 const loss=window.BRAX_CHAMPIONSHIP.create(mode,player,names,()=>.4);loss.next();loss.result('loss');assert.equal(window.BRAX_VICTORY.show(loss),false);
}
for(const player of names){const run={mode:'online_tournament',finished:true,player,champion:player,playerName:'WAWER'};assert(window.BRAX_VICTORY.show(run));assert(el('victoryCinema').classList.contains('online'));assert.equal(el('victoryTitle').textContent,'MISTRZ TURNIEJU · WAWER · '+player);assert.equal(el('victoryVideo').src,'/assets/victory/'+player.toLowerCase()+'.mp4');el('victorySkip').handlers.click();assert(!el('victoryCinema').classList.contains('online'));}
reject=true;window.BRAX_VICTORY.show({mode:'arcade',finished:true,player:'BRAX',champion:'BRAX'});await new Promise(r=>setImmediate(r));assert(!el('victoryPlay').classList.contains('off'));reject=false;el('victoryPlay').handlers.click();await Promise.resolve();el('victorySkip').handlers.click();assert(el('victoryCinema').classList.contains('off'));
window.BRAX_VICTORY.show({mode:'tournament',finished:true,player:'NYXA',champion:'NYXA'});el('victoryVideo').handlers.error();assert(el('victoryCinema').classList.contains('off'));
console.log('PASS: 12 winning campaigns; intermediate bouts and losses excluded; no preload; correct fighter; once per run; mute; autoplay retry; skip; ended; error cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1});
