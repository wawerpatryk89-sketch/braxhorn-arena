"""Original loop and interface cues synthesized for Braxhorn; no sampled music."""
import numpy as np, wave, subprocess
from pathlib import Path
sr=44100; beat=60/96; duration=32*beat; n=int(duration*sr); t=np.arange(n)/sr
rng=np.random.default_rng(1906); mix=np.zeros((n,2))
chords=[(36,[50,53,57]),(34,[46,50,53]),(31,[43,46,50]),(36,[48,52,55])]
def hz(m):return 440*2**((m-69)/12)
for bar,(bass,notes) in enumerate(chords):
 st=bar*8*beat; ix=(t>=st)&(t<st+8*beat); u=t[ix]-st
 env=np.minimum(1,u/.5)*np.minimum(1,(8*beat-u)/.8)
 for j,m in enumerate(notes):
  v=(np.sin(2*np.pi*hz(m)*u)+.2*np.sin(2*np.pi*hz(m)*2*u))*.012*env
  mix[ix,0]+=v*(.85+j*.05);mix[ix,1]+=v*(1.05-j*.05)
 for step in range(8):
  start=int((st+step*beat)*sr); length=int(.45*sr); q=np.arange(length)/sr
  tone=(np.sin(2*np.pi*hz(bass)*q)+.2*np.sin(2*np.pi*hz(bass)*2*q))*.08*np.exp(-q*9)*np.minimum(1,q/.015)
  mix[start:start+length]+=tone[:,None]
for k in range(32):
 start=int(k*beat*sr); q=np.arange(int(.32*sr))/sr
 kick=np.sin(2*np.pi*(43*q+5*(1-np.exp(-q*27))))*np.exp(-q*17)*.12
 mix[start:start+len(q)]+=kick[:,None]
 if k%4 in (2,):
  noise=rng.normal(size=len(q)); noise=np.concatenate(([0],np.diff(noise)))*np.exp(-q*35)*.008
  mix[start:start+len(q)]+=noise[:,None]
 for sub in [0,.5]:
  start=int((k+sub)*beat*sr); q=np.arange(int(.065*sr))/sr
  hat=rng.normal(size=len(q))*np.exp(-q*90)*.004
  mix[start:start+len(q),k%2]+=hat
# Gentle pad tail from the previous loop; cyclic crossfade avoids an audible seam.
fade=int(.08*sr);mix[:fade]*=np.linspace(0,1,fade)[:,None];mix[-fade:]*=np.linspace(1,0,fade)[:,None]
def save(name,a):
 p=Path('/tmp/'+name+'.wav');a=np.clip(a,-.8,.8)
 with wave.open(str(p),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((a*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(p),'-codec:a','libmp3lame','-b:a','192k','game/assets/audio/'+name+'.mp3'],check=True)
save('roster-premium',mix)
for name,d in [('roster-select',.14),('roster-confirm',.42)]:
 q=np.arange(int(sr*d))/sr
 if d<.2:v=(np.sin(2*np.pi*620*q)+.3*np.sin(2*np.pi*1733*q))*.11*np.exp(-q*45)
 else:v=(np.sin(2*np.pi*(65*q+2*(1-np.exp(-q*20))))+.18*np.sin(2*np.pi*260*q))*.19*np.exp(-q*13)
 v*=np.minimum(1,q/.003);save(name,np.column_stack([v,v]))
print('Original 20-second stereo loop and two interface cues created.')
