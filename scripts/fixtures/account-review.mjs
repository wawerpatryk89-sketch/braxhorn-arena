// Review-only data loaded by the loopback local server before it starts listening.
// These publicly documented test credentials never connect to a deployed database.
export const REVIEW_PASSWORD='Braxhorn-Test-2026!';
export async function seedAccountReview({db,sqlite,bucket,handleAccount}){
 const origin='http://localhost',profiles=[];
 for(const [nick,avatar] of [['QA BRAX','male'],['QA NYXA','female']]){
  const response=await handleAccount(new Request(origin+'/api/account?action=register',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':'fixture-'+nick},body:JSON.stringify({nick,password:REVIEW_PASSWORD,avatar})}),db,bucket);
  const result=await response.json();if(response.status!==201)throw Error('Fixture account: '+JSON.stringify(result));profiles.push(result.player);
 }
 // A legacy owner attaches a password to the SAME primary key. Ordinary password login
 // then works without any trusted headers, matching the production migration path.
 const response=await handleAccount(new Request(origin+'/api/account?action=password',{method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':'fixture-owner','oai-authenticated-user-email':'fixture-owner@test.invalid'},body:JSON.stringify({password:REVIEW_PASSWORD})}),db,bucket,'fixture-owner@test.invalid');
 const result=await response.json();if(!response.ok)throw Error('Fixture owner: '+JSON.stringify(result));
 const [a,b]=profiles,now=Date.now(),organizer='u:fixture-owner';
 for(const [i,p] of profiles.entries()){
  const id='fixture-run-'+i;
  sqlite.prepare('INSERT INTO runs(id,owner,client,mode,difficulty,fighter,target,started,updated,closed,score,elapsed,matches) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,p.id,id,'survival','normal',i?'NYXA':'BRAX',12,now-600000,now,1,12-i*4,180000,12-i*4);
  sqlite.prepare('INSERT INTO results(id,owner,mode,difficulty,fighter,score,elapsed,completed,created) VALUES(?,?,?,?,?,?,?,?,?)').run(id,p.id,'survival','normal',i?'NYXA':'BRAX',12-i*4,180000,0,now-i*1000);
 }
 sqlite.prepare('INSERT INTO duel_results(code,host_player,guest_player,host_name,guest_name,host_fighter,guest_fighter,score,created) VALUES(?,?,?,?,?,?,?,?,?)').run('FADE2026',a.id,b.id,'Historical BRAX','Historical NYXA','BRAX','NYXA','[2,1]',now-60000);
 const tournament='fixture-tournament',entryIds=['fixture-entry-a','fixture-entry-b','fixture-entry-owner','fixture-entry-invite'];
 sqlite.prepare('INSERT INTO online_tournaments(id,code,owner,name,status,capacity,start_at,interval_minutes,timezone,created,revision) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(tournament,'FACE2026',organizer,'BRAXHORN IDENTITY CUP','running',4,now+120000,0,'Europe/Warsaw',now-3600000,1);
 for(const [i,p] of [a,b,{id:organizer,name:'WAWER'},{id:'invite:0000000000002026',name:'Zaproszony gracz'}].entries())sqlite.prepare('INSERT INTO tournament_entries(id,tournament_id,player_id,name,fighter,seed,created) VALUES(?,?,?,?,?,?,?)').run(entryIds[i],tournament,p.id,p.name,['BRAX','NYXA','KROV','NINA'][i],i+1,now-1000+i);
 for(const [position,aId,bId] of [[0,entryIds[0],entryIds[1]],[1,entryIds[2],entryIds[3]]])sqlite.prepare('INSERT INTO tournament_fights(id,tournament_id,round,position,a,b,status,scheduled_at,room_code) VALUES(?,?,?,?,?,?,?,?,?)').run('fixture-semi-'+position,tournament,0,position,aId,bId,'scheduled',now+120000,position?'FACE2002':'FACE2001');
 sqlite.prepare('INSERT INTO tournament_fights(id,tournament_id,round,position,status,scheduled_at,room_code) VALUES(?,?,?,?,?,?,?)').run('fixture-final',tournament,1,0,'waiting',now+120000,'FACE2003');
 console.log('Review fixture ready: QA BRAX / QA NYXA / WAWER; password '+REVIEW_PASSWORD+'; tournament FACE2026. Local memory only.');
}
