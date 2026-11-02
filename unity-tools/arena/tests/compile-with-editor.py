#!/usr/bin/env python3
"""Compile against installed Unity refs without invoking/licensing the Editor.
This is not an Editor import, shader compilation, Play Mode test or device build.
"""
import argparse,json,pathlib,shutil,subprocess
p=argparse.ArgumentParser();p.add_argument('--editor-data',required=True);p.add_argument('--out-dir',required=True);p.add_argument('--with-assets',action='store_true');a=p.parse_args()
editor=pathlib.Path(a.editor_data).resolve();out=pathlib.Path(a.out_dir).resolve();out.mkdir(parents=True,exist_ok=True)
repo=pathlib.Path(__file__).resolve().parents[3]
dotnet=editor/'NetCoreRuntime/dotnet';compiler=editor/'DotNetSdkRoslyn/csc.dll'
standard=list((editor/'NetStandard/ref/2.1.0').glob('*.dll'))
newtonsoft=editor/'Managed/Newtonsoft.Json.dll'
common=['-nostdlib+','-langversion:9','-warn:4']
def compile(name,sources,refs,target):
 response=out/(name+'.rsp')
 args=common+['-target:'+target,'-out:'+str(out/(name+'.dll'))]+['-r:'+str(f) for f in refs]+[str(s) for s in sources]
 response.write_text('\n'.join('"'+s+'"' for s in args))
 subprocess.run([str(dotnet),str(compiler),'-noconfig','@'+str(response)],check=True)
compile('ArenaNative',list((repo/'unity-arena/Assets/Arena').rglob('*.cs')),
 standard+list((editor/'NetStandard/compat/2.1.0/shims/netfx').glob('*.dll'))+list((editor/'Managed/UnityEngine').glob('*.dll'))+
 [newtonsoft,editor/'Resources/PackageManager/BuiltInPackages/com.unity.ext.nunit/net40/unity-custom/nunit.framework.dll',
 editor/'Resources/PackageManager/ProjectTemplates/libcache/com.unity.template.3d-cross-platform-17.0.14/ScriptAssemblies/UnityEngine.UI.dll'],'library')
runners=list(pathlib.Path(__file__).parent.glob('*Runner.cs'))
compile('RulesParity',list((repo/'unity-arena/Assets/Arena/Domain').glob('*.cs'))+runners,standard+[newtonsoft],'exe')
shutil.copy2(newtonsoft,out/newtonsoft.name)
(out/'RulesParity.runtimeconfig.json').write_text(json.dumps({'runtimeOptions':{'tfm':'net6.0','framework':{'name':'Microsoft.NETCore.App','version':'6.0.0'},'rollForward':'LatestMinor'}}))
subprocess.run([str(dotnet),str(out/'RulesParity.dll'),str(repo/'unity-tools/arena/tests/campaign-reference.json.gz'),str(repo/'unity-tools/arena/tests')]+([str(repo/'unity-arena/Assets/Arena/SourceData')] if a.with_assets else []),check=True,cwd=repo)
print('PASS managed compilation and executable rule checks; Unity import/runtime untested.')
