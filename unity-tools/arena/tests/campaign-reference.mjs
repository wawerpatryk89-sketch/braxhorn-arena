import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
const context=vm.createContext({window:{}});
for(const file of ['unity-tools/arena/reference/championship.js','unity-tools/arena/reference/arena-features.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const roster=context.window.BRAX_FEATURES.roster;
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const cases=[];
const snapshot=run=>({next:run.next(),finished:run.finished,eliminated:!!run.eliminated,champion:run.champion||null,index:run.index||0,score:run.score||0,hp:run.hp??null,resultApplied:!!run.resultApplied,history:run.history.map(h=>({...h})),rounds:(run.rounds||[]).map(r=>r.map(b=>({a:b.a,b:b.b,winner:b.winner,simulated:!!b.simulated})))});
for(const mode of ['arcade','tournament','survival'])for(let seed=1;seed<=8;seed++)for(const player of roster){
 const outcomes=seed%3===0?['draw','win','loss']:Array(12).fill('win');
 const run=mode==='survival'?context.window.BRAX_FEATURES.createSurvival(player,rng(seed),seed%4+1):context.window.BRAX_CHAMPIONSHIP.create(mode,player,roster,rng(seed));
 const trace=[snapshot(run)];
 for(const outcome of outcomes){run.result(outcome,47);trace.push(snapshot(run));if(mode==='survival'){run.result(outcome,1);trace.push(snapshot(run));run.advance();trace.push(snapshot(run));}}
 cases.push({mode,seed,player,limit:seed%4+1,outcomes,trace});
}
fs.writeFileSync('unity-tools/arena/tests/campaign-reference.json.gz',zlib.gzipSync(JSON.stringify(cases),{mtime:0}));
console.log(JSON.stringify({referenceCases:cases.length,source:'Published v271 JavaScript rules',result:'generated'}));
