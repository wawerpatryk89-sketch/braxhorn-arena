# Software reference render of supplied mesh for identity inspection; no WebGL needed.
import numpy as np
from PIL import Image
import sys
mesh=np.fromfile('/tmp/nina-mesh.bin',dtype=np.float32).reshape(-1,3,5)
tex=np.asarray(Image.open(sys.argv[1]).convert('RGB'));tw,th=tex.shape[1],tex.shape[0]
w,h=700,1000
xyz=mesh[:,:,:3];lo=xyz.reshape(-1,3).min(0);hi=xyz.reshape(-1,3).max(0);scale=min((w-50)/(hi[0]-lo[0]),(h-40)/(hi[1]-lo[1]));v=mesh.copy();v[:,:,0]=(xyz[:,:,0]-(hi[0]+lo[0])/2)*scale+w/2;v[:,:,1]=h-20-(xyz[:,:,1]-lo[1])*scale
out=np.full((h,w,3),215.,dtype=np.float32);zbuf=np.full((h,w),-1e10)
light=np.array([-.3,.5,1.]);light/=np.linalg.norm(light)
for original,t in zip(mesh,v):
 x0=max(0,int(t[:,0].min()));x1=min(w-1,int(np.ceil(t[:,0].max())));y0=max(0,int(t[:,1].min()));y1=min(h-1,int(np.ceil(t[:,1].max())))
 if x1<x0 or y1<y0:continue
 a,b,c=t[:,:2];den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
 if abs(den)<1e-8:continue
 xx,yy=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
 aa=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den;bb=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;cc=1-aa-bb
 zz=aa*t[0,2]+bb*t[1,2]+cc*t[2,2];mask=(aa>=0)&(bb>=0)&(cc>=0)&(zz>zbuf[y0:y1+1,x0:x1+1])
 if not mask.any():continue
 u=np.clip((aa*t[0,3]+bb*t[1,3]+cc*t[2,3])*(tw-1),0,tw-1).astype(int);vv=np.clip((1-aa*t[0,4]-bb*t[1,4]-cc*t[2,4])*(th-1),0,th-1).astype(int)
 n=np.cross(original[1,:3]-original[0,:3],original[2,:3]-original[0,:3]);n/=max(np.linalg.norm(n),1e-9);shade=.6+.4*abs(np.dot(n,light))
 out[y0:y1+1,x0:x1+1][mask]=tex[vv,u][mask]*shade;zbuf[y0:y1+1,x0:x1+1][mask]=zz[mask]
pixels=np.clip(out,0,255).astype('uint8')
if '--transparent' in sys.argv: pixels=np.dstack((pixels,np.where(zbuf>-1e9,255,0).astype('uint8')))
Image.fromarray(pixels).save(sys.argv[2])
print(sys.argv[2])
