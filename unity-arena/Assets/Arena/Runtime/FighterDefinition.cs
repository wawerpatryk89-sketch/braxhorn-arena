using System;
using System.Collections.Generic;
using UnityEngine;

namespace Braxhorn.Arena
{
    [Serializable]
    public sealed class FighterActionClip
    {
        public string id;
        public AnimationClip clip;
        public float duration;
    }

    [CreateAssetMenu(menuName = "Braxhorn/Fighter definition")]
    public sealed class FighterDefinition : ScriptableObject
    {
        public string id;
        public string baseId;
        public string displayName;
        public bool npc;
        public bool complete;
        public GameObject prefab;
        public TextAsset configuration;
        public FighterActionClip[] actions;
        Dictionary<string, FighterActionClip> index;

        public FighterActionClip FindAction(string action)
        {
            if (index == null)
            {
                index = new Dictionary<string, FighterActionClip>(StringComparer.Ordinal);
                foreach (var item in actions) index.Add(item.id, item);
            }
            return index.TryGetValue(action, out var result) ? result : null;
        }

        void OnEnable() => index = null;
    }
}
