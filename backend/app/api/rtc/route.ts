import {env} from 'cloudflare:workers';
import {handleRTC} from '../../../lib/rtc-config';
export const POST=(request:Request)=>handleRTC(request,env.DB,env);
