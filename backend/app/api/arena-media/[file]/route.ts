import {env} from 'cloudflare:workers';
import {arenaMedia} from '../../../../lib/arena-media';
async function handle(request:Request, context:{params:Promise<{file:string}>}) {
 const {file}=await context.params;
 return arenaMedia(request,env.BUCKET,(env as any).ARENA_MEDIA_UPLOAD_TOKEN,file);
}
export const GET=handle;
export const HEAD=handle;
export const PUT=handle;
