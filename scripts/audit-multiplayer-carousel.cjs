const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const names=['BRAX','NYXA','VEXA','KROV','NINA','DANNY','BEAR','DEMON'],nodes=new Map();let clock=1000,request;
class Element{
 constructor(id=''){this.id=id;this.listeners={};this.attrs={};this.dataset={};this.value='';this.style={setProperty:(k,v)=>this.attrs[k]=v};const classes=new Set();this.classList={add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle:(c,v)=>{v??=!classes.has(c);v?classes.add(c):classes.delete(c)}};nodes.set(id,this);}
 setAttribute(k,v){this.attrs[k]=v} getAttribute(k){return this.attrs[k]} focus(){} blur(){} appendChild(e){nodes.set(e.id,e)}
 set innerHTML(s){this.html=s;for(const m of s.matchAll(/id="([^"]+)"/g))if(!nodes.has(m[1]))new Element(m[1]);}
 get innerHTML(){return this.html||''}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f)}
 fire(k,e={}){for(const f of this.listeners[k]||[])f({preventDefault(){},stopPropagation(){},...e})}
 click(){return this.onclick?.()}
 querySelector(s){if(s==='.roster-full-art')return{innerHTML:'<svg viewBox="0 0 300 600" preserveAspectRatio="xMidYMid meet"><image href="/assets/fighter-cards-reference.jpeg" width="1536" height="864"></image></svg>'};if(s==='.fighter-card-style')return{textContent:'STYLE'};if(s==='.mp-roster')return track;throw Error(s)}
 querySelectorAll(){return cards}
}
const track=new Element('track'),cards=names.map(n=>{const e=new Element('fighter-'+n);e.dataset.fighter=n;return e});
for(const n of names)new Element('card-'+n.toLowerCase());new Element('game');const row=new Element('row');
const context={document:{getElementById:id=>nodes.get(id),createElement:()=>new Element(),querySelector:()=>row,addEventListener(){}},window:{BRAX_CODE_INPUT:{attach(){}},addEventListener(){},BRAX_ONLINE:{name:'WAWER',ensureProfile:async()=>({name:'WAWER'})}},navigator:{},performance:{now:()=>clock},setTimeout,clearTimeout,clearInterval,AbortController,fetch:async(_,args)=>{request=JSON.parse(args.body);return{ok:false,json:async()=>({error:'TEST'})}}};
vm.runInNewContext(fs.readFileSync('game/assets/arena-catalog.js','utf8'),context);assert.deepEqual(Object.keys(context.window.BRAX_ARENA_VIDEOS),JSON.parse(fs.readFileSync('backend/lib/arena-list.json')));
vm.runInNewContext(fs.readFileSync('game/assets/multiplayer.js','utf8'),context);
const chosen=()=>cards.filter(c=>c.attrs['aria-pressed']==='true').map(c=>c.dataset.fighter);
(async()=>{
 context.window.BRAX_MULTIPLAYER.open();
 for(const n of names){assert.deepEqual(chosen(),[n]);assert.equal(cards.filter(c=>c.attrs['aria-hidden']==='false').length,3);nodes.get('mpFollowing').click()}
 assert.deepEqual(chosen(),['BRAX']);nodes.get('mpPrevious').click();assert.deepEqual(chosen(),['DEMON']);
 track.fire('pointerdown',{pointerId:1,clientX:250,clientY:70});track.fire('pointerup',{pointerId:1,clientX:130,clientY:75});assert.deepEqual(chosen(),['BRAX']);
 cards[2].click();assert.deepEqual(chosen(),['BRAX'],'swipe release must not select touched card');clock+=500;cards[2].click();assert.deepEqual(chosen(),['VEXA']);
 track.fire('pointerdown',{pointerId:2,clientX:200,clientY:40});track.fire('pointerup',{pointerId:2,clientX:190,clientY:150});assert.deepEqual(chosen(),['VEXA'],'vertical gesture must not change fighter');
 nodes.get('mpSelection').fire('keydown',{key:'ArrowRight'});assert.deepEqual(chosen(),['KROV']);
 nodes.get('mpNext').click();assert.equal(nodes.get('mpChosenName').textContent,'KROV');assert(nodes.get('mpSelection').classList.contains('off'));
 nodes.get('mpChange').click();assert.deepEqual(chosen(),['KROV']);nodes.get('mpNext').click();nodes.get('mpArena').value='beach';await nodes.get('mpCreate').click();assert.equal(request.arena,'beach');assert.equal(request.fighter,'KROV');assert.equal(request.action,'create');
 console.log('PASS multiplayer carousel: all eight fighters, one selection, three visible cards, wrap, swipe/click suppression, vertical gesture, keyboard, lobby and room payload');
})().catch(e=>{console.error(e);process.exitCode=1});
