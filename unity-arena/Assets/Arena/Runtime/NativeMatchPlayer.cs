using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using Braxhorn.Arena.Domain;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    // Playable native migration entry point. Production art/menus and the online
    // adapter are separate work; this scene never presents itself as store-ready.
    public sealed partial class NativeMatchPlayer : MonoBehaviour
    {
        public Camera matchCamera;
        public Shader arenaMediaShader;
        public Shader adventureCorpseShader;
        public Shader adventureSeamShader;
        public Shader adventureColourShader;
        static readonly string[] Roster = { "BRAX", "NYXA", "VEXA", "KROV", "NINA", "DANNY", "BEAR", "DEMON" };
        static readonly string[] Variants = { "BRAX", "BRAX_WHITE", "BRAX_STREET", "NYXA", "NYXA_SPORT", "NYXA_PINK", "VEXA", "VEXA_PURPLE", "VEXA_STREET", "KROV", "KROV_TRACKSUIT", "KROV_SUMMER", "NINA", "DANNY", "BEAR", "DEMON" };
        static readonly string[] Modes = { "fight", "training", "arcade", "tournament", "survival", "adventure" };
        static readonly string[] ModeNames = { "WALKA", "TRENING", "ARCADE", "TURNIEJ", "SURVIVAL", "PRZYGODA" };
        readonly FighterDefinition[] definitions = new FighterDefinition[2];
        readonly FighterPosePlayer[] poses = new FighterPosePlayer[2];
        readonly GameObject[] actors = new GameObject[2];
        readonly List<TouchFightButton> buttons = new List<TouchFightButton>();
        readonly System.Random random = new System.Random();
        ArenaMatch match;
        ArenaMediaCatalog mediaCatalog;
        NativeArenaMedia arenaMedia;
        NativeFightAudio fightAudio;
        int arenaIndex;
        CampaignRun campaign;
        SurvivalRun survival;
        Font font;
        Canvas canvas;
        GameObject selection, controls, resultPanel;
        Text status, hud, chosen, result, pauseLabel;
        TouchFightButton left,right,block,down,sprint,grab;
        int variantIndex,opponentIndex=1,modeIndex,difficulty=1,generation;
        bool loading, resultApplied, disposed, applicationSuspended;
        string error, campaignOpponent;
        RectTransform safeRoot,uiRoot;

        void Start()
        {
            Application.targetFrameRate=60;QualitySettings.skinWeights=SkinWeights.Unlimited;
            Screen.sleepTimeout=SleepTimeout.NeverSleep;
            font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            BuildUi();
            try{mediaCatalog=ArenaMediaCatalog.Load();arenaMedia=gameObject.AddComponent<NativeArenaMedia>();fightAudio=gameObject.AddComponent<NativeFightAudio>();ShowSelection();}
            catch(Exception e){Fail(e.Message);}
        }
        static string Display(string id) => id=="BEAR"?"MIŚ":id=="DEMON"?"AZRAK":id.Replace('_',' ');
        static string Base(string id) => id.Split('_')[0];
        void BuildUi()
        {
            canvas=new GameObject("Arena native interface",typeof(Canvas),typeof(CanvasScaler),typeof(GraphicRaycaster)).GetComponent<Canvas>();
            canvas.renderMode=RenderMode.ScreenSpaceOverlay;
            var scaler=canvas.GetComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ScaleWithScreenSize;scaler.referenceResolution=new Vector2(1024,576);scaler.matchWidthOrHeight=.5f;
            if(!EventSystem.current)new GameObject("Arena input",typeof(EventSystem),typeof(StandaloneInputModule));
            safeRoot=new GameObject("Safe area",typeof(RectTransform)).GetComponent<RectTransform>();safeRoot.SetParent(canvas.transform,false);safeRoot.offsetMin=safeRoot.offsetMax=Vector2.zero;
            uiRoot=new GameObject("Mobile interface fit",typeof(RectTransform)).GetComponent<RectTransform>();uiRoot.SetParent(safeRoot,false);uiRoot.anchorMin=uiRoot.anchorMax=uiRoot.pivot=new Vector2(.5f,.5f);uiRoot.sizeDelta=new Vector2(1024,576);uiRoot.anchoredPosition=Vector2.zero;
            status=Label(uiRoot,"Status",new Rect(20,16,984,28),16);
            status.text="BRAXHORN ARENA · UNITY · TEST MIGRACJI WALKI";
            selection=Panel("Selection",new Rect(100,76,824,420),new Color(.04f,.05f,.07f,.97f));
            Label(selection.transform,"Title",new Rect(24,20,776,50),30).text="BRAXHORN ARENA";
            chosen=Label(selection.transform,"Selection details",new Rect(24,68,776,126),21);
            Click(selection.transform,"Postać ◀",new Rect(24,204,184,48),()=>{variantIndex=(variantIndex+Variants.Length-1)%Variants.Length;RefreshSelection();});
            Click(selection.transform,"Postać ▶",new Rect(220,204,184,48),()=>{variantIndex=(variantIndex+1)%Variants.Length;RefreshSelection();});
            Click(selection.transform,"Przeciwnik",new Rect(416,204,184,48),()=>{opponentIndex=(opponentIndex+1)%Roster.Length;RefreshSelection();});
            Click(selection.transform,"Trudność",new Rect(612,204,184,48),()=>{difficulty=(difficulty+1)%3;RefreshSelection();});
            Click(selection.transform,"Tryb",new Rect(24,274,232,58),()=>{modeIndex=(modeIndex+1)%Modes.Length;RefreshSelection();});
            Click(selection.transform,"Arena",new Rect(280,274,232,58),()=>{if(mediaCatalog!=null){if(Modes[modeIndex]=="adventure")routeIndex=(routeIndex+1)%mediaCatalog.Routes.Count;else arenaIndex=(arenaIndex+1)%mediaCatalog.Arenas.Length;RefreshSelection();}});
            Click(selection.transform,"ROZPOCZNIJ",new Rect(536,274,260,58),BeginSession);
            Label(selection.transform,"Scope",new Rect(24,348,776,56),16).text="Natywna walka i kampanie. Przygoda lokalna bez rankingu online. Wersja nieprzeznaczona do sprzedaży.";
            controls=Panel("Controls",new Rect(0,440,1024,136),Color.clear);
            left=Hold("◀",new Rect(16,54,74,62));right=Hold("▶",new Rect(98,54,74,62));
            down=Hold("DÓŁ",new Rect(180,54,74,62));sprint=Hold("BIEG",new Rect(16,0,96,44));
            block=Hold("GARDA",new Rect(122,0,132,44));grab=Hold("CHWYT",new Rect(278,54,96,62));
            Tap("UNIK",new Rect(278,0,96,44),FightButton.Evade);
            Tap("SKOK",new Rect(384,54,96,62),FightButton.Jump);
            Tap("P1",new Rect(672,54,76,62),FightButton.Punch);Tap("P2",new Rect(758,54,76,62),FightButton.Heavy);
            Tap("K1",new Rect(844,54,76,62),FightButton.Kick);Tap("K2",new Rect(930,54,76,62),FightButton.HeavyKick);
            Tap("COMBO",new Rect(672,0,156,44),FightButton.Combo);Tap("ENERGIA",new Rect(844,0,162,44),FightButton.Energy);
            hud=Label(uiRoot,"HUD",new Rect(24,56,976,68),22);
            var pause=Click(uiRoot,"PAUZA",new Rect(850,12,150,36),TogglePause);pauseLabel=pause.GetComponentInChildren<Text>();
            Click(uiRoot,"DŹWIĘK",new Rect(708,12,132,36),()=>{if(fightAudio)fightAudio.Mute(!fightAudio.Muted);});
            resultPanel=Panel("Result",new Rect(240,150,544,250),new Color(.03f,.04f,.05f,.97f));
            result=Label(resultPanel.transform,"Result text",new Rect(24,20,496,104),26);
            Click(resultPanel.transform,"DALEJ",new Rect(24,160,230,60),ContinueSession);
            Click(resultPanel.transform,"MENU",new Rect(278,160,242,60),ShowSelection);
            resultPanel.SetActive(false);controls.SetActive(false);
        }
        GameObject Panel(string name,Rect rect,Color color)
        {var obj=new GameObject(name,typeof(RectTransform),typeof(Image));Place(obj,uiRoot,rect);obj.GetComponent<Image>().color=color;obj.GetComponent<Image>().raycastTarget=color.a>0;return obj;}
        void Place(GameObject obj,Transform parent,Rect rect)
        {var t=obj.GetComponent<RectTransform>();t.SetParent(parent,false);t.anchorMin=t.anchorMax=new Vector2(0,1);t.pivot=new Vector2(0,1);t.anchoredPosition=new Vector2(rect.x,-rect.y);t.sizeDelta=rect.size;}
        Text Label(Transform parent,string name,Rect rect,int size)
        {var obj=new GameObject(name,typeof(RectTransform),typeof(Text));Place(obj,parent,rect);var text=obj.GetComponent<Text>();text.font=font;text.fontSize=size;text.color=Color.white;text.raycastTarget=false;text.verticalOverflow=VerticalWrapMode.Overflow;return text;}
        GameObject Click(Transform parent,string text,Rect rect,Action action)
        {
            var obj=new GameObject(text,typeof(RectTransform),typeof(Image),typeof(Button));Place(obj,parent,rect);obj.GetComponent<Image>().color=new Color(.18f,.20f,.23f,.96f);
            var label=Label(obj.transform,"Label",new Rect(4,2,rect.width-8,rect.height-4),18);label.alignment=TextAnchor.MiddleCenter;
            label.text=text;obj.GetComponent<Button>().onClick.AddListener(()=>action());return obj;
        }
        TouchFightButton Hold(string text,Rect rect)
        {var obj=Click(controls.transform,text,rect,()=>{});var button=obj.AddComponent<TouchFightButton>();buttons.Add(button);return button;}
        void Tap(string text,Rect rect,FightButton action)
        {var button=Hold(text,rect);button.Pressed=()=>{ReadInput();match?.Press(0,action);};}
        void RefreshSelection() => chosen.text="POSTAĆ: "+Display(Variants[variantIndex])+"\nPRZECIWNIK: "+Display(Roster[opponentIndex])+"\n"+ModeNames[modeIndex]+" · "+new[]{"ŁATWY","ŚREDNI","TRUDNY"}[difficulty]+"\n"+(Modes[modeIndex]=="adventure"?(string)mediaCatalog?.Routes[routeIndex]["title"]:(mediaCatalog?.Arenas[arenaIndex].name??"BRAK KATALOGU AREN"));
        void BeginSession()
        {
            if(loading||mediaCatalog==null)return;
            if(Modes[modeIndex]=="adventure"){StartCoroutine(LoadAdventure());return;}
            campaign=null;survival=null;var mode=Modes[modeIndex];var player=Base(Variants[variantIndex]);
            if(mode=="arcade"||mode=="tournament")campaign=new CampaignRun(mode,player,Roster,random.NextDouble);
            if(mode=="survival")survival=new SurvivalRun(player,random.NextDouble);
            campaignOpponent=campaign?.Next()??survival?.Next()??Roster[opponentIndex];
            StartCoroutine(LoadMatch(Variants[variantIndex],campaignOpponent,survival?.Hp??100));
        }
        IEnumerator LoadMatch(string player,string opponent,double hp)
        {
            loading=true;resultApplied=false;error=null;var requestId=++generation;
            ReleaseControls();match=null;selection.SetActive(false);controls.SetActive(false);resultPanel.SetActive(false);hud.text="WCZYTYWANIE…";
            ClearActors();yield return null;yield return Resources.UnloadUnusedAssets();
            yield return arenaMedia.Load(mediaCatalog.Arenas[arenaIndex],matchCamera,arenaMediaShader);
            if(disposed||requestId!=generation)yield break;
            if(arenaMedia.Error!=null){Fail(arenaMedia.Error);yield break;}
            yield return fightAudio.Load(mediaCatalog);
            if(disposed||requestId!=generation)yield break;
            if(fightAudio.Error!=null){Fail(fightAudio.Error);yield break;}
            fightAudio.ResetMatch();
            var configs=new CombatConfiguration[2];var ids=new[]{player,opponent};
            for(var i=0;i<2;i++)
            {
                var side=i;
                yield return LoadFighter(ids[i],i,requestId,c=>configs[side]=c);
                if(disposed||requestId!=generation||configs[i]==null)yield break;
            }
            try
            {
                var logicalWidth=Math.Max(320,576.0*matchCamera.aspect);var arena=mediaCatalog.Arenas[arenaIndex];
                var geometry=new MediaGeometry(logicalWidth,576,arena.aspect,arena.ground,arena.fit=="contain");
                match=new ArenaMatch(configs[0],configs[1],random.NextDouble,training:Modes[modeIndex]=="training",singleRound:survival!=null,playerHp:hp,width:logicalWidth,groundRatio:geometry.Floor/576);
                match.UseCpu(1,(CpuLevel)difficulty,TrainingBehavior.Spar);
                var worldPerPixel=3.25f/640/(float)match.Scale;
                matchCamera.orthographic=true;matchCamera.orthographicSize=(float)match.Height*worldPerPixel/2;
                matchCamera.transform.position=new Vector3(0,(float)(match.Floor-match.Height/2)*worldPerPixel,-8);
                loading=false;controls.SetActive(true);if(applicationSuspended)Pause(true);Present();
            }
            catch(Exception e){Debug.LogException(e);Fail(e.Message);}
        }
        void Fail(string message){generation++;ReleaseControls();ClearAdventure();ClearActors();match=null;controls.SetActive(false);loading=false;error=message;hud.text="Nie udało się wczytać meczu: "+message;selection.SetActive(true);if(arenaMedia)arenaMedia.Clear();if(fightAudio)fightAudio.Stop();}
        void Update()
        {
            if(safeRoot){var r=Screen.safeArea;safeRoot.anchorMin=r.min/new Vector2(Screen.width,Screen.height);safeRoot.anchorMax=r.max/new Vector2(Screen.width,Screen.height);if(uiRoot)uiRoot.localScale=Vector3.one*Mathf.Min(safeRoot.rect.width/1024,safeRoot.rect.height/576);}
            if(arenaMedia&&fightAudio)arenaMedia.Sound(fightAudio.Muted,fightAudio.Duck);
            if(loading||match==null)return;
            if(adventure!=null){UpdateAdventure();return;}
            if(arenaMedia.Error!=null&&error!=arenaMedia.Error){error=arenaMedia.Error;Pause(true);status.text=error;}
            if(Input.GetKeyDown(KeyCode.Escape))TogglePause();ReadInput();
            var keys=new[]{KeyCode.J,KeyCode.K,KeyCode.U,KeyCode.I,KeyCode.L,KeyCode.Space,KeyCode.O,KeyCode.P};
            for(var i=0;i<keys.Length;i++)if(Input.GetKeyDown(keys[i]))match.Press(0,(FightButton)i);
            match.Advance(Math.Min(100,Time.unscaledDeltaTime*1000));Present();
            if(match.Phase==MatchPhase.Complete&&!resultApplied)CompleteMatch();
        }
        void ReadInput()
        {
            if(match==null)return;
            var direction=(right.Held||Input.GetKey(KeyCode.D)||Input.GetKey(KeyCode.RightArrow)?1:0)-(left.Held||Input.GetKey(KeyCode.A)||Input.GetKey(KeyCode.LeftArrow)?1:0);
            match.SetInput(0,new FightInput(direction,block.Held||Input.GetKey(KeyCode.LeftControl),down.Held||Input.GetKey(KeyCode.S),sprint.Held||Input.GetKey(KeyCode.LeftShift),grab.Held||Input.GetKey(KeyCode.G)));
        }
        void Present()
        {
            for(var i=0;i<2;i++)
            {
                RenderFighter(i,match.Presentation(i));
                if(adventure!=null)actors[i].SetActive(i==0?adventure.Phase!=AdventurePhase.Entrance||adventure.ElapsedMs>=450:adventure.OpponentVisible);
            }
            for(var i=0;i<2;i++)
            {
                var fighter=match.Fighter(i);
                poses[i].ApplyMovingGait(fighter.MovingGait,fighter.MovingGaitSeconds,fighter.MovingGaitWeight);
            }
            if(match.ClinchActive)
                for(var i=0;i<2;i++)
                {
                    var self=match.Fighter(i);var other=match.Fighter(1-i);
                    var gap=Math.Abs(self.X-other.X)/match.Scale/self.Action.Scale*3.25/640;
                    poses[i].ApplyClinchContact(self.Action,other.Action,gap,self.Clock.PoseSeconds);
                }
            hud.text=Display(definitions[0].id)+"  "+Math.Ceiling(match.Player.Hp)+" HP · "+(int)match.Player.Energy+" EN     "+Math.Ceiling(match.RemainingSeconds)+"     "+Display(definitions[1].id)+"  "+Math.Ceiling(match.Opponent.Hp)+" HP\n"+
                "RUNDA "+match.Round+" · "+match.PlayerWins+" : "+match.OpponentWins+(match.Paused?" · PAUZA":match.Phase==MatchPhase.Countdown?" · "+match.Countdown:"");
            if(adventure!=null)hud.text=Display(definitions[0].id)+" · "+Math.Ceiling(match.Player.Hp)+" HP · "+(int)match.Player.Energy+" EN     "+(int)(adventure.ElapsedMs/60000)+":"+((int)(adventure.ElapsedMs/1000)%60).ToString("00")+"\nSZLAK "+adventure.Defeated+"/6 · "+adventure.Score+" PKT · "+(string)adventure.Route["chapters"][adventure.Chapter]["name"];
            pauseLabel.text=match.Paused?"WZNÓW":"PAUZA";
            while(match.TryDequeue(out var e))
            {
                fightAudio?.Consume(e,match,adventure!=null?null:mediaCatalog.Arenas[arenaIndex]);
                if(e.Kind=="hit"||e.Kind=="slam")status.text="TRAFIENIE · "+Display(match.Fighter(e.Actor).Configuration.Character)+" · "+e.Region+" · "+e.Damage;
            }
        }
        void CompleteMatch()
        {
            resultApplied=true;ReleaseControls();controls.SetActive(false);resultPanel.SetActive(true);
            arenaMedia.SetPaused(true);fightAudio.Stop();
            var outcome=match.Winner<0?BoutOutcome.Draw:match.Winner==0?BoutOutcome.Win:BoutOutcome.Loss;
            campaign?.Result(outcome);survival?.Result(outcome,match.Player.Hp);
            result.text=(outcome==BoutOutcome.Draw?"REMIS":outcome==BoutOutcome.Win?"WYGRYWASZ":"WYGRYWA PRZECIWNIK")+"\n"+match.PlayerWins+" : "+match.OpponentWins;
            if(campaign?.Finished==true)result.text+="\n"+(campaign.Champion==campaign.Player?"KAMPANIA UKOŃCZONA":"KONIEC KAMPANII");
            if(survival!=null)result.text+="\nSURVIVAL: "+survival.Score;
        }
        void ContinueSession()
        {
            if(loading)return;
            if(adventure!=null){ShowSelection();return;}
            if(campaign!=null){if(campaign.Finished){ShowSelection();return;}campaignOpponent=campaign.Next();}
            else if(survival!=null){if(!survival.Advance()){ShowSelection();return;}campaignOpponent=survival.Next();}
            StartCoroutine(LoadMatch(Variants[variantIndex],campaignOpponent??Roster[opponentIndex],survival?.Hp??100));
        }
        void TogglePause(){if(match==null||loading||match.Phase==MatchPhase.Complete||adventure?.Phase==AdventurePhase.Complete||adventure?.Phase==AdventurePhase.Dead)return;Pause(match.Paused?false:true);}
        void Pause(bool value){match?.SetPaused(value);arenaMedia?.SetPaused(value);adventureWorld?.SetPaused(value);fightAudio?.SetPaused(value);ReleaseControls();}
        void ReleaseControls(){foreach(var button in buttons)button.Release();match?.ReleaseInputs();}
        void ShowSelection()
        {generation++;StopAllCoroutines();ClearAdventure();loading=false;match=null;ClearActors();if(arenaMedia)arenaMedia.Clear();if(fightAudio)fightAudio.Stop();ReleaseControls();selection.SetActive(true);controls.SetActive(false);resultPanel.SetActive(false);hud.text="";RefreshSelection();}
        void ClearActors(){for(var i=0;i<2;i++){if(actors[i])Destroy(actors[i]);actors[i]=null;poses[i]=null;definitions[i]=null;}}
        void OnApplicationPause(bool pause){applicationSuspended=pause;if(pause)Pause(true);}
        void OnApplicationFocus(bool focus){applicationSuspended=!focus;if(!focus)Pause(true);}
        void OnDestroy(){disposed=true;generation++;ClearAdventure();ClearActors();if(canvas)Destroy(canvas.gameObject);}
    }
}
