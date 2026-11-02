Shader "Braxhorn/Original Adventure Colour"
{
    Properties
    {
        _MainTex("Original colour",2D)="white"{}
        _Color("Original diffuse multiplier",Color)=(1,1,1,1)
        [Enum(UnityEngine.Rendering.CullMode)] _Cull("Culling",Float)=2
    }
    SubShader
    {
        Tags {"RenderType"="Opaque"}
        Cull [_Cull]
        Pass
        {
            CGPROGRAM
            #pragma vertex vert_img
            #pragma fragment frag
            #include "UnityCG.cginc"
            sampler2D _MainTex;
            float4 _Color;
            fixed4 frag(v2f_img i):SV_Target{return fixed4(tex2D(_MainTex,i.uv).rgb*_Color.rgb,1);}
            ENDCG
        }
    }
}
