import compatibility from './build-compatibility.json';
// PvP has no difficulty: retain the config-derived physical minimum.
import limits from './duel-times.json';
import arenaNames from './arena-list.json';
import {playerIdentity} from './player-identity';
import {publicPlayerName} from './owner-policy';
import {advanceFight,reviewFight} from './tournament-api';
const roster=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const fail=(message:string,status=400)=>Object.assign(new Error(message),{status});
const int=(v:any)=>Number.isSafeInteger(v)&&v>=0;
function validSnapshot(s:any){
 return !!s&&int(s.ack)&&int(s.snapshotId)&&s.snapshotId>0&&Array.isArray(s.actors)&&s.actors.length===2&&s.actors.every((a:any)=>a&&[a.x,a.y,a.face,a.hp,a.en,a.frame].every(Number.isFinite)&&a.x>=0&&a.x<=100&&Math.abs(a.y)<=1000&&Math.abs(a.face)===1&&a.hp>=0&&a.hp<=100&&a.en>=0&&a.en<=100&&a.frame>=0&&a.frame<10000&&typeof a.a==='string'&&/^[A-Z_0-9]{1,64}$/.test(a.a))&&s.state&&int(s.state.round)&&s.state.round>=1&&s.state.round<=3&&Number.isFinite(s.state.t)&&s.state.t>=0&&s.state.t<=60&&Array.isArray(s.state.wins)&&s.state.wins.length===2&&s.state.wins.every((n:any)=>int(n)&&n<=2)&&s.state.wins[0]+s.state.wins[1]<=s.state.round;
}
export async function handleDuel(request:Request,db:any,ownerEmail=''){
 const headers:Record<string,string>={'Cache-Control':'no-store','Vary':'Cookie'};
 const reply=(data:any,status=200)=>Response.json(data,{status,headers});
 try{
  const url=new URL(request.url),origin=request.headers.get('origin');
  if(request.method!=='POST')throw fail('Nieznane działanie.',405);
  if((origin&&new URL(origin).host!==url.host)||request.headers.get('sec-fetch-site')==='cross-site')throw fail('Niedozwolone źródło.',403);
  if(!db)throw fail('Multiplayer chwilowo niedostępny.',503);
  if(Number(request.headers.get('content-length')||0)>40000)throw fail('Za duże dane.',413);
  const raw=await request.text();if(raw.length>40000)throw fail('Za duże dane.',413);
  let b;try{b=JSON.parse(raw);}catch{throw fail('Nieprawidłowe dane.');}if(!b||typeof b!=='object')throw fail('Nieprawidłowe dane.');
  const now=Date.now(),action=b.action;
  if(['create','join','sync'].includes(action)&&(!b.compat||b.compat.protocol!==compatibility.protocol||b.compat.build!==compatibility.build||b.compat.configs!==compatibility.configs))throw fail('Odśwież grę — inna wersja u przeciwnika',409);
  const player=['create','join'].includes(action)?await playerIdentity(request,db,headers,ownerEmail):null;
  if(action==='create'){
   if(!roster.includes(b.fighter))throw fail('Wybierz zawodnika.');
   const arena=b.arena??'snow';if(!arenaNames.includes(arena))throw fail('Wybierz poprawną arenę.');
   const creator=request.headers.get('cf-connecting-ip')||'local';
   const count=await db.prepare('SELECT COUNT(*) AS n FROM duel_rooms WHERE creator=? AND created>?').bind(creator,now-600000).first();
   if(count.n>=6)throw fail('Zbyt wiele nowych pokoi. Spróbuj za kilka minut.',429);
   await db.prepare('DELETE FROM duel_rooms WHERE expires<?').bind(now).run();
   const code=crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase(),token=crypto.randomUUID();
   await db.prepare('INSERT INTO duel_rooms (code,host_key,creator,created,expires,host_seen,host_fighter,arena,host_player,host_name) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(code,token,creator,now,now+3600000,now,b.fighter,arena,player!.id,player!.name).run();
   return reply({code,token,role:'host',hostName:player!.name});
  }
  const code=String(b.code||'').toUpperCase();if(!/^[A-F0-9]{8}$/.test(code))throw fail('Kod pokoju ma 8 znaków.');
  let r=await db.prepare("SELECT *, (SELECT player_id FROM arena_owner WHERE id='organizer') AS owner_id FROM duel_rooms WHERE code=? AND expires>?").bind(code,now).first();
  if(!r||(r.status==='closed'&&action!=='result'))throw fail('Pokój wygasł albo został zamknięty.',404);
  const ownerId=r.owner_id;
  if(action==='join'){
   if(r.tournament_fight)throw fail('Wejdź do tej walki ze swojej drabinki turniejowej.',403);
   if(r.host_player&&r.host_player===player!.id)throw fail('Nie możesz walczyć przeciwko własnemu profilowi.',409);
   if(!roster.includes(b.fighter))throw fail('Wybierz zawodnika.');
   const token=crypto.randomUUID();
   const result=await db.prepare("UPDATE duel_rooms SET guest_key=?,guest_fighter=?,guest_seen=?,guest_player=?,guest_name=? WHERE code=? AND guest_key IS NULL AND status='waiting'").bind(token,b.fighter,now,player!.id,player!.name,code).run();
   if(!result.meta.changes)throw fail('Pokój jest już zajęty.',409);
   return reply({code,token,role:'guest',hostName:publicPlayerName(r.host_name,r.host_player,ownerId),guestName:player!.name});
  }
  const host=b.token===r.host_key,guest=!!r.guest_key&&b.token===r.guest_key;if(!host&&!guest)throw fail('Brak dostępu do pokoju.',403);
  if(action==='leave'){
   if(r.tournament_fight&&!r.started_at){await db.prepare(`UPDATE duel_rooms SET ${host?'host':'guest'}_ready=0,${host?'host':'guest'}_seen=0 WHERE code=?`).bind(code).run();return reply({closed:false});}
   await db.prepare("UPDATE duel_rooms SET status='closed' WHERE code=?").bind(code).run();
   if(r.result_status!=='confirmed')await reviewFight(db,r,'Walka przerwana. Organizator może zarządzić powtórkę lub rozstrzygnąć wynik.');return reply({closed:true});
  }
  if(action==='review'){if(!r.tournament_fight)throw fail('Ta walka nie należy do turnieju.');await db.prepare("UPDATE duel_rooms SET result_status='disputed' WHERE code=? AND result_status<>'confirmed'").bind(code).run();await reviewFight(db,r,'Gracz zgłosił brak potwierdzenia lub problem z wynikiem.');return reply({resultStatus:'disputed'});}
  if(action==='result'){
   if(r.result_status==='confirmed'){await settleTournament(db,r,JSON.parse(r.host_report));return reply({resultStatus:'confirmed',score:JSON.parse(r.host_report)});}
   if(r.result_status==='disputed')return reply({resultStatus:'disputed'});
   const score=b.score;if(!Array.isArray(score)||score.length!==2||!score.every((n:any)=>int(n)&&n<=2)||score[0]+score[1]>3)throw fail('Nieprawidłowy wynik walki.');
   const terminal=r.snapshot?JSON.parse(r.snapshot):null;
   if(!r.started_at||!validSnapshot(terminal)||terminal.state.matchOver!==true||terminal.state.ended!==true||terminal.state.round<2||(terminal.state.round<3&&Math.max(...terminal.state.wins)<2))throw fail('Walka jeszcze się nie zakończyła.',409);
   const wins=terminal.state.wins,minimum=wins[0]*limits.fighters[r.host_fighter as keyof typeof limits.fighters].roundMinimumMs+wins[1]*limits.fighters[r.guest_fighter as keyof typeof limits.fighters].roundMinimumMs+(terminal.state.round-wins[0]-wins[1])*60000;
   if(!Number.isFinite(minimum)||now-r.started_at<minimum){console.warn('duel_time_rejected',JSON.stringify({code,elapsed:now-r.started_at,minimum}));throw fail('Wynik jest krótszy niż minimalny czas walki.',409);}
   const report=JSON.stringify(score),field=host?'host_report':'guest_report';
   await db.prepare(`UPDATE duel_rooms SET ${field}=COALESCE(${field},?),result_status=CASE WHEN result_status='' THEN 'pending' ELSE result_status END WHERE code=?`).bind(report,code).run();
   r=await db.prepare('SELECT * FROM duel_rooms WHERE code=?').bind(code).first();
   if(r.host_report&&r.guest_report){
    if(r.host_report!==r.guest_report||r.host_report!==JSON.stringify(terminal.state.wins)){
     await db.prepare("UPDATE duel_rooms SET result_status='disputed' WHERE code=?").bind(code).run();await reviewFight(db,r,'Niezgodne wyniki. Potrzebna decyzja organizatora.');return reply({resultStatus:'disputed'});
    }
    await db.batch([db.prepare('INSERT OR IGNORE INTO duel_results(code,host_player,guest_player,host_name,guest_name,host_fighter,guest_fighter,score,created) VALUES(?,?,?,?,?,?,?,?,?)').bind(code,r.host_player,r.guest_player,r.host_name,r.guest_name||'GRACZ',r.host_fighter,r.guest_fighter,r.host_report,now),db.prepare("UPDATE duel_rooms SET result_status='confirmed' WHERE code=?").bind(code)]);
    await settleTournament(db,r,JSON.parse(r.host_report));
    return reply({resultStatus:'confirmed',score:JSON.parse(r.host_report)});
   }return reply({resultStatus:'pending',score});
  }
  if(action!=='sync')throw fail('Nieznane działanie.',404);
  const role=host?'host':'guest';
  const writes=[db.prepare(`UPDATE duel_rooms SET ${role}_seen=?,${role}_ready=MAX(${role}_ready,?) WHERE code=?`).bind(now,b.ready===true?1:0,code)];
  if(host&&b.snapshot){
   const s=b.snapshot;if(!int(b.seq)||!validSnapshot(s))throw fail('Nieprawidłowy stan walki.');
   writes.push(db.prepare('UPDATE duel_rooms SET snapshot=?,seq=? WHERE code=? AND seq<?').bind(JSON.stringify(s),b.seq,code,b.seq));
  }
  if(guest&&b.input){
   const i=b.input;if(!int(b.seq)||!i.held||!Array.isArray(i.events)||i.events.length>64||!i.events.every((e:any)=>e&&int(e.id)&&['punch','heavy','kick','kick2','special','grab','evade','left','right'].includes(e.kind)))throw fail('Nieprawidłowe sterowanie.');
   writes.push(db.prepare('UPDATE duel_rooms SET input=?,input_seq=? WHERE code=? AND input_seq<?').bind(JSON.stringify(i),b.seq,code,b.seq));
  }
  let scheduledAt=0;
  if(r.tournament_fight){const f=await db.prepare('SELECT scheduled_at,status FROM tournament_fights WHERE id=? AND room_code=?').bind(r.tournament_fight,code).first();if(!f||!['scheduled','playing'].includes(f.status))throw fail('Ta próba walki nie jest już aktywna.',409);scheduledAt=f.scheduled_at;}
  if(now>=scheduledAt&&r.status==='waiting'){writes.push(db.prepare("UPDATE duel_rooms SET status='playing',started_at=? WHERE code=? AND host_ready=1 AND guest_ready=1 AND status='waiting' AND host_seen>? AND guest_seen>?").bind(now,code,now-5000,now-5000));
   if(r.tournament_fight)writes.push(db.prepare("UPDATE tournament_fights SET status='playing' WHERE id=? AND room_code=? AND status='scheduled' AND (SELECT started_at FROM duel_rooms WHERE code=?)>0").bind(r.tournament_fight,code,code));}

  writes.push(db.prepare('SELECT * FROM duel_rooms WHERE code=?').bind(code));
  const synced=await db.batch(writes);r=synced[synced.length-1].results[0];
  return reply({code,status:r.status,hostFighter:r.host_fighter,guestFighter:r.guest_fighter,hostName:publicPlayerName(r.host_name,r.host_player,ownerId),guestName:publicPlayerName(r.guest_name,r.guest_player,ownerId),scheduledAt,resultStatus:r.result_status,arena:r.arena,peerSeen:host?r.guest_seen:r.host_seen,now,peerReady:!!(host?r.guest_ready:r.host_ready),snapshot:guest&&r.snapshot?JSON.parse(r.snapshot):null,input:host&&r.input?JSON.parse(r.input):null,seq:host?r.input_seq:r.seq});
 }catch(e:any){return reply({error:e.status?e.message:'Połączenie z pokojem jest chwilowo niedostępne.'},e.status||500);}
}

async function settleTournament(db:any,r:any,score:number[]){if(!r.tournament_fight)return;const f=await db.prepare("SELECT * FROM tournament_fights WHERE id=? AND room_code=? AND (SELECT status FROM online_tournaments WHERE id=tournament_id)='running'").bind(r.tournament_fight,r.code).first();if(!f||['finished','bye'].includes(f.status))return;if(score[0]===score[1])await reviewFight(db,r,'Remis. Organizator wyznaczy powtórkę.');else await advanceFight(db,f,score[0]>score[1]?f.a:f.b,JSON.stringify(score),'Wynik potwierdzony przez oba połączenia.','system',r.code);}
