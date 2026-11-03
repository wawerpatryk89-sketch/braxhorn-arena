using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Braxhorn.Arena.Domain;
using UnityEngine;
using UnityEngine.Networking;

namespace Braxhorn.Arena
{
    // Only original recorded audio. The v271 source deliberately removes ready,
    // taunt, effort and heavy voices; never restore those obsolete voice cues.
    public sealed class NativeFightAudio : MonoBehaviour
    {
        readonly Dictionary<string,AudioClip> clips=new Dictionary<string,AudioClip>();
        readonly List<AudioSource> pool=new List<AudioSource>();
        readonly AudioSource[] fighterVoices=new AudioSource[2];
        readonly int[,] hurtCount=new int[2,2];
        readonly double[] hurtTime={double.NegativeInfinity,double.NegativeInfinity};
        AudioSource announcer;
        bool paused,muted,disposed;
        public bool Ready { get; private set; }
        public string Error { get; private set; }
        public bool Duck => !muted&&announcer&&announcer.isPlaying;
        public bool Muted => muted;
        public Action<string,float,float,string> NetworkSound;

        AudioSource Source(string label)
        {var obj=new GameObject(label);obj.transform.SetParent(transform,false);var s=obj.AddComponent<AudioSource>();s.playOnAwake=false;s.spatialBlend=0;return s;}
        public IEnumerator Load(ArenaMediaCatalog catalog)
        {
            if(Ready)yield break;
            if(!announcer){announcer=Source("Announcer");for(var i=0;i<2;i++)fighterVoices[i]=Source("Fighter voice "+i);for(var i=0;i<12;i++)pool.Add(Source("Combat sound "+i));}
            foreach(var entry in catalog.Sounds)
            {
                if(clips.ContainsKey(entry.Key))continue;
                using(var request=UnityWebRequestMultimedia.GetAudioClip(ArenaMediaCatalog.Url(entry.Value),entry.Value.EndsWith(".wav",StringComparison.OrdinalIgnoreCase)?AudioType.WAV:AudioType.MPEG))
                {
                    request.timeout=15;yield return request.SendWebRequest();if(disposed)yield break;
                    if(request.result!=UnityWebRequest.Result.Success){Error="Nie można odczytać nagrania: "+entry.Key;yield break;}
                    var clip=DownloadHandlerAudioClip.GetContent(request);clip.name=entry.Key;clips.Add(entry.Key,clip);
                }
            }
            Ready=true;Error=null;
        }
        public void Consume(MatchEvent e,ArenaMatch match,ArenaMediaEntry arena)
        {
            if(paused||!Ready)return;
            if(e.Kind=="three"||e.Kind=="two"||e.Kind=="one"||e.Kind=="fight")
            {Play(e.Kind,.94f,1,announcer);if(e.Kind=="fight")Play("gong",.5f);return;}
            if(e.Kind=="step"){Play("step",.17f,UnityEngine.Random.Range(.98f,1.02f));return;}
            if(e.Kind=="land"){Play("land",.48f);return;}
            var config=match.Fighter(e.Actor).Configuration;
            if(!config.Has(e.Action))return;
            var action=config[e.Action];var hit=action.Hits.Values.FirstOrDefault(x=>x.Group==e.Group);
            if(e.Kind=="swing")
            {
                var kick=Regex.IsMatch(hit?.Bone??"","Foot|Leg|Toe|Knee",RegexOptions.IgnoreCase)||string.IsNullOrEmpty(hit?.Bone)&&Regex.IsMatch(e.Action,"KICK|KNEE|STOMP|ROUNDHOUSE");
                Play(kick?"kick":"punch",kick?.66f:.54f,UnityEngine.Random.Range(.96f,1.04f));return;
            }
            if(e.Kind=="block"){Play("heavy",.25f);return;}
            if(e.Kind!="hit"&&e.Kind!="slam")return;
            Play(e.Kind=="slam"?"land":"impact",e.Kind=="slam"?.85f:.6f);
            var sound=hit?.Source["hitSFX"];
            if(sound?["clip"]!=null)Play((string)sound["clip"],(float?)sound["volume"]??.7f,(float?)sound["pitch"]??1);
            if(e.Kind=="slam"&&arena?.surface?["hitSFX"] is Newtonsoft.Json.Linq.JObject surface)
                Play((string)surface["clip"],(float?)surface["volume"]??.85f,(float?)surface["pitch"]??.88f);
            if(e.Target>=0)Hurt(e.Target,match.Fighter(e.Target).Configuration.Character,Time.realtimeSinceStartupAsDouble*1000,e.Kind=="slam");
        }
        void Hurt(int side,string character,double time,bool fall)
        {
            if(time-hurtTime[side]<(fall?240:180))return;
            var female=character=="NYXA"||character=="VEXA"||character=="NINA";
            var pitch=character switch {"BRAX"=>.97f,"NYXA"=>.92f,"VEXA"=>1.02f,"KROV"=>.86f,"NINA"=>1.06f,"DANNY"=>1.08f,"BEAR"=>.82f,"DEMON"=>.89f,_=>.97f};
            var kind=fall?1:0;var n=hurtCount[side,kind];if(Play("vocal-"+(female?"female":"male")+"-hurt-"+(n%3+1),fall?.8f:.76f,pitch+(n%3-1)*.015f,fighterVoices[side])){hurtCount[side,kind]++;hurtTime[side]=time;}
        }
        bool Play(string key,float volume,float pitch=1,AudioSource channel=null,bool remote=false)
        {
            if(paused||key==null||!clips.TryGetValue(key,out var clip))return false;
            if(!remote&&key!="three"&&key!="two"&&key!="one"&&key!="fight"&&key!="gong")NetworkSound?.Invoke(key,Mathf.Clamp01(volume),Mathf.Clamp(pitch,.75f,1.25f),channel&&channel==fighterVoices[0]?"fighter-0":channel&&channel==fighterVoices[1]?"fighter-1":null);
            if(muted)return NetworkSound!=null&&!remote;
            var source=channel?channel:pool.FirstOrDefault(s=>!s.isPlaying);
            // Limit simultaneous effects instead of allocating AudioSources per hit.
            if(!source)return false;source.Stop();source.clip=clip;source.volume=Mathf.Clamp01(volume)*.8f;source.pitch=Mathf.Clamp(pitch,.75f,1.25f);source.Play();return true;
        }
        public void RemoteSound(string key,float volume,float pitch,string channel=null)
        {
            if(key=="title"||key=="roster-premium"||key=="roster-select"||key=="roster-confirm")return;
            var source=channel=="fighter-0"?fighterVoices[0]:channel=="fighter-1"?fighterVoices[1]:key=="three"||key=="two"||key=="one"||key=="fight"?announcer:null;
            Play(key,volume,pitch,source,true);
        }
        public void Stop()
        {if(announcer)announcer.Stop();foreach(var s in fighterVoices)if(s)s.Stop();foreach(var s in pool)if(s)s.Stop();}
        public void ResetMatch(){Stop();for(var i=0;i<2;i++){hurtCount[i,0]=hurtCount[i,1]=0;hurtTime[i]=double.NegativeInfinity;}paused=false;}
        public void SetPaused(bool value){paused=value;if(value)Stop();}
        public void Mute(bool value){muted=value;if(value)Stop();}
        void OnDestroy(){disposed=true;Stop();foreach(var clip in clips.Values)Destroy(clip);clips.Clear();}
    }
}
