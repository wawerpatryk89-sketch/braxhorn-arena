using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;

namespace Braxhorn.Arena.Editor
{
    public static class ArenaBuild
    {
        public const string ReviewScene = "Assets/Arena/Scenes/FighterReview.unity";
        public const string CombatScene = "Assets/Arena/Scenes/NativeCombat.unity";

        public static void AndroidReview()
        { BuildAndroid(false); }

        public static void AndroidCombat()
        { BuildAndroid(true); }

        static void BuildAndroid(bool combat)
        {
            NativeFighterImporter.ImportAll();
            CreateReviewScene();
            if(combat) CreateCombatScene();
            PlayerSettings.companyName = "Braxhorn";
            PlayerSettings.productName = combat ? "Braxhorn Arena Unity Combat" : "Braxhorn Arena Unity Review";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android,"com.braxhorn.arena.unityreview");
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.Android.bundleVersionCode = 1;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevelAuto;
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android,ScriptingImplementation.IL2CPP);
            PlayerSettings.SetManagedStrippingLevel(NamedBuildTarget.Android,ManagedStrippingLevel.Low);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.LandscapeLeft;
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.Android,false);
            PlayerSettings.SetGraphicsAPIs(BuildTarget.Android,new[] {GraphicsDeviceType.OpenGLES3});
            EditorUserBuildSettings.buildAppBundle = false;
            Directory.CreateDirectory("../build/Android");
            var output = "../build/Android/"+(combat ? "BraxhornArena-UnityCombat.apk" : "BraxhornArena-UnityReview.apk");
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = combat ? new[] {CombatScene,ReviewScene} : new[] {ReviewScene}, locationPathName = output,
                target = BuildTarget.Android, options = BuildOptions.Development
            });
            File.WriteAllText("../build/Android/build-result.json",JsonUtility.ToJson(new BuildEvidence
            {
                result = report.summary.result.ToString(), errors = report.summary.totalErrors,
                warnings = report.summary.totalWarnings, unityVersion = Application.unityVersion,
                sourceVersion = 271, scope = combat ? "Native combat/campaign integration; production UI, audiovisual, adventure, online and device validation incomplete" : "Native model/animation review scene; full game migration and device validation incomplete"
            },true));
            if (report.summary.result != BuildResult.Succeeded || !File.Exists(output))
                throw new BuildFailedException("Native Android review build failed: " + report.summary.result);
        }

        [MenuItem("Braxhorn/Migration/Create native combat scene")]
        public static void CreateCombatScene()
        {
            Directory.CreateDirectory("Assets/Arena/Scenes");
            var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
            var camera=new GameObject("Native arena camera").AddComponent<Camera>();
            camera.orthographic=true;camera.orthographicSize=2;camera.transform.position=new Vector3(0,1,-8);
            camera.nearClipPlane=.1f;camera.farClipPlane=30;camera.clearFlags=CameraClearFlags.SolidColor;
            camera.backgroundColor=new Color(.04f,.05f,.07f);camera.tag="MainCamera";camera.gameObject.AddComponent<AudioListener>();
            RenderSettings.ambientMode=AmbientMode.Flat;RenderSettings.ambientLight=new Color(.45f,.45f,.5f);
            var key=new GameObject("Arena key light").AddComponent<Light>();key.type=LightType.Directional;key.intensity=1.3f;key.transform.rotation=Quaternion.Euler(30,-25,0);
            var player=new GameObject("Native match").AddComponent<NativeMatchPlayer>();player.matchCamera=camera;
            player.arenaMediaShader=AssetDatabase.LoadAssetAtPath<Shader>("Assets/Arena/Shaders/OriginalArenaMedia.shader");
            player.adventureCorpseShader=AssetDatabase.LoadAssetAtPath<Shader>("Assets/Arena/Shaders/OriginalAdventureCorpse.shader");
            player.adventureSeamShader=AssetDatabase.LoadAssetAtPath<Shader>("Assets/Arena/Shaders/OriginalAdventureSeam.shader");
            player.adventureColourShader=AssetDatabase.LoadAssetAtPath<Shader>("Assets/Arena/Shaders/OriginalAdventureColour.shader");
            if(!player.arenaMediaShader||!player.adventureCorpseShader||!player.adventureSeamShader||!player.adventureColourShader||!AssetDatabase.LoadAssetAtPath<TextAsset>("Assets/Arena/Resources/ArenaMediaCatalog.json"))throw new BuildFailedException("Native media export or shader is missing.");
            if(!EditorSceneManager.SaveScene(scene,CombatScene))throw new BuildFailedException("Cannot save native combat scene.");
            EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene(CombatScene,true),new EditorBuildSettingsScene(ReviewScene,true)};
            AssetDatabase.SaveAssets();
        }

        public static void CreateReviewScene()
        {
            Directory.CreateDirectory("Assets/Arena/Scenes");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
            var camera = new GameObject("Review camera").AddComponent<Camera>();
            camera.orthographic = true; camera.orthographicSize = 1.625f;
            camera.transform.position = new Vector3(0,(550f/640-.5f)*3.25f,-8);
            camera.clearFlags = CameraClearFlags.SolidColor; camera.backgroundColor = new Color(.04f,.05f,.07f);
            camera.nearClipPlane = .1f;camera.farClipPlane = 30;camera.tag = "MainCamera";
            camera.gameObject.AddComponent<AudioListener>();
            RenderSettings.ambientMode = AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(.45f,.45f,.5f);
            var key = new GameObject("Review key light").AddComponent<Light>();
            key.type = LightType.Directional;key.intensity = 1.3f;key.transform.rotation = Quaternion.Euler(30,-25,0);
            new GameObject("Native fighter review").AddComponent<FighterReviewPlayer>().reviewCamera = camera;
            if (!EditorSceneManager.SaveScene(scene,ReviewScene)) throw new BuildFailedException("Cannot save native review scene.");
            EditorBuildSettings.scenes = new[] {new EditorBuildSettingsScene(ReviewScene,true)};
            AssetDatabase.SaveAssets();
            if (scene.GetRootGameObjects().SelectMany(root=>root.GetComponentsInChildren<Transform>(true)).Any(t=>GameObjectUtility.GetMonoBehavioursWithMissingScriptCount(t.gameObject)>0))
                throw new BuildFailedException("Review scene has missing scripts.");
        }
        [Serializable] sealed class BuildEvidence
        {
            public string result,unityVersion,scope;
            public int sourceVersion;
            public int errors,warnings;
        }
    }
}
