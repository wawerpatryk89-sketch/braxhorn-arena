const fs=require('node:fs'),assert=require('node:assert/strict');
const urls=[];for(const f of fs.readdirSync('game/assets').filter(f=>f.endsWith('.js'))){for(const m of fs.readFileSync('game/assets/'+f,'utf8').matchAll(/['"]([^'"]*fighter-source\.js\?v=[^'"]+)['"]/g))urls.push({file:f,url:m[1]});}
assert(urls.length>=7);assert.equal(new Set(urls.map(x=>new URL(x.url,'https://braxhorn.invalid/assets/').href)).size,1);console.log('PASS',JSON.stringify(urls));
