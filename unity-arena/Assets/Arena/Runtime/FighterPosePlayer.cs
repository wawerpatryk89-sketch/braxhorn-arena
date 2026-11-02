using System;
using UnityEngine;
using UnityEngine.Animations;
using UnityEngine.Playables;

namespace Braxhorn.Arena
{
    // Simulation owns action and time. Unity owns deformation and pose blending.
    // No JS interpreter, browser canvas, WebView or Three.js runtime is involved.
    public sealed class FighterPosePlayer : MonoBehaviour
    {
        PlayableGraph graph;
        AnimationMixerPlayable mixer;
        AnimationClipPlayable current;
        AnimationClipPlayable previous;
        FighterDefinition definition;
        string action;
        double transitionClock;
        float transitionSeconds;
        int activeSlot;

        public void Initialize(FighterDefinition fighter)
        {
            DisposeGraph();
            definition = fighter ? fighter : throw new ArgumentNullException(nameof(fighter));
            // The original roster uses up to twelve influences per vertex.
            // Default mobile quality settings would otherwise truncate the rig.
            QualitySettings.skinWeights = SkinWeights.Unlimited;
            var animator = GetComponent<Animator>();
            if (!animator) animator = gameObject.AddComponent<Animator>();
            animator.applyRootMotion = false;
            animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
            graph = PlayableGraph.Create("Arena pose: " + fighter.id);
            graph.SetTimeUpdateMode(DirectorUpdateMode.Manual);
            mixer = AnimationMixerPlayable.Create(graph, 2);
            AnimationPlayableOutput.Create(graph, "Pose", animator).SetSourcePlayable(mixer);
            graph.Play();
        }

        public void Sample(string actionId, double seconds, double clock, float blendSeconds = .08f)
        {
            if (!graph.IsValid()) throw new InvalidOperationException("Initialize the pose player first.");
            var data = definition.FindAction(actionId);
            if (data == null) throw new InvalidOperationException(definition.id + ": missing action " + actionId);
            if (action != actionId)
            {
                if (previous.IsValid()) { graph.Disconnect(mixer, 1 - activeSlot); graph.DestroyPlayable(previous); }
                previous = current;
                activeSlot = 1 - activeSlot;
                current = AnimationClipPlayable.Create(graph, data.clip);
                current.SetApplyFootIK(false);
                current.SetApplyPlayableIK(false);
                current.SetSpeed(0);
                graph.Connect(current, 0, mixer, activeSlot);
                transitionClock = clock;
                transitionSeconds = Mathf.Max(0, blendSeconds);
                action = actionId;
            }
            current.SetTime(Math.Max(0, Math.Min(seconds, data.duration)));
            var weight = !previous.IsValid() || transitionSeconds <= 0 ? 1 : Mathf.Clamp01((float)(clock - transitionClock) / transitionSeconds);
            mixer.SetInputWeight(activeSlot, weight);
            mixer.SetInputWeight(1 - activeSlot, 1 - weight);
            graph.Evaluate(0);
        }

        void DisposeGraph()
        {
            if (graph.IsValid()) graph.Destroy();
            graph = default;
            current = previous = default;
            action = null;
            activeSlot = 0;
        }
        void OnDestroy() => DisposeGraph();
    }
}
