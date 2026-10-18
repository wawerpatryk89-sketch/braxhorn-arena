import fs from 'node:fs';
// Distances measured against Nina's moving ginga and actual strike bones, in source pixels.
const ranges={brax:{LIGHT_PUNCH:180,HEAVY_PUNCH:170,LIGHT_KICK:220,HEAVY_KICK:245,DOUBLE_PUNCH:195,TEEP:235},nyxa:{LIGHT_PUNCH:160,HEAVY_PUNCH:200,LIGHT_KICK:300,HEAVY_KICK:310,ELBOW:170,CLINCH_KNEE:170}};
for(const who of ['brax','nyxa','vexa','krov']){const p='game/assets/'+who+'-new/config.json',c=JSON.parse(fs.readFileSync(p));for(const [name,range] of Object.entries(ranges[who]||{}))c[name].attackRangeByOpponent={NINA:range};const gap={nyxa:130,vexa:165,krov:150}[who];if(gap)c.COMBO.comboGapByOpponent={NINA:gap};fs.writeFileSync(p,JSON.stringify(c));}
