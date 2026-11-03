using System;
using System.Collections.Generic;
using System.Linq;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        static readonly Color MenuInk=new Color(.025f,.045f,.03f,1);
        static readonly Color MenuGreen=new Color(.63f,.89f,.36f,1);
        static readonly string[] Styles={"BOKS · KICKBOXING","TECHNICZNE MUAY THAI","TAEKWONDO · KICKBOXING","MUAY THAI","CAPOEIRA","KICKBOXING","SIŁA · WALKA W ZWARCIU","AKROBATYKA · KOPNIĘCIA"};
        readonly List<GameObject> menuPages=new List<GameObject>();
        readonly List<(NativeMenuImage image,string key,bool crop)> menuArt=new List<(NativeMenuImage,string,bool)>();
        readonly List<Image> rosterFrames=new List<Image>();
        readonly List<Text> rosterBadges=new List<Text>();
        readonly List<Text> recordRows=new List<Text>();
        GameObject menuTitle,menuRoster,menuModes,menuSetup,menuArena,menuHub,menuRecords,menuProfile,menuCurrent,pausePanel;
        GameObject pauseControl,soundControl;
        Text rosterRole,rosterChoice,outfitChoice,menuIdentity,arenaChoice,recordsCategory,recordSummary,profileMessage;
        Text difficultyChoice,recordsNote,recordFighter,onlineResultStatus;
        Text spectatorChoice;
        NativeMenuImage arenaPreview,setupPlayer,setupOpponent,recordPortrait;
        InputField nickname;
        bool pickingOpponent;
        int recordsMode,recordsDifficulty=1,recordsFighter;
        readonly string[] recordModes=new[]{"survival","fight","arcade","tournament"}.Concat(ChallengeCatalog.All.Select(c=>"challenge:"+c.Id)).ToArray();
        GameObject MenuPage(string name)
        {
            var page=Panel(name,new Rect(0,0,1024,576),MenuInk);Place(page,selection.transform,new Rect(0,0,1024,576));menuPages.Add(page);
            var background=MenuArt(page.transform,"background",new Rect(0,0,1024,576),true);
            background.GetComponent<RawImage>().color=new Color(.42f,.45f,.39f,1);
            page.SetActive(false);return page;
        }
        NativeMenuImage Picture(Transform parent,string name,Rect rect)
        {
            var host=new GameObject(name,typeof(RectTransform));Place(host,parent,rect);
            var child=new GameObject("Original image",typeof(RectTransform),typeof(RawImage),typeof(NativeMenuImage));Place(child,host.transform,new Rect(0,0,rect.width,rect.height));
            child.GetComponent<RawImage>().raycastTarget=false;return child.GetComponent<NativeMenuImage>();
        }
        NativeMenuImage MenuArt(Transform parent,string key,Rect rect,bool crop=false)
        {var image=Picture(parent,key,rect);menuArt.Add((image,key,crop));return image;}
        Text MenuHeading(GameObject page,string value)
        {var t=Label(page.transform,"Title",new Rect(32,22,730,48),32);t.fontStyle=FontStyle.Bold;t.text=value;return t;}
        void MenuBack(GameObject page,GameObject destination)
        {Click(page.transform,"‹ WRÓĆ",new Rect(32,510,170,46),()=>ShowMenuPage(destination));}
        void BuildMenuUi()
        {
            selection=Panel("Native menu",new Rect(0,0,1024,576),MenuInk);
            menuTitle=MenuPage("Title");menuRoster=MenuPage("Fighters");menuModes=MenuPage("Modes");menuSetup=MenuPage("Match setup");menuArena=MenuPage("Arena selection");
            menuHub=MenuPage("Challenges and records");menuRecords=MenuPage("Local records");menuProfile=MenuPage("Local profile");
            MenuArt(menuTitle.transform,"title",new Rect(0,0,1024,576));
            Click(menuTitle.transform,"ROZPOCZNIJ",new Rect(372,488,280,60),PlayStartFilm);
            BuildRosterMenu();BuildModesMenu();BuildSetupMenu();BuildArenaMenu();BuildHubMenu();BuildRecordsMenu();BuildProfileMenu();BuildAccountUi();
        }
        void BuildRosterMenu()
        {
            MenuHeading(menuRoster,"WYBIERZ ZAWODNIKÓW");
            rosterRole=Click(menuRoster.transform,"",new Rect(660,24,330,46),()=>{pickingOpponent=!pickingOpponent;RefreshMenuUi();}).GetComponentInChildren<Text>();
            var viewport=new GameObject("Fighter scroll",typeof(RectTransform),typeof(Image),typeof(RectMask2D),typeof(ScrollRect));Place(viewport,menuRoster.transform,new Rect(32,94,960,352));viewport.GetComponent<Image>().color=new Color(0,0,0,.25f);
            var content=new GameObject("Fighter cards",typeof(RectTransform));Place(content,viewport.transform,new Rect(0,0,Roster.Length*204-12,348));
            var scroll=viewport.GetComponent<ScrollRect>();scroll.viewport=(RectTransform)viewport.transform;scroll.content=(RectTransform)content.transform;scroll.horizontal=true;scroll.vertical=false;scroll.movementType=ScrollRect.MovementType.Clamped;
            for(var i=0;i<Roster.Length;i++)
            {
                var index=i;var card=Click(content.transform,"",new Rect(i*204,0,192,346),()=>SelectRoster(index));rosterFrames.Add(card.GetComponent<Image>());
                MenuArt(card.transform,"portrait-"+Roster[i],new Rect(4,8,184,250));
                var name=Label(card.transform,"Fighter",new Rect(8,264,176,32),24);name.alignment=TextAnchor.MiddleCenter;name.fontStyle=FontStyle.Bold;name.text=Display(Roster[i]);
                var style=Label(card.transform,"Style",new Rect(8,300,176,40),12);style.alignment=TextAnchor.MiddleCenter;style.text=Styles[i];
                var badge=Label(card.transform,"Selected",new Rect(12,8,168,30),18);badge.color=MenuGreen;rosterBadges.Add(badge);
            }
            Click(menuRoster.transform,"◀",new Rect(32,452,62,44),()=>scroll.horizontalNormalizedPosition=Mathf.Clamp01(scroll.horizontalNormalizedPosition-.3f));
            Click(menuRoster.transform,"▶",new Rect(104,452,62,44),()=>scroll.horizontalNormalizedPosition=Mathf.Clamp01(scroll.horizontalNormalizedPosition+.3f));
            rosterChoice=Label(menuRoster.transform,"Duel",new Rect(186,455,620,40),20);
            outfitChoice=Click(menuRoster.transform,"",new Rect(240,510,410,46),CycleOutfit).GetComponentInChildren<Text>();
            MenuBack(menuRoster,menuTitle);Click(menuRoster.transform,"ZATWIERDŹ →",new Rect(714,510,278,46),()=>{menuAudio?.Cue(true);ShowMenuPage(menuModes);});
        }
        void SelectRoster(int index)
        {
            menuAudio?.Cue();
            if(pickingOpponent)opponentIndex=index;else variantIndex=Array.IndexOf(Variants,Roster[index]);
            RefreshSelection();
        }
        void CycleOutfit()
        {OpenShop();}
        void BuildModesMenu()
        {
            MenuHeading(menuModes,"WYBIERZ TRYB GRY");
            var art=new[]{"portrait-BRAX","training","portrait-VEXA","portrait-KROV","mode-survival","mode-adventure"};
            for(var i=0;i<Modes.Length;i++)
            {
                var index=i;var card=Click(menuModes.transform,"",new Rect(32+i*162,108,150,314),()=>{modeIndex=index;spectatorRequested=false;ShowMenuPage(menuSetup);});
                MenuArt(card.transform,art[i],new Rect(4,4,142,240));
                var title=Label(card.transform,"Mode",new Rect(8,258,134,42),19);title.alignment=TextAnchor.MiddleCenter;title.fontStyle=FontStyle.Bold;title.text=ModeNames[i];
            }
            menuIdentity=Click(menuModes.transform,"",new Rect(32,444,300,46),()=>ShowMenuPage(menuProfile)).GetComponentInChildren<Text>();
            Click(menuModes.transform,"KONTO",new Rect(348,444,190,46),OpenAccount);
            Click(menuModes.transform,"WYZWANIA I REKORDY",new Rect(562,444,430,46),()=>ShowMenuPage(menuHub));MenuBack(menuModes,menuRoster);
            Click(menuModes.transform,"SKLEP",new Rect(240,510,190,46),OpenShop);
            Label(menuModes.transform,"Local mode",new Rect(460,520,532,26),15).text="Rozgrywka i wyniki na tym urządzeniu";
        }
        void BuildSetupMenu()
        {
            MenuHeading(menuSetup,"USTAWIENIA WALKI");
            setupPlayer=Picture(menuSetup.transform,"Player",new Rect(40,90,230,250));setupOpponent=Picture(menuSetup.transform,"Opponent",new Rect(754,90,230,250));
            chosen=Label(menuSetup.transform,"Selection details",new Rect(292,102,440,150),21);chosen.alignment=TextAnchor.UpperCenter;
            difficultyChoice=Click(menuSetup.transform,"",new Rect(328,274,368,52),()=>{difficulty=(difficulty+1)%3;RefreshSelection();}).GetComponentInChildren<Text>();
            spectatorChoice=Click(menuSetup.transform,"",new Rect(328,338,368,44),()=>{spectatorRequested=!spectatorRequested;RefreshSelection();}).GetComponentInChildren<Text>();spectatorChoice.fontSize=15;
            selectionScope=Label(menuSetup.transform,"Scope",new Rect(124,400,776,58),18);selectionScope.alignment=TextAnchor.MiddleCenter;
            selectionScope.text="Wybierz arenę, aby rozpocząć rozgrywkę.";
            MenuBack(menuSetup,menuModes);Click(menuSetup.transform,"WYBIERZ ARENĘ →",new Rect(674,510,318,46),()=>ShowMenuPage(menuArena));
        }
        void BuildArenaMenu()
        {
            MenuHeading(menuArena,"WYBIERZ ARENĘ");arenaPreview=Picture(menuArena.transform,"Arena poster",new Rect(164,88,696,344));
            arenaChoice=Label(menuArena.transform,"Arena",new Rect(110,446,804,42),23);arenaChoice.alignment=TextAnchor.MiddleCenter;
            Click(menuArena.transform,"◀",new Rect(32,226,88,70),()=>ChangeArena(-1));Click(menuArena.transform,"▶",new Rect(904,226,88,70),()=>ChangeArena(1));
            MenuBack(menuArena,menuSetup);Click(menuArena.transform,"LOSUJ",new Rect(240,510,190,46),()=>ChangeArena(random.Next(1,100)));Click(menuArena.transform,"ROZPOCZNIJ",new Rect(674,510,318,46),()=>{menuAudio?.Cue(true);BeginSession();});
        }
        void ChangeArena(int offset)
        {
            if(mediaCatalog==null)return;
            menuAudio?.Cue();
            if(Modes[modeIndex]=="adventure")routeIndex=(routeIndex+offset%mediaCatalog.Routes.Count+mediaCatalog.Routes.Count)%mediaCatalog.Routes.Count;
            else arenaIndex=(arenaIndex+offset%mediaCatalog.Arenas.Length+mediaCatalog.Arenas.Length)%mediaCatalog.Arenas.Length;
            RefreshSelection();
        }
        void BuildHubMenu()
        {
            MenuHeading(menuHub,"WYZWANIA I REKORDY");
            var names=new[]{"SURVIVAL","WYZWANIA","REKORDY"};var keys=new[]{"mode-survival","mode-challenges","mode-ranking"};
            for(var i=0;i<3;i++)
            {
                var index=i;var card=Click(menuHub.transform,"",new Rect(70+i*300,110,284,344),()=>{if(index==0){modeIndex=4;ShowMenuPage(menuSetup);}else if(index==1)OpenChallenges();else ShowMenuPage(menuRecords);});
                MenuArt(card.transform,keys[i],new Rect(4,4,276,274),true);Label(card.transform,"Destination",new Rect(16,294,252,40),24).text=names[i];
            }
            MenuBack(menuHub,menuModes);
        }
        void BuildRecordsMenu()
        {
            MenuHeading(menuRecords,"REKORDY I POSTĘP");recordsCategory=Label(menuRecords.transform,"Category",new Rect(100,88,494,48),18);recordsCategory.alignment=TextAnchor.MiddleCenter;
            Click(menuRecords.transform,"◀",new Rect(32,88,60,44),()=>{recordsMode=(recordsMode+recordModes.Length-1)%recordModes.Length;RefreshRecords();});
            Click(menuRecords.transform,"▶",new Rect(604,88,60,44),()=>{recordsMode=(recordsMode+1)%recordModes.Length;RefreshRecords();});
            Click(menuRecords.transform,"TRUDNOŚĆ",new Rect(32,142,164,42),()=>{recordsDifficulty=(recordsDifficulty+1)%3;RefreshRecords();});
            recordsNote=Label(menuRecords.transform,"Ranking scope",new Rect(208,146,456,42),15);
            for(var i=0;i<5;i++)recordRows.Add(Label(menuRecords.transform,"Result "+i,new Rect(32,208+i*52,632,48),17));
            recordPortrait=Picture(menuRecords.transform,"Progress portrait",new Rect(734,82,198,216));
            recordFighter=Label(menuRecords.transform,"Progress fighter",new Rect(720,308,240,40),24);recordFighter.alignment=TextAnchor.MiddleCenter;
            recordSummary=Label(menuRecords.transform,"Progress",new Rect(712,360,280,114),18);recordSummary.alignment=TextAnchor.UpperCenter;
            Click(menuRecords.transform,"◀",new Rect(684,306,50,44),()=>{recordsFighter=(recordsFighter+7)%8;RefreshRecords();});
            Click(menuRecords.transform,"▶",new Rect(950,306,50,44),()=>{recordsFighter=(recordsFighter+1)%8;RefreshRecords();});
            MenuBack(menuRecords,menuHub);
            Click(menuRecords.transform,"PONÓW ZAPIS ONLINE",new Rect(224,510,278,46),RetryServerResults);
            Click(menuRecords.transform,"POSTĘP KONTA",new Rect(518,510,180,46),LoadServerProgress);
            onlineResultStatus=Label(menuRecords.transform,"Online result status",new Rect(32,478,960,30),14);
            Click(menuRecords.transform,"PROFIL LOKALNY",new Rect(714,510,278,46),()=>ShowMenuPage(menuProfile));
            Click(menuRecords.transform,"RANKING ONLINE",new Rect(714,24,278,44),OpenLeaderboard);BuildLeaderboardUi();
        }
        void BuildProfileMenu()
        {
            MenuHeading(menuProfile,"PROFIL NA TYM URZĄDZENIU");
            Label(menuProfile.transform,"Name instructions",new Rect(244,138,536,90),21).text="Imię lub pseudonim (2–20 znaków)\nWyniki i wyzwania zapisują się osobno dla każdego profilu.";
            var input=new GameObject("Nickname",typeof(RectTransform),typeof(Image),typeof(InputField));Place(input,menuProfile.transform,new Rect(244,244,536,58));input.GetComponent<Image>().color=new Color(.08f,.13f,.09f,1);
            nickname=input.GetComponent<InputField>();nickname.textComponent=Label(input.transform,"Value",new Rect(16,8,504,42),25);nickname.textComponent.alignment=TextAnchor.MiddleLeft;
            nickname.characterLimit=20;nickname.lineType=InputField.LineType.SingleLine;nickname.contentType=InputField.ContentType.Standard;
            nickname.onSubmit.AddListener(_=>SaveProfile());
            profileMessage=Label(menuProfile.transform,"Profile message",new Rect(244,330,536,100),19);
            MenuBack(menuProfile,menuModes);Click(menuProfile.transform,"ZAPISZ PROFIL",new Rect(674,510,318,46),SaveProfile);
        }
        void SaveProfile()
        {
            if(progress==null||progressStore==null)return;
            var candidate=new ArenaProgress(progress.Serialize());
            if(!candidate.SetName(nickname.text)){profileMessage.text="Wpisz co najmniej 2 znaki: litery lub cyfry.";return;}
            if(!progressStore.Save(candidate)){profileMessage.text=progressStore.Error;return;}
            progress=candidate;nickname.SetTextWithoutNotify(progress.Name);profileMessage.text="Profil zapisany: "+progress.Name;RefreshMenuUi();
        }
        void RefreshRecords()
        {
            if(progress==null||mediaCatalog==null)return;
            var mode=recordModes[recordsMode];var level=new[]{"easy","normal","hard"}[recordsDifficulty];
            var title=mode.StartsWith("challenge:")?ChallengeCatalog.All.First(c=>"challenge:"+c.Id==mode).Title:ModeNames[Array.IndexOf(Modes,mode)];
            recordsCategory.text=title+"\n"+new[]{"ŁATWY","ŚREDNI","TRUDNY"}[recordsDifficulty];
            recordsNote.text="TOP 5 na tym urządzeniu · "+(progress.Name.Length>0?progress.Name:"GRACZ")+(mode=="tournament"?"\nCzas = średnia czasu walk.":"\nRemis rozstrzyga krótszy czas.");
            var rows=progress.Top(mode,level);
            for(var i=0;i<recordRows.Count;i++)
            {
                if(i>=rows.Count){recordRows[i].text=i==0?"Brak zapisanych wyników w tej kategorii.":"";continue;}
                var r=rows[i];var ms=(double)r["elapsed"];var seconds=(int)(ms/1000);string score;
                if(mode=="survival")score=r["score"]+" zwycięstw";
                else if(mode=="arcade")score=((bool)r["completed"]?"Ukończone · ":"")+r["score"]+"/"+r["targetWins"];
                else if(mode=="tournament")score=((bool)r["completed"]?"Mistrz":"Zakończone")+" · "+r["score"]+" wygr.";
                else if(mode.StartsWith("challenge:"))score="Ukończone";
                else score=r["rounds"] is JArray rounds?string.Join(" : ",rounds.Values<int>()):"Wygrana · przewaga "+r["score"]+" rund";
                recordRows[i].text=(i+1)+". "+r["name"]+" · "+Display((string)r["fighter"])+"\n    "+score+" · "+seconds/60+":"+(seconds%60).ToString("D2");
            }
            var fighter=Roster[recordsFighter];var fromServer=online?.Authenticated==true&&online.PlayerId==serverFightersOwner&&serverFighters?[fighter] is JObject;var f=fromServer?(JObject)serverFighters[fighter]:progress.Fighter(fighter);var available=ChallengeCatalog.All.Where(c=>c.Allows(fighter)).ToArray();var done=((JArray)f["challenges"]).Values<string>().ToHashSet();
            recordPortrait.Show(mediaCatalog.Interface["portrait-"+fighter]);recordFighter.text=Display(fighter);
            recordSummary.text=(fromServer?"POSTĘP KONTA\n":"PROFIL LOKALNY\n")+"Zwycięstwa: "+f["wins"]+"\nRekord Survival: "+f["bestSurvival"]+"\nWyzwania: "+available.Count(c=>done.Contains(c.Id))+" / "+available.Length;
        }
        void ShowMenuPage(GameObject page)
        {
            if(!page||accountBusy)return;if((menuCurrent==menuAccount||menuCurrent==menuAccountSettings)&&page!=menuCurrent)ClearAccountSecrets();foreach(var p in menuPages)p.SetActive(p==page);menuCurrent=page;
            if(EventSystem.current)EventSystem.current.SetSelectedGameObject(null);
            if(page==menuProfile){nickname.SetTextWithoutNotify(progress?.Name??"");profileMessage.text=progressStore?.Error??"Profil lokalny nie jest kontem internetowym.";}
            RefreshSelection();if(page==menuRecords)RefreshRecords();RefreshMenuAudio();
        }
        void RefreshMenuUi()
        {
            if(mediaCatalog==null)return;
            foreach(var item in menuArt)item.image.Show(mediaCatalog.Interface[item.key],item.crop);
            var fighter=Base(Variants[variantIndex]);rosterRole.text=pickingOpponent?"WYBIERASZ: PRZECIWNIK":"WYBIERASZ: GRACZ";
            rosterChoice.text=Display(fighter)+"  VS  "+Display(Roster[opponentIndex]);
            for(var i=0;i<Roster.Length;i++)
            {
                var player=Roster[i]==fighter;var cpu=i==opponentIndex;rosterBadges[i].text=player&&cpu?"GRACZ / CPU":player?"GRACZ":cpu?"CPU":"";
                rosterFrames[i].color=player?new Color(.22f,.36f,.14f,1):new Color(.06f,.1f,.07f,1);
            }
            var outfit=mediaCatalog.Outfits.FirstOrDefault(o=>(string)o["id"]==Variants[variantIndex]);outfitChoice.text="STRÓJ: "+(outfit==null?"PODSTAWOWY":(string)outfit["label"])+" ›";
            outfitChoice.transform.parent.GetComponent<Button>().interactable=Variants.Count(v=>Base(v)==fighter)>1;
            menuIdentity.text="PROFIL: "+(string.IsNullOrEmpty(progress?.Name)?"GRACZ":progress.Name);
            setupPlayer.Show(mediaCatalog.Interface["portrait-"+Variants[variantIndex]]);setupOpponent.Show(mediaCatalog.Interface["portrait-"+Roster[opponentIndex]]);
            difficultyChoice.text="TRUDNOŚĆ: "+new[]{"ŁATWY","ŚREDNI","TRUDNY"}[difficulty];
            spectatorChoice.transform.parent.gameObject.SetActive(Modes[modeIndex]=="fight");spectatorChoice.text=spectatorRequested?"POKAZ: KOMPUTER KONTRA KOMPUTER":"GRACZ KONTRA KOMPUTER";
            if(Modes[modeIndex]=="fight")selectionScope.text=spectatorRequested?"Obaj zawodnicy walczą automatycznie. Pokaz nie zapisuje wyników ani osiągnięć.":"Wybierz arenę, aby rozpocząć rozgrywkę.";
            if(Modes[modeIndex]=="adventure")
            {
                var route=mediaCatalog.Routes[routeIndex];arenaChoice.text=(routeIndex+1)+" / "+mediaCatalog.Routes.Count+" · "+route["title"];
                arenaPreview.Show((string)route["chapters"][0]["poster"],true);
            }
            else {var arena=mediaCatalog.Arenas[arenaIndex];arenaChoice.text=(arenaIndex+1)+" / "+mediaCatalog.Arenas.Length+" · "+arena.name;arenaPreview.Show(arena.poster,true);}
        }
        void OpenChallenges(){RefreshChallenge();challengesPanel.SetActive(true);challengesPanel.transform.SetAsLastSibling();}
        void BuildPauseUi()
        {
            pausePanel=Panel("Pause menu",new Rect(240,110,544,324),new Color(.025f,.045f,.03f,.98f));
            Label(pausePanel.transform,"Pause",new Rect(32,22,480,48),32).text="PAUZA";
            Click(pausePanel.transform,"WRÓĆ DO GRY",new Rect(32,94,480,56),()=>Pause(false));
            Click(pausePanel.transform,"DŹWIĘK",new Rect(32,170,226,56),ToggleSound);
            Click(pausePanel.transform,"MENU",new Rect(278,170,234,56),ShowSelection);
            Label(pausePanel.transform,"Pause hint",new Rect(32,250,480,48),16).text="Powrót do menu kończy bieżącą walkę.";pausePanel.SetActive(false);
        }
        void RefreshPauseUi()
        {
            if(!pausePanel)return;
            var show=match!=null&&(duel!=null?duelUserPaused:match.Paused)&&!loading&&!resultApplied&&!applicationSuspended&&cinema?.Active!=true&&!(trainingPanel&&trainingPanel.activeSelf);
            pausePanel.SetActive(show);if(show)pausePanel.transform.SetAsLastSibling();
        }
        void CloseMenuOverlays(){cinema?.Stop();if(pausePanel)pausePanel.SetActive(false);}
        void UpdateMenuInput()
        {
            if(onlineResultStatus&&menuCurrent==menuRecords)onlineResultStatus.text=recordsServiceMessage??rankTracker?.Status??"Wyniki na tym urządzeniu. Zaloguj się, aby zapisywać nowe walki na koncie.";
            if(resultOnlineStatus&&resultPanel.activeSelf)resultOnlineStatus.text=spectating?"Pokaz — bez zapisu postępu.":adventure==null?rankTracker?.Status??"Wynik zapisany lokalnie.":adventureTracker?.Status??"Przejście lokalne — poza rankingiem.";
            var inGame=!selection.activeSelf&&!loading&&match!=null;
            if(pauseControl&&pauseControl.activeSelf!=inGame)pauseControl.SetActive(inGame);
            if(soundControl)
            {
                soundControl.SetActive(!loading);Place(soundControl,uiRoot,inGame?new Rect(708,12,132,36):new Rect(918,0,106,24));
                soundControl.GetComponentInChildren<Text>().fontSize=inGame?18:12;
            }
            if(selection.activeSelf&&Input.GetKeyDown(KeyCode.Escape))
            {
                if(challengesPanel&&challengesPanel.activeSelf){challengesPanel.SetActive(false);return;}
                if(menuCurrent==menuDuel){ShowSelection();ShowMenuPage(menuModes);return;}
                if(menuCurrent==menuTitle)return;
                var destination=menuCurrent==menuRoster?menuTitle:menuCurrent==menuModes?menuRoster:menuCurrent==menuArena?menuSetup:menuCurrent==menuRecords?menuHub:menuCurrent==menuLeaderboard?menuRecords:menuCurrent==menuAccountSettings?menuAccount:menuModes;
                ShowMenuPage(destination);
            }
        }
    }
}
