import {ownerIdentity,publicPlayerName} from './owner-policy';
/** Share the existing arena identity; display names are never authentication. */
export async function playerIdentity(request:Request,db:any,headers:Record<string,string>,ownerEmail=''){
 const cookie=request.headers.get('cookie')?.match(/(?:^|;\s*)brax_player=([a-f0-9-]{36})(?:;|$)/)?.[1];
 const guest=cookie||crypto.randomUUID(),auth=request.headers.get('oai-authenticated-user-id');
 const id=auth?'u:'+auth:'g:'+guest;
 if(!cookie)headers['Set-Cookie']='brax_player='+guest+'; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000'+(new URL(request.url).protocol==='https:'?'; Secure':'');
 const access=await ownerIdentity(request,db,ownerEmail);
 await db.prepare('INSERT OR IGNORE INTO players(id,name,created) VALUES(?,?,?)').bind(id,access.isOwner?'WAWER':'GRACZ',Date.now()).run();
 if(auth&&cookie){await db.batch([
 db.prepare("UPDATE players SET name=COALESCE((SELECT name FROM players WHERE id=?),name) WHERE id=? AND name='GRACZ'").bind('g:'+guest,id),
 db.prepare('UPDATE runs SET owner=? WHERE owner=?').bind(id,'g:'+guest),
 db.prepare('UPDATE results SET owner=? WHERE owner=?').bind(id,'g:'+guest),
 db.prepare('UPDATE tournament_entries SET player_id=? WHERE player_id=? AND NOT EXISTS (SELECT 1 FROM tournament_entries other WHERE other.tournament_id=tournament_entries.tournament_id AND other.player_id=?)').bind(id,'g:'+guest,id)
 ]);}
 const p=await db.prepare('SELECT name FROM players WHERE id=?').bind(id).first();
 const name=publicPlayerName(p.name,id,access.ownerId);
 if(name!==p.name)await db.prepare('UPDATE players SET name=? WHERE id=?').bind(name,id).run();
 return{id,name,authenticated:!!auth,...access};
}
