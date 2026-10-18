// Immutable, public fighter payloads; uploads require a temporary server-only secret.
const FILE = /^[a-z0-9-]+\.([a-f0-9]{64})\.(json\.gz|webp)$/;
export async function fighterMedia(request: Request, bucket: R2Bucket|undefined, token: string|undefined, file: string) {
 if(!FILE.test(file)) return new Response('Not found',{status:404});
 if(!bucket) return new Response('Media unavailable',{status:503});
 if(!['GET','HEAD','PUT'].includes(request.method))return new Response('Method not allowed',{status:405});
 const key='fighters/'+file;
 const contentType=file.endsWith('.gz')?'application/gzip':'image/webp';
 if(request.method==='PUT') {
  if(!token || request.headers.get('Authorization')!=='Bearer '+token) return new Response('Forbidden',{status:403});
  const size=Number(request.headers.get('Content-Length'));
  if(!Number.isSafeInteger(size)||size<=0||size>64*1024*1024) return new Response('Invalid size',{status:413});
  if(await bucket.head(key)) return new Response('Already exists',{status:409});
  const body=await request.arrayBuffer();
  if(body.byteLength!==size) return new Response('Size mismatch',{status:400});
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',body)),v=>v.toString(16).padStart(2,'0')).join('');
  if(digest!==FILE.exec(file)![1])return new Response('Hash mismatch',{status:400});
  const object=await bucket.put(key,body,{httpMetadata:{contentType:contentType,cacheControl:'public, max-age=31536000, immutable'}});
  return Response.json({size:object?.size,etag:object?.etag},{status:201});
 }
 const head=await bucket.head(key);
 if(!head) return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
 const headers=new Headers({'Content-Type':contentType,'Cache-Control':'public, max-age=31536000, immutable','Accept-Ranges':'bytes','ETag':head.httpEtag,'X-Content-Type-Options':'nosniff'});
 if(request.headers.get('If-None-Match')===head.httpEtag) return new Response(null,{status:304,headers});
 let offset=0,end=head.size-1,status=200;
 const range=request.headers.get('Range');
 if(range && (!request.headers.get('If-Range')||request.headers.get('If-Range')===head.httpEtag)) {
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match||(!match[1]&&!match[2])) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${head.size}`}});
  if(!match[1]&&Number(match[2])===0)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${head.size}`}});
  if(!match[1])offset=Math.max(0,head.size-Number(match[2]));
  else {offset=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;}
  if(offset>end||offset>=head.size) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${head.size}`}});
  status=206;headers.set('Content-Range',`bytes ${offset}-${end}/${head.size}`);
 }
 headers.set('Content-Length',String(end-offset+1));
 if(request.method==='HEAD')return new Response(null,{status,headers});
 const object=await bucket.get(key,status===206?{range:{offset,length:end-offset+1}}:undefined);
 if(!object)return new Response('Not found',{status:404});
 return new Response(object.body,{status,headers});
}
