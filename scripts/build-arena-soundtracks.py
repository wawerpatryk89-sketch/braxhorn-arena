"""Local synthesized ambience; original animation timing and frames are retained."""
import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io import wavfile
import subprocess,tempfile,pathlib,json
rate=44100
rng=np.random.default_rng(111026)
sources={'snow':('Braxhorn-dach-sniezyca-helikopter.gif',8),'underground':('Braxhorn-underground-pociag-kibice.gif',8),'beach':('Braxhorn-plaza-ruch-kibicow.gif',6)}
def noise(n,lo,hi):
 x=sosfilt(butter(2,[lo,hi],btype='bandpass',fs=rate,output='sos'),rng.normal(size=n));return x/(np.std(x)+1e-9)
for who,(file,duration) in sources.items():
 n=rate*duration;t=np.arange(n)/rate;out=np.zeros((n,2))
 if who=='snow':
  wind=noise(n,100,2200)*(.08+.035*np.sin(2*np.pi*t/duration));out[:]=wind[:,None]
  env=np.sin(np.pi*np.clip((t-1)/6,0,1))**2
  rotor=(noise(n,35,450)*.09+np.sin(2*np.pi*58*t)*.06)*(0.35+0.65*np.maximum(0,np.sin(2*np.pi*19*t)))
  pan=np.clip((t-1)/6,0,1);out[:,0]+=rotor*env*pan;out[:,1]+=rotor*env*(1-pan)
 else:
  crowd=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-stream_loop','-1','-i','game/assets/audio/crowd.mp3','-t',str(duration),'-f','f32le','-ac','2','-ar',str(rate),'-']),dtype=np.float32).reshape(-1,2);out+=crowd[:n]*.20
  if who=='beach':
   swell=.5+.5*np.sin(2*np.pi*t/3-.7);out+=noise(n,160,5500)[:,None]*(.045+.09*swell[:,None]**2)
  else:
   env=np.sin(np.pi*np.clip((t-.7)/6.6,0,1))**1.5
   rumble=noise(n,30,850)*.15+noise(n,1200,4200)*.025
   wheels=(np.maximum(0,np.sin(2*np.pi*9*t))**25)*noise(n,100,2800)*.12
   pan=np.clip((t-.7)/6.6,0,1);out[:,0]+=(rumble+wheels)*env*pan;out[:,1]+=(rumble+wheels)*env*(1-pan)
  for at in rng.uniform(.15,duration-.22,24):
   m=int(rate*.16);x=noise(m,500,6500)*np.exp(-np.arange(m)/(rate*.024))*.13;pos=int(at*rate);pan=rng.uniform(.1,.9);out[pos:pos+m,0]+=x*pan;out[pos:pos+m,1]+=x*(1-pan)
 # Short boundary fades prevent loop clicks; absolute peaks stay below full scale.
 fade=np.minimum(1,np.minimum(t,duration-t)/.035);out*=fade[:,None];out=np.tanh(out*1.6)*.85
 with tempfile.TemporaryDirectory() as tmp:
  wav=str(pathlib.Path(tmp)/'ambience.wav');wavfile.write(wav,rate,(out*32767).astype(np.int16))
  target='game/assets/arena-'+who+'.mp4'
  subprocess.run(['ffmpeg','-v','error','-i','../animated-arenas/Gra Braxhorn/'+file,'-i',wav,'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest','-y',target],check=True)
  print(who,subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size','-of','json',target]).decode(),flush=True)
