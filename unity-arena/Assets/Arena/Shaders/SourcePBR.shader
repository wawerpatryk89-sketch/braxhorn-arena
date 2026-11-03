Shader "Braxhorn/Source PBR"
{
    Properties
    {
        _Color ("Source diffuse", Color) = (1,1,1,1)
        _MainTex ("Base color", 2D) = "white" {}
        [Normal] _BumpMap ("Normal", 2D) = "bump" {}
        _MetallicGlossMap ("Metallic R / Smoothness A", 2D) = "white" {}
        [Enum(UnityEngine.Rendering.CullMode)] _Cull ("Culling", Float) = 2
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 300
        Cull [_Cull]
        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows addshadow
        #pragma target 3.0
        sampler2D _MainTex, _BumpMap, _MetallicGlossMap;
        fixed4 _Color;
        struct Input { float2 uv_MainTex; float facing : VFACE; };
        void surf(Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 color = tex2D(_MainTex, IN.uv_MainTex) * _Color;
            fixed4 packed = tex2D(_MetallicGlossMap, IN.uv_MainTex);
            o.Albedo = color.rgb;
            o.Alpha = 1;
            o.Metallic = packed.r;
            o.Smoothness = packed.a;
            o.Normal = UnpackNormal(tex2D(_BumpMap, IN.uv_MainTex)) * (IN.facing >= 0 ? 1 : -1);
        }
        ENDCG
    }
    FallBack "Diffuse"
}
