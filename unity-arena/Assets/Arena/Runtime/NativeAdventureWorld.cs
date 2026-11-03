using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Braxhorn.Arena
{
    // Two native video decoders cover the current section and its neighbour.
    // Corpses are snapshots of the actual Unity rig's final grounded pose.
    public sealed partial class NativeAdventureWorld : MonoBehaviour
    {
        sealed class Slot {public NativeArenaMedia Media;public Coroutine Loading;}
        sealed class Corpse {public GameObject Plane;public RenderTexture Image;public Material Material;public double Camera;}
        readonly Dictionary<int,Slot> slots=new Dictionary<int,Slot>();
        readonly List<Corpse> corpses=new List<Corpse>();
        JArray chapters;
        Camera view;
        Shader mediaShader,corpseShader;
        Mesh quad;
        public string Error {get;private set;}
        public int LoadedDecoders=>slots.Count;
        bool disposed;
        public void Initialize(JObject route,Camera camera,Shader backgroundShader,Shader bodyShader,Shader edgeShader)
        {chapters=(JArray)route["chapters"];view=camera;mediaShader=backgroundShader;corpseShader=bodyShader;seamShader=edgeShader;Ensure(0);}
        void Ensure(int i)
        {
            if(i<0||i>=chapters.Count||slots.ContainsKey(i))return;
            var obj=new GameObject("Adventure film "+i);obj.transform.SetParent(transform,false);
            var media=obj.AddComponent<NativeArenaMedia>();media.CropAspect=898f/512;
            var slot=new Slot{Media=media};slots.Add(i,slot);slot.Loading=StartCoroutine(Load(i,slot));
        }
        IEnumerator Load(int i,Slot slot)
        {
            var chapter=chapters[i];
            var entry=new ArenaMediaEntry{id="chapter-"+i,name=(string)chapter["name"],video=(string)chapter["video"],poster=(string)chapter["poster"],aspect=(float?)chapter["aspect"]??898f/512,ground=.84f,brightness=1,contrast=1,fit="cover"};
            yield return slot.Media.Load(entry,view,mediaShader);
            if(disposed||!slots.TryGetValue(i,out var active)||active!=slot)yield break;
            if(slot.Media.Error!=null)Error=slot.Media.Error;
            slot.Media.SetPaused(true);slot.Loading=null;
        }
        public IEnumerator PrepareFirst()
        {while(!disposed&&Error==null&&(!slots.TryGetValue(0,out var slot)||!slot.Media.Ready))yield return null;}
        public bool Ready(double camera,double span)
        {
            var first=Math.Max(0,Math.Min(chapters.Count-1,(int)Math.Floor(camera/100)));var last=Math.Min(chapters.Count-1,(int)Math.Floor((camera+span-.001)/100));
            for(var i=first;i<=last;i++)if(!slots.TryGetValue(i,out var slot)||!slot.Media.Ready)return false;return true;
        }
        public void Present(AdventureRun run,bool muted)
        {
            currentCamera=run.Camera;currentSpan=run.Span;hasView=true;
            var first=Math.Max(0,Math.Min(chapters.Count-1,(int)Math.Floor(run.Camera/100)));var last=Math.Min(chapters.Count-1,(int)Math.Floor((run.Camera+run.Span-.001)/100));
            foreach(var i in slots.Keys.Where(i=>i<first||i>first+1).ToArray())
            {var slot=slots[i];if(i==first-1)RememberEdge(i,slot.Media);if(slot.Loading!=null)StopCoroutine(slot.Loading);slot.Media.Clear();Destroy(slot.Media.gameObject);slots.Remove(i);}
            if(previousIndex!=first-1)ReleaseEdge();
            Ensure(first);Ensure(first+1);
            var buffering=!Ready(run.Camera,run.Span);
            var audible=Math.Min(last,(int)Math.Floor((run.Camera+run.Span*.5)/100));
            foreach(var pair in slots)
            {
                var media=pair.Value.Media;media.ScreenTile=new Rect((float)((pair.Key*100-run.Camera)/run.Span),0,(float)(100/run.Span),1);
                media.Sound(muted,false);media.SetAdventureSound((float?)chapters[pair.Key]["gain"]??1,pair.Key==audible);
                if(media.Error!=null)Error=media.Error;
                if(media.Ready)media.SetPaused(buffering||run.Match.Paused||pair.Key>last||run.Phase==AdventurePhase.Complete||run.Phase==AdventurePhase.Dead);
                var mask=run.Route["entry"]?["mask"] as JObject;
                media.DoorMask(pair.Key==0&&run.Masked&&mask!=null&&run.EntryGround<=(double)mask["y"]+(double)mask["h"]?new Rect((float)mask["x"],(float)mask["y"],(float)mask["w"],(float)mask["h"]):(Rect?)null);
            }
            var height=2*view.orthographicSize;var width=height*view.aspect;
            foreach(var corpse in corpses){corpse.Plane.transform.localPosition=new Vector3((float)((corpse.Camera-run.Camera)/run.Span)*width,0,10);corpse.Plane.transform.localScale=new Vector3(width,height,1);}
        }
        public void FreezeCorpse(GameObject actor,double camera,double logicalWidth,double logicalHeight)
        {
            if(!corpseShader)throw new InvalidOperationException("Missing native corpse shader");
            var image=new RenderTexture((int)Math.Ceiling(logicalWidth),(int)Math.Ceiling(logicalHeight),24,RenderTextureFormat.ARGB32){name="Actual grounded fighter snapshot"};image.Create();
            var obj=new GameObject("Corpse capture camera");var capture=obj.AddComponent<Camera>();capture.CopyFrom(view);capture.enabled=false;capture.targetTexture=image;capture.clearFlags=CameraClearFlags.SolidColor;capture.backgroundColor=Color.clear;capture.cullingMask=1<<31;
            obj.transform.SetPositionAndRotation(view.transform.position,view.transform.rotation);
            var transforms=actor.GetComponentsInChildren<Transform>(true);var layers=transforms.Select(t=>t.gameObject.layer).ToArray();var wasActive=actor.activeSelf;
            try{actor.SetActive(true);foreach(var t in transforms)t.gameObject.layer=31;capture.Render();}
            catch{image.Release();Destroy(image);throw;}
            finally{for(var i=0;i<transforms.Length;i++)transforms[i].gameObject.layer=layers[i];actor.SetActive(wasActive);capture.targetTexture=null;Destroy(obj);}
            EnsureQuad();
            var plane=new GameObject("Grounded opponent",typeof(MeshFilter),typeof(MeshRenderer));plane.transform.SetParent(view.transform,false);plane.GetComponent<MeshFilter>().sharedMesh=quad;
            var material=new Material(corpseShader){mainTexture=image};plane.GetComponent<MeshRenderer>().sharedMaterial=material;
            corpses.Add(new Corpse{Plane=plane,Material=material,Image=image,Camera=camera});
        }
        public void SetPaused(bool paused)
        {foreach(var slot in slots.Values)slot.Media.SetPaused(paused);}
        public void Clear()
        {
            disposed=true;ClearSeams();StopAllCoroutines();foreach(var slot in slots.Values){slot.Media.Clear();Destroy(slot.Media.gameObject);}slots.Clear();
            foreach(var corpse in corpses){Destroy(corpse.Plane);Destroy(corpse.Material);corpse.Image.Release();Destroy(corpse.Image);}corpses.Clear();if(quad)Destroy(quad);quad=null;
        }
        void OnDestroy()=>Clear();
    }
}
