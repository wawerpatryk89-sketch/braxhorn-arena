import {env} from 'cloudflare:workers';
import {handleDuel} from '../../../lib/duel-api';
export const POST=(request:Request)=>handleDuel(request,env.DB,(env as any).BRAX_OWNER_EMAIL);
