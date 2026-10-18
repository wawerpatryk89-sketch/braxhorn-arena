"""Orthographic reference portrait of the game's skinned mesh and original UV texture."""
import sys
import numpy as np
from PIL import Image

mesh=np.fromfile(sys.argv[1],dtype=np.float32).reshape(-1,3,5)
tex=np.asarray(Image.open(sys.argv[2]).convert('RGB'));th,tw=tex.shape[:2]
w,h=640,720
xyz=mesh[:,:,:3];lo=xyz.reshape(-1,3).min(0);hi=xyz.reshape(-1,3).max(0)
bottom=lo[1]+(hi[1]-lo[1])*.42
upper=xyz[xyz[:,:,1]>bottom]
cx=(upper[:,0].min()+upper[:,0].max())/2
scale=min((w-44)/(upper[:,0].max()-upper[:,0].min()),(h-36)/(hi[1]-bottom))
v=mesh.copy();v[:,:,0]=(xyz[:,:,0]-cx)*scale+w/2;v[:,:,1]=18+(hi[1]-xyz[:,:,1])*scale
out=np.zeros((h,w,4),dtype=np.uint8);zbuf=np.full((h,w),-1e10)
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
 u=np.clip((aa*t[0,3]+bb*t[1,3]+cc*t[2,3])*(tw-1),0,tw-1).astype(int)
 vv=np.clip((1-aa*t[0,4]-bb*t[1,4]-cc*t[2,4])*(th-1),0,th-1).astype(int)
 n=np.cross(original[1,:3]-original[0,:3],original[2,:3]-original[0,:3]);n/=max(np.linalg.norm(n),1e-9)
 shade=.72+.28*abs(np.dot(n,light))
 patch=out[y0:y1+1,x0:x1+1];patch[mask,:3]=np.clip(tex[vv,u][mask]*shade,0,255).astype(np.uint8);patch[mask,3]=255
 zbuf[y0:y1+1,x0:x1+1][mask]=zz[mask]
Image.fromarray(out).save(sys.argv[3],quality=94,method=6)
print(sys.argv[3])
