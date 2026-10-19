// Runtime complement to the static rg audit. No real browser/audio decoding is claimed.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createGame}=require('./audit-new-fighters.cjs');
(async()=>{
 const deleted=execFileSync('git',['diff','--no-renames','--diff-filter=D','--name-only','220e7e2298099e798ac7ebc0867fe537bc6a44fc','90f65b34d3b0a01566d24b51c6de32accd227d10','--','game/assets'],{encoding:'utf8'}).trim().split('\n').map(x=>'/'+x.replace(/^game\//,''));
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync('game/assets/arena-catalog.js','utf8'),ctx);
 const catalog=ctx.window.BRAX_ARENA_VIDEOS;
 const packaged=new Set(['manifest.json','assets-manifest.json'].flatMap(file=>JSON.parse(fs.readFileSync('arena-media/'+file)).map(x=>'/api/arena-media/'+x.file)));
 const observed=[];
 function check(url,where){if(typeof url!=='string'||!url)return;const path=new URL(url,'https://test.invalid').pathname;assert(!deleted.includes(path),where+' resurrected '+path);if(path.startsWith('/api/arena-media/'))assert(packaged.has(path),where+' missing package entry '+path);observed.push({where,url});}
 for(const [id,row] of Object.entries(catalog)){
  for(const key of ['src','fallback','video','audio'])check(row[key],id+'.catalog.'+key);
  const g=await createGame(844,390,true);
  g.context.BRAX_ARENA_MEDIA={release(){},async prepare(url,motion){check(url,id+'.prepare');motion.src=url;}};
  await g.start();g.elements.get('chooseFighter').dispatch('click');g.elements.get('arena-'+id).dispatch('click');await g.flush();g.elements.get('fighterFilm').dispatch('ended');await g.flush();g.step(15000);
  for(const element of ['arena','arenaMotion','arenaAudio'])for(const key of ['src','poster'])check(g.elements.get(element)[key],id+'.'+element+'.'+key);
  assert(g.state().running,id+' started');
 }
 assert.equal(Object.keys(catalog).length,17);
 fs.writeFileSync('docs/deleted-arena-runtime-paths.json',JSON.stringify({status:'PASS',scope:'Mock DOM; all arena selection/start paths; catalog URLs and observed media src/poster',arenas:17,deleted,observed},null,2)+'\n');
 console.log('PASS: 17 arena start paths; '+observed.length+' catalog/media URL observations; no deleted path, every package URL in manifest.');
})().catch(e=>{console.error(e);process.exitCode=1;});
