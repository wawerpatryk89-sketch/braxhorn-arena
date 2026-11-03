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
            CreateFighterLighting();
            var player=new GameObject("Native match").AddComponent<NativeMatchPlayer>();player.matchCamera=camera;
            player.arenaMediaShader=AssetDatabase.LoadAssetAtPath<Shader>("Assets/Arena/Shaders/OriginalArenaMedia.shader");
            player.adventureCorpseShader=AssetDatabase.LoadAssetAtPath<Shader>("Assets/Arena/Shaders/OriginalAdventureCorpse.shader");
            player.adventureSeamShader=AssetDatabase.LoadAssetAtPath<Shader>("Assets/Arena/Shaders/OriginalAdventureSeam.shader");
            player.adventureColourShader=AssetDatabase.LoadAssetAtPath<Shader>("Assets/Arena/Shaders/OriginalAdventureColour.shader");
            player.bloodShader=AssetDatabase.LoadAssetAtPath<Shader>("Assets/Arena/Shaders/OriginalBlood.shader");
            if(!player.arenaMediaShader||!player.adventureCorpseShader||!player.adventureSeamShader||!player.adventureColourShader||!player.bloodShader||!AssetDatabase.LoadAssetAtPath<TextAsset>("Assets/Arena/Resources/ArenaMediaCatalog.json"))throw new BuildFailedException("Native media export or shader is missing.");
            if(!EditorSceneManager.SaveScene(scene,CombatScene))throw new BuildFailedException("Cannot save native combat scene.");
            EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene(CombatScene,true),new EditorBuildSettingsScene(ReviewScene,true)};
            AssetDatabase.SaveAssets();
        }

        static void CreateFighterLighting()
        {
            // Shared by review, arena and adventure. Video backgrounds are unlit.
            // These are initial studio values, not a verified Tripo calibration.
            RenderSettings.ambientMode=AmbientMode.Trilight;
            RenderSettings.ambientSkyColor=new Color(.30f,.32f,.36f);
            RenderSettings.ambientEquatorColor=new Color(.18f,.19f,.20f);
            RenderSettings.ambientGroundColor=new Color(.10f,.09f,.08f);
            QualitySettings.pixelLightCount=Mathf.Max(3,QualitySettings.pixelLightCount);
            void Add(string name,Vector3 angles,Color colour,float intensity,bool shadows)
            {
                var light=new GameObject(name).AddComponent<Light>();light.enabled=true;
                light.type=LightType.Directional;light.renderMode=LightRenderMode.ForcePixel;
                light.color=colour;light.intensity=intensity;light.transform.rotation=Quaternion.Euler(angles);
                light.shadows=shadows?LightShadows.Soft:LightShadows.None;
                light.shadowStrength=.65f;light.shadowBias=.03f;light.shadowNormalBias=.2f;
            }
            Add("Fighter studio key",new Vector3(30,-25,0),new Color(1,.97f,.94f),1.1f,true);
            Add("Fighter studio fill",new Vector3(15,35,0),new Color(.88f,.94f,1),.45f,false);
            Add("Fighter studio rim",new Vector3(25,160,0),new Color(1,.98f,.95f),.55f,false);
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
            CreateFighterLighting();
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
