Shader "Braxhorn/Original Adventure Seam"
{
    Properties
    {
        _LeftTex("Left decoded frame",2D)="black"{}
        _LeftHead("Left loop head",2D)="black"{}
        _RightTex("Right decoded frame",2D)="black"{}
        _RightHead("Right loop head",2D)="black"{}
        _LeftCrop("Left source crop",Vector)=(0,0,1,1)
        _RightCrop("Right source crop",Vector)=(0,0,1,1)
        _Loops("Loop blend amounts",Vector)=(0,0,0,0)
        _Strip("Source strip fraction",Float)=.045
    }
    SubShader
    {
        Tags {"Queue"="Background+1" "RenderType"="Opaque"}
        Cull Off ZWrite Off ZTest Always
        Pass
        {
            CGPROGRAM
            #pragma vertex vert_img
            #pragma fragment frag
            #include "UnityCG.cginc"
            sampler2D _LeftTex,_LeftHead,_RightTex,_RightHead;
            float4 _LeftCrop,_RightCrop,_Loops;
            float _Strip;
            fixed4 frag(v2f_img i):SV_Target
            {
                float2 left=_LeftCrop.xy+float2(1-_Strip+i.uv.x*_Strip,i.uv.y)*_LeftCrop.zw;
                float2 right=_RightCrop.xy+float2(i.uv.x*_Strip,i.uv.y)*_RightCrop.zw;
                float3 a=tex2D(_LeftTex,left).rgb,b=tex2D(_LeftHead,left).rgb;
                float3 c=tex2D(_RightTex,right).rgb,d=tex2D(_RightHead,right).rgb;
                // Match the original 2D canvas compositing in sRGB, including
                // each film's tail-to-first-frame dissolve before the edge join.
                #ifndef UNITY_COLORSPACE_GAMMA
                a=LinearToGammaSpace(a);b=LinearToGammaSpace(b);c=LinearToGammaSpace(c);d=LinearToGammaSpace(d);
                #endif
                float3 color=lerp(lerp(a,b,_Loops.x),lerp(c,d,_Loops.y),i.uv.x);
                #ifndef UNITY_COLORSPACE_GAMMA
                color=GammaToLinearSpace(color);
                #endif
                return fixed4(color,1);
            }
            ENDCG
        }
    }
}
