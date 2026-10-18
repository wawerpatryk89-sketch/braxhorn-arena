import {env} from 'cloudflare:workers';
import {handleTournaments} from '../../../lib/tournament-api';
export const GET=(request:Request)=>handleTournaments(request,env.DB,(env as any).BRAX_OWNER_EMAIL);
export const POST=GET;
