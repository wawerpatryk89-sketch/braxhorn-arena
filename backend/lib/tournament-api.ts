import arenaNames from './arena-list.json';
import {playerIdentity} from './player-identity';
import {publicPlayerName,reservedName} from './owner-policy';
const roster=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const fail=(message:string,status=400)=>Object.assign(new Error(message),{status});
const code=()=>crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();
const rows=async(db:any,sql:string,...args:any[])=>(await db.prepare(sql).bind(...args).all()).results;
const stmt=(db:any,sql:string,...args:any[])=>db.prepare(sql).bind(...args);
const history=(db:any,t:string,actor:string,action:string,detail:string,id=crypto.randomUUID())=>stmt(db,'INSERT OR IGNORE INTO tournament_events(id,tournament_id,actor,action,detail,created) VALUES(?,?,?,?,?,?)',id,t,actor,action,detail,Date.now());
const active=(s:string)=>!['finished','bye'].includes(s);
// Keep all later slots and already-open waiting rooms in step with a moved fight.
async function scheduleFollowing(db:any,t:any,f:any,startAt:number){
 const earlier=await rows(db,"SELECT scheduled_at FROM tournament_fights WHERE tournament_id=? AND (round<? OR (round=? AND position<?)) AND status<>'bye'",t.id,f.round,f.round,f.position);
 if(earlier.some((x:any)=>x.scheduled_at+t.interval_minutes*60000>startAt))throw fail('Termin musi przypadać po wcześniejszych walkach z zachowaniem odstępu.');
 const following=await rows(db,"SELECT * FROM tournament_fights WHERE tournament_id=? AND (round>? OR (round=? AND position>=?)) AND status IN ('scheduled','waiting','review') ORDER BY round,position",t.id,f.round,f.round,f.position);
 let at=startAt+(following[0]?.id===f.id?0:t.interval_minutes*60000);const writes=[];for(const x of following){const when=x.id===f.id?at:Math.max(at,x.scheduled_at);at=when+t.interval_minutes*60000;
  writes.push(stmt(db,'UPDATE tournament_fights SET scheduled_at=? WHERE id=?',when,x.id));
  if(x.room_code)writes.push(stmt(db,"UPDATE duel_rooms SET expires=? WHERE code=? AND status='waiting' AND started_at=0",when+7200000,x.room_code));
 }
 if(!earlier.length)writes.push(stmt(db,'UPDATE online_tournaments SET start_at=? WHERE id=?',startAt,t.id));
 return writes;
}
export async function advanceFight(db:any,f:any,winner:string,score:string,reason:string,actor:string,roomCode?:string){
 if(![f.a,f.b].includes(winner)||!winner)throw fail('Zwycięzca musi być uczestnikiem tej walki.');
 const next=await db.prepare('SELECT * FROM tournament_fights WHERE tournament_id=? AND round=? AND position=?').bind(f.tournament_id,f.round+1,Math.floor(f.position/2)).first();
 const side=f.position%2?'b':'a',condition=roomCode?' AND room_code=?':'';
 const tournament=await db.prepare('SELECT interval_minutes FROM online_tournaments WHERE id=?').bind(f.tournament_id).first();
 const writes=[stmt(db,"UPDATE tournament_fights SET winner=?,score=?,reason=?,status='finished' WHERE id=? AND status NOT IN ('finished','bye')"+condition,winner,score,reason,f.id,...(roomCode?[roomCode]:[]))];
 if(next){writes.push(stmt(db,`UPDATE tournament_fights SET ${side}=(SELECT winner FROM tournament_fights WHERE id=?),status=CASE WHEN ${side==='a'?'b':'a'} IS NOT NULL THEN 'scheduled' ELSE 'waiting' END,scheduled_at=CASE WHEN ?=0 AND ${side==='a'?'b':'a'} IS NOT NULL THEN MAX(scheduled_at,?) ELSE scheduled_at END WHERE id=? AND status IN ('waiting','scheduled')`,f.id,tournament.interval_minutes,Date.now(),next.id));}
 else writes.push(stmt(db,"UPDATE online_tournaments SET status='completed',champion=(SELECT winner FROM tournament_fights WHERE id=?) WHERE id=? AND (SELECT winner FROM tournament_fights WHERE id=?) IS NOT NULL",f.id,f.tournament_id,f.id));
 writes.push(stmt(db,'UPDATE online_tournaments SET revision=revision+1 WHERE id=?',f.tournament_id),history(db,f.tournament_id,actor,'result',reason||'Wynik potwierdzony przez oba połączenia.','result:'+f.id+':'+f.attempt));
 await db.batch(writes);
}
export async function reviewFight(db:any,room:any,reason:string){
 if(!room.tournament_fight)return;
 await db.batch([stmt(db,"UPDATE tournament_fights SET status='review',reason=? WHERE id=? AND room_code=? AND status NOT IN ('finished','bye')",reason,room.tournament_fight,room.code),stmt(db,'UPDATE online_tournaments SET revision=revision+1 WHERE id=(SELECT tournament_id FROM tournament_fights WHERE id=?)',room.tournament_fight)]);
}
async function detail(db:any,t:any,p:any){
 const entries=await rows(db,'SELECT * FROM tournament_entries WHERE tournament_id=? ORDER BY seed,created,id',t.id);
 const fights=await rows(db,'SELECT * FROM tournament_fights WHERE tournament_id=? ORDER BY round,position',t.id);
 const mine=entries.find((e:any)=>e.player_id===p.id),organizer=p.isOwner;
 return{tournament:{id:t.id,code:t.code,name:t.name,status:t.status,capacity:t.capacity,startAt:t.start_at,intervalMinutes:t.interval_minutes,timezone:t.timezone,revision:t.revision,champion:t.champion},profile:{name:p.name,authenticated:p.authenticated,isOwner:p.isOwner},organizer,ownEntry:mine?.id||null,
 entries:entries.map((e:any)=>({id:e.id,name:publicPlayerName(e.name,e.player_id,p.ownerId),fighter:e.fighter,seed:e.seed,own:e.id===mine?.id,pending:e.player_id.startsWith('invite:'),...(organizer&&e.player_id.startsWith('invite:')?{inviteCode:e.player_id.slice(7)}:{})})),
 fights:fights.map((f:any)=>({id:f.id,round:f.round,position:f.position,a:f.a,b:f.b,winner:f.winner,status:f.status,scheduledAt:f.scheduled_at,score:f.score,reason:f.reason,attempt:f.attempt,code:mine&&[f.a,f.b].includes(mine.id)?f.room_code:null})),
 history:organizer?await rows(db,'SELECT action,detail,created FROM tournament_events WHERE tournament_id=? ORDER BY created DESC LIMIT 30',t.id):[],now:Date.now()};
}
export async function handleTournaments(request:Request,db:any,ownerEmail=''){
 const headers:Record<string,string>={'Cache-Control':'no-store','Vary':'Cookie'};
 const reply=(body:any,status=200)=>Response.json(body,{status,headers});
 try{
  if(!db)throw fail('Turnieje są chwilowo niedostępne.',503);
  const url=new URL(request.url),origin=request.headers.get('origin');
  if(!['GET','POST'].includes(request.method))throw fail('Nieznane działanie.',405);
  if(request.method==='POST'&&((origin&&new URL(origin).host!==url.host)||request.headers.get('sec-fetch-site')==='cross-site'))throw fail('Niedozwolone źródło.',403);
  let b:any={};if(request.method==='POST'){const raw=await request.text();if(raw.length>4096)throw fail('Za duże dane.',413);try{b=JSON.parse(raw);}catch{throw fail('Nieprawidłowe dane.');}if(!b||Array.isArray(b))throw fail('Nieprawidłowe dane.');}
  const p=await playerIdentity(request,db,headers,ownerEmail),action=request.method==='GET'?(url.searchParams.get('code')?'detail':'list'):b.action,now=Date.now();
  const requireOwner=()=>{if(!p.isOwner)throw fail('Tylko Wawer po zalogowaniu na konto właściciela może organizować turnieje.',403);};
  if(['create','draw','schedule','restart','resolve','cancel','delete','addParticipant','removeParticipant'].includes(action))requireOwner();
  if(action==='list'){
   const all=await rows(db,`SELECT t.*,COUNT(e.id) AS count,MAX(CASE WHEN e.player_id=? THEN e.id END) AS own_entry FROM online_tournaments t LEFT JOIN tournament_entries e ON e.tournament_id=t.id GROUP BY t.id HAVING t.status!='deleted' AND (t.status IN ('registration','running') OR ?=1 OR own_entry IS NOT NULL) ORDER BY t.created DESC LIMIT 50`,p.id,p.isOwner?1:0);
   const upcoming=await rows(db,`SELECT f.id,f.scheduled_at,f.status,t.code,t.name,e.name AS player_name,other.name AS opponent_name,other.player_id AS opponent_id FROM tournament_fights f JOIN online_tournaments t ON t.id=f.tournament_id JOIN tournament_entries e ON (e.id=f.a OR e.id=f.b) LEFT JOIN tournament_entries other ON other.id=CASE WHEN e.id=f.a THEN f.b ELSE f.a END WHERE e.player_id=? AND t.status='running' AND f.status NOT IN ('finished','bye') ORDER BY f.scheduled_at LIMIT 8`,p.id);
   return reply({profile:{name:p.name,authenticated:p.authenticated,isOwner:p.isOwner},tournaments:all.map((t:any)=>({code:t.code,name:t.name,status:t.status,capacity:t.capacity,count:t.count,startAt:t.start_at,own:!!t.own_entry,organizer:p.isOwner})) ,upcoming:upcoming.map(({opponent_id,...f}:any)=>({...f,player_name:p.name,opponent_name:publicPlayerName(f.opponent_name,opponent_id,p.ownerId)})),now});
  }
  if(action==='create'){
   const name=String(b.name||'').normalize('NFKC').trim().replace(/\s+/g,' ');
   if(name.length<3||name.length>60||/[<>]/.test(name))throw fail('Nazwa turnieju: od 3 do 60 znaków.');
   if((!Number.isInteger(b.capacity)||b.capacity<4||b.capacity>10)||![0,15,30,60].includes(b.intervalMinutes)||!Number.isSafeInteger(b.startAt)||b.startAt<now+60000||b.startAt>now+366*86400000)throw fail('Ustaw 4–10 miejsc, przyszły termin i tryb bez przerw albo odstęp 15, 30 lub 60 minut.');
   try{new Intl.DateTimeFormat('pl',{timeZone:b.timezone}).format(now);}catch{throw fail('Nieprawidłowa strefa czasowa.');}
   const n=await db.prepare("SELECT COUNT(*) AS n FROM online_tournaments WHERE owner=? AND status IN ('registration','running')").bind(p.id).first();if(n.n>=5)throw fail('Możesz prowadzić maksymalnie 5 aktywnych turniejów.',429);
   const id=crypto.randomUUID(),c=code();await db.batch([stmt(db,'INSERT INTO online_tournaments(id,code,owner,name,capacity,start_at,interval_minutes,timezone,created) VALUES(?,?,?,?,?,?,?,?,?)',id,c,p.id,name,b.capacity,b.startAt,b.intervalMinutes,b.timezone||'UTC',now),history(db,id,p.id,'create','Otwarto zapisy.')]);
   return reply(await detail(db,await db.prepare('SELECT * FROM online_tournaments WHERE id=?').bind(id).first(),p));
  }
  if(action==='claim'){
   const invite=String(b.inviteCode||'').replace(/[\s-]/g,'').toUpperCase();
   if(!/^[A-F0-9]{16}$/.test(invite))throw fail('Osobisty kod uczestnika ma 16 znaków.');
   const entry=await db.prepare('SELECT * FROM tournament_entries WHERE player_id=?').bind('invite:'+invite).first();
   if(!entry)throw fail('Kod jest nieprawidłowy albo został już wykorzystany.',404);
   const tournament=await db.prepare('SELECT * FROM online_tournaments WHERE id=?').bind(entry.tournament_id).first();
   if(!['registration','running'].includes(tournament.status))throw fail('Ten turniej jest już zakończony.',409);
   if(await db.prepare('SELECT id FROM tournament_entries WHERE tournament_id=? AND player_id=?').bind(tournament.id,p.id).first())throw fail('Masz już swoje miejsce w tym turnieju.',409);
   const result=await stmt(db,"UPDATE tournament_entries SET player_id=? WHERE id=? AND player_id=? AND (SELECT status FROM online_tournaments WHERE id=?) IN ('registration','running')",p.id,entry.id,'invite:'+invite,tournament.id).run();
   if(!result.meta.changes)throw fail('Kod został już wykorzystany.',409);
   await stmt(db,'UPDATE online_tournaments SET revision=revision+1 WHERE id=?',tournament.id).run();
   return reply(await detail(db,tournament,p));
  }
  const c=String(b.code||url.searchParams.get('code')||'').toUpperCase();if(!/^[A-F0-9]{8}$/.test(c))throw fail('Kod turnieju ma 8 znaków.');
  let t=await db.prepare('SELECT * FROM online_tournaments WHERE code=?').bind(c).first();if(!t||t.status==='deleted')throw fail('Nie znaleziono turnieju.',404);
  if(action==='detail')return reply(await detail(db,t,p));
  const own=requireOwner;
  if(action==='addParticipant'){
   const name=String(b.name||'').normalize('NFKC').trim().replace(/\s+/g,' ');
   if(name.length<2||name.length>20||/[<>]/.test(name)||reservedName(name))throw fail('Podaj pseudonim uczestnika: 2–20 znaków. WAWER jest zarezerwowany.');
   if(!roster.includes(b.fighter))throw fail('Wybierz zawodnika dla uczestnika.');
   const invite=crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase();
   const result=await stmt(db,"INSERT INTO tournament_entries(id,tournament_id,player_id,name,fighter,created) SELECT ?,?,?,?,?,? WHERE (SELECT status FROM online_tournaments WHERE id=?)='registration' AND (SELECT COUNT(*) FROM tournament_entries WHERE tournament_id=?)<(SELECT capacity FROM online_tournaments WHERE id=?)",crypto.randomUUID(),t.id,'invite:'+invite,name,b.fighter,now,t.id,t.id,t.id).run();
   if(!result.meta.changes)throw fail('Zapisy są zamknięte albo brak wolnych miejsc.',409);
   await history(db,t.id,p.id,'invite','Dodano uczestnika: '+name).run();
  }else if(action==='removeParticipant'){
   const result=await stmt(db,"DELETE FROM tournament_entries WHERE id=? AND tournament_id=? AND (SELECT status FROM online_tournaments WHERE id=?)='registration'",String(b.entry||''),t.id,t.id).run();
   if(!result.meta.changes)throw fail('Nie można usunąć tego zgłoszenia po losowaniu.',409);
   await history(db,t.id,p.id,'remove','Usunięto zgłoszenie przed losowaniem.').run();
  }else if(action==='register'){
   if(p.name==='GRACZ'||p.name.length<2)throw fail('Najpierw zapisz swój pseudonim na ekranie startowym.');
   if(!roster.includes(b.fighter))throw fail('Wybierz zawodnika.');
   const exists=await db.prepare('SELECT id FROM tournament_entries WHERE tournament_id=? AND player_id=?').bind(t.id,p.id).first();
   if(!exists){const r=await stmt(db,"INSERT INTO tournament_entries(id,tournament_id,player_id,name,fighter,created) SELECT ?,?,?,?,?,? WHERE (SELECT status FROM online_tournaments WHERE id=?)='registration' AND (SELECT COUNT(*) FROM tournament_entries WHERE tournament_id=?)<(SELECT capacity FROM online_tournaments WHERE id=?) ON CONFLICT(tournament_id,player_id) DO NOTHING",crypto.randomUUID(),t.id,p.id,p.name,b.fighter,now,t.id,t.id,t.id).run();if(!r.meta.changes)throw fail('Zapisy są zamknięte albo wszystkie miejsca są zajęte.',409);}
  }else if(action==='withdraw'){
   await stmt(db,"DELETE FROM tournament_entries WHERE tournament_id=? AND player_id=? AND (SELECT status FROM online_tournaments WHERE id=?)='registration'",t.id,p.id,t.id).run();
  }else if(action==='draw'){
   own();if(t.status!=='registration')throw fail('Drabinka została już utworzona.',409);
   const entries=await rows(db,'SELECT * FROM tournament_entries WHERE tournament_id=? ORDER BY created,id',t.id);if(entries.length<4)throw fail('Do losowania potrzebujesz co najmniej 4 uczestników.');
   if(t.interval_minutes===0)t.start_at=Math.max(t.start_at,now);else if(t.start_at<now+60000)throw fail('Ustaw przyszłą godzinę pierwszej walki przed losowaniem.');
   for(let i=entries.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[entries[i],entries[j]]=[entries[j],entries[i]];}
   const drawKey=crypto.randomUUID(),size=entries.length===4?4:entries.length<=8?8:16,order=size===4?[1,4,2,3]:size===8?[1,8,4,5,2,7,3,6]:[1,16,8,9,4,13,5,12,2,15,7,10,3,14,6,11],grid:any[][]=[];
   let scheduled=t.start_at;for(let r=0,count=size/2;count>=1;r++,count/=2){grid[r]=[];for(let pos=0;pos<count;pos++){
    const a=r===0?entries[order[pos*2]-1]?.id||null:grid[r-1][pos*2].winner,bp=r===0?entries[order[pos*2+1]-1]?.id||null:grid[r-1][pos*2+1].winner;
    const bye=r===0&&(!a||!bp),winner=bye?(a||bp):null,status=bye?'bye':a&&bp?'scheduled':'waiting';
    grid[r].push({id:crypto.randomUUID(),a,b:bp,winner,status,at:scheduled,room:bye?null:code(),r,pos});if(!bye)scheduled+=t.interval_minutes*60000;
   }}
   const writes=[stmt(db,"UPDATE online_tournaments SET status='running',start_at=?,draw_key=?,revision=revision+1 WHERE id=? AND status='registration' AND (SELECT COUNT(*) FROM tournament_entries WHERE tournament_id=?)=? AND (SELECT COUNT(*) FROM tournament_entries WHERE tournament_id=? AND id IN ("+entries.map(()=>'?').join(',')+"))=?",t.start_at,drawKey,t.id,t.id,entries.length,t.id,...entries.map((e:any)=>e.id),entries.length)];
   for(const [i,e] of entries.entries())writes.push(stmt(db,'UPDATE tournament_entries SET seed=? WHERE id=? AND (SELECT draw_key FROM online_tournaments WHERE id=?)=?',i+1,e.id,t.id,drawKey));
   for(const f of grid.flat())writes.push(stmt(db,'INSERT INTO tournament_fights(id,tournament_id,round,position,a,b,winner,status,scheduled_at,room_code) SELECT ?,?,?,?,?,?,?,?,?,? WHERE (SELECT draw_key FROM online_tournaments WHERE id=?)=?',f.id,t.id,f.r,f.pos,f.a,f.b,f.winner,f.status,f.at,f.room,t.id,drawKey));
   writes.push(stmt(db,'INSERT OR IGNORE INTO tournament_events(id,tournament_id,actor,action,detail,created) SELECT ?,?,?,?,?,? WHERE (SELECT draw_key FROM online_tournaments WHERE id=?)=?','draw:'+t.id,t.id,p.id,'draw','Zamknięto zapisy i wylosowano drabinkę.',now,t.id,drawKey));const result=await db.batch(writes);if(!result[0].meta.changes)throw fail('Lista uczestników zmieniła się lub drabinka już istnieje. Odśwież turniej.',409);
  }else if(action==='schedule'){
   own();if(!Number.isSafeInteger(b.startAt)||b.startAt<now+60000||b.startAt>now+366*86400000)throw fail('Wybierz przyszły termin.');
   if(t.status==='registration')await stmt(db,'UPDATE online_tournaments SET start_at=? WHERE id=?',b.startAt,t.id).run();
   else{const f=await db.prepare('SELECT * FROM tournament_fights WHERE id=? AND tournament_id=?').bind(b.fight,t.id).first();if(!f||!['scheduled','waiting'].includes(f.status))throw fail('Można przełożyć wyłącznie nierozpoczętą walkę.');
    await db.batch(await scheduleFollowing(db,t,f,b.startAt));
   }await history(db,t.id,p.id,'schedule','Zmieniono terminarz. '+String(b.reason||'Gracze widzą nowe godziny w panelu.').trim().slice(0,300)).run();
  }else if(action==='enter'){
   if(t.status!=='running')throw fail('Turniej nie jest w trakcie rozgrywania.');
   const f=await db.prepare('SELECT * FROM tournament_fights WHERE id=? AND tournament_id=?').bind(b.fight,t.id).first();if(!f||!['scheduled','playing'].includes(f.status)||!f.a||!f.b)throw fail('Ta walka nie jest gotowa do rozpoczęcia.');
   const participants=await rows(db,'SELECT * FROM tournament_entries WHERE id IN (?,?)',f.a,f.b),a=participants.find((e:any)=>e.id===f.a),guest=participants.find((e:any)=>e.id===f.b);
   if(![a.player_id,guest.player_id].includes(p.id))throw fail('Ta walka jest przeznaczona dla innej pary zawodników.',403);
   if(now<f.scheduled_at-600000)throw fail('Pokój otworzy się 10 minut przed walką.');
   if(now>f.scheduled_at+3600000&&f.status!=='playing')throw fail('Termin minął. Poproś organizatora o nową godzinę.');
   await stmt(db,"INSERT OR IGNORE INTO duel_rooms(code,host_key,guest_key,creator,created,expires,host_seen,guest_seen,host_fighter,guest_fighter,host_player,guest_player,host_name,guest_name,tournament_fight,arena) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",f.room_code,crypto.randomUUID(),crypto.randomUUID(),p.id,now,Math.max(now,f.scheduled_at)+7200000,0,0,a.fighter,guest.fighter,a.player_id,guest.player_id,publicPlayerName(a.name,a.player_id,p.ownerId),publicPlayerName(guest.name,guest.player_id,p.ownerId),f.id,arenaNames[crypto.getRandomValues(new Uint32Array(1))[0]%arenaNames.length]).run();
   const room=await db.prepare('SELECT * FROM duel_rooms WHERE code=?').bind(f.room_code).first();if(room.started_at||room.status==='closed')throw fail('Ta próba walki już się rozpoczęła. Po utracie sesji organizator może zarządzić powtórkę.',409);
   return reply({code:room.code,token:p.id===a.player_id?room.host_key:room.guest_key,role:p.id===a.player_id?'host':'guest',hostName:publicPlayerName(a.name,a.player_id,p.ownerId),guestName:publicPlayerName(guest.name,guest.player_id,p.ownerId),tournamentCode:t.code,tournamentFight:f.id,scheduledAt:f.scheduled_at});
  }else if(action==='resolve'||action==='restart'){
   own();if(t.status!=='running')throw fail('Turniej nie jest aktywny.');const f=await db.prepare('SELECT * FROM tournament_fights WHERE id=? AND tournament_id=?').bind(b.fight,t.id).first();
   if(!f||!active(f.status)||!f.a||!f.b)throw fail('Nie można zmienić tej walki.');
   const reason=String(b.reason||'').trim();if(reason.length<5||reason.length>300)throw fail('Podaj uzasadnienie od 5 do 300 znaków.');
   if(action==='restart'&&(!Number.isSafeInteger(b.startAt)||b.startAt<now-1000||b.startAt>now+366*86400000))throw fail('Ustaw termin powtórki.');
   if(action==='resolve'&&![f.a,f.b].includes(b.winner))throw fail('Wybierz uczestnika tej walki.');
   const rescheduled=action==='restart'?await scheduleFollowing(db,t,{...f,status:'review'},b.startAt):[];
   if(f.room_code)await stmt(db,"UPDATE duel_rooms SET status='closed' WHERE code=?",f.room_code).run();
   if(action==='resolve')await advanceFight(db,f,b.winner,'W/O',reason,p.id);
   else{if(!Number.isSafeInteger(b.startAt)||b.startAt<now-1000||b.startAt>now+366*86400000)throw fail('Ustaw termin powtórki.');await db.batch([...rescheduled,stmt(db,"UPDATE tournament_fights SET room_code=?,attempt=attempt+1,status='scheduled',scheduled_at=?,score=NULL,reason=? WHERE id=? AND status NOT IN ('finished','bye')",code(),b.startAt,reason,f.id),history(db,t.id,p.id,'restart',reason)]);}
  }else if(action==='delete'){
   own();await db.batch([stmt(db,"UPDATE online_tournaments SET status='deleted',revision=revision+1 WHERE id=?",t.id),stmt(db,"UPDATE duel_rooms SET status='closed' WHERE tournament_fight IN (SELECT id FROM tournament_fights WHERE tournament_id=?)",t.id),history(db,t.id,p.id,'delete','Organizator usunął turniej z listy.')]);return reply({deleted:true});
  }else if(action==='cancel'){
   own();if(['completed','cancelled'].includes(t.status))throw fail('Turniej został już zakończony.');await db.batch([stmt(db,"UPDATE online_tournaments SET status='cancelled' WHERE id=?",t.id),stmt(db,"UPDATE duel_rooms SET status='closed' WHERE tournament_fight IN (SELECT id FROM tournament_fights WHERE tournament_id=?)",t.id),history(db,t.id,p.id,'cancel','Organizator odwołał turniej.')]);
  }else throw fail('Nieznane działanie.',404);
  await stmt(db,'UPDATE online_tournaments SET revision=revision+1 WHERE id=?',t.id).run();t=await db.prepare('SELECT * FROM online_tournaments WHERE id=?').bind(t.id).first();return reply(await detail(db,t,p));
 }catch(e:any){return reply({error:e.status?e.message:'Nie udało się zapisać turnieju. Spróbuj ponownie.'},e.status||500);}
}
