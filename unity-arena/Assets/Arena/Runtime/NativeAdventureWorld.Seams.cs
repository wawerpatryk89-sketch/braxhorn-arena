using UnityEngine;

namespace Braxhorn.Arena
{
    public sealed partial class NativeAdventureWorld
    {
        sealed class Edge {public GameObject Plane;public Material Material;}
        readonly Edge[] edges=new Edge[2];
        Shader seamShader;
        RenderTexture previousFrame,previousHead;
        int previousIndex=-1;
        float previousMix;
        double currentCamera,currentSpan;
        bool hasView;
        void RememberEdge(int index,NativeArenaMedia media)
        {
            ReleaseEdge();var source=media.CurrentFrame;if(!source)return;
            var width=Mathf.Min(1280,source.width);var height=Mathf.Max(1,Mathf.RoundToInt(width*(float)source.height/source.width));
            previousFrame=new RenderTexture(width,height,0,RenderTextureFormat.ARGB32,RenderTextureReadWrite.sRGB);previousFrame.Create();Graphics.Blit(source,previousFrame);
            previousHead=new RenderTexture(previousFrame.descriptor);previousHead.Create();Graphics.Blit(media.LoopFrame?media.LoopFrame:source,previousHead);
            previousIndex=index;previousMix=media.LoopAmount;
        }
        void ReleaseEdge()
        {if(previousFrame){previousFrame.Release();Destroy(previousFrame);}if(previousHead){previousHead.Release();Destroy(previousHead);}previousFrame=previousHead=null;previousIndex=-1;}
        bool Frame(int index,out Texture frame,out Texture head,out float mix)
        {
            if(slots.TryGetValue(index,out var slot)&&slot.Media.CurrentFrame){frame=slot.Media.CurrentFrame;head=slot.Media.LoopFrame?slot.Media.LoopFrame:frame;mix=slot.Media.LoopAmount;return true;}
            frame=previousIndex==index?previousFrame:null;head=previousHead;mix=previousMix;return frame;
        }
        static Vector4 Crop(Texture image)
        {var aspect=(double)image.width/image.height;var layout=new Domain.MediaGeometry(898.0/512,1,aspect,.84,false);return new Vector4((float)(-layout.Left/layout.Width),(float)(-layout.Top/layout.Height),(float)((898.0/512)/layout.Width),(float)(1/layout.Height));}
        void LateUpdate()
        {
            if(!hasView||disposed||!view||!seamShader)return;
            var first=Mathf.Max(0,(int)System.Math.Floor(currentCamera/100));
            var last=Mathf.Min(chapters.Count-1,(int)System.Math.Floor((currentCamera+currentSpan-.001)/100));
            var panel=view.pixelWidth*100/currentSpan;var half=System.Math.Max(12,System.Math.Round(panel*.045));var used=0;
            for(var i=System.Math.Max(1,first);i<=System.Math.Min(chapters.Count-1,last+1);i++)
            {
                var boundary=(i*100-currentCamera)/currentSpan*view.pixelWidth;
                if(boundary+half<0||boundary-half>view.pixelWidth||!Frame(i-1,out var left,out var leftHead,out var leftMix)||!Frame(i,out var right,out var rightHead,out var rightMix))continue;
                if(used>=edges.Length)break;
                if(edges[used]==null)
                {
                    EnsureQuad();var plane=new GameObject("Original chapter edge",typeof(MeshFilter),typeof(MeshRenderer));plane.transform.SetParent(view.transform,false);plane.GetComponent<MeshFilter>().sharedMesh=quad;
                    var material=new Material(seamShader);plane.GetComponent<MeshRenderer>().sharedMaterial=material;edges[used]=new Edge{Plane=plane,Material=material};
                }
                var edge=edges[used++];edge.Plane.SetActive(true);var h=view.orthographicSize*2;var w=h*view.aspect;
                edge.Plane.transform.localPosition=new Vector3((float)(boundary/view.pixelWidth-.5)*w,0,19);edge.Plane.transform.localScale=new Vector3((float)(2*half/view.pixelWidth)*w,h,1);
                var m=edge.Material;m.SetTexture("_LeftTex",left);m.SetTexture("_LeftHead",leftHead);m.SetTexture("_RightTex",right);m.SetTexture("_RightHead",rightHead);
                m.SetVector("_LeftCrop",Crop(left));m.SetVector("_RightCrop",Crop(right));m.SetVector("_Loops",new Vector4(leftMix,rightMix));m.SetFloat("_Strip",(float)(half/panel));
            }
            for(var i=used;i<edges.Length;i++)if(edges[i]!=null)edges[i].Plane.SetActive(false);
        }
        void ClearSeams()
        {hasView=false;ReleaseEdge();for(var i=0;i<edges.Length;i++){if(edges[i]==null)continue;Destroy(edges[i].Plane);Destroy(edges[i].Material);edges[i]=null;}}
        void EnsureQuad()
        {if(quad)return;quad=new Mesh{name="Adventure film geometry"};quad.vertices=new[]{new Vector3(-.5f,-.5f),new Vector3(.5f,-.5f),new Vector3(-.5f,.5f),new Vector3(.5f,.5f)};quad.uv=new[]{Vector2.zero,Vector2.right,Vector2.up,Vector2.one};quad.triangles=new[]{0,2,1,2,3,1};quad.RecalculateBounds();}
    }
}
