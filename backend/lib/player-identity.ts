import {ownerIdentity,publicPlayerName} from './owner-policy';
import {addCookie,cookie,cookieValue,DEFAULT_AVATAR,ENTRY_COOKIE,sessionPlayer} from './account-session';
/** One identity for legacy ChatGPT accounts, password sessions and anonymous play. */
export async function playerIdentity(request:Request,db:any,headers:Record<string,string>,ownerEmail=''){
 const existing=await sessionPlayer(request,db),entry=cookieValue(request,ENTRY_COOKIE);
 const subject=(!entry||entry==='legacy')?request.headers.get('oai-authenticated-user-id'):null;
 const guestCookie=cookieValue(request,'brax_player'),validGuest=/^[a-f0-9-]{36}$/.test(guestCookie),guest=validGuest?guestCookie:crypto.randomUUID();
 if(!validGuest)addCookie(headers,cookie(request,'brax_player',guest,31536000));
 const id=existing?.id||(subject?'u:'+subject:'g:'+guest),authenticated=!!existing||!!subject;
 const access=await ownerIdentity(request,db,ownerEmail,id,authenticated);
 const guestName='GOŚĆ-'+guest.replace(/-/g,'').slice(0,4).toUpperCase();
 await db.prepare('INSERT OR IGNORE INTO players(id,name,avatar,created) VALUES(?,?,?,?)').bind(id,access.isOwner?'WAWER':authenticated?'GRACZ':guestName,DEFAULT_AVATAR,Date.now()).run();
 // Only legacy sign-in may migrate the old guest history. Password sign-in never adopts another identity's records.
 if(subject&&validGuest&&!existing){await db.batch([
 db.prepare("UPDATE players SET name=COALESCE((SELECT name FROM players WHERE id=?),name) WHERE id=? AND name='GRACZ' AND NOT EXISTS(SELECT 1 FROM account_credentials WHERE player_id=?)").bind('g:'+guest,id,id),
 db.prepare('UPDATE runs SET owner=? WHERE owner=?').bind(id,'g:'+guest),
 db.prepare('UPDATE results SET owner=? WHERE owner=?').bind(id,'g:'+guest),
 db.prepare('UPDATE tournament_entries SET player_id=? WHERE player_id=? AND NOT EXISTS (SELECT 1 FROM tournament_entries other WHERE other.tournament_id=tournament_entries.tournament_id AND other.player_id=?)').bind(id,'g:'+guest,id)
 ]);}
 const p=await db.prepare('SELECT name,avatar FROM players WHERE id=?').bind(id).first();
 let name=authenticated?publicPlayerName(p.name,id,access.ownerId):guestName;
 if(name!==p.name)await db.prepare('UPDATE players SET name=? WHERE id=?').bind(name,id).run();
 const credential=authenticated?await db.prepare('SELECT player_id FROM account_credentials WHERE player_id=?').bind(id).first():null;
 return{id,name,avatar:p.avatar||DEFAULT_AVATAR,authenticated,hasPassword:!!credential,...access};
}
