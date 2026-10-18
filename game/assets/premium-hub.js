/* Full-size navigation and challenge details; launches stay in the game engine. */
(()=>{
'use strict';
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
 const $=id=>document.getElementById(id),F=window.BRAX_FEATURES;
 const categoryNames={defense:'OBRONA I REAKCJA',attack:'ATAK I DYSTANS',wins:'PRÓBY WALKI',survival:'SURVIVAL'};
 const art={defense:'challenges',attack:'challenges',wins:'challenges',survival:'survival'};
 let category='defense',progress=null,who='BRAX',launch=null,selectedTask=null,activeTask=null;
 for(const c of F.challenges){if($('challenge-'+c.id))continue;const b=document.createElement('button');b.id='challenge-'+c.id;b.type='button';b.dataset.category=c.category;$('featureChallenges').appendChild(b);}
 const modes=$('recordsMode');for(const option of [...modes.options])if(option.value.startsWith('challenge:'))option.remove();for(const c of F.challenges){const option=document.createElement('option');option.value='challenge:'+c.id;option.textContent='Wyzwanie: '+c.title;modes.appendChild(option);}
 $('hubMode').addEventListener('click',()=>$('challengeHub').classList.remove('off'));
 $('hubBack').addEventListener('click',()=>$('challengeHub').classList.add('off'));
 $('survivalStart').addEventListener('click',()=>$('challengeHub').classList.add('off'));
 function inspect(c,callback){selectedTask=c;launch=callback;for(const task of F.challenges)$('challenge-'+task.id).setAttribute('aria-pressed',String(task.id===c.id));$('challengeArt').src='/assets/mode-art/'+art[c.category]+'.webp';$('challengeCategory').textContent=categoryNames[c.category];$('challengeDetailTitle').textContent=c.title;$('challengeDescription').textContent=c.description;$('challengeLevel').textContent=c.drill?'TRENING TECHNIKI':c.difficulty==='hard'?'POZIOM TRUDNY':'POZIOM ŚREDNI';$('challengeGoal').textContent='CEL · '+c.description.split('.')[0];window.BRAX_UI?.challengeDetail(c,progress,who);$('challengeStatus').textContent=progress?.fighter(who).challenges.includes(c.id)?'✓ UKOŃCZONE · '+displayFighterName(who):'DO ZDOBYCIA · '+displayFighterName(who);$('challengeStart').textContent=progress?.fighter(who).challenges.includes(c.id)?'POWTÓRZ WYZWANIE →':'WYBIERZ ZAWODNIKA →';}
 function filter(next){category=next;for(const b of $('challengeCategories').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.category===category));for(const c of F.challenges)$('challenge-'+c.id).classList.toggle('off',c.category!==category);$('challenge-'+F.challenges.find(c=>c.category===category).id).click();}
 for(const b of $('challengeCategories').querySelectorAll('button'))b.addEventListener('click',()=>filter(b.dataset.category));
 $('challengeStart').addEventListener('click',()=>{if(launch){activeTask=selectedTask;$('challengeHub').classList.add('off');launch();}});
 for(const id of ['fightMode','arcadeMode','tournamentMode','mode-training','survivalMode'])$(id).addEventListener('click',()=>{activeTask=null;});
 $('chooseFighter').addEventListener('click',e=>{const selected=$('rosterPlayer').textContent.split('·').at(-1).trim();if(activeTask?.exclude?.includes(selected)){e.preventDefault();e.stopImmediatePropagation();$('rosterInstruction').textContent='TO WYZWANIE WYMAGA GARDY · WYBIERZ INNEGO ZAWODNIKA';}},true);
 window.BRAX_HUB={inspect,openChallenges(p,f){progress=p;who=f;filter(category);}};
})();
