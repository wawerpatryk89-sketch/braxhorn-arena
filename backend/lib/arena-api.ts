import {minimumMatchTime} from './ranking-time-policy';
import challenges from './challenges.json';
import {playerIdentity} from './player-identity';
import {reservedName,publicPlayerName} from './owner-policy';
const roster=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];
const levels=['easy','normal','hard'];
const modes=['fight','arcade','tournament','survival','training'];
const cleanName=(v:unknown)=>String(v||'').normalize('NFKC').replace(/[^\p{L}\p{N} ._-]/gu,'').trim().replace(/\s+/g,' ').slice(0,20);
const integer=(v:unknown,min=0,max=1000000)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
const fail=(message:string,status=400)=>Object.assign(new Error(message),{status});
export async function handleArena(request:Request,db:any,ownerEmail=''){
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Cookie'};
 const reply=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers});
 try{
  if(!db)throw fail('Ranking jest chwilowo niedostępny.',503);
  const url=new URL(request.url),action=url.searchParams.get('action')||'me',now=Date.now();
  if(request.method==='POST'){
   const origin=request.headers.get('origin');if((origin&&new URL(origin).host!==url.host)||request.headers.get('sec-fetch-site')==='cross-site')throw fail('Niedozwolone źródło żądania.',403);
   if(Number(request.headers.get('content-length')||0)>8192)throw fail('Zbyt duże żądanie.',413);
  }
  const player=await playerIdentity(request,db,headers,ownerEmail),owner=player.id,auth=player.authenticated;
  if(request.method==='GET'&&action==='me'){
   const won=await db.prepare('SELECT fighter,COUNT(*) AS wins FROM matches JOIN runs ON matches.run_id=runs.id WHERE runs.owner=? AND matches.finished=1 AND matches.wins>matches.losses GROUP BY fighter').bind(owner).all();
   const best=await db.prepare("SELECT fighter,MAX(score) AS best FROM results WHERE owner=? AND mode='survival' GROUP BY fighter").bind(owner).all();
   const done=await db.prepare("SELECT DISTINCT fighter,mode FROM results WHERE owner=? AND mode LIKE 'challenge:%'").bind(owner).all();
   return reply({name:player.name,authenticated:!!auth,isOwner:player.isOwner,fighters:Object.fromEntries(roster.map(f=>[f,{wins:won.results.find((x:any)=>x.fighter===f)?.wins||0,bestSurvival:best.results.find((x:any)=>x.fighter===f)?.best||0,challenges:done.results.filter((x:any)=>x.fighter===f).map((x:any)=>x.mode.slice(10))}]))});
  }
  if(request.method==='GET'&&action==='board'){
   const mode=url.searchParams.get('mode')||'survival',difficulty=url.searchParams.get('difficulty')||'normal';
   if(!levels.includes(difficulty)||!([...modes,...challenges.map(c=>'challenge:'+c.id)].includes(mode)))throw fail('Nieznana kategoria.');
   const cte=`WITH best AS (SELECT results.*,(SELECT target FROM runs WHERE runs.id=results.id) AS targetWins,players.name,ROW_NUMBER() OVER(PARTITION BY results.owner ORDER BY results.completed DESC,results.score DESC,results.elapsed ASC,results.created ASC,results.id ASC) AS personal FROM results JOIN players ON players.id=results.owner WHERE mode=? AND difficulty=?), ranked AS (SELECT *,ROW_NUMBER() OVER(ORDER BY completed DESC,score DESC,elapsed ASC,created ASC,id ASC) AS rank FROM best WHERE personal=1) SELECT rank,name,fighter,score,elapsed,completed,targetWins,owner,owner=? AS own FROM ranked`;
   const rows=await db.prepare(cte+' WHERE rank<=100 OR owner=? ORDER BY rank').bind(mode,difficulty,owner,owner).all();
   const safe=rows.results.map(({owner:id,...r}:any)=>({...r,name:publicPlayerName(r.name,id,player.ownerId)}));
   return reply({rows:safe.filter((r:any)=>r.rank<=100),own:safe.find((r:any)=>r.own)||null});
  }
  if(request.method!=='POST')throw fail('Nieznane działanie.',404);
  const raw=await request.text();if(raw.length>8192)throw fail('Zbyt duże żądanie.',413);let body;try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{throw fail('Nieprawidłowe dane żądania.');}
  if(action==='name'){
   const requested=cleanName(body.name);if(reservedName(requested)&&!player.isOwner)throw fail('Pseudonim Wawer jest zarezerwowany dla właściciela. Zaloguj się na konto właściciela lub wybierz inną nazwę.',403);const name=player.isOwner?'WAWER':requested;if(name.length<2)throw fail('Wpisz pseudonim od 2 do 20 znaków.');await db.prepare('UPDATE players SET name=? WHERE id=?').bind(name,owner).run();return reply({name});
  }
  if(action==='start'){
   const {mode,difficulty,fighter,challenge}=body;const target=mode==='tournament'?(body.targetWins===2?2:3):mode==='arcade'?roster.length-1:1;
   if(!modes.includes(mode)||!levels.includes(difficulty)||!roster.includes(fighter)||typeof body.runId!=='string'||body.runId.length>90)throw fail('Nieprawidłowe ustawienia walki.');
   const task=challenge?challenges.find(c=>c.id===challenge):null;
   if(challenge&&!task)throw fail('Nieznane wyzwanie.');
   if(task&&((task as any).exclude||[]).includes(fighter))throw fail('Ten zawodnik nie obsługuje techniki wymaganej w wyzwaniu.');
   if(task&&((task.drill?'training':task.mode||'fight')!==mode||(!task.drill&&(task.difficulty||'normal')!==difficulty)))throw fail('Ustawienia nie odpowiadają wyzwaniu.');
   const recent=await db.prepare('SELECT COUNT(*) AS n FROM matches JOIN runs ON matches.run_id=runs.id WHERE runs.owner=? AND matches.started>?').bind(owner,now-60000).first();if(recent.n>=20)throw fail('Zbyt wiele rozpoczętych walk. Poczekaj chwilę.',429);
   await db.prepare('INSERT INTO runs(id,owner,client,mode,difficulty,fighter,challenge,target,started,updated) SELECT ?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM runs WHERE owner=? AND client=?)').bind(crypto.randomUUID(),owner,body.runId,mode,difficulty,fighter,challenge||null,target,now,now,owner,body.runId).run();
   const run=await db.prepare('SELECT * FROM runs WHERE owner=? AND client=? ORDER BY started DESC,id DESC LIMIT 1').bind(owner,body.runId).first();
   if(!run||run.closed||run.mode!==mode||run.fighter!==fighter||run.difficulty!==difficulty||run.challenge!==(challenge||null))throw fail('Seria została zakończona lub zmieniono jej ustawienia.',409);
   await db.prepare('INSERT INTO matches(id,run_id,started) SELECT ?,id,? FROM runs WHERE id=? AND closed=0 AND NOT EXISTS(SELECT 1 FROM matches WHERE run_id=runs.id AND finished=0)').bind(crypto.randomUUID(),now,run.id).run();
   const pending=await db.prepare('SELECT id FROM matches WHERE run_id=? AND finished=0 ORDER BY started DESC,id DESC LIMIT 1').bind(run.id).first();
   if(!pending)throw fail('Seria została zakończona.',409);
   return reply({match:pending.id,targetWins:run.target});
  }
  const match=await db.prepare('SELECT matches.*,runs.owner,runs.mode,runs.difficulty,runs.fighter,runs.challenge,runs.score,runs.elapsed AS run_elapsed,runs.closed,runs.target,runs.matches AS match_count FROM matches JOIN runs ON runs.id=matches.run_id WHERE matches.id=? AND runs.owner=?').bind(String(body.match||''),owner).first();
  if(!match)throw fail('Nie znaleziono rozpoczętej walki.',404);
  if(action==='finish'){
   if(match.finished)return reply({saved:true,duplicate:true});
   if(match.closed)throw fail('Seria jest już zakończona.',409);
   const {rounds,elapsed,hp,specials}=body;const roundsPlayed=body.roundsPlayed??(match.mode==='survival'?1:Math.max(2,(rounds?.[0]||0)+(rounds?.[1]||0)));
   if(!Array.isArray(rounds)||rounds.length!==2||!rounds.every(n=>integer(n,0,2))||!integer(elapsed,0,240000)||elapsed>now-match.started+3000||!integer(hp,0,100)||!integer(specials,0,30))throw fail('Wynik nie przeszedł sprawdzenia czasu lub parametrów.');
   if(match.mode==='training'||!integer(roundsPlayed,1,3)||rounds[0]+rounds[1]>roundsPlayed||(match.mode==='survival'?roundsPlayed!==1||Math.max(...rounds)>1:Math.max(...rounds)<2&&roundsPlayed!==3))throw fail('Nieprawidłowy wynik rund.');
   const minimum=minimumMatchTime(match.mode,match.fighter,rounds,roundsPlayed);if(elapsed<minimum){console.warn('ranking_time_rejected',JSON.stringify({match:match.id,mode:match.mode,fighter:match.fighter,elapsed,minimum,rounds,roundsPlayed}));throw fail('Wynik jest krótszy niż minimalny czas walki.');}
   const won=Number(rounds[0]>rounds[1]),lost=Number(rounds[0]<rounds[1]),settlement=crypto.randomUUID();
   // One transactional claim; subsequent writes are guarded by this request's nonce.
   const completed="(mode='fight' OR (mode IN ('arcade','tournament') AND score>=target))";
   const writes=[db.prepare('UPDATE matches SET finished=1,elapsed=?,wins=?,losses=?,hp=?,specials=?,settlement_key=? WHERE id=? AND finished=0 AND EXISTS(SELECT 1 FROM runs WHERE runs.id=matches.run_id AND closed=0)').bind(elapsed,rounds[0],rounds[1],hp,specials,settlement,match.id),
    db.prepare("UPDATE runs SET score=score+?,elapsed=elapsed+?,matches=matches+1,closed=(mode='fight' OR ?=1 OR (mode IN ('arcade','tournament') AND score+?>=target)),updated=? WHERE id=? AND EXISTS(SELECT 1 FROM matches WHERE id=? AND settlement_key=?)").bind(won,elapsed,lost,won,now,match.run_id,match.id,settlement)];
   if(won)writes.push(db.prepare(`INSERT INTO results(id,owner,mode,difficulty,fighter,score,elapsed,completed,created) SELECT id,owner,mode,difficulty,fighter,CASE WHEN mode='fight' THEN ? ELSE score END,elapsed,${completed},? FROM runs WHERE id=? AND EXISTS(SELECT 1 FROM matches WHERE id=? AND settlement_key=?) ON CONFLICT(id) DO UPDATE SET score=excluded.score,elapsed=excluded.elapsed,completed=excluded.completed`).bind(rounds[0]-rounds[1],now,match.run_id,match.id,settlement));
   const saved=await db.batch(writes);
   if(!saved[0].meta.changes){const prior=await db.prepare('SELECT finished FROM matches WHERE id=?').bind(match.id).first();if(prior?.finished)return reply({saved:true,duplicate:true});throw fail('Seria jest już zakończona.',409);}
   const result=await db.prepare('SELECT score FROM runs WHERE id=?').bind(match.run_id).first();
   return reply({saved:true,score:result.score});
  }
  if(action==='challenge'){
   if(match.challenge_done)return reply({saved:true,duplicate:true});
   const task=challenges.find(c=>c.id===match.challenge);if(!task||task.id!==body.challenge)throw fail('Wyzwanie nie jest aktywne.');
   if(!integer(body.elapsed,300,86400000)||body.elapsed>now-match.started+match.run_elapsed+3000||!integer(body.count,task.goal,task.goal))throw fail('Nieprawidłowy postęp wyzwania.');
   if(task.drill&&body.elapsed<task.goal*100)throw fail('Nieprawidłowy czas techniki.');
   if(task.mode==='survival'&&match.score<task.goal)throw fail('Seria jest za krótka.');
   if(!task.drill&&!task.mode){if(!match.finished||match.wins<=match.losses)throw fail('Walka musi zakończyć się wygraną.');if(task.event==='cleanwin'&&match.specials!==0)throw fail('Użyto COMBO.');if(task.event==='healthywin'&&match.hp<60)throw fail('Za mało zdrowia.');if(task.event==='fastwin'&&match.elapsed>90000)throw fail('Przekroczono czas.');}
   const elapsed=task.mode==='survival'?match.run_elapsed:body.elapsed;
   await saveResult(db,match.run_id+'-'+task.id,owner,'challenge:'+task.id,match.difficulty,match.fighter,1,elapsed,true,now);
   await db.prepare('UPDATE matches SET challenge_done=1 WHERE id=?').bind(match.id).run();return reply({saved:true});
  }
  throw fail('Nieznane działanie.',404);
 }catch(error:any){return reply({error:error.status?error.message:'Nie udało się połączyć z rankingiem. Spróbuj ponownie.'},error.status||500);}
}
function resultStatement(db:any,id:string,owner:string,mode:string,difficulty:string,fighter:string,score:number,elapsed:number,completed:boolean,now:number){return db.prepare('INSERT INTO results(id,owner,mode,difficulty,fighter,score,elapsed,completed,created) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET score=excluded.score,elapsed=excluded.elapsed,completed=excluded.completed').bind(id,owner,mode,difficulty,fighter,score,Math.max(1,Math.round(elapsed)),Number(completed),now);}
async function saveResult(db:any,id:string,owner:string,mode:string,difficulty:string,fighter:string,score:number,elapsed:number,completed:boolean,now:number){await resultStatement(db,id,owner,mode,difficulty,fighter,score,elapsed,completed,now).run();}
