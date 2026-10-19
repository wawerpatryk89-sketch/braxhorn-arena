/* Presentation regression: use the existing physics fixture with the real language runtime/catalog. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {createGame}=require('./audit-new-fighters.cjs');
const html=fs.readFileSync('game/index.html','utf8'),source=fs.readFileSync('game/assets/combat.js','utf8');
const ids=[...new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]))];
const core=fs.readFileSync('game/assets/i18n.js','utf8');
const catalog=fs.readFileSync('game/assets/i18n-combat.js','utf8');
const content=fs.readFileSync('game/assets/i18n-content.js','utf8');
const aux=fs.readFileSync('game/assets/i18n-combat-aux.js','utf8');
const prefix=`document.readyState='loading';document.documentElement.dataset={};window.CustomEvent=class{constructor(type,options){this.type=type;this.detail=options?.detail;}};window.dispatchEvent=()=>true;window.localStorage={getItem(){return null;},setItem(){}};const originalQueryAll=document.querySelectorAll;document.querySelectorAll=selector=>selector==='[data-combat-copy]'?${JSON.stringify(ids)}.map(id=>document.querySelector('#'+id)).filter(node=>node?.dataset.combatCopy):selector.includes('data-language-switch')||selector.includes('data-i18n')?[]:originalQueryAll(selector);window.BRAX_ONLINE.avatarUrl=()=>'/assets/avatar-male.jpg';window.BRAX_ONLINE.avatarMarkup=()=>'';\n`;
const expose=`window.__COMBAT_I18N_TEST__={say,networkRender,refreshCombatPresentation,callout:()=>calloutToken,sourceAttacks:SOURCE_ATTACKS,renderCombatHud};`;
const combatSource=prefix+core+'\n'+catalog+'\n'+content+'\n'+aux+'\n'+source.replace(/\}\)\(\);?\s*$/,expose+'})();');
const stable=g=>JSON.stringify({state:g.test.S,player:g.test.B,opponent:g.test.O,session:g.context.BRAX_ACCOUNT.profile,feature:g.test.featureState(),buttons:g.buttons.map(button=>({disabled:button.disabled,classes:['off','ready','charging','active'].map(name=>[name,button.classList.contains(name)])}))});
let presentationDraws=0;
const language=async(g,value)=>{const before=stable(g),draws=presentationDraws;await g.context.BRAX_I18N.setLanguage(value);assert.equal(stable(g),before,'language switch changed fight/session/campaign state');assert.equal(presentationDraws,draws,'language switch repainted/advanced fighter animation');};
(async()=>{
 const g=await createGame(844,390,true,null,{combatSource});await g.start('Nick żółw');await g.test.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 const i18n=g.context.BRAX_I18N,t=g.context.__COMBAT_I18N_TEST__;
 assert.equal(g.state().preFight,false);assert.equal(i18n.language,'pl');assert.equal(g.elements.get('playerName').textContent,'Nick żółw');const playerMarker=g.elements.get('playerName').braxRoleMarker;assert.equal(playerMarker.textContent,'TY');assert.equal(g.elements.get('opponentName').braxRoleMarker.textContent,'CPU');
 const configs=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'].map(who=>[who,JSON.stringify(g.context[who+'_3D'].config)]);
 const configsBefore=JSON.stringify(configs);for(const [who] of configs){const renderer=g.context[who+'_3D'],render=renderer.render;renderer.render=(...args)=>{presentationDraws++;return render(...args);};for(const key of Object.keys(renderer.config))assert(g.context.BRAX_COMBAT_I18N.hasAction(who,key),who+'/'+key+' action copy');}
 assert.deepEqual([...t.sourceAttacks.BRAX],['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','DOUBLE_PUNCH','UPPERCUT','TEEP','CAPOEIRA']);
 t.say('PAUZA',false);const snapshot=g.context.BRAX_MULTIPLAYER_ENGINE.snapshot();assert.equal(snapshot.state.callout,'PAUZA');
 await language(g,'en');assert.equal(g.elements.get('playerName').textContent,'Nick żółw');assert.equal(g.elements.get('playerName').braxRoleMarker,playerMarker);assert.equal(playerMarker.textContent,'YOU');assert.equal(g.elements.get('round').textContent,'ROUND 1/3');assert.equal(g.elements.get('callout').firstElementChild.textContent,'PAUSED');assert.equal(g.context.BRAX_MULTIPLAYER_ENGINE.snapshot().state.callout,'PAUZA');
 await language(g,'pl');assert.equal(g.elements.get('callout').firstElementChild.textContent,'PAUZA');
 for(const token of ['FIGHT','REMIS','PRZYWRACANIE OBRAZU…','OBRAZ GOTOWY — WZNÓW GRĘ','3','BEAR','DEMON']){t.say(token,false);await language(g,'en');assert.equal(t.callout(),token);assert.equal(g.context.BRAX_MULTIPLAYER_ENGINE.snapshot().state.callout,token);await language(g,'pl');}
 // Audio receives the original countdown/fight token even when the local display is English.
 await language(g,'en');const soundCount=g.proof.audio().played.length;t.say('FIGHT');assert(g.proof.audio().played.slice(soundCount).some(e=>e.key==='fight'));assert.equal(t.callout(),'FIGHT');
 // A Polish host's old-format canonical packet renders in an English guest, and vice versa.
 for(const [guestLanguage,token,expected] of [['en','REMIS','DRAW'],['en','PAUZA','PAUSED'],['pl','REMIS','REMIS'],['pl','PAUZA','PAUZA']]){
  await language(g,guestLanguage);g.test.NET.active=true;g.test.NET.host=false;g.test.NET.hostName='Host PL';g.test.NET.guestName='Guest EN';const packet=g.context.BRAX_MULTIPLAYER_ENGINE.snapshot();packet.state.callout=token;packet.state.simTime=0;g.test.NET.latest=packet;g.test.NET.buffer=[packet];g.test.NET.receivedAt=g.context.performance.now();t.networkRender();assert.equal(g.elements.get('callout').firstElementChild.textContent,expected);assert.equal(packet.state.callout,token);assert.equal(g.elements.get('playerName').textContent,'Host PL');assert.equal(g.elements.get('opponentName').textContent,'Guest EN');assert.equal(g.elements.get('playerName').braxRoleMarker.hidden,true);assert.equal(g.elements.get('opponentName').braxRoleMarker.textContent,guestLanguage==='en'?'YOU':'TY');
 }
 g.test.NET.host=true;await language(g,'en');assert.equal(g.elements.get('playerName').braxRoleMarker.textContent,'YOU');assert.equal(g.elements.get('opponentName').braxRoleMarker.hidden,true);g.test.NET.host=false;await language(g,'pl');
 // Locale changes preserve the guest's enabled controls even when host and guest meters differ.
 g.test.B.en=0;g.test.O.en=100;g.test.S.comboUses=2;g.test.O.comboUses=0;const special=g.buttons.find(button=>button.dataset.tap==='special');special.disabled=false;await language(g,'en');assert.equal(special.disabled,false);assert.equal(special.title,'COMBO: '+g.context.BRAX_COMBAT_I18N.action(g.test.O.character,'COMBO'));
 g.test.NET.active=false;g.test.NET.host=false;g.test.NET.latest=null;g.test.NET.buffer=[];
 // All eight guides use stable action IDs and clean vector text; their controls differ by fighter.
 for(let slot=0;slot<8;slot++){
  g.test.S.paused=true;g.test.selectSlot(slot,true);await g.flush();await g.test.begin();g.test.S.cinematic=false;g.test.S.preFight=false;g.test.S.paused=true;g.context.__MANUAL_HELP=true;g.test.showFighterHelp(true);await language(g,'en');
  const who=g.state().character,guide=decodeURIComponent(g.elements.get('helpControlsImage').src.split(',')[1]);
  assert(guide.startsWith('<svg'));assert(guide.includes('TOUCH CONTROLS'));assert(!guide.includes('STEROWANIE')&&!guide.includes('KOPNIĘCIA')&&!guide.includes('CHWYT'));
  assert(!g.elements.get('fighterHelpCombo').textContent.includes('Pełna energia'));
  const rows=g.test.helpRows(who,g.test.CFG());for(const row of rows)assert(row.label&&row.label!=='Content unavailable');
  assert.equal(g.elements.get('helpFighterName').textContent,who==='BEAR'?'MIŚ':who==='DEMON'?'AZRAK':who);
  if(who==='NINA'){assert(guide.includes('NO GUARD OR THROW'));assert(!guide.includes('>GRAB<')&&!guide.includes('>GUARD<'));}
  else if(who==='DANNY'){assert(guide.includes('GUARD · NO THROW'));assert(!guide.includes('>GRAB<'));}
  else assert(guide.includes('>GRAB<')&&guide.includes('>GUARD<'));
  await language(g,'pl');assert(g.elements.get('fighterHelpTitle').textContent.includes('STEROWANIE'));g.test.closeFighterHelp(false);
 }
 assert.equal(JSON.stringify(configs.map(([who])=>[who,JSON.stringify(g.context[who+'_3D'].config)])),configsBefore,'source configs mutated');
 // A running challenge's counters, timer and selected attacks survive a language change.
 g.test.S.challengeRun={id:'evade5',count:3,done:false};g.test.S.matchElapsed=15432;g.elements.get('trainingAttack').value='HEAVY_PUNCH';t.refreshCombatPresentation();await language(g,'en');assert.equal(g.elements.get('fightObjective').textContent,'Clean dodge 3/5');assert.equal(g.elements.get('trainingAttack').value,'HEAVY_PUNCH');await language(g,'pl');assert.equal(g.elements.get('fightObjective').textContent,'Czysty unik 3/5');
 // Results are refreshed without awarding or recording again.
 g.test.S.challengeRun=null;g.test.S.training=false;g.test.S.wins=[2,1];g.test.S.resultRecorded=true;g.test.showMatchResult(true);await language(g,'en');assert.equal(g.elements.get('resultKicker').textContent,'YOU WIN');assert(g.elements.get('resultNames').textContent.includes('Nick żółw'));await language(g,'pl');assert.equal(g.elements.get('resultKicker').textContent,'WYGRYWASZ');
 // Campaign presentation must not call next(), apply results, or alter run health/history.
 for(const mode of ['survival','arcade','tournament']){
  g.test.selectGameMode(mode);await g.test.launchCampaign();g.test.campaignBoard();const run=g.test.featureState().campaign;let nextCalls=0;const next=run.next;run.next=function(){nextCalls++;return next.call(this);};
  const panelHidden=g.elements.get('campaignScreen').classList.contains('off');await language(g,'en');assert.equal(nextCalls,0,mode+' language switch advanced opponent');assert.equal(g.elements.get('campaignScreen').classList.contains('off'),panelHidden);assert.equal(g.elements.get('campaignTitle').textContent,mode.toUpperCase());
  if(mode==='tournament'){assert(g.elements.get('campaignBracket').innerHTML.includes('QUARTERFINALS'));assert(g.elements.get('campaignBracket').innerHTML.includes('YOU'));}
  else if(mode==='survival')assert(g.elements.get('campaignStatus').textContent.startsWith('WINS: '));
  await language(g,'pl');assert.equal(nextCalls,0);if(mode==='tournament')assert(g.elements.get('campaignTitle').textContent==='TURNIEJ');
 }
 g.elements.get('campaignStatus').dataset.combatCopy='errors.fightLoad';await language(g,'en');assert.equal(g.elements.get('campaignStatus').textContent,'The fight could not be loaded. Please try again.');
 // Existing film failure copy changes in place, preserving the current video playback position.
 g.elements.get('fighterFilm').dispatch('error');g.elements.get('fighterFilm').currentTime=7.25;const filmSource=g.elements.get('fighterFilm').src;await language(g,'en');assert(g.elements.get('filmStatus').textContent.includes('could not be loaded'));assert.equal(g.elements.get('fighterFilm').currentTime,7.25);assert.equal(g.elements.get('fighterFilm').src,filmSource);
 // Catalog language and parameter sets match, with proper plural rules.
 for(const [key,entry] of Object.entries(i18n.catalog)){
  assert(entry.pl!==undefined&&entry.en!==undefined,key+' bilingual copy');
  const params=value=>[...new Set((JSON.stringify(value).match(/\{[\w.]+\}/g)||[]))].sort();assert.deepEqual(params(entry.pl),params(entry.en),key+' parameters');
 }
 for(const [value,suffix] of [[0,'zwycięstw'],[1,'zwycięstwo'],[2,'zwycięstwa'],[4,'zwycięstwa'],[5,'zwycięstw'],[12,'zwycięstw'],[14,'zwycięstw'],[21,'zwycięstw'],[22,'zwycięstwa'],[25,'zwycięstw']]){await language(g,'pl');assert.equal(i18n.t('combat.results.winCount',{count:value}),value+' '+suffix);}
 await language(g,'en');assert.equal(i18n.t('combat.results.winCount',{count:0}),'0 wins');assert.equal(i18n.t('combat.results.winCount',{count:1}),'1 win');assert.equal(i18n.t('combat.results.winCount',{count:2}),'2 wins');
 assert.deepEqual([...i18n.missingKeys],[],'missing localized combat keys');
 console.log(JSON.stringify({pass:true,catalogEntries:Object.keys(i18n.catalog).length,canonicalNetworkAndAudio:true,midRoundAndGuideStatePreserved:true,allEightFighters:true,resultsAndChallenge:true}));
})().catch(error=>{console.error(error);process.exitCode=1;});
