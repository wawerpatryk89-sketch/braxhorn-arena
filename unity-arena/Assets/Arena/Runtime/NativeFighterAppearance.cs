using UnityEngine;
using UnityEngine.Rendering;

namespace Braxhorn.Arena
{
    // The Unity version retains the imported PBR material in every mode.
    // The owner requested lit fighters in adventure, replacing the old web
    // unlit override. Original colour, normal and metal/roughness maps stay intact.
    public sealed class NativeFighterAppearance : MonoBehaviour
    {
        public void Apply(FighterDefinition fighter,bool adventure,Shader unlit)
        {
            foreach(var renderer in GetComponentsInChildren<Renderer>(true))
            {
                renderer.receiveShadows=true;
                renderer.shadowCastingMode=ShadowCastingMode.On;
            }
        }
    }
}
