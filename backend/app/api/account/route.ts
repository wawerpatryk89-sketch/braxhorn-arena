import {env} from 'cloudflare:workers';
import {handleAccount} from '../../../lib/account-api';
const handle=(request:Request)=>handleAccount(request,env.DB,env.BUCKET,(env as any).BRAX_OWNER_EMAIL);
export const GET=handle;
export const POST=handle;
export const PUT=handle;
