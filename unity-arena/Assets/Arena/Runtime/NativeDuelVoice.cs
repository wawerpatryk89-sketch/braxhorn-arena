using System;
using System.Collections;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.UI;
using Unity.WebRTC;

namespace Braxhorn.Arena
{
    public sealed class NativeDuelVoice:MonoBehaviour
    {
        VoiceConsent consent;
        ArenaIceServer[] ice;
        NativeDuelPeer peer;
        AudioStreamTrack outgoing,incoming;
        AudioSource capture,playback;
        AudioClip microphoneClip;
        string device;
        bool host,stopped,capturing,starting;
        int generation;
        double connectDeadline,disconnectedAt=-1;
        JObject remoteDescription;
        Action signalChanged;
        GameObject prompt,bar;
        Text note,status,micLabel,soundLabel;
        Button allow,micButton,soundButton;
        string message="CZEKAM NA ZGODĘ RYWALA";
        public bool Decided=>consent?.Decided==true;
        public bool Active=>!stopped&&consent?.Both==true&&consent.Foreground&&peer&&peer.Connected&&!consent.SoundMuted;
        public JObject Signal=>new JObject{["consent"]=consent?.Choice??"no",["description"]=peer?peer.Signal:null};
        static double Now=>Time.realtimeSinceStartupAsDouble*1000;
        public void Begin(bool isHost,GameObject question,GameObject controls,Text explanation,Text state,Button yes,Button no,Button microphone,Button sound,Button end,Action changed)
        {
            host=isHost;consent=new VoiceConsent();prompt=question;bar=controls;note=explanation;status=state;allow=yes;signalChanged=changed;generation++;
            micButton=microphone;soundButton=sound;micLabel=microphone.GetComponentInChildren<Text>();soundLabel=sound.GetComponentInChildren<Text>();
            yes.onClick.RemoveAllListeners();yes.onClick.AddListener(Allow);no.onClick.RemoveAllListeners();no.onClick.AddListener(()=>End("ROZMOWA WYŁĄCZONA"));
            microphone.onClick.RemoveAllListeners();microphone.onClick.AddListener(()=>{consent.ToggleMic();ApplyMute();});sound.onClick.RemoveAllListeners();sound.onClick.AddListener(()=>{consent.ToggleSound();ApplyMute();});end.onClick.RemoveAllListeners();end.onClick.AddListener(()=>End("ROZMOWA ZAKOŃCZONA"));
            prompt.SetActive(true);prompt.transform.SetAsLastSibling();bar.SetActive(false);note.text="Rozmowa po zgodzie obu graczy. Mikrofon możesz wyciszyć w każdej chwili.";yes.interactable=true;
        }
        public void SetIce(ArenaIceServer[] servers){ice=servers;}
        public void Accept(JObject envelope)
        {
            if(stopped||consent==null||consent.Choice=="no"||envelope==null)return;
            var choice=envelope["consent"]?.Type==JTokenType.String?(string)envelope["consent"]:null;
            consent.Peer(choice);if(choice=="no"&&consent.Choice=="no"){End("RYWAL GRA BEZ ROZMOWY");return;}
            if(choice=="yes"&&envelope["description"] is JObject description&&DuelWire.Signal(description)){remoteDescription=(JObject)description.DeepClone();}
        }
        void Allow()
        {
            if(stopped||!consent.Request(Now))return;allow.interactable=false;note.text="Zezwól na mikrofon w komunikacie telefonu. Możesz nadal wybrać „NIE ZEZWALAM”.";var token=generation;
            try
            {
#if UNITY_ANDROID && !UNITY_EDITOR
                if(UnityEngine.Android.Permission.HasUserAuthorizedPermission(UnityEngine.Android.Permission.Microphone)){PermissionResult(token,true);return;}
                var callbacks=new UnityEngine.Android.PermissionCallbacks();
                callbacks.PermissionGranted+=_=>PermissionResult(token,true);callbacks.PermissionDenied+=_=>PermissionResult(token,false);
                UnityEngine.Android.Permission.RequestUserPermission(UnityEngine.Android.Permission.Microphone,callbacks);
#else
                StartCoroutine(AskPermission(token));
#endif
            }
            catch(Exception){PermissionResult(token,false);}
        }
        IEnumerator AskPermission(int token)
        {
            var operation=Application.RequestUserAuthorization(UserAuthorization.Microphone);yield return operation;
            PermissionResult(token,Application.HasUserAuthorization(UserAuthorization.Microphone));
        }
        void PermissionResult(int token,bool allowed)
        {
            if(stopped||token!=generation||!consent.Permission(allowed))return;
            if(consent.Choice=="no"){End("BEZ ROZMOWY · MIKROFON NIEDOSTĘPNY");return;}
            prompt.SetActive(false);bar.SetActive(true);signalChanged?.Invoke();ApplyMute();
        }
        public void Suspend(bool suspended)
        {if(consent==null)return;consent.Suspend(suspended);if(suspended)StopMicrophone();ApplyMute();}
        void Update()
        {
            if(stopped||consent==null)return;
            if(consent.Tick(Now)){End("BEZ ROZMOWY · BRAK ZGODY NA MIKROFON");return;}
            if(!consent.Decided&&Input.GetKeyDown(KeyCode.Escape)){End("ROZMOWA WYŁĄCZONA");return;}
            if(consent.Choice=="no")return;
            if(consent.CanCapture&&ice!=null&&!capturing&&!starting)StartCoroutine(StartMicrophone(generation));
            if(!consent.CanCapture&&capturing)StopMicrophone();
            if(capturing&&consent.Foreground){try{if(!Microphone.IsRecording(device)){End("MIKROFON ODŁĄCZONY");return;}}catch(Exception){End("MIKROFON NIEDOSTĘPNY");return;}}
            if(peer)
            {
                if(remoteDescription!=null){peer.Accept(remoteDescription);remoteDescription=null;}
                if(peer.Failed||!peer.Connected&&Now>=connectDeadline){End("NIE UDAŁO SIĘ POŁĄCZYĆ ROZMOWY");return;}
                if(peer.Connected){connectDeadline=double.PositiveInfinity;disconnectedAt=-1;}
                else if(double.IsPositiveInfinity(connectDeadline)){if(disconnectedAt<0)disconnectedAt=Now;if(Now-disconnectedAt>8000){End("ROZMOWA PRZERWANA");return;}}
            }
            ApplyMute();
        }
        AudioSource Source(string name)
        {var obj=new GameObject(name);obj.transform.SetParent(transform,false);var source=obj.AddComponent<AudioSource>();source.playOnAwake=false;source.loop=true;source.spatialBlend=0;return source;}
        IEnumerator StartMicrophone(int token)
        {
            starting=true;
            try
            {
                if(Microphone.devices.Length==0)throw new InvalidOperationException();device=Microphone.devices[0];
                Microphone.GetDeviceCaps(device,out var min,out var max);var rate=max>0?Mathf.Clamp(AudioSettings.outputSampleRate,Math.Max(8000,min),max):AudioSettings.outputSampleRate;
                microphoneClip=Microphone.Start(device,true,1,rate);if(!microphoneClip)throw new InvalidOperationException();
            }
            catch(Exception){starting=false;End("MIKROFON NIEDOSTĘPNY");yield break;}
            var deadline=Now+5000;
            while(!stopped&&generation==token&&consent.CanCapture&&Now<deadline&&MicrophonePosition()<=0)yield return null;
            starting=false;
            if(stopped||generation!=token||!consent.CanCapture){StopMicrophone();yield break;}
            if(MicrophonePosition()<=0){End("MIKROFON NIE ODPOWIADA");yield break;}
            try
            {
                if(!capture)capture=Source("Voice capture (no loopback)");capture.clip=microphoneClip;
                if(outgoing==null)outgoing=new AudioStreamTrack(capture){Loopback=false,Enabled=false};
                // The package filter clears local output after feeding the RTC
                // track. Never play the microphone through the phone speaker.
                capture.Play();capturing=true;
                if(!peer)
                {
                    peer=gameObject.AddComponent<NativeDuelPeer>();connectDeadline=Now+20000;
                    if(!peer.Initialize(host,ice,null,signalChanged,outgoing,ReceiveAudio)){End("ROZMOWA NIEDOSTĘPNA");yield break;}
                }
                ApplyMute();
            }
            catch(Exception){End("ROZMOWA NIEDOSTĘPNA");}
        }
        void ReceiveAudio(AudioStreamTrack track)
        {
            if(stopped||!consent.Both){track.Dispose();return;}
            try
            {
                if(playback)playback.Stop();if(incoming!=null)incoming.Dispose();incoming=track;if(!playback)playback=Source("Opponent voice");
                playback.mute=!consent.Foreground||consent.SoundMuted;playback.SetTrack(track);playback.Play();ApplyMute();
            }
            catch(Exception){End("DŹWIĘK ROZMOWY NIEDOSTĘPNY");}
        }
        void ApplyMute()
        {
            if(consent==null)return;
            if(outgoing!=null)outgoing.Enabled=!stopped&&capturing&&consent.CanCapture;
            if(playback)playback.mute=stopped||!consent.Both||!consent.Foreground||consent.SoundMuted;
            if(micButton)micButton.interactable=consent.Choice=="yes";if(soundButton)soundButton.interactable=consent.Choice=="yes";
            if(micLabel)micLabel.text=consent.MicMuted?"WŁĄCZ MIKROFON":"WYCISZ MIKROFON";
            if(soundLabel)soundLabel.text=consent.SoundMuted?"WŁĄCZ RYWALA":"WYCISZ RYWALA";
            if(status)status.text=consent.Choice=="no"?message:!consent.Both?"CZEKAM NA ZGODĘ RYWALA":consent.MicMuted?"MIKROFON WYCISZONY":peer&&peer.Connected?"ROZMOWA AKTYWNA":"ŁĄCZENIE ROZMOWY";
        }
        void StopMicrophone()
        {
            if(outgoing!=null)outgoing.Enabled=false;if(capture){capture.Stop();capture.clip=null;}
            if(device!=null){try{Microphone.End(device);}catch(Exception){}}
            if(microphoneClip)Destroy(microphoneClip);microphoneClip=null;device=null;capturing=false;
        }
        int MicrophonePosition(){try{return device==null?0:Microphone.GetPosition(device);}catch(Exception){return 0;}}
        public void End(string reason)
        {
            if(consent==null)return;generation++;consent.Stop();message=reason;StopAllCoroutines();starting=false;StopMicrophone();
            if(peer){peer.Close();Destroy(peer);peer=null;}if(playback)playback.Stop();incoming?.Dispose();incoming=null;outgoing?.Dispose();outgoing=null;
            if(prompt)prompt.SetActive(false);if(bar)bar.SetActive(true);ApplyMute();signalChanged?.Invoke();
        }
        public void Stop()
        {if(stopped)return;End("ROZMOWA WYŁĄCZONA");stopped=true;signalChanged=null;if(prompt)prompt.SetActive(false);if(bar)bar.SetActive(false);if(capture)Destroy(capture.gameObject);if(playback)Destroy(playback.gameObject);}
        void OnDestroy()=>Stop();
    }
}
