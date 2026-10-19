import assert from 'node:assert/strict';
import {handleAccount} from '../../backend/lib/account-api.ts';
export const TEST_PASSWORD='Braxhorn-Test-2026!';
export function mergeCookies(previous,response){
 const jar=new Map(previous.split(';').map(c=>c.trim()).filter(Boolean).map(c=>{const i=c.indexOf('=');return [c.slice(0,i),c.slice(i+1)];}));
 for(const cookie of response.headers.getSetCookie()){const [pair]=cookie.split(';'),i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}
 return [...jar].map(([k,v])=>k+'='+v).join('; ');
}
export async function registerTestAccount(db,nick,avatar='male',bucket=null){
 const response=await handleAccount(new Request('https://game.test/api/account?action=register',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':'test-'+encodeURIComponent(nick)},body:JSON.stringify({nick,password:TEST_PASSWORD,avatar})}),db,bucket);
 const data=await response.json();assert.equal(response.status,201,JSON.stringify(data));
 return {cookie:mergeCookies('',response),id:data.player.id,player:data.player};
}
