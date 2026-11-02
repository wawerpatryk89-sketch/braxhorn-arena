Shader "Braxhorn/Original Arena Media"
{
    Properties
    {
        _MainTex("Decoded frame",2D)="black"{}
        _LoopTex("First decoded frame",2D)="black"{}
        _LoopBlend("Loop blend",Range(0,1))=0
        _Brightness("Source brightness",Float)=1
        _Contrast("Source contrast",Float)=1
        _UvRect("Source crop",Vector)=(0,0,1,1)
    }
    SubShader
    {
        Tags {"Queue"="Background" "RenderType"="Opaque"}
        Cull Off ZWrite Off ZTest Always
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            sampler2D _MainTex,_LoopTex;
            float4 _UvRect;
            float _LoopBlend,_Brightness,_Contrast;
            struct v2f {float4 pos:SV_POSITION;float2 uv:TEXCOORD0;};
            v2f vert(appdata_base v){v2f o;o.pos=UnityObjectToClipPos(v.vertex);o.uv=_UvRect.xy+v.texcoord.xy*_UvRect.zw;return o;}
            fixed4 frag(v2f i):SV_Target
            {
                if(any(i.uv<0)||any(i.uv>1))return fixed4(0,0,0,1);
                float3 a=tex2D(_MainTex,i.uv).rgb,b=tex2D(_LoopTex,i.uv).rgb;
                // CSS filters operate in sRGB. Unity is configured for linear
                // lighting, so apply the original filter in the original space.
                #ifndef UNITY_COLORSPACE_GAMMA
                a=LinearToGammaSpace(a);b=LinearToGammaSpace(b);
                #endif
                float3 c=saturate((lerp(a,b,_LoopBlend)*_Brightness-.5)*_Contrast+.5);
                #ifndef UNITY_COLORSPACE_GAMMA
                c=GammaToLinearSpace(c);
                #endif
                return fixed4(c,1);
            }
            ENDCG
        }
    }
}
