// Presentation audit: switch languages with real dictionaries while choices and drafts stay intact.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Window} from 'happy-dom';
const w=new Window({url:'http://localhost:8788',settings:{enableJavaScriptEvaluation:true,disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
w.ResizeObserver=class{observe(){}};
w.HTMLMediaElement.prototype.play=async()=>{};
w.HTMLMediaElement.prototype.pause=()=>{};
w.HTMLMediaElement.prototype.load=()=>{};
w.HTMLImageElement.prototype.decode=async()=>{};
w.Image=class{set src(value){this.url=value;}decode(){return Promise.resolve();}};
w.fetch=async()=>{throw new Error('Content audit must not make network requests');};
w.document.write(fs.readFileSync('game/index.html','utf8').replace(/<script\b[\s\S]*?<\/script>/gi,''));
const evaluate=name=>w.eval(fs.readFileSync('game/assets/'+name,'utf8'));
for(const name of ['i18n.js','i18n-common.js','i18n-content.js','i18n-online.js','fighter-names.js','arena-features.js','roster.js','roster-carousel.js','premium-hub.js','arena-catalog.js','arena-picker.js','menu-carousel.js','game-keyboard.js','night-market.js','diagnostics.js'])evaluate(name);
let rejectFighterLoad;w.__contentLoadFighters=()=>new Promise((resolve,reject)=>{rejectFighterLoad=reject;});
w.BRAX_TRANSITION={run:callback=>callback()};w.eval(fs.readFileSync('game/assets/menu.js','utf8').replaceAll("await import('/assets/fighter-source.js?v=review-147')","await window.__contentLoadFighters()"));
w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
w.BRAX_I18N.missingKeys.clear();w.BRAX_I18N.apply(w.document);
const $=id=>w.document.getElementById(id),I=w.BRAX_I18N,F=w.BRAX_FEATURES;
const settle=async()=>{for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));};
const snapshot=()=>JSON.stringify({roster:w.BRAX_ROSTER.state(),arena:w.BRAX_ARENA_PICKER.selection(),categories:[...$('arenaCategories').querySelectorAll('button')].map(b=>[b.dataset.category,b.getAttribute('aria-pressed')]),visible:[...$('arenaStrip').querySelectorAll('.arena-thumb')].filter(c=>!c.hidden).map(c=>c.id),mode:$('modePosition').textContent,difficulty:[...w.document.querySelectorAll('#difficultyOptions button')].map(b=>[b.id,b.getAttribute('aria-pressed')]),training:[...w.document.querySelectorAll('#trainingOptions button')].map(b=>[b.id,b.getAttribute('aria-pressed')]),settings:$('modeSettings').className,selection:$('selection').className,effects:w.BRAX_NIGHT_MARKET.report().quality});
// Catalog completeness includes semantic parameter parity and plural forms.
const params=value=>[...new Set((typeof value==='object'?Object.values(value).join(' '):value).match(/\{[\w.]+\}/g)||[])].sort();
for(const [key,value] of Object.entries(I.catalog).filter(([key])=>key.startsWith('content.'))){assert.notEqual(value.pl,undefined,key+' PL');assert.notEqual(value.en,undefined,key+' EN');assert.deepEqual(params(value.pl),params(value.en),key+' interpolation');}
for(const count of [0,1,2,5,12,21,22,25]){const pl=I.t('content.ranking.survivalWins',{count});assert(pl.startsWith(String(count)+' '));}
const progress=F.createProgress(w.localStorage);progress.setName('Żółw Tester');progress.win('NINA');progress.complete('NINA','evade5');const progressBefore=JSON.stringify(progress.snapshot());
$('fightMode').click();$('mode-hard').click();$('closeModeSettings').click();$('menuSound').click();
w.BRAX_ROSTER.choose(4);w.BRAX_ROSTER.setRole('opponent');w.BRAX_ROSTER.choose(7);
$('arenaCategories').querySelector('[data-category=city]').click();w.BRAX_ARENA_PICKER.select('rooftop-city');
$('modeFollowing').click();$('modeFollowing').click();w.BRAX_NIGHT_MARKET.setQuality('off');
w.BRAX_HUB.openChallenges(progress,'NINA');w.BRAX_HUB.inspect(F.challenges.find(c=>c.id==='evade5'),()=>{});
await settle();const before=snapshot(),playerButton=$('rosterPlayer'),opponentButton=$('rosterOpponent');
await I.setLanguage('en');await settle();
assert.equal(snapshot(),before,'language switch must preserve selection, filters, focused mode and effects');
assert.equal(JSON.stringify(progress.snapshot()),progressBefore,'progress does not change');
assert.equal($('menuSound').getAttribute('aria-label'),'Unmute sound');assert.equal($('titleAudio').muted,true);assert.equal($('modeSettingsTitle').textContent,'1 VS 1 FIGHT');
assert.equal($('rosterPlayer'),playerButton);assert.equal($('rosterOpponent'),opponentButton);
assert.equal($('rosterPlayer').textContent,'01  YOU · NINA');assert.equal($('rosterOpponent').textContent,'02  OPPONENT · AZRAK');
assert.equal($('arenaHeroName').textContent,'ROOFTOP · METROPOLIS');assert.equal($('arenaHeroCategory').textContent,'CITY');
assert.equal($('challengeDetailTitle').textContent,'Clean dodge');assert.equal($('challengeDescription').textContent,'Dodge 5 attacks in one drill.');
assert.equal($('challengeStatus').textContent,'✓ COMPLETED · NINA');
assert($('modePlay').getAttribute('aria-label').startsWith('Open: '));
assert.equal(w.document.querySelector('.effects-choice').getAttribute('aria-label'),'Arena effects');assert.equal(w.document.querySelector('.effects-choice button[data-value=off]').textContent,'Off');
assert(w.document.querySelector('#rosterCarousel .rc-card[aria-pressed=true]').getAttribute('aria-label').endsWith('Tap to select.'));
assert.equal(w.document.querySelector('#rosterCarousel .rc-card .rc-stats span').textContent,'POWER');
// Both local records and challenge definitions render at the active language.
assert(F.records(progress).includes('SURVIVAL RECORD'));assert(F.challengeCard(F.challenges[0]).includes('Clean dodge'));
$('recordsMode').value='survival';$('recordsDifficulty').value='normal';F.leaderboard(w.document,progress);assert($('leaderboard').textContent.includes('No saved scores'));
// Keyboard input nodes, draft and selected date survive translation.
const text=w.document.createElement('input');text.type='text';text.dataset.nativeInput='false';text.value='Żółw 7';w.document.body.append(text);w.BRAX_GAME_PAD.attach(text);w.BRAX_GAME_PAD.open(text);$('gamePad').querySelector('[data-char=A]').click();const textDraft=$('gamePadValue').textContent;
await I.setLanguage('pl');await settle();assert.equal($('gamePadValue').textContent,textDraft);assert.equal(text.value,'Żółw 7');assert.equal($('gamePad').querySelector('[data-gp=ok]').textContent,'ZAPISZ →');
w.BRAX_GAME_PAD.close();
const date=w.document.createElement('input');date.type='datetime-local';date.value='2026-10-20T14:30';w.document.body.append(date);w.BRAX_GAME_PAD.attach(date);w.BRAX_GAME_PAD.open(date);
$('gamePad').querySelector('[data-shift="15"]').click();await I.setLanguage('en');await settle();assert.equal(date.value,'2026-10-20T14:30');assert.equal($('gamePad').querySelector('[data-day="0"]').textContent,'TODAY');$('gamePad').querySelector('[data-gp=ok]').click();assert.equal(date.value,'2026-10-20T14:45');
// Arena preview must not launch; confirmation must dispatch the existing selected-card click once, after VS.
let launches=0,versus=0;const chosen=$('arena-rooftop-city');chosen.addEventListener('click',()=>launches++);w.BRAX_UI={versus:async()=>{versus++;}};$('arenaSelection').classList.remove('off');await settle();chosen.click();assert.equal(launches,0);$('arenaConfirm').click();assert.equal(launches,0,'tap is hint only');$('arenaConfirm').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await new Promise(resolve=>setTimeout(resolve,570));$('arenaConfirm').dispatchEvent(new w.KeyboardEvent('keyup',{key:'Enter',bubbles:true}));await settle();assert.equal(versus,1);assert.equal(launches,1);assert($('arenaConfirm').disabled,'pending combat handoff remains guarded');$('arenaSelection').classList.add('off');await settle();
// A language change during a fighter load keeps the request, slot and disabled guard.
w.BRAX_ROSTER.setRole('opponent');const loadingBefore=w.BRAX_ROSTER.state();$('chooseFighter').click();assert.equal($('chooseFighter').disabled,true);assert.equal($('selectionName').textContent,'LOADING 3D FIGHTERS…');
await I.setLanguage('pl');await settle();assert.equal($('chooseFighter').disabled,true);assert.equal($('selectionName').textContent,'ŁADOWANIE ZAWODNIKÓW 3D…');assert.deepEqual(w.BRAX_ROSTER.state(),loadingBefore);
rejectFighterLoad(new Error('Audit load failure'));await settle();assert.equal($('chooseFighter').dataset.loadState,'retry');assert.equal($('chooseFighter').disabled,false);assert.equal($('chooseFighter').textContent,'SPRÓBUJ PONOWNIE');
await I.setLanguage('en');await settle();assert.equal($('chooseFighter').textContent,'TRY AGAIN');assert.equal($('rosterInstruction').textContent,'Could not load the fight. Tap a card to try again.');assert.deepEqual(w.BRAX_ROSTER.state(),loadingBefore);
assert.deepEqual([...I.missingKeys],[],'all content and static references resolve');
await I.setLanguage('pl');await settle();assert.equal(w.BRAX_ARENA_PICKER.selection(),'rooftop-city');assert.equal($('arenaHeroName').textContent,'DACH · METROPOLIA');assert.equal($('rosterOpponent').textContent,'02  RYWAL · AZRAK');assert.equal($('challengeDetailTitle').textContent,'Czysty unik');
console.log(JSON.stringify({pass:true,contentKeys:Object.keys(I.catalog).filter(k=>k.startsWith('content.')).length,arenas:$('arenaStrip').querySelectorAll('.arena-thumb').length,challenges:F.challenges.length,checks:['dictionary parameter parity','lazy challenge copy','roster and arena selection preservation','category preservation','progress preservation','mode focus preservation','effects state preservation','keyboard draft/date preservation','pending fighter loading/retry preservation','arena preview / VS / original confirmation dispatch','PL↔EN live rerender'],limitation:'DOM model; physical phone layout and media playback are not exercised'}));
w.happyDOM.abort();
