import fs from 'node:fs';
import zlib from 'node:zlib';
import vm from 'node:vm';
const directory = new URL('.', import.meta.url);
const fighters = JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('combat-inputs.json.gz', directory))));
const source = fs.readFileSync(new URL('../reference/combat-rules.js', directory), 'utf8');
const result = [];
for (const fighter of fighters) {
  const config = fighter.config;
  const context = vm.createContext({
    B: {}, O: {}, COMBO_IMPACT: {speed: 1.15, openingSpeed: 1.05},
    characterConfig: () => config, krovConfig: () => config, krovName: () => fighter.base,
    sourceHeight: () => 300, arenaSize: () => ({width: 844}),
    comboTimeline: action => ({openingEnd: Math.max(0, ...Object.entries(action.hits).filter(([, hit]) => hit.group === 0).map(([frame]) => +frame))})
  });
  vm.runInContext(source, context);
  const actions = [];
  for (const [id, action] of Object.entries(config)) {
    const frames = new Set([0, Math.floor(action.durations.length / 2), action.durations.length - 1]);
    for (const key of [action.phaseTempo?.first, action.phaseTempo?.last, ...Object.keys(action.hits).map(Number)])
      if (key !== undefined) for (const offset of [-1, 0, 1]) if (key + offset >= 0 && key + offset < action.durations.length) frames.add(key + offset);
    actions.push({id, frames: [...frames].sort((a, b) => a-b).map(frame => ({frame,
      base: context.baseActionTempo(fighter.base, action, frame),
      tempo: context.actionTempo(fighter.base, action, frame)})),
      locomotion: context.locomotionTempo(fighter.base, id)});
  }
  const buttons = [];
  for (const kind of ['punch','heavy','kick','kick2']) for (const forward of [false,true])
    for (const down of [false,true]) for (const running of [false,true])
      buttons.push({kind, forward, down, running, expected: context.sourceButtonMove({},kind,forward,down,running) ?? null});
  result.push({id:fighter.id,base:fighter.base,actions,buttons,movement:[false,true].map(back=>context.sourceMoveSpeed(fighter.base,back))});
}
fs.writeFileSync(new URL('combat-reference.json.gz',directory),zlib.gzipSync(JSON.stringify(result)));
console.log('Frozen v271 combat oracle: '+result.length+' variants / '+result.reduce((n,f)=>n+f.actions.length,0)+' actions.');
