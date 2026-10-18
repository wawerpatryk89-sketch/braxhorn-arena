# Applies per-fighter damage multipliers (found by CPU-vs-CPU simulation, scripts in docs/balance-149) to every
# attack hit in the fighter configs, once. Records each move's damage before/after in docs/balance-149/damage.json.
# Usage: python3 scripts/apply-damage-balance.py '<json multipliers>'
import json,pathlib,sys
mult=json.loads(sys.argv[1]);out={'multipliers':mult,'moves':{}}
marker=pathlib.Path('docs/balance-149/damage.json')
if marker.exists():raise SystemExit('already applied: '+str(marker))
for who,m in mult.items():
    path=pathlib.Path(f'game/assets/{who.lower()}-new/config.json');cfg=json.loads(path.read_text(encoding='utf-8'))
    for name,c in cfg.items():
        if not isinstance(c,dict) or not c.get('attack') or not c.get('hits'):continue
        before={};after={}
        for h in c['hits'].values():
            g=str(h.get('group',0));before[g]=h['damage'];h['damage']=max(1,round(h['damage']*m));after[g]=h['damage']
        out['moves'].setdefault(who,{})[name]={'before':sum(before.values()),'after':sum(after.values())}
    path.write_text(json.dumps(cfg,separators=(',',':'),ensure_ascii=False),encoding='utf-8')
marker.parent.mkdir(parents=True,exist_ok=True);marker.write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n')
print(json.dumps({w:{k:f"{v['before']}->{v['after']}" for k,v in mv.items() if k in ('LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','COMBO')} for w,mv in out['moves'].items()},ensure_ascii=False))
