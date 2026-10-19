import {env} from 'cloudflare:workers';
import {playerAvatar} from '../../../../lib/account-api';
const handle=async(request:Request,context:{params:Promise<{file:string}>})=>playerAvatar(request,env.BUCKET,(await context.params).file);
export const GET=handle;
export const HEAD=handle;
