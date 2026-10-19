/* Campaign rules independent of rendering. CPU-only tournament bouts are simulated. */
(()=>{
'use strict';
const displayFighterName=id=>window.BRAX_FIGHTER_NAME?.(id)??String(id??'');
const copy=(key,fallback,params={})=>({key,fallback,params});
const translated=value=>value?.key?(window.BRAX_I18N?.t('combatAux.'+value.key,value.params)??value.fallback.replace(/\{(\w+)\}/g,(_,key)=>value.params[key]??'')):displayFighterName(value);
const binding=(value,esc,attribute)=>value?.key?` ${attribute?'data-i18n-attr="'+attribute+':combatAux.':'data-i18n="combatAux.'}${value.key}" data-i18n-params="${esc(JSON.stringify(value.params))}"`:'';
const shuffle=(a,r)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function create(mode,player,names,random=Math.random){
 const roster=shuffle(names,random),run={mode,player,finished:false,eliminated:false,champion:null,index:0,history:[],rounds:[]};
 if(mode==='arcade')run.opponents=roster.filter(n=>n!==player);
 else if(roster.length===8){run.rounds=[Array.from({length:4},(_,i)=>({a:roster[i*2],b:roster[i*2+1],winner:null}))];}
 else{run.rounds=[[{a:roster[0],b:roster[1],winner:null},{a:roster[2],b:roster[3],winner:null},{a:roster[4],b:null,winner:roster[4]},{a:roster[5],b:null,winner:roster[5]}]];}
 const simulate=m=>{m.winner=random()<.5?m.a:m.b;m.simulated=true;};
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
 const portrait=(name,x,y,w,h,opacity=1)=>name?`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 480 480" preserveAspectRatio="xMidYMid meet" opacity="${opacity}"><image href="/assets/campaign-portraits/${name.toLowerCase()}.webp" width="480" height="480"/></svg>`:'';
 const text=(x,y,value,size=16,color='#eaf3e0',weight=700,anchor='start')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}"${binding(value,esc)}>${esc(translated(value))}</text>`;
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
  if(s.name===run.player){out+=`<rect x="${x+5}" y="${y+5}" width="27" height="18" rx="2" fill="#e2c784"/>`+text(x+18.5,y+18,copy('bracket.you','TY'),11,'#101b0a',900,'middle');}
  if(winner&&s.name===winner)out+=text(x+w-8,y+h-9,'✓',16,'#e9d398',900,'end');
  return out;
 }
 function match(x,y,w,h,label,a,b,m){const active=pending(m),winner=m?.winner;let out=`<g data-match="${esc(translated(label))}"${binding(label,esc,'data-match')}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#080c09" fill-opacity=".98" stroke="${active?'#ead18e':'#746543'}" stroke-width="${active?2:1}"/>`+text(x+10,y+18,active?copy(label.key+'Current','TERAZ · '+label.fallback,label.params):label,11,active?'#f8e6b5':'#b6ab90');const pw=(w-26)/2;out+=fighter(a,x+8,y+26,pw,h-34,winner)+fighter(b,x+18+pw,y+26,pw,h-34,winner);out+=`<circle cx="${x+w/2}" cy="${y+h/2}" r="13" fill="#07110e" stroke="#617255"/>`+text(x+w/2,y+h/2+4,'VS',9,'#d9e9cb',800,'middle');return out+'</g>';}
 const semiSlot=(i)=>slot(semis[i]?.a||first[i].winner,[first[i].a,first[i].b],copy('bracket.pairWinner','ZWYCIĘZCA PARY {n}',{n:i+1}));
 const finalSlot=i=>slot(final?.[i===0?'a':'b']||semis[i]?.winner,[first[i].a,first[i].b,first[i+2].a],copy('bracket.semifinal','PÓŁFINAŁ {n}',{n:i+1}));
 const title=copy('bracket.sixTitle','Pełna drabinka turnieju sześciu zawodników'),description=copy('bracket.sixDescription','Dwie pary pierwszej rundy. Dwóch zawodników z wolnym losem w półfinałach. Linie prowadzą do finału. TY oznacza Twoją postać.');
 let out=`<svg xmlns="http://www.w3.org/2000/svg" class="tournament-tree" viewBox="0 0 1200 440" role="img" aria-labelledby="bracketName bracketDescription"><title id="bracketName"${binding(title,esc)}>${esc(translated(title))}</title><desc id="bracketDescription"${binding(description,esc)}>${esc(translated(description))}</desc><g font-family="Arial, sans-serif">`;
 for(const [x,name]of [[0,copy('bracket.firstRound','01 / PIERWSZA RUNDA')],[430,copy('bracket.semifinalsNumbered','02 / PÓŁFINAŁY')],[860,copy('bracket.finalNumbered','03 / FINAŁ')]])out+=text(x+2,17,name,15,'#c4d5b4');
 out+='<g fill="none" stroke="#ab9057" stroke-width="2"><path d="M320 124 H430 M320 336 H430 M750 124 H805 V230 H860 M750 336 H805 V230"/></g>';
 for(let i=0;i<2;i++){const y=34+i*212,m=first[i];out+=match(0,y,320,180,copy('bracket.pair','PARA {n}',{n:i+1}),slot(m.a,[],''),slot(m.b,[],''),m);out+=match(430,y,320,180,copy('bracket.semifinal','PÓŁFINAŁ {n}',{n:i+1}),semiSlot(i),slot(semis[i]?.b||first[i+2].a,[],''),semis[i]);}
 out+=text(746,239,copy('bracket.byes','WOLNY LOS: {first} · {second}',{first:displayFighterName(first[2].a),second:displayFighterName(first[3].a)}),10,'#bbcca8',600,'end');
 out+=match(860,140,340,180,copy('bracket.championship','WALKA O MISTRZOSTWO'),finalSlot(0),finalSlot(1),final);
 out+='<path d="M1012 44 H1048 V57 Q1048 78 1030 82 Q1012 78 1012 57 Z M1012 49 H1002 V57 Q1002 68 1017 68 M1048 49 H1058 V57 Q1058 68 1043 68 M1030 82 V96 M1018 97 H1042" fill="none" stroke="#e2c784" stroke-width="3"/>';
 out+=text(1030,116,run.champion?copy('bracket.champion','MISTRZ · {fighter}',{fighter:displayFighterName(run.champion)}):copy('bracket.oneChampion','JEDEN MISTRZ'),15,'#e9d398',800,'middle');
 out+=text(1030,348,run.champion?copy('bracket.completed','TURNIEJ ZAKOŃCZONY'):copy('bracket.roadToTitle','DROGA DO TYTUŁU'),11,'#aebf9f',600,'middle');
 return out+'</g></svg>';
}

function eightFighterView(run){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const width=300,height=70,xs=[10,425,840],ys=[[32,116,200,284],[74,242],[158]];
 // The simulation pairs opening bouts 0+2 and 1+3. Put those next to each
 // other in the drawing so every connector leads to its actual semifinal.
 const order=[[0,2,1,3],[0,1],[0]];
 const rounds=order.map((indices,r)=>indices.map(index=>run.rounds[r]?.[index]||null));
 for(let r=1;r<3;r++)for(let i=0;i<rounds[r].length;i++)if(!rounds[r][i])rounds[r][i]={a:rounds[r-1][i*2]?.winner||null,b:rounds[r-1][i*2+1]?.winner||null,winner:null};
 const portrait=(name,x,y)=>{
  const art=window.BRAX_ROSTER?.portrait(name);
  return art?art.replace('class="fighter-portrait"','').replace('<svg ',`<svg x="${x}" y="${y}" width="28" height="28" `):`<image href="/assets/portraits/${esc(name.toLowerCase())}.webp" x="${x}" y="${y}" width="28" height="28"/>`;
 };
 const title=copy('bracket.eightTitle','Turniej ośmiu zawodników'),description=copy('bracket.eightDescription','Ćwierćfinały, półfinały i finał. Połączenia wskazują awans zwycięzców. TY oznacza Twojego zawodnika.');
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" class="tournament-tree" viewBox="0 0 1150 370" role="img" aria-labelledby="tournamentTreeTitle tournamentTreeDescription"><title id="tournamentTreeTitle"${binding(title,esc)}>${esc(translated(title))}</title><desc id="tournamentTreeDescription"${binding(description,esc)}>${esc(translated(description))}</desc><g font-family="Inter, Arial, sans-serif">`;
 for(let r=0;r<2;r++)for(let i=0;i<ys[r].length;i++){
  const start=xs[r]+width,end=xs[r+1],mid=(start+end)/2,y=ys[r][i]+height/2,target=ys[r+1][Math.floor(i/2)]+height/2;
  svg+=`<path class="bracket-connector" d="M${start} ${y}H${mid}V${target}H${end}" fill="none" stroke="#526757" stroke-width="2" stroke-linejoin="round"/>`;
 }
 for(let r=0;r<3;r++){
  const heading=[copy('bracket.quarterfinals','ĆWIERĆFINAŁY'),copy('bracket.semifinals','PÓŁFINAŁY'),copy('bracket.final','FINAŁ')][r];
  svg+=`<text x="${xs[r]}" y="22" fill="#bdcbbb" font-size="18" font-weight="600" letter-spacing="2"${binding(heading,esc)}>${esc(translated(heading))}</text>`;
  for(let i=0;i<4/2**r;i++){
   const m=rounds[r][i],y=ys[r][i],x=xs[r],current=!!m&&m===run.current;
   svg+=`<g class="bracket-match${current?' current':''}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${current?'#19281a':'#0e1712'}" stroke="${current?'#a6ff3c':'#35473a'}" stroke-width="${current?2:1}"/><path d="M${x+12} ${y+35}H${x+width-12}" stroke="#2b3c30"/>`;
   for(let k=0;k<2;k++){
    const n=m?.[k?'b':'a'],row=y+k*35,player=n===run.player,loser=n&&m?.winner&&m.winner!==n;
    const pending=r===1?copy('bracket.quarterfinalWinner','Zwycięzca QF {n}',{n:i*2+k+1}):copy('bracket.semifinalWinner','Zwycięzca SF {n}',{n:k+1});
    svg+=`<g opacity="${loser?0.65:1}">`;
    if(n)svg+=portrait(n,x+8,row+4);
    else svg+=`<circle cx="${x+24}" cy="${row+20}" r="13" fill="#1a2820"/><text x="${x+24}" y="${row+26}" text-anchor="middle" fill="#809b86" font-size="18">?</text>`;
    svg+=`<text x="${x+50}" y="${row+25}" fill="${player?'#c9ff97':n?'#f0f5ed':'#93a58f'}" font-size="${n?22:18}" font-weight="${n?600:400}"${n?'':binding(pending,esc)}>${esc(n?displayFighterName(n):translated(pending))}</text>`;
    if(player){const you=copy('bracket.you','TY');svg+=`<text x="${x+width-14}" y="${row+25}" text-anchor="end" fill="#a6ff3c" font-size="13" font-weight="700"${binding(you,esc)}>${esc(translated(you))}</text>`;}
    else if(n&&m?.winner===n)svg+=`<text x="${x+width-14}" y="${row+26}" text-anchor="end" fill="#c9dfba" font-size="18">✓</text>`;
    svg+='</g>';
   }
   svg+='</g>';
  }
 }
 return svg+'</g></svg>';
}
window.BRAX_CHAMPIONSHIP={create,tournamentView};
window.BRAX_I18N?.onChange(()=>document.querySelectorAll('.tournament-tree').forEach(tree=>window.BRAX_I18N.apply(tree)));
})();
