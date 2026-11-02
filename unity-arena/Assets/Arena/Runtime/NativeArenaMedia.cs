using System;
using System.Collections;
using Braxhorn.Arena.Domain;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.Video;

namespace Braxhorn.Arena
{
    // Native offline video plane, behind the actual 3D fighters. Keep decoded
    // pixels during stalls/seeks; cross-fade the final .45 s into the first frame.
    // Poster artwork is only used until a real video frame has arrived.
    public sealed class NativeArenaMedia : MonoBehaviour
    {
        public bool Ready { get; private set; }
        public string Error { get; private set; }
        public ArenaMediaEntry Entry { get; private set; }
        public bool Paused { get; private set; }
        public Rect? ScreenTile { get; set; }
        public float CropAspect { get; set; }
        public Texture CurrentFrame=>firstFrame?decoded:poster;
        public Texture LoopFrame=>first;
        public float LoopAmount=>firstFrame?(looping?1:(float)MediaGeometry.LoopBlend(video.time,video.length)):0;
        Camera view;
        GameObject plane;
        Mesh mesh;
        Material material;
        Material foregroundMaterial;
        GameObject foreground;
        NativeAudioGain gainFilter;
        float? adventureVolume;
        VideoPlayer video;
        AudioSource ambient;
        AudioClip ambientClip;
        Texture2D poster;
        RenderTexture decoded,first;
        Coroutine capture;
        long lastFrame=-1;
        bool firstFrame,looping,muted,ducked;
        int generation;
        UnityWebRequest pendingRequest;

        public IEnumerator Load(ArenaMediaEntry entry,Camera camera,Shader shader)
        {
            Clear();Entry=entry;view=camera;var token=++generation;
            if(!shader){Error="Brak shadera oryginalnych aren";yield break;}
            material=new Material(shader){name="Original arena "+entry.id};
            material.SetFloat("_Brightness",entry.brightness);material.SetFloat("_Contrast",entry.contrast);
            plane=new GameObject("Arena movie plane",typeof(MeshFilter),typeof(MeshRenderer));plane.transform.SetParent(view.transform,false);
            mesh=new Mesh{name="Arena movie rectangle"};mesh.vertices=new[]{new Vector3(-.5f,-.5f),new Vector3(.5f,-.5f),new Vector3(-.5f,.5f),new Vector3(.5f,.5f)};
            mesh.uv=new[]{Vector2.zero,Vector2.right,Vector2.up,Vector2.one};mesh.triangles=new[]{0,2,1,2,3,1};mesh.RecalculateBounds();
            plane.GetComponent<MeshFilter>().sharedMesh=mesh;plane.GetComponent<MeshRenderer>().sharedMaterial=material;
            ambient=gameObject.AddComponent<AudioSource>();ambient.playOnAwake=false;ambient.loop=true;ambient.spatialBlend=0;
            if(!string.IsNullOrEmpty(entry.poster))
            {
                using(var request=UnityWebRequestTexture.GetTexture(ArenaMediaCatalog.Url(entry.poster),true))
                {
                    pendingRequest=request;yield return request.SendWebRequest();pendingRequest=null;
                    if(token!=generation)yield break;
                    if(request.result!=UnityWebRequest.Result.Success){Error="Nie można odczytać tła: "+entry.id;yield break;}
                    poster=DownloadHandlerTexture.GetContent(request);material.SetTexture("_MainTex",poster);
                }
            }
            if(!string.IsNullOrEmpty(entry.audio))
            {
                using(var request=UnityWebRequestMultimedia.GetAudioClip(ArenaMediaCatalog.Url(entry.audio),AudioType.MPEG))
                {
                    pendingRequest=request;yield return request.SendWebRequest();pendingRequest=null;
                    if(token!=generation)yield break;
                    if(request.result!=UnityWebRequest.Result.Success){Error="Nie można odczytać dźwięku areny: "+entry.id;yield break;}
                    ambientClip=DownloadHandlerAudioClip.GetContent(request);ambient.clip=ambientClip;
                }
            }
            if(string.IsNullOrEmpty(entry.video)){Ready=poster;UpdateAudio();if(!Paused&&!muted&&ambient.clip)ambient.Play();yield break;}
            video=gameObject.AddComponent<VideoPlayer>();video.playOnAwake=false;video.isLooping=true;video.waitForFirstFrame=true;video.skipOnDrop=true;
            video.source=VideoSource.Url;video.url=ArenaMediaCatalog.Url(entry.video);video.renderMode=VideoRenderMode.RenderTexture;
            video.audioOutputMode=string.IsNullOrEmpty(entry.audio)?VideoAudioOutputMode.AudioSource:VideoAudioOutputMode.None;
            if(video.audioOutputMode==VideoAudioOutputMode.AudioSource){video.controlledAudioTrackCount=1;video.SetTargetAudioSource(0,ambient);}
            video.errorReceived+=OnVideoError;video.frameReady+=OnFrame;video.sendFrameReadyEvents=true;video.loopPointReached+=OnLoop;
            video.Prepare();var deadline=Time.realtimeSinceStartup+30;
            while(!video.isPrepared&&Error==null&&token==generation&&Time.realtimeSinceStartup<deadline)yield return null;
            if(token!=generation||Error!=null)yield break;
            if(!video.isPrepared){Error="Upłynął czas przygotowania filmu: "+entry.id;yield break;}
            decoded=new RenderTexture((int)video.width,(int)video.height,0,RenderTextureFormat.ARGB32,RenderTextureReadWrite.sRGB){name="Arena decoded frames"};decoded.Create();
            first=new RenderTexture(decoded.descriptor){name="Arena first decoded frame"};first.Create();video.targetTexture=decoded;
            UpdateAudio();video.Play();if(ambient.clip&&!muted)ambient.Play();deadline=Time.realtimeSinceStartup+15;
            while(!Ready&&Error==null&&token==generation&&Time.realtimeSinceStartup<deadline)yield return null;
            if(token!=generation)yield break;
            if(!Ready&&Error==null)Error="Film nie dostarczył pierwszej klatki: "+entry.id;
            if(Paused){video.Pause();ambient.Pause();}
        }
        void OnFrame(VideoPlayer source,long frame)
        {
            if(source!=video||!decoded||!material)return;
            // frameReady can precede the texture's render-thread update. Capture
            // only after rendering has completed, rather than copying a black RT.
            if(!firstFrame&&capture==null)capture=StartCoroutine(CaptureFirst(generation));
            if(looping&&(frame<lastFrame||source.time<source.length-.45)){looping=false;material.SetFloat("_LoopBlend",0);}
            lastFrame=frame;
        }
        IEnumerator CaptureFirst(int token)
        {
            yield return new WaitForEndOfFrame();
            if(token!=generation||!decoded||!first||!material)yield break;
            Graphics.Blit(decoded,first);firstFrame=true;material.SetTexture("_MainTex",decoded);material.SetTexture("_LoopTex",first);Ready=true;capture=null;
        }
        void OnLoop(VideoPlayer source){looping=true;if(material)material.SetFloat("_LoopBlend",1);}
        void OnVideoError(VideoPlayer source,string message){Error="Film "+Entry?.id+": "+message;Debug.LogError(Error);}
        void LateUpdate()
        {
            if(!plane||!view||Entry==null)return;
            var h=2*view.orthographicSize;var w=h*view.aspect;var tile=ScreenTile??new Rect(0,0,1,1);
            plane.transform.localPosition=new Vector3((tile.center.x-.5f)*w,(.5f-tile.center.y)*h,Mathf.Min(20,view.farClipPlane-1));plane.transform.localScale=new Vector3(w*tile.width,h*tile.height,1);
            var cropWidth=CropAspect>0?CropAspect:tile.width*view.pixelWidth;var cropHeight=CropAspect>0?1:tile.height*view.pixelHeight;
            var layout=new MediaGeometry(cropWidth,cropHeight,Entry.aspect,Entry.ground,Entry.fit=="contain");
            material.SetVector("_UvRect",new Vector4((float)(-layout.Left/layout.Width),(float)(-layout.Top/layout.Height),(float)(cropWidth/layout.Width),(float)(cropHeight/layout.Height)));
            if(firstFrame&&video&&!looping)material.SetFloat("_LoopBlend",(float)MediaGeometry.LoopBlend(video.time,video.length));
            if(foreground&&foreground.activeSelf){var mask=foregroundMaterial.GetVector("_DoorMask");foregroundMaterial.CopyPropertiesFromMaterial(material);foregroundMaterial.SetVector("_DoorMask",mask);foregroundMaterial.SetFloat("_MaskEnabled",1);foreground.transform.localPosition=new Vector3(plane.transform.localPosition.x,plane.transform.localPosition.y,2);foreground.transform.localScale=plane.transform.localScale;}
            UpdateAudio();
        }
        public void SetPaused(bool paused)
        {
            if(Paused==paused)return;
            Paused=paused;
            if(video&&video.isPrepared){if(paused)video.Pause();else if(Ready)video.Play();}
            if(ambient&&ambient.clip){if(paused)ambient.Pause();else if(!muted)ambient.UnPause();}
        }
        public void Sound(bool mute,bool duck){muted=mute;ducked=duck;UpdateAudio();}
        public void SetAdventureSound(float gain,bool audible)
        {adventureVolume=audible?1:0;if(!gainFilter)gainFilter=gameObject.AddComponent<NativeAudioGain>();gainFilter.Gain=gain;UpdateAudio();}
        public void DoorMask(Rect? mask)
        {
            if(!mask.HasValue){if(foreground)foreground.SetActive(false);return;}
            if(!material||!plane)return;
            if(!foreground){foreground=new GameObject("Original doorway foreground",typeof(MeshFilter),typeof(MeshRenderer));foreground.transform.SetParent(view.transform,false);foreground.GetComponent<MeshFilter>().sharedMesh=mesh;foregroundMaterial=new Material(material){renderQueue=3100};foreground.GetComponent<MeshRenderer>().sharedMaterial=foregroundMaterial;}
            foreground.SetActive(true);var m=mask.Value;foregroundMaterial.SetVector("_DoorMask",new Vector4(m.x,m.y,m.width,m.height));
        }
        void UpdateAudio(){if(ambient){ambient.mute=muted;ambient.volume=adventureVolume??(Entry!=null&&!string.IsNullOrEmpty(Entry.audio)?(ducked?.045f:.13f):(ducked?.05f:.16f));}}
        public void Clear()
        {
            generation++;try{pendingRequest?.Abort();}catch(ObjectDisposedException){}pendingRequest=null;
            if(capture!=null){StopCoroutine(capture);capture=null;}lastFrame=-1;
            if(video){video.errorReceived-=OnVideoError;video.frameReady-=OnFrame;video.loopPointReached-=OnLoop;video.Stop();Destroy(video);video=null;}
            if(ambient){ambient.Stop();Destroy(ambient);ambient=null;}if(ambientClip)Destroy(ambientClip);ambientClip=null;
            if(gainFilter)Destroy(gainFilter);gainFilter=null;adventureVolume=null;
            if(foreground)Destroy(foreground);if(foregroundMaterial)Destroy(foregroundMaterial);foreground=null;foregroundMaterial=null;
            if(plane)Destroy(plane);if(mesh)Destroy(mesh);if(material)Destroy(material);if(poster)Destroy(poster);
            if(decoded){decoded.Release();Destroy(decoded);}if(first){first.Release();Destroy(first);}
            plane=null;mesh=null;material=null;poster=null;decoded=first=null;Ready=firstFrame=looping=Paused=false;Error=null;Entry=null;
        }
        void OnDestroy(){Clear();}
    }
}
