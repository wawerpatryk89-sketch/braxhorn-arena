import {env} from 'cloudflare:workers';
import {handleArena} from '../../../lib/arena-api';
export const GET=(request:Request)=>handleArena(request,env.DB,(env as any).BRAX_OWNER_EMAIL);
export const POST=(request:Request)=>handleArena(request,env.DB,(env as any).BRAX_OWNER_EMAIL);
