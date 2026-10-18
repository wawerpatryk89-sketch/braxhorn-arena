const {createGame}=require('./audit-new-fighters.cjs'),assert=require('node:assert/strict');
(async()=>{const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'];for(let slot=0;slot<names.length;slot++){
 const g=await createGame(844,390,true),saved=Object.fromEntries(names.map(who=>[who,g.context[who+'_3D']]));for(const who of names.slice(2))delete g.context[who+'_3D'];
 g.context.BRAX_PREPARE_PAIR=async pair=>{await Promise.resolve();for(const who of pair)if(who)g.context[who+'_3D']=saved[who];};
 await g.start();g.test.selectSlot(slot,true);g.test.selectOpponent(names[(slot+2)%names.length]);await g.flush();await g.test.begin();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);assert.equal(g.state().character,names[slot]);assert.equal(g.state().opponent.character,names[(slot+2)%names.length]);assert(g.state().running&&!g.state().preFight);
}console.log('PASS lazy metadata: all eight player choices and deferred opponents start without preloading four unused configs');})().catch(e=>{console.error(e);process.exitCode=1;});
