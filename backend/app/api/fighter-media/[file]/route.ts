import {env} from 'cloudflare:workers';
import {fighterMedia} from '../../../../lib/fighter-media';
async function handle(request:Request, context:{params:Promise<{file:string}>}) {
 const {file}=await context.params;
 return fighterMedia(request,env.BUCKET,(env as any).FIGHTER_MEDIA_UPLOAD_TOKEN,file);
}
export const GET=handle;
export const HEAD=handle;
export const PUT=handle;
