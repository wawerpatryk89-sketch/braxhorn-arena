#!/usr/bin/env python3
"""Validate the migration payload, not Unity runtime or gameplay parity."""
import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path
import struct
import sys

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'unity-arena/Assets/Arena/SourceData'


def check_pose(file, expected_nodes):
    data = memoryview(gzip.decompress(file.read_bytes()))
    assert data[:4] == b'BAP1', file
    nodes, frames = struct.unpack_from('<ii', data, 4)
    assert nodes == expected_nodes and 2 <= frames <= 36000, file
    at = 12
    paths = []
    for _ in range(nodes):
        length, = struct.unpack_from('<i', data, at)
        assert 0 <= length <= 65536, file
        at += 4
        paths.append(bytes(data[at:at+length]).decode())
        at += length
    assert len(set(paths)) == nodes, file
    times = struct.unpack_from('<' + str(frames) + 'f', data, at)
    assert all(math.isfinite(t) for t in times), file
    assert all(a < b for a, b in zip(times, times[1:])), file
    at += frames * 4
    assert len(data) - at == nodes * frames * 10 * 4, file
    for row in struct.iter_unpack('<10f', data[at:]):
        assert all(math.isfinite(x) for x in row), file
        assert abs(sum(x*x for x in row[3:7])-1) < .002, (file, 'quaternion length')
    return frames


def check_gaits(directory, info, model):
    entry = info['gaitLayers']
    file = directory / entry['file']
    assert hashlib.sha256(file.read_bytes()).hexdigest() == entry['sha256'], file
    data = json.loads(file.read_text())
    assert data['schema'] == 1 and len(data['layers']) == entry['count'], file
    names = {node['name'] for node in model['nodes']}
    expected = {'mixamorig'+side+part for side in ['Left', 'Right'] for part in ['UpLeg', 'Leg', 'Foot', 'ToeBase']}
    ids = set()
    for layer in data['layers']:
        assert layer['id'] not in ids, file
        ids.add(layer['id'])
        assert math.isfinite(layer['duration']) and layer['duration'] > 0 and math.isfinite(layer['start']), file
        assert {t['bone'] for t in layer['tracks']} == expected and len(layer['tracks']) == 8, file
        for track in layer['tracks']:
            assert track['bone'] in names, (file, track['bone'])
            times, values = track['times'], track['values']
            assert times and len(values) == 4*len(times), file
            assert all(math.isfinite(v) for v in times+values), file
            assert all(a < b for a,b in zip(times,times[1:])), file
            assert all(abs(sum(v*v for v in values[i:i+4])-1) < .002 for i in range(0,len(values),4)), file
    if not info['npc']:
        assert ids == {'RUN','WALK_FORWARD','ADVENTURE_WALK'}, file
    return len(data['layers'])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--allow-partial', action='store_true')
    parser.add_argument('--gaits-only', action='store_true')
    parser.add_argument('--fighters', help='Comma-separated diagnostic subset')
    args = parser.parse_args()
    manifest = json.loads((SOURCE / 'manifest.json').read_text())
    if not args.allow_partial:
        assert not manifest['partial'], 'Partial exports cannot pass the release asset gate'
        assert len(manifest['fighters']) == 18, 'All 10 base/NPC models and 8 outfits are required'
    selected = args.fighters.split(',') if args.fighters else None
    totals = {'fighters': 0, 'actions': 0, 'sampledFrames': 0, 'vertices': 0, 'gaitLayers': 0}
    for directory in sorted(SOURCE.iterdir()):
        if not directory.is_dir() or selected and directory.name not in selected:
            continue
        info = json.loads((directory / 'fighter.json').read_text())
        config = json.loads(gzip.decompress((directory / 'config.bytes').read_bytes()))
        model = json.loads(gzip.decompress((directory / 'model.bytes').read_bytes()))
        totals['gaitLayers'] += check_gaits(directory, info, model)
        if args.gaits_only:
            totals['fighters'] += 1
            continue
        if not args.allow_partial:
            assert info['complete'] and set(config) == {a['id'] for a in info['actions']}, directory
        for i, node in enumerate(model['nodes']):
            assert -1 <= node['parent'] < i, directory
        for mesh in model['meshes']:
            attributes = mesh['attributes']
            count = len(attributes['position']['array']) // 3
            totals['vertices'] += count
            for name, a in attributes.items():
                assert len(a['array']) == count * a['itemSize'], (directory, name)
            if mesh['index'] is not None:
                assert all(0 <= x < count for x in mesh['index']), directory
            groups = [a for name, a in attributes.items() if name.startswith('skinWeight')]
            for vertex in range(count):
                weight = sum(sum(a['array'][vertex*4:vertex*4+4]) for a in groups)
                assert weight == 0 or abs(weight - 1) < .001, (directory, vertex, weight)
        for action in info['actions']:
            file = directory / action['file']
            assert hashlib.sha256(file.read_bytes()).hexdigest() == action['sha256'], file
            totals['sampledFrames'] += check_pose(file, len(model['nodes']))
            totals['actions'] += 1
        totals['fighters'] += 1
    for source in manifest['sources']:
        file = ROOT / source['path']
        assert hashlib.sha256(file.read_bytes()).hexdigest() == source['sha256'], file
    print(json.dumps({'result': 'PASS', 'scope': 'export data only', **totals}))


if __name__ == '__main__':
    main()
