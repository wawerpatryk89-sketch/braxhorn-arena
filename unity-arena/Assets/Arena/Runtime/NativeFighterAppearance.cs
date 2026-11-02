using System;
using System.Collections.Generic;
using UnityEngine;

namespace Braxhorn.Arena
{
    // Adventure's BRAX and NYXA image-derived textures already contain shading.
    // Match the source's MeshBasicMaterial path, including both NYXA outfits.
    public sealed class NativeFighterAppearance : MonoBehaviour
    {
        readonly List<Material> owned=new List<Material>();
        public void Apply(FighterDefinition fighter,bool adventure,Shader unlit)
        {
            if(!adventure||!(fighter.id=="BRAX"||fighter.id=="NYXA"||fighter.id=="NYXA_SPORT"||fighter.id=="NYXA_PINK"))return;
            if(!unlit)throw new InvalidOperationException("Missing original adventure material shader");
            var replacements=new Dictionary<Material,Material>();
            foreach(var renderer in GetComponentsInChildren<Renderer>(true))
            {
                var materials=renderer.sharedMaterials;
                for(var i=0;i<materials.Length;i++)
                {
                    var source=materials[i];if(!source)continue;
                    if(!replacements.TryGetValue(source,out var replacement))
                    {
                        replacement=new Material(unlit){name=source.name+" / original adventure colour"};
                        replacement.SetTexture("_MainTex",source.GetTexture("_MainTex"));replacement.SetColor("_Color",source.GetColor("_Color"));replacement.SetFloat("_Cull",source.GetFloat("_Cull"));
                        replacements.Add(source,replacement);owned.Add(replacement);
                    }
                    materials[i]=replacement;
                }
                renderer.sharedMaterials=materials;
            }
        }
        void OnDestroy(){foreach(var material in owned)Destroy(material);owned.Clear();}
    }
}
