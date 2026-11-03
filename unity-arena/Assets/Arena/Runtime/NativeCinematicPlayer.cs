using System;
using Braxhorn.Arena.Domain;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Video;

namespace Braxhorn.Arena
{
    // One decoder at a time. Local StreamingAssets URLs also work inside an APK;
    // no embedded browser, network movie fetch, or copied temporary video file.
    public sealed class NativeCinematicPlayer : MonoBehaviour
    {
        readonly CinematicSequence sequence=new CinematicSequence();
        GameObject overlay,noticeHost;
        RawImage frame;
        NativeMenuImage notice;
        Text message;
        Button retry,skip;
        VideoPlayer video;
        AudioSource audioChannel;
        Action completed;
        string movie,noticeFile;
        bool suspended,muted,discardDelta;
        CinematicPhase shown;
        public bool Active => sequence.Active;

        public void Initialize(GameObject layer,RawImage image,GameObject card,NativeMenuImage artwork,Text status,Button again,Button next)
        {
            overlay=layer;frame=image;noticeHost=card;notice=artwork;message=status;retry=again;skip=next;
            retry.onClick.AddListener(Retry);skip.onClick.AddListener(Skip);overlay.SetActive(false);
        }
        public void Play(string file,string copyright,Action done)
        {
            Stop();movie=file;noticeFile=copyright;completed=done;sequence.Begin(!string.IsNullOrEmpty(copyright));shown=CinematicPhase.Idle;discardDelta=true;
            overlay.SetActive(true);overlay.transform.SetAsLastSibling();noticeHost.SetActive(false);
            Prepare();Refresh();
        }
        void Prepare()
        {
            ReleaseVideo();
            var child=new GameObject("Original cinematic decoder");child.transform.SetParent(transform,false);
            audioChannel=child.AddComponent<AudioSource>();audioChannel.playOnAwake=false;audioChannel.spatialBlend=0;audioChannel.mute=muted;
            video=child.AddComponent<VideoPlayer>();video.playOnAwake=false;video.isLooping=false;video.waitForFirstFrame=true;
            video.renderMode=VideoRenderMode.APIOnly;video.source=VideoSource.Url;video.url=ArenaMediaCatalog.Url(movie);
            video.audioOutputMode=VideoAudioOutputMode.AudioSource;video.controlledAudioTrackCount=1;video.SetTargetAudioSource(0,audioChannel);
            video.prepareCompleted+=Prepared;video.errorReceived+=Failed;video.loopPointReached+=Ended;
            try{video.Prepare();}catch(Exception e){Debug.LogWarning("Cinematic preparation failed: "+e.GetType().Name);sequence.Error();}
        }
        void Prepared(VideoPlayer source)
        {
            if(source!=video||sequence.Phase!=CinematicPhase.Preparing)return;
            sequence.Prepared();if(!suspended)source.Play();Refresh();
        }
        void Failed(VideoPlayer source,string reason)
        {
            if(source!=video)return;
            sequence.Error();Debug.LogWarning("Original cinematic decoder: "+reason);Refresh();
        }
        void Ended(VideoPlayer source){if(source==video&&sequence.Phase==CinematicPhase.Playing)Skip();}
        void Retry(){if(sequence.Phase!=CinematicPhase.Failed)return;sequence.Retry();Prepare();Refresh();}
        public void Skip(){if(!Active)return;sequence.EndFilm();Refresh();}
        public void Suspend(bool value)
        {
            if(suspended==value)return;suspended=value;if(!value)discardDelta=true;
            if(video&&sequence.Phase==CinematicPhase.Playing){if(value)video.Pause();else video.Play();}
        }
        public void Mute(bool value){muted=value;if(audioChannel)audioChannel.mute=value;}
        void Update()
        {
            if(!Active)return;
            sequence.Advance(discardDelta?0:Time.unscaledDeltaTime*1000,suspended,notice.Ready||notice.Failed);discardDelta=false;
            Refresh();
            if(video&&sequence.Phase==CinematicPhase.Playing&&video.texture)
            {
                frame.texture=video.texture;frame.enabled=true;
                var box=((RectTransform)frame.transform.parent).rect.size;var texture=video.texture;
                var scale=Mathf.Min(box.x/texture.width,box.y/texture.height);frame.rectTransform.sizeDelta=new Vector2(texture.width,texture.height)*scale;
            }
        }
        void Refresh()
        {
            var phase=sequence.Phase;
            if(phase==shown)return;shown=phase;
            retry.gameObject.SetActive(phase==CinematicPhase.Failed);skip.gameObject.SetActive(phase!=CinematicPhase.Notice);
            message.text=phase==CinematicPhase.Preparing?"WCZYTYWANIE FILMU…":phase==CinematicPhase.Failed?"Nie udało się odtworzyć filmu. Spróbuj ponownie lub pomiń.":"";
            if(phase==CinematicPhase.Failed)ReleaseVideo();
            if(phase==CinematicPhase.Notice)
            {
                ReleaseVideo();noticeHost.SetActive(true);notice.Show(noticeFile);
            }
            if(phase==CinematicPhase.Idle)
            {
                var next=completed;Stop();next?.Invoke();
            }
        }
        void ReleaseVideo()
        {
            if(frame){frame.texture=null;frame.enabled=false;}
            if(video)
            {
                var old=video;video=null;old.prepareCompleted-=Prepared;old.errorReceived-=Failed;old.loopPointReached-=Ended;
                old.Stop();old.targetTexture=null;Destroy(old.gameObject);
            }
            audioChannel=null;
        }
        public void Stop()
        {
            completed=null;sequence.Stop();shown=CinematicPhase.Idle;ReleaseVideo();
            if(noticeHost)noticeHost.SetActive(false);if(overlay)overlay.SetActive(false);
        }
        void OnDisable(){Stop();}
        void OnDestroy(){Stop();}
    }
}
