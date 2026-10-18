// Only Sites' authenticated identity can claim the configured owner's account.
// A display name, guest cookie, room token or shared URL is never an admin credential.
export async function ownerIdentity(request:Request,db:any,ownerEmail=''){
 const subject=request.headers.get('oai-authenticated-user-id');
 const email=request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
 let owner=await db.prepare("SELECT player_id FROM arena_owner WHERE id='organizer'").first();
 if(!owner&&subject&&ownerEmail&&email===ownerEmail.trim().toLowerCase()){
  await db.prepare("INSERT OR IGNORE INTO arena_owner(id,player_id) VALUES('organizer',?)").bind('u:'+subject).run();
  owner=await db.prepare("SELECT player_id FROM arena_owner WHERE id='organizer'").first();
 }
 return {ownerId:owner?.player_id||null,isOwner:!!subject&&owner?.player_id==='u:'+subject};
}
export function reservedName(name:unknown){
 return String(name||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f\s\p{Cf}._-]/gu,'').replace(/[аɑ]/g,'a').replace(/[еҽ]/g,'e').replace(/[ԝ]/g,'w')==='wawer';
}
export function publicPlayerName(name:string,id:string|null,ownerId:string|null){
 return ownerId&&id===ownerId?'WAWER':reservedName(name)?'GRACZ':name;
}
