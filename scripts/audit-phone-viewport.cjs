const assert=require('node:assert/strict');const {createGame}=require('./audit-new-fighters.cjs');
(async()=>{
 const viewport={width:390,height:844,offsetLeft:0,offsetTop:0,addEventListener(){}};
 const g=await createGame(390,844,false,viewport);const game=g.elements.get('game');
 const cases=[[320,568],[360,800],[390,844],[430,932],[568,320],[844,390],[932,430],[844,300],[300,844]];
 for(const [w,h] of cases){viewport.width=w;viewport.height=h;g.send('resize');assert.equal(game.style.width,w+'px');assert.equal(game.style.height,h+'px');assert.equal(game.attributes['data-orientation'],w<h?'portrait':'landscape');console.log('PASS viewport '+w+'x'+h);}
 for(const event of ['orientationchange','pageshow']){viewport.width=812;viewport.height=375;g.send(event);assert.equal(game.style.width,'812px',event);}
 viewport.offsetLeft=12;viewport.offsetTop=18;g.send('resize');assert.equal(game.style.left,'12px');assert.equal(game.style.top,'18px');
 viewport.width=844;viewport.height=390;g.send('resize');await g.start();g.elements.get('chooseFighter').dispatch('click');g.elements.get('arena-rooftop-city').dispatch('click');await g.flush();g.elements.get('fighterFilm').dispatch('ended');g.step(17000);
 const {B,S,K}=g.test;K.right=true;const time=S.t;viewport.width=390;viewport.height=844;g.send('resize');assert(!K.right);g.step(500);assert.equal(S.t,time,'portrait suspends match clock');viewport.width=844;viewport.height=390;g.send('resize');g.step(100);assert(S.t<time,'landscape resumes match');console.log('PASS: viewport offsets, input release, portrait pause and landscape resume');
})().catch(e=>{console.error(e);process.exit(1)});
