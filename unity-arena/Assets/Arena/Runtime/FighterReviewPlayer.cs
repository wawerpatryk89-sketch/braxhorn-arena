using System;
using System.Collections;
using Braxhorn.Arena.Domain;
using UnityEngine;

namespace Braxhorn.Arena
{
    // A native validation scene, deliberately separate from the unfinished
    // production menu/match flow. Uses the real roster, shaders and authored poses.
    public sealed class FighterReviewPlayer : MonoBehaviour
    {
        public string initialFighter = "BRAX";
        public string initialAction = "IDLE";
        public Camera reviewCamera;
        static readonly string[] Fighters = { "BRAX", "NYXA", "VEXA", "KROV", "NINA", "DANNY", "BEAR", "DEMON", "BOSS", "ZOMBIE", "BRAX_WHITE", "BRAX_STREET", "NYXA_SPORT", "NYXA_PINK", "VEXA_PURPLE", "VEXA_STREET", "KROV_TRACKSUIT", "KROV_SUMMER" };
        FighterDefinition definition;
        FighterPosePlayer player;
        CombatConfiguration config;
        readonly ActionClock clock = new ActionClock();
        GameObject actor;
        string[] actions = Array.Empty<string>();
        string error;
        int fighterIndex, actionIndex, face = 1;
        bool paused, loading;
        double poseClock;
        GUIStyle label;

        IEnumerator Start()
        {
            QualitySettings.skinWeights = SkinWeights.Unlimited;
            Application.targetFrameRate = 60;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            fighterIndex = Math.Max(0, Array.IndexOf(Fighters, initialFighter));
            yield return LoadFighter();
            if (config != null && config.Has(initialAction)) SelectAction(initialAction);
        }

        IEnumerator LoadFighter()
        {
            loading = true;
            if (actor) Destroy(actor);
            actor = null; player = null; definition = null; config = null;
            // Release the previous rig before loading another set of 120-200 clips.
            yield return null;
            yield return Resources.UnloadUnusedAssets();
            var request = Resources.LoadAsync<FighterDefinition>("Fighters/" + Fighters[fighterIndex] + "/" + Fighters[fighterIndex]);
            yield return request;
            try
            {
                definition = request.asset as FighterDefinition;
                if (!definition || !definition.complete || !definition.prefab || !definition.configuration)
                    throw new InvalidOperationException("Brak pełnych zasobów: " + Fighters[fighterIndex]);
                config = CombatConfiguration.Read(definition.baseId, definition.configuration.bytes);
                actor = new GameObject("Fighter placement");
                var rig = Instantiate(definition.prefab, actor.transform);
                player = rig.GetComponent<FighterPosePlayer>();
                player.Initialize(definition);
                actions = new string[definition.actions.Length];
                for (var i = 0; i < actions.Length; i++) actions[i] = definition.actions[i].id;
                actionIndex = Math.Max(0, Array.IndexOf(actions, "IDLE"));
                SelectAction(actions[actionIndex]);
                error = null;
            }
            catch (Exception exception) { error = exception.Message; Debug.LogException(exception); }
            loading = false;
        }

        void SelectAction(string id)
        {
            actionIndex = Array.IndexOf(actions,id);
            clock.Start(config[id]); poseClock = 0;
        }
        void Update()
        {
            if (loading || !player || paused || error != null) return;
            var milliseconds = Math.Min(Time.unscaledDeltaTime * 1000, 100);
            poseClock += milliseconds / 1000;
            var action = clock.Action;
            clock.Advance(milliseconds, frame => action.Id == "IDLE" ? CombatRules.ActionSpeed * (definition.baseId == "NINA" ? .93 : 1) : CombatRules.ActionTempo(definition.baseId,action,frame), _ => true, true);
            player.Sample(action.Id,clock.PoseSeconds,poseClock,0);
            actor.transform.localRotation = Quaternion.Euler(0,face < 0 ? 180 : 0,0);
        }
        void OnApplicationPause(bool background) { if(background) paused = true; }
        void OnApplicationFocus(bool focus) { if(!focus) paused = true; }
        void OnDestroy() { if(actor)Destroy(actor); }
        void OnGUI()
        {
            if(label == null) label = new GUIStyle(GUI.skin.label) { fontSize = 20, wordWrap = true };
            var scale = Math.Min(Screen.width / 960f,Screen.height / 540f);
            var previous = GUI.matrix; GUI.matrix = Matrix4x4.Scale(new Vector3(scale,scale,1));
            GUILayout.BeginArea(new Rect(16,12,928,150));
            GUILayout.Label("BRAXHORN ARENA — kontrola migracji Unity",label);
            GUILayout.Label("Scena techniczna: oryginalne postacie i animacje. To nie jest gotowa gra.");
            if(error != null) GUILayout.Label(error,label);
            else GUILayout.Label(loading ? "Wczytywanie…" : Fighters[fighterIndex]+" / "+(clock.Action?.Id ?? "")+" / klatka "+clock.Frame,label);
            GUILayout.EndArea();
            GUI.enabled = !loading && error == null;
            GUILayout.BeginArea(new Rect(16,420,928,100));GUILayout.BeginHorizontal();
            if(GUILayout.Button("Poprzednia postać",GUILayout.Height(48)))ChangeFighter(-1);
            if(GUILayout.Button("Następna postać",GUILayout.Height(48)))ChangeFighter(1);
            if(GUILayout.Button("Poprzedni ruch",GUILayout.Height(48)))ChangeAction(-1);
            if(GUILayout.Button("Następny ruch",GUILayout.Height(48)))ChangeAction(1);
            if(GUILayout.Button("Obróć",GUILayout.Height(48)))face = -face;
            if(GUILayout.Button(paused ? "Wznów" : "Pauza",GUILayout.Height(48)))paused = !paused;
            GUILayout.EndHorizontal();GUILayout.EndArea();
            GUI.enabled = true;GUI.matrix = previous;
        }
        void ChangeFighter(int delta) { fighterIndex = (fighterIndex + delta + Fighters.Length) % Fighters.Length;StartCoroutine(LoadFighter()); }
        void ChangeAction(int delta) { actionIndex = (actionIndex + delta + actions.Length) % actions.Length;SelectAction(actions[actionIndex]); }
    }
}
