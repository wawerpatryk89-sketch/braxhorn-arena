using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

namespace Braxhorn.Arena
{
    public sealed class NativeMenuAudio : MonoBehaviour
    {
        readonly Dictionary<string,AudioClip> clips=new Dictionary<string,AudioClip>();
        readonly Dictionary<string,AudioSource> loops=new Dictionary<string,AudioSource>();
        AudioSource cue;
        UnityWebRequest request;
        string wanted;
        bool blocked;
        AudioSource Source(string name)
        {
            var child=new GameObject(name);child.transform.SetParent(transform,false);
            var source=child.AddComponent<AudioSource>();source.playOnAwake=false;source.spatialBlend=0;return source;
        }
        public void Initialize(ArenaMediaCatalog catalog)
        {
            cue=Source("Menu confirmation");
            foreach(var key in new[]{"title","roster-premium"})
            {var source=Source(key);source.loop=true;source.volume=key=="title"?.72f:.68f;loops.Add(key,source);}
            StartCoroutine(Load(catalog));
        }
        IEnumerator Load(ArenaMediaCatalog catalog)
        {
            foreach(var key in new[]{"title","roster-premium","roster-select","roster-confirm","heavy"})
            {
                var file=catalog.Sounds[key];request=UnityWebRequestMultimedia.GetAudioClip(ArenaMediaCatalog.Url(file),file.EndsWith(".wav",StringComparison.OrdinalIgnoreCase)?AudioType.WAV:AudioType.MPEG);
                request.timeout=15;yield return request.SendWebRequest();
                if(request.result==UnityWebRequest.Result.Success)
                {
                    var clip=DownloadHandlerAudioClip.GetContent(request);clip.name=key;clips.Add(key,clip);
                    if(loops.TryGetValue(key,out var source))source.clip=clip;
                }
                else Debug.LogWarning("Original menu audio unavailable: "+key);
                request.Dispose();request=null;Refresh();
            }
        }
        public void Context(string music,bool silent)
        {if(wanted==music&&blocked==silent)return;wanted=music;blocked=silent;Refresh();}
        void Refresh()
        {
            foreach(var item in loops)
            {
                var source=item.Value;
                if(blocked||wanted!=item.Key){if(source.isPlaying)source.Pause();}
                else if(source.clip&&!source.isPlaying){source.UnPause();if(!source.isPlaying)source.Play();}
            }
            if(blocked||wanted==null)cue?.Stop();
        }
        public void Cue(bool confirm=false)
        {
            if(blocked||wanted==null||!cue||!clips.TryGetValue(confirm?"roster-confirm":"roster-select",out var clip))return;
            cue.Stop();cue.clip=clip;cue.volume=confirm?.45f:.28f;cue.Play();
        }
        void OnDisable(){Context(null,true);}
        void OnDestroy()
        {
            StopAllCoroutines();if(request!=null){request.Abort();request.Dispose();request=null;}
            foreach(var source in loops.Values)if(source)source.Stop();if(cue)cue.Stop();
            foreach(var clip in clips.Values)Destroy(clip);clips.Clear();
        }
    }
}
