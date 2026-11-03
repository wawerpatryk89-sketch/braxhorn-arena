/* Campaign rules independent of rendering. CPU-only tournament bouts are simulated. */
(()=>{
'use strict';
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
const shuffle=(a,r)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function create(mode,player,names,random=Math.random){
 const roster=shuffle(names,random);if(mode==='tournament'&&roster.length===8){const playerHalf=Math.floor(roster.indexOf(player)/2)%2;const slot=roster.findIndex((name,i)=>name!==player&&Math.floor(i/2)%2!==playerHalf);roster[slot]='BOSS';}const run={mode,player,finished:false,eliminated:false,champion:null,index:0,history:[],rounds:[]};
 if(mode==='arcade')run.opponents=roster.filter(n=>n!==player);
 else if(roster.length===8){run.rounds=[Array.from({length:4},(_,i)=>({a:roster[i*2],b:roster[i*2+1],winner:null}))];}
 else{run.rounds=[[{a:roster[0],b:roster[1],winner:null},{a:roster[2],b:roster[3],winner:null},{a:roster[4],b:null,winner:roster[4]},{a:roster[5],b:null,winner:roster[5]}]];}
 const simulate=m=>{m.winner=[m.a,m.b].includes('BOSS')?'BOSS':random()<.5?m.a:m.b;m.simulated=true;};
 function next(){
  if(run.finished)return null;
  if(mode==='arcade')return run.opponents[run.index];
  for(;;){const round=run.rounds.at(-1);for(const m of round)if(!m.winner&&!([m.a,m.b].includes(player)&&!run.eliminated))simulate(m);
   const pending=round.find(m=>!m.winner);if(pending){run.current=pending;return pending.a===player?pending.b:pending.a;}
   if(round.length===1){run.finished=true;run.champion=round[0].winner;return null;}
   const w=round.map(m=>m.winner);run.rounds.push(w.length===4?[{a:w[0],b:w[2],winner:null},{a:w[1],b:w[3],winner:null}]:[{a:w[0],b:w[1],winner:null}]);
  }
 }
 function result(outcome){if(run.finished||outcome==='draw')return;const opponent=next();run.history.push({opponent,outcome});if(mode==='arcade'){if(outcome==='loss'){run.finished=true;run.eliminated=true;return;}run.index++;if(run.index===run.opponents.length){run.finished=true;run.champion=player;}}else{run.current.winner=outcome==='win'?player:opponent;run.eliminated=outcome==='loss';next();}}
 return Object.assign(run,{next,result});
}
// Complete six-player bracket: two opening bouts, two byes into semifinals, final.
// Previewing future rounds never advances or mutates tournament results.
function tournamentView(run){
 if(run.rounds[0].every(m=>m.b))return eightFighterView(run);

 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const portrait=(name,x,y,w,h,opacity=1)=>name?`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="80 0 480 420" preserveAspectRatio="xMidYMin slice" opacity="${opacity}"><image href="/assets/portraits/${name.toLowerCase()}.webp" width="640" height="720"/></svg>`:'';
 const text=(x,y,value,size=16,color='#eaf3e0',weight=700,anchor='start')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(displayFighterName(value))}</text>`;
 const first=run.rounds[0],semis=run.rounds[1]||[],final=run.rounds[2]?.[0];
 const slot=(name,candidates,label)=>({name,candidates:name?[name]:candidates.filter(Boolean),label});
 const pending=(m)=>m===run.current&&!run.finished;
 function fighter(s,x,y,w,h,winner){
  const lost=winner&&s.name&&winner!==s.name;
  let out=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0a1510"/>`;
  if(s.name)out+=portrait(s.name,x,y,w,h-27,lost?.38:1);
  else{out+=`<rect x="${x+4}" y="${y+4}" width="${w-8}" height="${h-35}" rx="5" fill="#141713" stroke="#b29b5c33"/><circle cx="${x+w/2}" cy="${y+(h-27)/2}" r="23" fill="#1e2219" stroke="#b29b5c66"/>`;out+=text(x+w/2,y+(h-27)/2+9,'?',27,'#c9b780',500,'middle');}

  out+=`<rect x="${x}" y="${y+h-27}" width="${w}" height="27" fill="${s.name===run.player?'#3b321c':'#0b1711'}"/>`;
  out+=text(x+8,y+h-9,s.name||s.label,s.name?17:10,winner&&s.name===winner?'#e9d398':'#eaf3e0');
  if(s.name===run.player){out+=`<rect x="${x+5}" y="${y+5}" width="27" height="18" rx="2" fill="#e2c784"/>`+text(x+18.5,y+18,'TY',11,'#101b0a',900,'middle');}
  if(winner&&s.name===winner)out+=text(x+w-8,y+h-9,'✓',16,'#e9d398',900,'end');
  return out;
 }
 function match(x,y,w,h,label,a,b,m){const active=pending(m),winner=m?.winner;let out=`<g data-match="${esc(label)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#080c09" fill-opacity=".98" stroke="${active?'#ead18e':'#746543'}" stroke-width="${active?2:1}"/>`+text(x+10,y+18,active?'TERAZ · '+label:label,11,active?'#f8e6b5':'#b6ab90');const pw=(w-26)/2;out+=fighter(a,x+8,y+26,pw,h-34,winner)+fighter(b,x+18+pw,y+26,pw,h-34,winner);out+=`<circle cx="${x+w/2}" cy="${y+h/2}" r="13" fill="#07110e" stroke="#617255"/>`+text(x+w/2,y+h/2+4,'VS',9,'#d9e9cb',800,'middle');return out+'</g>';}
 const semiSlot=(i)=>slot(semis[i]?.a||first[i].winner,[first[i].a,first[i].b],'ZWYCIĘZCA PARY '+(i+1));
 const finalSlot=i=>slot(final?.[i===0?'a':'b']||semis[i]?.winner,[first[i].a,first[i].b,first[i+2].a],'PÓŁFINAŁ '+(i+1));
 let out='<svg xmlns="http://www.w3.org/2000/svg" class="tournament-tree" viewBox="0 0 1200 440" role="img" aria-labelledby="bracketName bracketDescription"><title id="bracketName">Pełna drabinka turnieju sześciu zawodników</title><desc id="bracketDescription">Dwie pary pierwszej rundy. Dwóch zawodników z wolnym losem w półfinałach. Linie prowadzą do finału. TY oznacza Twoją postać.</desc><g font-family="Arial, sans-serif">';
 for(const [x,name]of [[0,'01 / PIERWSZA RUNDA'],[430,'02 / PÓŁFINAŁY'],[860,'03 / FINAŁ']])out+=text(x+2,17,name,15,'#c4d5b4');
 out+='<g fill="none" stroke="#ab9057" stroke-width="2"><path d="M320 124 H430 M320 336 H430 M750 124 H805 V230 H860 M750 336 H805 V230"/></g>';
 for(let i=0;i<2;i++){const y=34+i*212,m=first[i];out+=match(0,y,320,180,'PARA '+(i+1),slot(m.a,[],''),slot(m.b,[],''),m);out+=match(430,y,320,180,'PÓŁFINAŁ '+(i+1),semiSlot(i),slot(semis[i]?.b||first[i+2].a,[],''),semis[i]);}
 out+=text(746,239,'WOLNY LOS: '+displayFighterName(first[2].a)+' · '+displayFighterName(first[3].a),10,'#bbcca8',600,'end');
 out+=match(860,140,340,180,'WALKA O MISTRZOSTWO',finalSlot(0),finalSlot(1),final);
 out+='<path d="M1012 44 H1048 V57 Q1048 78 1030 82 Q1012 78 1012 57 Z M1012 49 H1002 V57 Q1002 68 1017 68 M1048 49 H1058 V57 Q1058 68 1043 68 M1030 82 V96 M1018 97 H1042" fill="none" stroke="#e2c784" stroke-width="3"/>';
 out+=text(1030,116,run.champion?'MISTRZ · '+displayFighterName(run.champion):'JEDEN MISTRZ',15,'#e9d398',800,'middle');
 out+=text(1030,348,run.champion?'TURNIEJ ZAKOŃCZONY':'DROGA DO TYTUŁU',11,'#aebf9f',600,'middle');
 return out+'</g></svg>';
}

// Dedicated close-ups from the existing carousel artwork; no new character designs.
const bracketPortraits={
 BRAX:['a','110 10 360 340'],NYXA:['a','605 10 345 345'],
 VEXA:['a','125 770 305 300'],KROV:['a','620 770 315 310'],
 NINA:['b','155 20 215 255'],DANNY:['b','650 15 205 250'],
 BEAR:['b','135 770 275 290'],DEMON:['b','575 770 360 320']
};
function bracketPortrait(name,x,y,opacity=1){
 const p=bracketPortraits[name];if(name==='BOSS')return `<svg x="${x}" y="${y}" width="84" height="44" viewBox="80 0 480 420" opacity="${opacity}"><image href="/assets/portraits/boss.webp" width="640" height="720"/></svg>`;if(!p)return '';
 return `<svg x="${x}" y="${y}" width="84" height="44" viewBox="${p[1]}" preserveAspectRatio="xMidYMid meet" opacity="${opacity}" overflow="hidden"><image href="/assets/roster-art-${p[0]}-151.webp" width="1024" height="1536"/></svg>`;
}
function eightFighterView(run){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const en=document.documentElement.lang==='en', headings=en?['QUARTER-FINALS','SEMI-FINALS','FINAL']:['ĆWIERĆFINAŁY','PÓŁFINAŁY','FINAŁ'];
 // Display the real 0+2 / 1+3 pairings together without changing tournament rules.
 const order=[0,2,1,3], xs=[12,460,908], ys=[[44,150,256,362],[97,309],[203]], width=340;
 let svg='<svg xmlns="http://www.w3.org/2000/svg" class="tournament-tree" viewBox="0 0 1260 468" role="img" aria-label="'+(en?'Eight-fighter tournament':'Turniej ośmiu zawodników')+'"><g font-family="Teko, Arial, sans-serif">';
 svg+='<g fill="none" stroke="#91af7a" stroke-width="2"><path d="M352 90 H406 V196 H352 M406 143 H460 M352 302 H406 V408 H352 M406 355 H460 M800 143 H854 V355 H800 M854 249 H908"/></g>';
 for(let r=0;r<3;r++){
  svg+=`<text x="${xs[r]}" y="25" fill="#d5e0c9" font-size="24" font-weight="700" font-style="italic" letter-spacing="2">${headings[r]}</text><path d="M${xs[r]} 32h110" stroke="#aaff48" stroke-width="2"/>`;
  for(let i=0;i<4/2**r;i++){
   const index=r===0?order[i]:i,m=run.rounds[r]?.[index],y=ys[r][i],x=xs[r],active=m===run.current&&!run.finished;
   svg+=`<g><rect x="${x}" y="${y}" width="${width}" height="92" rx="8" fill="#06100d" fill-opacity=".9" stroke="${active?'#aaff48':'#82917d'}" stroke-width="${active?3:1.5}"/><path d="M${x+4} ${y+46}h${width-8}" stroke="#7c917066"/>`;
   for(let k=0;k<2;k++){
    const source=r===1?run.rounds[0]?.[i+k*2]:r===2?run.rounds[1]?.[k]:null;
    const n=m?.[k?'b':'a']||source?.winner, row=y+k*46, lost=m?.winner&&m.winner!==n;
    if(n)svg+=`<rect x="${x+4}" y="${row+1}" width="84" height="44" rx="4" fill="#24372b"/>`+bracketPortrait(n,x+4,row+1,lost?.85:1);
    else svg+=`<circle cx="${x+40}" cy="${row+16}" r="9" fill="#536258"/><path d="M${x+21} ${row+42}q0-24 19-24t19 24" fill="#536258"/>`;
    const pending=(en?'Winner ':'Zwycięzca ')+(r===1?'QF '+(i+k*2+1):'SF '+(k+1));
    svg+=`<text x="${x+92}" y="${row+32}" fill="${n===run.player?'#adff4d':lost?'#869087':'#f0f3eb'}" font-size="${n?29:23}" font-style="italic" font-weight="700">${esc(n?displayFighterName(n):pending)}</text>`;
    svg+=`<text x="${x+width-16}" y="${row+31}" text-anchor="end" fill="#adff4d" font-size="22">${n===run.player?(en?'YOU':'TY'):m?.winner===n&&n?'✓':''}</text>`;
   }
   svg+='</g>';
  }
 }
 return svg+'</g></svg>';
}

window.BRAX_CHAMPIONSHIP={create,tournamentView};
})();
