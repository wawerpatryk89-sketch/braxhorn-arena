// Reproduce the same immutable-model patch applied by the published v271 loader.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root = path.resolve('native-source');
const {applyOutfitModelPatch} = await import(pathToFileURL(path.join(root,'game/assets/outfit-retarget.js')));
const lock = JSON.parse(fs.readFileSync(path.join(root,'unity-tools/arena/source-lock.json')));
for (const entry of lock.sources.filter(e=>e.delivery?.patch)) {
  const file = path.join(root,entry.path), input = fs.readFileSync(file);
  const hash = b=>createHash('sha256').update(b).digest('hex');
  if ([entry.sha256,entry.delivery.restoredSha256].includes(hash(input))) continue;
  if(hash(input)!==entry.delivery.payloadSha256)throw Error('Unverified published model: '+entry.path);
  const recipe = JSON.parse(fs.readFileSync(path.join(root,entry.delivery.patch)));
  const model = applyOutfitModelPatch(JSON.parse(zlib.gunzipSync(input)),recipe.modelChanges);
  const output = zlib.gzipSync(JSON.stringify(model),{level:9});
  if(hash(output)!==entry.delivery.restoredSha256)throw Error('Published model patch differs from verified v271 source: '+entry.path);
  fs.writeFileSync(file,output);
  console.log('Verified published model reconstruction: '+entry.path);
}
