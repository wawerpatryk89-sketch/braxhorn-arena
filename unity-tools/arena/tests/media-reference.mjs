import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(dir,'../media/arena-catalog.source.js'),'utf8'),context);
const {BRAX_ARENA_VIDEOS:arenas,BRAX_ARENA_PRESENTATION:p}=context.window;const cases=[];
for(const[id,arena]of Object.entries(arenas))for(const[w,h]of [[1024,576],[1920,1080],[2340,1080],[2400,1080],[2560,1440],[1280,800],[2960,1440],[320,200],[800,600],[640,480]]){
 // The standalone night market uses its 1672x941 photograph; catalog.ground
 // leaves unspecified legacy stills at 16/9. Pin the actually displayed ratio.
 const a={...arena,aspect:arena.aspect??(id==='nocny-targ'?1672/941:16/9)};
 cases.push({id,width:w,height:h,aspect:a.aspect,ground:a.ground,contain:a.fit==='contain',floor:p.ground(a,w,h)});
}
fs.writeFileSync(path.join(dir,'media-reference.json'),JSON.stringify(cases)+'\n');console.log('Frozen original catalog: '+cases.length+' ground/crop reference cases.');
vm.runInContext(fs.readFileSync(path.join(dir,'../media/entrance.source.js'),'utf8'),context);
const entrances=JSON.parse(fs.readFileSync(path.join(dir,'entrance-reference.json'),'utf8'));
for(const item of entrances){const e=context.window.BRAX_ADVENTURE_ENTRANCE(item.input);item.expected={distance:e.distance,depth:e.depth,x0:e.x0,yaw:e.yaw,masked:e.masked};item.samples=[-.1,0,.1,.25,.5,.75,.9,1,1.1].map(f=>({travel:e.distance*f,...e.sample(e.distance*f)}));}
fs.writeFileSync(path.join(dir,'entrance-reference.json'),JSON.stringify(entrances)+'\n');
console.log('Frozen original adventure entrance: '+entrances.length+' cases.');
