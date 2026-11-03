using Braxhorn.Arena.Domain;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        NativeCinematicPlayer cinema;
        NativeMenuAudio menuAudio;
        CampaignRun celebrated;
        bool applicationPaused,applicationFocused=true;
        void BuildCinematics()
        {
            var layer=Panel("Original cinematics",new Rect(0,0,1024,576),Color.black);
            var picture=new GameObject("Video frame",typeof(RectTransform),typeof(RawImage));Place(picture,layer.transform,new Rect(0,0,1024,576));
            var frame=picture.GetComponent<RawImage>();frame.raycastTarget=false;frame.rectTransform.anchorMin=frame.rectTransform.anchorMax=frame.rectTransform.pivot=new Vector2(.5f,.5f);frame.rectTransform.anchoredPosition=Vector2.zero;
            var card=Picture(layer.transform,"Copyright",new Rect(0,0,1024,576));
            var message=Label(layer.transform,"Playback status",new Rect(24,460,976,42),18);message.alignment=TextAnchor.MiddleCenter;
            var retry=Click(layer.transform,"ODTWÓRZ PONOWNIE",new Rect(288,512,278,44),()=>{}).GetComponent<Button>();
            var skip=Click(layer.transform,"POMIŃ",new Rect(824,512,176,44),()=>{}).GetComponent<Button>();
            Click(layer.transform,"DŹWIĘK",new Rect(32,512,176,44),ToggleSound);
            cinema=gameObject.AddComponent<NativeCinematicPlayer>();cinema.Initialize(layer,frame,card.transform.parent.gameObject,card,message,retry,skip);
            menuAudio=gameObject.AddComponent<NativeMenuAudio>();menuAudio.Initialize(mediaCatalog);
        }
        void ToggleSound()
        {if(!fightAudio)return;fightAudio.Mute(!fightAudio.Muted);cinema?.Mute(fightAudio.Muted);RefreshMenuAudio();}
        void RefreshMenuAudio()
        {
            var music=selection&&selection.activeSelf&&!loading&&cinema?.Active!=true?(menuCurrent==menuRoster?"roster-premium":"title"):null;
            menuAudio?.Context(music,applicationSuspended||fightAudio?.Muted==true);
        }
        void PlayStartFilm()
        {
            if(loading||cinema.Active)return;
            PlayCinema("start",true,()=>ShowMenuPage(menuRoster));
        }
        void PlayCinema(string key,bool copyright,System.Action done)
        {
            if(!mediaCatalog.Cinematics.TryGetValue(key,out var file)){done();return;}
            ReleaseControls();if(EventSystem.current)EventSystem.current.SetSelectedGameObject(null);
            cinema.Mute(fightAudio.Muted);cinema.Suspend(applicationSuspended);
            cinema.Play(file,copyright?mediaCatalog.Interface["copyright"]:null,()=>{done();RefreshMenuAudio();});
            RefreshPauseUi();RefreshMenuAudio();
        }
        void BeginLoadedMatch(bool intro)
        {
            var token=generation;var loaded=match;
            void Ready()
            {
                if(disposed||token!=generation||match!=loaded)return;
                if(duel!=null){DuelLoaded();return;}
                BeginServerMatch();loading=false;controls.SetActive(!spectating);Pause(applicationSuspended);Present();
            }
            if(!intro){Ready();return;}
            match.SetPaused(true);arenaMedia.SetPaused(true);fightAudio.SetPaused(true);Present();
            var boss=campaignOpponent=="BOSS"&&(survival!=null||campaign?.Mode=="tournament");
            PlayCinema(boss?"boss":"fighter-"+Base(Variants[variantIndex]),false,Ready);
        }
        void PlayVictory()
        {
            if(campaign==null||campaign==celebrated||!campaign.Finished||campaign.Champion!=campaign.Player||!mediaCatalog.Cinematics.ContainsKey("victory-"+campaign.Player))return;
            celebrated=campaign;resultPanel.SetActive(false);var token=generation;
            PlayCinema("victory-"+campaign.Player,false,()=>{if(!disposed&&generation==token&&resultApplied)resultPanel.SetActive(true);});
        }
        void RefreshApplicationState()
        {
            applicationSuspended=applicationPaused||!applicationFocused;
            cinema?.Suspend(applicationSuspended);RefreshMenuAudio();
            if(duel!=null){if(applicationSuspended){duelInput?.Clear();duelHost?.DropPending();ReleaseControls();}RefreshPauseUi();}
            else if(applicationSuspended)Pause(true);else RefreshPauseUi();
        }
    }
}
