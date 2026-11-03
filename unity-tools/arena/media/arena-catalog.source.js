window.BRAX_ARENA_VIDEOS = {"rooftop-city":{"src":"/assets/arena-rooftop-city-20261018.webp","video":"/api/arena-media/rooftop-city.0fa1a9a4c445.mp4","ground":0.81,"aspect":2.22265625,"remote":true,"audio":null},"jungle":{"src":"/assets/arena-jungle-20261018.webp","video":"/api/arena-media/jungle.5da36c4fba53.mp4","ground":0.81,"aspect":2.22265625,"remote":true,"audio":null},"volcano":{"src":"/assets/arena-volcano-20261018.webp","video":"/api/arena-media/volcano.216629861b12.mp4","ground":0.81,"aspect":2.22265625,"remote":true,"audio":null},"temple":{"src":"/assets/arena-temple-20261018.webp","video":"/api/arena-media/temple.cad5d0b82369.mp4","ground":0.81,"aspect":2.22265625,"remote":true,"audio":null},"himalaya":{"src":"/assets/arena-himalaya-20261018.webp","video":"/api/arena-media/himalaya.90b8580a32ae.mp4","ground":0.81,"aspect":2.0,"remote":true,"audio":null},"beach":{"src":"/assets/arena-beach-20261018.webp","video":"/api/arena-media/beach.8e9ab7847d09.mp4","ground":0.81,"aspect":2.22265625,"remote":true,"audio":null},"carrier":{"src":"/assets/arena-carrier-20261018.webp","video":"/api/arena-media/carrier.d55dcea46803.mp4","ground":0.81,"aspect":1.75390625,"remote":true,"audio":null},"reactor":{"src":"/assets/arena-reactor-20261018.webp","video":"/api/arena-media/reactor.6956a48b6ccc.mp4","ground":0.81,"aspect":1.75390625,"remote":true,"audio":null},"savanna":{"src":"/assets/arena-savanna.48341554c7de.webp","video":"/assets/arena-savanna.ebd8aad330ff.mp4","ground":0.81,"aspect":1.75390625,"remote":true,"audio":null},"brooklyn":{"src":"/assets/arena-brooklyn-20261018.webp","video":"/api/arena-media/brooklyn.6d9545bcc543.mp4","ground":0.81,"aspect":1.75390625,"remote":true,"audio":null},"dragon":{"src":"/assets/arena-dragon-20261018.webp","video":"/api/arena-media/dragon.f666fd6d5e72.mp4","ground":0.81,"aspect":1.75390625,"remote":true,"audio":null},"aquarium":{"src":"/assets/arena-aquarium-20261018.webp","video":"/api/arena-media/aquarium.2c8649a07a44.mp4","ground":0.81,"aspect":2.22265625,"remote":true,"audio":null},"snow":{"src":"/assets/arena-snow.jpeg","video":"/api/arena-media/snow.1dbb2e6d48ae.mp4","ground":0.81,"aspect":2.1666666666666665,"remote":true,"audio":null},"underground":{"src":"/assets/arena-underground.jpeg","video":"/api/arena-media/underground.971834e4cd67.mp4","ground":0.81,"aspect":2.1666666666666665,"remote":true,"audio":null},"metro":{"src":"/api/arena-media/metro.ab100a72e1ad.gif","ground":0.81,"audio":"/api/arena-media/metro-audio.1b15d86dfad5.mp3","video":"/assets/arena-metro-20261020.mp4","aspect":1.7777777777777777,"remote":true},"harbor":{"src":"/api/arena-media/harbor.d2da7fb26002.gif","ground":0.81,"audio":"/api/arena-media/harbor-audio.27e013706a8f.mp3"},"nocny-targ":{"src":"/assets/arena-nocny-targ.jpg","ground":0.8289054197662061,"audio":"/api/arena-media/market-audio.289063ea7ff3.mp3"},"foundry":{"src":"/assets/arena-foundry.fdb330e68594.webp","video":"/assets/arena-foundry.db831634b3ad.mp4","ground":0.81,"aspect":1.77734375,"remote":true,"audio":null},"storm-complex":{"src":"/assets/arena-storm-complex-20261020.webp","video":"/assets/arena-storm-complex.612b614f0e25.mp4","ground":0.81,"aspect":1.77734375,"remote":true,"audio":null},"octagon":{"src":"/assets/arena-octagon-20261020.webp","video":"/assets/arena-octagon.db76fbd2805f.mp4","ground":0.81,"aspect":1.75390625,"remote":true,"audio":null},"winter-station":{"src":"/assets/arena-winter-station-20261020.webp","video":"/assets/arena-winter-station.7401eee3844b.mp4","ground":0.81,"aspect":1.75390625,"remote":true,"audio":null}};

// One presentation profile shared by combat, both loop decoders and selection.
window.BRAX_ARENA_PRESENTATION={
 profiles:{underground:[1.20,.96],foundry:[1.18,.94],volcano:[1.15,.94],'storm-complex':[1.12,.96],rooftop:[1.08,.98],jungle:[1.08,.98],brooklyn:[1.06,.98],'nocny-targ':[1.06,.98],metro:[1.04,1],harbor:[1.04,1]},
 apply(element,id){const p=this.profiles[id]||[1,1];element.style.setProperty('--arena-light',String(p[0]));element.style.setProperty('--arena-contrast',String(p[1]));element.style.setProperty('--arena-fit',id==='dragon'?'contain':'cover');},
 ground(arena,width,height){const imageHeight=(arena.fit==='contain'?Math.min:Math.max)(height,width/(arena.aspect||16/9));return (height-imageHeight)/2+imageHeight*arena.ground;}
};
window.BRAX_ARENA_VIDEOS.dragon.fit='contain';

// Editable surface VFX/SFX profiles. Arena IDs remain stable when UI labels are translated.
window.BRAX_ARENA_SURFACES=(()=>{
 const groups={
  Snow:[['winter-station','ZIMOWA STACJA'],['himalaya','HIMALAJE'],['snow','ŚNIEŻNY DACH']],
  Concrete:[['underground','UNDERGROUND'],['nocny-targ','NOCNY TARG'],['rooftop-city','DACH · METROPOLIA'],['metro','ARENA METRO'],['brooklyn','ARENA BROOKLYN']],
  Nature:[['beach','PLAŻA'],['jungle','DŻUNGLA'],['savanna','ARENA SAWANNA'],['temple','ŚWIĄTYNIA SAKURY']],
  Metal:[['harbor','ARENA PORT'],['carrier','ARENA LOTNISKOWIEC'],['reactor','ARENA REAKTOR'],['foundry','HUTA']],
  Fantasy:[['volcano','KUŹNIA WULKANU'],['dragon','ARENA SMOCZA TWIERDZA'],['aquarium','ARENA AKWARIUM'],['storm-complex','KOMPLEKS BURZOWY'],['octagon','OKTAGON MMA']]
 };
 const profiles={
  Snow:{hitVFX:{preset:'snow',color:'#e8f6ff',count:12,radius:85,duration:.65,lifetime:2},hitSFX:{clip:'surface-snow',volume:.75,pitch:1}},
  Concrete:{hitVFX:{preset:'debris',color:'#b7afa5',count:12,radius:90,duration:.48,lifetime:2},hitSFX:{clip:'surface-concrete',volume:.8,pitch:1}},
  Nature:{hitVFX:{preset:'earth',color:'#b5a276',count:10,radius:85,duration:.55,lifetime:2},hitSFX:{clip:'surface-nature',volume:.75,pitch:1}},
  Metal:{hitVFX:{preset:'metal',color:'#ffd48a',count:14,radius:105,duration:.38,lifetime:2},hitSFX:{clip:'surface-metal',volume:.72,pitch:1}},
  Fantasy:{hitVFX:{preset:'energy',color:'#c8a0ff',count:12,radius:95,duration:.55,lifetime:2},hitSFX:{clip:'surface-fantasy',volume:.7,pitch:1}}
 };
 const arenaProfiles={
  snow:{snowRoof:true,preset:'snow',color:'#f0f8ff',radius:125,count:16,duration:.85},
  himalaya:{preset:'snow',color:'#e4f4ff',radius:135,count:16,duration:.9},
  'winter-station':{preset:'snow',color:'#d9ebf6',radius:115,count:16,duration:.8},
  beach:{preset:'earth',color:'#e7c38c',radius:125,count:14,duration:.75},
  savanna:{preset:'earth',color:'#c89455',radius:120,count:14,duration:.72},
  jungle:{preset:'earth',color:'#718453',radius:100,count:14,duration:.7},
  temple:{special:'petals',preset:'debris',color:'#d2c7b8',radius:90,count:12,duration:.6},
  underground:{preset:'splash',color:'#b4c8d2',radius:95,count:14,duration:.55},
  'rooftop-city':{preset:'splash',color:'#b2cbd8',radius:100,count:12,duration:.55},
  brooklyn:{preset:'splash',color:'#becbd1',radius:100,count:14,duration:.6},
  metro:{preset:'splash',color:'#bac4cb',radius:95,count:12,duration:.5},
  'nocny-targ':{preset:'splash',color:'#bce7f3',radius:110,count:14,duration:.6},
  harbor:{preset:'splash',color:'#a8d8eb',radius:120,count:16,duration:.65},
  carrier:{preset:'splash',color:'#c4e4ef',radius:125,count:16,duration:.65},
  reactor:{special:'pulse',preset:'metal',color:'#dcecf6',radius:115,count:14,duration:.4},
  foundry:{special:'steam',preset:'splash',color:'#ddbd9e',radius:130,count:16,duration:.48},
  volcano:{preset:'lava',color:'#f29252',radius:115,count:16,duration:.6},
  dragon:{preset:'splash',color:'#b6c9c5',radius:110,count:14,duration:.6},
  aquarium:{preset:'splash',color:'#b4edf7',radius:110,count:14,duration:.65},
  'storm-complex':{preset:'splash',color:'#b8dbe9',radius:125,count:16,duration:.65},
  octagon:{preset:'ground',color:'#d8d8d8',radius:65,count:6,duration:.35}
 };
 const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[łŁ]/g,'l').toUpperCase().replace(/[·•_–—-]/g,' ').replace(/\s+/g,' ').trim();
 const lookup=new Map();
 for(const [type,arenas]of Object.entries(groups)){
  lookup.set(normalize(type),type);
  for(const [id,label]of arenas){
   for(const name of [id,label,label.replace(/^ARENA /,'')])lookup.set(normalize(name),type);
   if(window.BRAX_ARENA_VIDEOS[id])window.BRAX_ARENA_VIDEOS[id].surfaceType=type;
  }
 }
 function getSurfaceType(arenaName){return lookup.get(normalize(arenaName))||'Concrete';}
 function effectsFor(arenaName,contact,base={}){
  if(!['ground','scrape','step','land'].includes(contact))return base;
  const surfaceType=getSurfaceType(arenaName),profile=profiles[surfaceType],ground=contact==='ground',scrape=contact==='scrape',light=scrape||contact==='step';
  const arenaId=Object.keys(arenaProfiles).find(id=>normalize(id)===normalize(arenaName));
  const vfx={...profile.hitVFX,...arenaProfiles[arenaId]},sfx=profile.hitSFX;
  // Material follows the visible floor, including wet decks and the MMA mat.
  const sound= vfx.preset==='splash'?'surface-water':vfx.preset==='ground'?'surface-mat':['debris','lava'].includes(vfx.preset)?'surface-concrete':sfx.clip;
  return {...base,surfaceType,surfaceArena:arenaId,surfaceContact:contact,
   hitVFX:{...vfx,count:light?4:ground?24:9,radius:vfx.radius*(light?.3:ground?1.55:.65),sizeScale:light?.55:ground?1.65:.85,duration:ground?Math.max(vfx.preset==='lava'?1.05:.7,vfx.duration*1.15):vfx.duration*(light?.55:1.1),opacity:light?.38:1,ground:true,scrape,special:ground?vfx.special:null,lavaSeep:ground&&vfx.preset==='lava',ring:vfx.preset==='splash'&&!light},
   hitSFX:{...sfx,clip:sound,volume:light?.11:ground?.85:.35,pitch:light?1.3:ground?.88:1.08},
   screenShake:base.screenShake??{strength:ground?7:0,duration:ground?.2:0}};
 }
 return {groups,profiles,arenaProfiles,getSurfaceType,effectsFor};
})();
