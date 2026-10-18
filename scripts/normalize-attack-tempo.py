# Keep every attack's wind-up and recovery inside the playback-speed range the five original fighters use
# (1.4x-2.6x of the source clip, after playbackRate and the global 1.10 fighter speed). NINA, BEAR and DEMON
# had wind-ups fast-forwarded up to 5x and a few recoveries slowed to 0.5x, which looked jerky and made those
# fighters dominate. Only phaseTempo values change; clips, frames, hitboxes and damage stay as they are.
import json,pathlib
LO,HI=1.4,2.6
for who in ['brax','nyxa','vexa','krov','nina','danny','bear','demon']:
    path=pathlib.Path(f'game/assets/{who}-new/config.json');raw=path.read_text(encoding='utf-8');cfg=json.loads(raw);changed=[]
    for name,c in cfg.items():
        p=c.get('phaseTempo') if isinstance(c,dict) else None
        if not (c.get('attack') if isinstance(c,dict) else False) or not p or name=='COMBO':continue
        base=(c.get('playbackRate') or 1)*1.10*(0.93 if who=='nina' else 1)
        for phase in ('startup','recovery'):
            v=p[phase];new=min(max(v,LO/base),HI/base)
            if abs(new-v)>1e-9:p[phase]=round(new,4);changed.append(f'{name}.{phase} {v:.2f}->{new:.2f}')
    if changed:
        path.write_text(json.dumps(cfg,separators=(',',':'),ensure_ascii=False),encoding='utf-8');print(who,'; '.join(changed))

# MIŚ (BEAR) is the heavyweight: his clips are the quickest in the roster, so every attack recovers at the
# slow end of the shared range (1.4x) instead of losing most of its damage.
path=pathlib.Path('game/assets/bear-new/config.json');cfg=json.loads(path.read_text(encoding='utf-8'))
for name in ['LIGHT_PUNCH','HEAVY_PUNCH','LIGHT_KICK','HEAVY_KICK','SHOULDER','UPPERCUT']:
    c=cfg[name];c['phaseTempo']['recovery']=round(LO/((c.get('playbackRate') or 1)*1.10),4)
path.write_text(json.dumps(cfg,separators=(',',':'),ensure_ascii=False),encoding='utf-8')
