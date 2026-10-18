# Original procedural arena ambience and start impact, no third-party recordings.
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io.wavfile import write
rate=22050;rng=np.random.default_rng(42);duration=12;n=rate*duration;t=np.arange(n)/rate
noise=sosfilt(butter(2,[250,3500],btype='bandpass',fs=rate,output='sos'),rng.normal(0,1,n))
y=noise*.018*(.7+.3*np.sin(2*np.pi*t/6)**2)
# Overlapping voiced crowd calls with changing pitch and vowel formants.
for i in range(46):
 start=rng.uniform(-1,duration);length=rng.uniform(.6,2);u=t-start;env=np.where((u>0)&(u<length),np.sin(np.pi*np.clip(u/length,0,1))**2,0)
 pitch=rng.uniform(100,240)*(1+.05*np.sin(2*np.pi*t*rng.uniform(3,6)))
 phase=2*np.pi*np.cumsum(pitch)/rate;voice=np.zeros(n)
 for harmonic in range(1,22):
  f=harmonic*pitch;weight=(np.exp(-((f-650)/230)**2)+.5*np.exp(-((f-1200)/340)**2)+.2*np.exp(-((f-2500)/500)**2))/harmonic
  voice+=weight*np.sin(harmonic*phase+rng.uniform(0,6))
 y+=voice*env*.085
# Arena reflections and soft loop edges.
dry=y.copy()
for delay,gain in [(.081,.20),(.143,.17),(.231,.12),(.347,.08)]:
 k=int(delay*rate);y[k:]+=dry[:-k]*gain
fade=np.minimum(1,np.minimum(t/.3,(duration-t)/.3));y*=fade;y=np.tanh(y*1.8);y*=.65/max(.65,np.max(np.abs(y)))
write('game/assets/crowd.wav',rate,(y*32767).astype('int16'))
t=np.arange(int(rate*1.8))/rate
hit=.65*np.sin(2*np.pi*(45*t+55*(1-np.exp(-t*16))/16))*np.exp(-t*5)
hit+=.25*rng.normal(0,1,len(t))*np.exp(-t*22)
for f in [440,713,1037]:hit+=.075*np.sin(2*np.pi*f*t)*np.exp(-t*3)
hit=np.tanh(hit)*.8
write('game/assets/start-impact.wav',rate,(hit*32767).astype('int16'))
# 8-bar, 120 BPM instrumental title loop: low drums, distorted bass, sparse metallic accents.
seconds=16;n=seconds*rate;t=np.arange(n)/rate;music=np.zeros(n)
for beat in range(32):
 u=t-beat*.5;active=(u>=0);u=np.maximum(u,0)
 kick=.46*np.sin(2*np.pi*(48*u+75*(1-np.exp(-u*25))/25))*np.exp(-u*13)*active
 music+=kick
 if beat%2:
  music+=.13*rng.normal(size=n)*np.exp(-u*25)*active
for eighth in range(64):
 u=t-eighth*.25;active=u>=0;u=np.maximum(u,0);music+=.035*rng.normal(size=n)*np.exp(-u*110)*active
notes=[82.4069,82.4069,97.999,73.4162]
for note in range(32):
 f=notes[(note//4)%4];u=t-note*.5;mask=(u>=0)&(u<.46);u=np.maximum(u,0);env=(1-np.exp(-u*100))*np.exp(-u*5)*mask
 bass=np.sin(2*np.pi*f*u)+.35*np.sin(2*np.pi*f*2*u)+.12*np.sin(2*np.pi*f*3*u);music+=.14*np.tanh(bass*2)*env
music=np.tanh(music)*.78
write('game/assets/title-music.wav',rate,(music*32767).astype('int16'))
