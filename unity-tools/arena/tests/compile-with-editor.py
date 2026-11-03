#!/usr/bin/env python3
"""Compile against installed Unity refs without invoking/licensing the Editor.
This is not an Editor import, shader compilation, Play Mode test or device build.
"""
import argparse,json,pathlib,shutil,subprocess
p=argparse.ArgumentParser();p.add_argument('--editor-data',required=True);p.add_argument('--out-dir',required=True);p.add_argument('--with-assets',action='store_true');p.add_argument('--only-duel',action='store_true');p.add_argument('--webrtc-package',required=True,help='Verified com.unity.webrtc 3.0.0 package directory; source compilation only');a=p.parse_args()
editor=pathlib.Path(a.editor_data).resolve();out=pathlib.Path(a.out_dir).resolve();out.mkdir(parents=True,exist_ok=True)
repo=pathlib.Path(__file__).resolve().parents[3]
dotnet=editor/'NetCoreRuntime/dotnet';compiler=editor/'DotNetSdkRoslyn/csc.dll'
standard=list((editor/'NetStandard/ref/2.1.0').glob('*.dll'))
newtonsoft=editor/'Managed/Newtonsoft.Json.dll'
common=['-nostdlib+','-langversion:9','-warn:4']
def compile(name,sources,refs,target,extra=None):
 response=out/(name+'.rsp')
 args=common+(extra or [])+['-target:'+target,'-out:'+str(out/(name+'.dll'))]+['-r:'+str(f) for f in refs]+[str(s) for s in sources]
 response.write_text('\n'.join('"'+s+'"' for s in args))
 subprocess.run([str(dotnet),str(compiler),'-noconfig','@'+str(response)],check=True)
# Compile the real asmdef boundaries independently: a monolithic assembly can
# hide accidental internal API access from Runtime into Domain or Editor.
unity_refs=standard+list((editor/'NetStandard/compat/2.1.0/shims/netfx').glob('*.dll'))+list((editor/'Managed/UnityEngine').glob('*.dll'))
ui=editor/'Resources/PackageManager/ProjectTemplates/libcache/com.unity.template.3d-cross-platform-17.0.14/ScriptAssemblies/UnityEngine.UI.dll'
nunit=editor/'Resources/PackageManager/BuiltInPackages/com.unity.ext.nunit/net40/unity-custom/nunit.framework.dll'
assets=repo/'unity-arena/Assets/Arena'
webrtc=pathlib.Path(a.webrtc_package).resolve()
metadata=json.loads((webrtc/'package.json').read_text())
if metadata.get('name')!='com.unity.webrtc' or metadata.get('version')!='3.0.0':raise ValueError('Expected pinned WebRTC package 3.0.0')
compile('Unity.WebRTC',list((webrtc/'Runtime').rglob('*.cs')),unity_refs,'library',['-unsafe+'])
unity_refs.append(out/'Unity.WebRTC.dll')
compile('Arena.Domain',list((assets/'Domain').glob('*.cs')),standard+[newtonsoft],'library')
compile('Arena.Runtime',list((assets/'Runtime').glob('*.cs')),unity_refs+[newtonsoft,ui,out/'Arena.Domain.dll'],'library')
compile('Arena.Editor',list((assets/'Editor').glob('*.cs')),unity_refs+[newtonsoft,ui,out/'Arena.Runtime.dll'],'library')
compile('Arena.Tests',list((assets/'Tests/EditMode').glob('*.cs')),unity_refs+[newtonsoft,nunit,ui,out/'Arena.Domain.dll',out/'Arena.Runtime.dll',out/'Arena.Editor.dll'],'library')
runners=list(pathlib.Path(__file__).parent.glob('*Runner.cs'))+[assets/'Runtime/ProgressFileStore.cs',assets/'Runtime/ArenaRankTracker.cs',assets/'Runtime/PendingArenaResults.cs',assets/'Runtime/ArenaAdventureTracker.cs',assets/'Runtime/ArenaDuelSession.cs']+list((assets/'Runtime').glob('ArenaOnlineClient*.cs'))
compile('RulesParity',list((repo/'unity-arena/Assets/Arena/Domain').glob('*.cs'))+runners,standard+[newtonsoft],'exe')
shutil.copy2(newtonsoft,out/newtonsoft.name)
(out/'RulesParity.runtimeconfig.json').write_text(json.dumps({'runtimeOptions':{'tfm':'net6.0','framework':{'name':'Microsoft.NETCore.App','version':'6.0.0'},'rollForward':'LatestMinor'}}))
subprocess.run([str(dotnet),str(out/'RulesParity.dll'),'--duel' if a.only_duel else str(repo/'unity-tools/arena/tests/campaign-reference.json.gz'),str(repo/'unity-tools/arena/tests')]+([str(repo/'unity-arena/Assets/Arena/SourceData')] if a.with_assets else []),check=True,cwd=repo)
print('PASS managed compilation and executable rule checks; Unity import/runtime untested.')
