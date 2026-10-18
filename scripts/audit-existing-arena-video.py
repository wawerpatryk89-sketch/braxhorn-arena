"""Prove audio repairs preserve existing encoded video packets."""
import json,subprocess,tempfile
from pathlib import Path
base='220e7e2298099e798ac7ebc0867fe537bc6a44fc'
old=json.loads(subprocess.check_output(['git','show',base+':arena-media/manifest.json']))
current={r['id']:r for r in json.loads(Path('arena-media/manifest.json').read_text())}
def video_hash(p):return subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).decode().strip()
with tempfile.TemporaryDirectory() as tmp:
 for row in old:
  p=Path(tmp)/'old.mp4';p.write_bytes(subprocess.check_output(['git','show',base+':arena-media/loops/'+row['file']]))
  assert video_hash(p)==video_hash(Path('arena-media/loops')/current[row['id']]['file']),row['id']
  print('PASS unchanged encoded video:',row['id'])
