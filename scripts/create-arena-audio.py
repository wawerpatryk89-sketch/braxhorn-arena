"""Original, deterministic sound design; licensed voice source folders passed on CLI."""
from pathlib import Path
import sys, subprocess, tempfile
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io.wavfile import write

root=Path(__file__).resolve().parents[1]
dest=root/'game/assets/audio'
source=Path(sys.argv[1])
sr=32000
rng=np.random.default_rng(716)
n=sr*18
t=np.arange(n)/sr

def noise(lo,hi):
    a=sosfilt(butter(2,[lo,hi],btype='bandpass',fs=sr,output='sos'),rng.normal(0,1,n))
    return a/max(np.std(a),.0001)

def encode(name,a,loop=True):
    if loop:
        k=sr*2;u=np.linspace(0,1,k)
        a=np.r_[a[k:-k],a[-k:]*(1-u)+a[:k]*u]
    else:
        a*=np.minimum(1,np.arange(len(a))/160)*np.minimum(1,np.arange(len(a))[::-1]/640)
    a=np.tanh(a)*.52
    with tempfile.NamedTemporaryFile(suffix='.wav') as f:
        write(f.name,sr,np.int16(np.clip(a,-1,1)*32767))
        subprocess.run(['ffmpeg','-v','error','-y','-i',f.name,'-codec:a','libmp3lame','-b:a','128k',str(dest/(name+'.mp3'))],check=True)

rain=noise(500,7000)*.12*(.8+.18*np.sin(t*.7))
rain+=noise(45,220)*.06*(.2+np.exp(-((t-8)/1.5)**2))
encode('arena-rooftop',rain)
metro=noise(70,1200)*.065*(.5+.5*np.sin(t*.22)**2)
metro+=.018*np.sin(2*np.pi*93*t)+.012*np.sin(2*np.pi*141*t)
for at in np.arange(1,18,.8):
    u=np.maximum(0,t-at);metro+=noise(500,2500)*.025*np.exp(-u*20)*(t>=at)
encode('arena-metro',metro)
harbor=noise(180,4500)*.12*(.2+.8*(.5+.5*np.sin(t*1.1))**2)
harbor+=noise(45,180)*.035
encode('arena-harbor',harbor)
lava=noise(35,240)*.14+noise(600,2800)*.018
for at in rng.uniform(0,18,75):
    u=np.maximum(0,t-at);f=rng.uniform(70,180)
    lava+=rng.uniform(.03,.10)*np.sin(2*np.pi*(f*u+25*(1-np.exp(-u*8))/8))*np.exp(-u*12)*(t>=at)
encode('arena-volcano',lava)
jungle=noise(700,6000)*.035*(.75+.25*np.sin(t*.9))
for at in rng.uniform(0,18,24):
    u=t-at;env=np.exp(-((u-.16)/.11)**2)*(u>0)*(u<.5)
    jungle+=.022*np.sin(2*np.pi*(rng.uniform(1800,3200)*u+350*u*u))*env
jungle+=.018*np.sin(2*np.pi*4100*t)*(np.sin(2*np.pi*28*t)>.65)
encode('arena-jungle',jungle)
g=np.arange(sr*3)/sr
gong=sum(amp*np.sin(2*np.pi*freq*g)*np.exp(-g/decay) for freq,amp,decay in [(162,.42,1.1),(247,.3,1.3),(379,.2,1.0),(583,.13,.8),(917,.07,.5)])
gong+=rng.normal(0,.06,len(g))*np.exp(-g*70)
encode('gong',gong,False)

voices={
 'brax-ready':('fighter/Audio/prepare_yourself.ogg',True),
 'brax-taunt1':('fighter/Audio/ready.ogg',True),
 'brax-taunt2':('fighter/Audio/prepare_yourself.ogg',True),
 'nyxa-ready':('general/Female/ready.ogg',False),
 'nyxa-taunt1':('general/Female/war_look_out.ogg',False),
 'nyxa-taunt2':('general/Female/hurry_up.ogg',False),
}
for name,(file,deep) in voices.items():
    effect='highpass=f=80,lowpass=f=7500,'
    if deep:effect+='asetrate=44100*0.91,aresample=44100,atempo=1.0989,'
    effect+='acompressor=threshold=0.12:ratio=2:attack=10:release=120,loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:d=0.015'
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(source/file),'-ar','44100','-af',effect,'-codec:a','libmp3lame','-b:a','128k',str(dest/(name+'.mp3'))],check=True)
print('Created five arena loops, gong, and six character voice clips.')
