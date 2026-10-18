// Module hooks for scripts/local-server.mjs: extensionless backend imports resolve to .ts,
// and JSON files are imported as default exports (as the Cloudflare bundler does).
import {register} from 'node:module';
register('data:text/javascript,'+encodeURIComponent(`
import fs from 'node:fs';
export async function resolve(specifier,context,next){
 try{return await next(specifier,context);}catch(error){
  if(specifier.startsWith('.')&&!/\\.[a-z]+$/i.test(specifier)){for(const ext of ['.ts','.mts','.js']){try{return await next(specifier+ext,context);}catch{}}}
  throw error;
 }
}
export async function load(url,context,next){
 if(url.endsWith('.json'))return {format:'module',shortCircuit:true,source:'export default '+fs.readFileSync(new URL(url),'utf8')};
 if(url.endsWith('.raw')||url.includes('?raw'))return {format:'module',shortCircuit:true,source:'export default '+JSON.stringify(fs.readFileSync(new URL(url.split('?')[0]),'utf8'))};
 return next(url,context);
}`));
