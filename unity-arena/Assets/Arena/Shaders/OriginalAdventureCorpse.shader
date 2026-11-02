Shader "Braxhorn/Original Adventure Corpse"
{
 Properties { _MainTex("Actual grounded pose",2D)="black"{} }
 SubShader
 {
  Tags {"Queue"="Transparent" "RenderType"="Transparent"}
  Blend SrcAlpha OneMinusSrcAlpha Cull Off ZWrite Off ZTest LEqual
  Pass
  {
   CGPROGRAM
   #pragma vertex vert_img
   #pragma fragment frag
   #include "UnityCG.cginc"
   sampler2D _MainTex;
   fixed4 frag(v2f_img i):SV_Target {return tex2D(_MainTex,i.uv);}
   ENDCG
  }
 }
}
