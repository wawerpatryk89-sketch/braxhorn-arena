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
        public Shader bloodShader;
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
        NativeBloodEffects blood;
        int bloodRound;
        double bloodCamera;
        int arenaIndex;
        CampaignRun campaign;
        SurvivalRun survival;
        Font font;
        Canvas canvas;
        GameObject selection, controls, resultPanel;
        Text status, hud, chosen, result, pauseLabel, blockLabel;
        CombatConfiguration controlConfiguration;
        TouchFightButton left,right,block,down,sprint,grab;
        TouchFightButton jumpButton,comboButton,energyButton;
        readonly DirectionTap directionTap=new DirectionTap();
        int directionInputFrame=-1;
        int variantIndex,opponentIndex=1,modeIndex,difficulty=1,generation;
        bool loading, resultApplied, disposed, applicationSuspended;
        bool spectatorRequested,spectating;
        string error, campaignOpponent;
        RectTransform safeRoot,uiRoot;

        void Start()
        {
            Application.targetFrameRate=60;QualitySettings.skinWeights=SkinWeights.Unlimited;
            Screen.sleepTimeout=SleepTimeout.NeverSleep;
            font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            BuildUi();LoadProgress();
            try{mediaCatalog=ArenaMediaCatalog.Load();arenaMedia=gameObject.AddComponent<NativeArenaMedia>();fightAudio=gameObject.AddComponent<NativeFightAudio>();blood=gameObject.AddComponent<NativeBloodEffects>();blood.Initialize(bloodShader);BuildCinematics();ShowSelection();ShowMenuPage(menuTitle);}
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
            BuildMenuUi();
            controls=Panel("Controls",new Rect(0,440,1024,136),Color.clear);
            left=Hold("◀",new Rect(16,54,74,62));right=Hold("▶",new Rect(98,54,74,62));
            left.Pressed=()=>DirectionPressed(-1);right.Pressed=()=>DirectionPressed(1);left.Released=()=>directionTap.Release(-1);right.Released=()=>directionTap.Release(1);
            down=Hold("DÓŁ",new Rect(180,54,74,62));sprint=Hold("BIEG",new Rect(16,0,96,44));
            block=Hold("GARDA",new Rect(122,0,132,44));grab=Hold("CHWYT",new Rect(278,54,96,62));
            blockLabel=block.GetComponentInChildren<Text>();
            block.Pressed=()=>{if(match?.Fighter(DuelSide).Configuration.Character=="NINA")PressLocal(FightButton.Evade);};
            grab.Pressed=()=>{ReadInput();PressLocal(FightButton.Grab);};
            Tap("UNIK",new Rect(278,0,96,44),FightButton.Evade);
            jumpButton=Tap("SKOK",new Rect(384,54,96,62),FightButton.Jump);
            Tap("P1",new Rect(672,54,76,62),FightButton.Punch);Tap("P2",new Rect(758,54,76,62),FightButton.Heavy);
            Tap("K1",new Rect(844,54,76,62),FightButton.Kick);Tap("K2",new Rect(930,54,76,62),FightButton.HeavyKick);
            comboButton=Tap("COMBO",new Rect(672,0,156,44),FightButton.Combo);energyButton=Tap("ENERGIA",new Rect(844,0,162,44),FightButton.Energy);
            hud=Label(uiRoot,"HUD",new Rect(24,56,976,68),22);
            pauseControl=Click(uiRoot,"PAUZA",new Rect(850,12,150,36),TogglePause);pauseLabel=pauseControl.GetComponentInChildren<Text>();
            soundControl=Click(uiRoot,"DŹWIĘK",new Rect(708,12,132,36),ToggleSound);
            resultPanel=Panel("Result",new Rect(240,150,544,250),new Color(.03f,.04f,.05f,.97f));
            result=Label(resultPanel.transform,"Result text",new Rect(24,20,496,104),26);
            resultOnlineStatus=Label(resultPanel.transform,"Server result",new Rect(24,128,496,30),14);
            Click(resultPanel.transform,"DALEJ",new Rect(24,160,230,60),ContinueSession);
            Click(resultPanel.transform,"MENU",new Rect(278,160,242,60),ShowSelection);
            resultPanel.SetActive(false);controls.SetActive(false);BuildTrainingUi();BuildChallengeUi();BuildReplayUi();BuildPauseUi();BuildDuelUi();
        }
        GameObject Panel(string name,Rect rect,Color color)
        {var obj=new GameObject(name,typeof(RectTransform),typeof(Image));Place(obj,uiRoot,rect);obj.GetComponent<Image>().color=color;obj.GetComponent<Image>().raycastTarget=color.a>0;return obj;}
        void Place(GameObject obj,Transform parent,Rect rect)
        {var t=obj.GetComponent<RectTransform>();t.SetParent(parent,false);t.anchorMin=t.anchorMax=new Vector2(0,1);t.pivot=new Vector2(0,1);t.anchoredPosition=new Vector2(rect.x,-rect.y);t.sizeDelta=rect.size;}
        Text Label(Transform parent,string name,Rect rect,int size)
        {var obj=new GameObject(name,typeof(RectTransform),typeof(Text));Place(obj,parent,rect);var text=obj.GetComponent<Text>();text.font=font;text.fontSize=size;text.color=Color.white;text.raycastTarget=false;text.supportRichText=false;text.verticalOverflow=VerticalWrapMode.Overflow;return text;}
        GameObject Click(Transform parent,string text,Rect rect,Action action)
        {
            var obj=new GameObject(text,typeof(RectTransform),typeof(Image),typeof(Button));Place(obj,parent,rect);obj.GetComponent<Image>().color=new Color(.18f,.20f,.23f,.96f);
            var label=Label(obj.transform,"Label",new Rect(4,2,rect.width-8,rect.height-4),18);label.alignment=TextAnchor.MiddleCenter;
            label.text=text;obj.GetComponent<Button>().onClick.AddListener(()=>action());return obj;
        }
        TouchFightButton Hold(string text,Rect rect)
        {var obj=Click(controls.transform,text,rect,()=>{});var button=obj.AddComponent<TouchFightButton>();buttons.Add(button);return button;}
        TouchFightButton Tap(string text,Rect rect,FightButton action)
        {var button=Hold(text,rect);button.Pressed=()=>{ReadInput();PressLocal(action);};return button;}
        void DirectionPressed(int direction)
        {if(duel!=null&&DuelSide==1)
            {if(!DuelConnected(NetworkNow)||duelUserPaused||applicationSuspended)return;var face=duelView?.Latest==null?-1:(int)duelView.Latest["actors"][1]["face"];var retreat=directionTap.Press(direction,NetworkNow,face);duelInput.Press(direction<0?"left":"right",retreat);return;}
            if(match==null||match.Paused||match.Phase!=MatchPhase.Fighting){directionTap.Reset();return;}if(directionTap.Press(direction,Time.realtimeSinceStartupAsDouble*1000,match.Player.Face))match.Press(0,FightButton.Retreat);}
        void RefreshSelection() {RefreshTrainingLabels();RefreshMenuUi();chosen.text="POSTAĆ: "+Display(Variants[variantIndex])+"\nPRZECIWNIK: "+Display(Roster[opponentIndex])+"\n"+ModeNames[modeIndex]+" · "+new[]{"ŁATWY","ŚREDNI","TRUDNY"}[difficulty]+"\n"+(Modes[modeIndex]=="adventure"?(string)mediaCatalog?.Routes[routeIndex]["title"]:(mediaCatalog?.Arenas[arenaIndex].name??"BRAK KATALOGU AREN"));}
        void BeginSession()
        {
            if(loading||mediaCatalog==null)return;
            spectating=Modes[modeIndex]=="fight"&&spectatorRequested&&pendingChallenge==null;
            if(Variants[variantIndex].Contains("_")&&online?.Owns(Variants[variantIndex])!=true)variantIndex=Array.IndexOf(Variants,Base(Variants[variantIndex]));
            BeginProgressSession();
            challengeRun=pendingChallenge==null?null:new ChallengeRun(pendingChallenge,Base(Variants[variantIndex]));pendingChallenge=null;
            if(Modes[modeIndex]=="adventure"){StartCoroutine(LoadAdventure());return;}
            campaign=null;survival=null;var mode=Modes[modeIndex];var player=Base(Variants[variantIndex]);
            if(mode=="arcade"||mode=="tournament")campaign=new CampaignRun(mode,player,Roster,random.NextDouble);
            if(mode=="survival")survival=new SurvivalRun(player,random.NextDouble,challengeRun?.Definition.Goal??10);
            campaignOpponent=campaign?.Next()??survival?.Next()??challengeRun?.Definition.Opponent??Roster[opponentIndex];
            StartCoroutine(LoadMatch(spectating?Base(Variants[variantIndex]):Variants[variantIndex],campaignOpponent,survival?.Hp??100));
        }
        IEnumerator LoadMatch(string player,string opponent,double hp,bool intro=true)
        {
            loading=true;resultApplied=false;error=null;CloseMenuOverlays();var requestId=++generation;
            ResetReplay();
            matchRecordId=Guid.NewGuid().ToString("N");
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
                if(duel==null)match.UseCpu(1,(CpuLevel)difficulty,match.Training?TrainingModes[trainingMode]:TrainingBehavior.Spar,DrillMove);
                if(spectating)match.UseCpu(0,(CpuLevel)difficulty);
                var worldPerPixel=3.25f/640/(float)match.Scale;
                matchCamera.orthographic=true;matchCamera.orthographicSize=(float)match.Height*worldPerPixel/2;
                matchCamera.transform.position=new Vector3(0,(float)(match.Floor-match.Height/2)*worldPerPixel,-8);
                BeginLoadedMatch(intro);
            }
            catch(Exception e){Debug.LogException(e);Fail(e.Message);}
        }
        void Fail(string message){StopDuel();ResetReplay();CloseMenuOverlays();if(trainingPanel)trainingPanel.SetActive(false);if(trainingOpen)trainingOpen.SetActive(false);generation++;ReleaseControls();ClearAdventure();ClearActors();match=null;controls.SetActive(false);loading=false;error=message;hud.text="Nie udało się wczytać meczu: "+message;selection.SetActive(true);ShowMenuPage(menuRoster);status.text=message;if(arenaMedia)arenaMedia.Clear();if(fightAudio)fightAudio.Stop();}
        void Update()
        {
            if(safeRoot){var r=Screen.safeArea;safeRoot.anchorMin=r.min/new Vector2(Screen.width,Screen.height);safeRoot.anchorMax=r.max/new Vector2(Screen.width,Screen.height);if(uiRoot)uiRoot.localScale=Vector3.one*Mathf.Min(safeRoot.rect.width/1024,safeRoot.rect.height/576);}
            if(arenaMedia&&fightAudio)arenaMedia.Sound(fightAudio.Muted,fightAudio.Duck);
            RefreshMenuAudio();
            if(cinema?.Active==true){if(Input.GetKeyDown(KeyCode.Escape))cinema.Skip();return;}
            UpdateMenuInput();
            if(UpdateDuel())return;
            if(loading||match==null)return;
            if(replay.Active){UpdateReplay();return;}
            if(adventure!=null){UpdateAdventure();return;}
            if(arenaMedia.Error!=null&&error!=arenaMedia.Error){error=arenaMedia.Error;Pause(true);status.text=error;}
            if(Input.GetKeyDown(KeyCode.Escape))TogglePause();ReadInput();
            var keys=new[]{KeyCode.J,KeyCode.K,KeyCode.U,KeyCode.I,KeyCode.L,KeyCode.Space,KeyCode.O,KeyCode.P};
            if(!spectating)for(var i=0;i<keys.Length;i++)if(Input.GetKeyDown(keys[i]))match.Press(0,(FightButton)i);
            match.Advance(Math.Min(100,Time.unscaledDeltaTime*1000));Present();
            if(match.Phase==MatchPhase.Complete&&!resultApplied&&!BeginReplay())CompleteMatch();
        }
        void ReadInput()
        {
            if(match==null||spectating)return;
            if(directionInputFrame!=Time.frameCount)
            {
                directionInputFrame=Time.frameCount;
                if(Input.GetKeyDown(KeyCode.A)||Input.GetKeyDown(KeyCode.LeftArrow))DirectionPressed(-1);
                if(Input.GetKeyDown(KeyCode.D)||Input.GetKeyDown(KeyCode.RightArrow))DirectionPressed(1);
                if(Input.GetKeyUp(KeyCode.A)||Input.GetKeyUp(KeyCode.LeftArrow))directionTap.Release(-1);
                if(Input.GetKeyUp(KeyCode.D)||Input.GetKeyUp(KeyCode.RightArrow))directionTap.Release(1);
                if(Input.GetKeyDown(KeyCode.G))PressLocal(FightButton.Grab);
                if(Input.GetKeyDown(KeyCode.LeftControl)&&match.Fighter(DuelSide).Configuration.Character=="NINA")PressLocal(FightButton.Evade);
            }
            var direction=(right.Held||Input.GetKey(KeyCode.D)||Input.GetKey(KeyCode.RightArrow)?1:0)-(left.Held||Input.GetKey(KeyCode.A)||Input.GetKey(KeyCode.LeftArrow)?1:0);
            var input=new FightInput(direction,block.Held||Input.GetKey(KeyCode.LeftControl),down.Held||Input.GetKey(KeyCode.S),sprint.Held||Input.GetKey(KeyCode.LeftShift)||directionTap.SprintHeld,grab.Held||Input.GetKey(KeyCode.G));
            if(duel!=null&&DuelSide==1)duelInput.Set(input,!applicationSuspended&&!duelUserPaused&&DuelConnected(NetworkNow));else match.SetInput(0,input);
        }
        void Present()
        {
            if(blood)
            {
                if(bloodRound!=match.Round){blood.Clear(true);bloodRound=match.Round;}
                if(adventure!=null){blood.Shift(-(adventure.Camera-bloodCamera)/adventure.Span,match.Width);bloodCamera=adventure.Camera;}
            }
            trainingOpen.SetActive(match.Training);
            RefreshFightControls(match.Fighter(DuelSide).Configuration);
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
            if(spectating)hud.text+=" · KOMPUTER KONTRA KOMPUTER";
            if(adventure!=null)hud.text=Display(definitions[0].id)+" · "+Math.Ceiling(match.Player.Hp)+" HP · "+(int)match.Player.Energy+" EN     "+(int)(adventure.ElapsedMs/60000)+":"+((int)(adventure.ElapsedMs/1000)%60).ToString("00")+"\nSZLAK "+adventure.Defeated+"/6 · "+adventure.Score+" PKT · "+(string)adventure.Route["chapters"][adventure.Chapter]["name"];
            pauseLabel.text=match.Paused?"WZNÓW":"PAUZA";
            while(!match.Paused&&match.TryDequeue(out var e))
            {
                fightAudio?.Consume(e,match,adventure!=null?null:mediaCatalog.Arenas[arenaIndex]);
                blood?.Hit(e,match);
                if(adventure==null&&!match.Training&&(e.Kind=="hit"||e.Kind=="slam"||e.Kind=="swing"||e.Kind=="block"||e.Kind=="step"||e.Kind=="land"))replay.Sound(e);
                if(e.Kind.StartsWith("objective:",StringComparison.Ordinal))NoteChallenge(e.Kind.Substring(10));
                if(e.Kind=="hit"||e.Kind=="slam")status.text="TRAFIENIE · "+Display(match.Fighter(e.Actor).Configuration.Character)+" · "+e.Region+" · "+e.Damage;
            }
            if(challengeRun!=null)hud.text+="\n"+(challengeRun.Done?"✓ ":"")+challengeRun.Definition.Title+" "+challengeRun.Count+"/"+challengeRun.Definition.Goal;
            if(duel==null)CaptureReplay();
            blood?.Present(match,Math.Min(50,Time.unscaledDeltaTime*1000));
        }
        void RefreshFightControls(CombatConfiguration config)
        {
            if(controlConfiguration!=config)
            {
                controlConfiguration=config;
                jumpButton.gameObject.SetActive(config.Has("JUMP"));comboButton.gameObject.SetActive(config.Has("COMBO")&&config["COMBO"].Attack);energyButton.gameObject.SetActive(config.Has("ENERGY_SPECIAL"));
                grab.gameObject.SetActive(config.Has("COMBO")&&(bool?)config["IDLE"].Source["pairedCombat"]?["enabled"]==true);
                blockLabel.text=config.Character=="NINA"?"UNIK":"GARDA";
            }
            if(duel!=null&&DuelSide==1){jumpButton.gameObject.SetActive(false);energyButton.gameObject.SetActive(false);}
        }
        void CompleteMatch()
        {
            resultApplied=true;ReleaseControls();controls.SetActive(false);resultPanel.SetActive(true);
            arenaMedia.SetPaused(true);fightAudio.Stop();
            var outcome=match.Winner<0?BoutOutcome.Draw:match.Winner==0?BoutOutcome.Win:BoutOutcome.Loss;
            campaign?.Result(outcome);survival?.Result(outcome,match.Player.Hp);
            result.text=(outcome==BoutOutcome.Draw?"REMIS":outcome==BoutOutcome.Win?"WYGRYWASZ":"WYGRYWA PRZECIWNIK")+"\n"+match.PlayerWins+" : "+match.OpponentWins;
            if(spectating)result.text=(outcome==BoutOutcome.Draw?"REMIS":"ZWYCIĘZCA: "+Display(definitions[match.Winner].id))+"\n"+match.PlayerWins+" : "+match.OpponentWins+"\nPOKAZ — BEZ ZAPISU WYNIKU";
            if(campaign?.Finished==true)result.text+="\n"+(campaign.Champion==campaign.Player?"KAMPANIA UKOŃCZONA":"KONIEC KAMPANII");
            if(survival!=null)result.text+="\nSURVIVAL: "+survival.Score;
            SubmitServerMatch();
            SaveMatchProgress();
            CompleteChallengeMatch();
            PlayVictory();
        }
        void ContinueSession()
        {
            if(loading)return;
            if(adventure!=null){ShowSelection();return;}
            if(campaign!=null){if(campaign.Finished){ShowSelection();return;}campaignOpponent=campaign.Next();}
            else if(survival!=null){if(!survival.Advance()){ShowSelection();return;}campaignOpponent=survival.Next();}
            else {BeginProgressSession();if(challengeRun!=null)challengeRun=new ChallengeRun(challengeRun.Definition,challengeRun.Fighter);}
            StartCoroutine(LoadMatch(spectating?Base(Variants[variantIndex]):Variants[variantIndex],campaignOpponent??Roster[opponentIndex],survival?.Hp??100,campaign!=null||survival!=null));
        }
        void TogglePause(){if(duel!=null){Pause(!duelUserPaused);return;}if(replay.Active){Pause(!match.Paused);return;}if(trainingPanel&&trainingPanel.activeSelf){CloseTraining();return;}if(match==null||loading||match.Phase==MatchPhase.Complete||adventure?.Phase==AdventurePhase.Complete||adventure?.Phase==AdventurePhase.Dead)return;Pause(match.Paused?false:true);}
        void Pause(bool value){if(duel!=null){duelUserPaused=value;duelInput?.Clear();duelHost?.DropPending();match?.SetPaused(true);ReleaseControls();RefreshPauseUi();return;}match?.SetPaused(value);arenaMedia?.SetPaused(value||replay.Active);adventureWorld?.SetPaused(value);fightAudio?.SetPaused(value);ReleaseControls();RefreshPauseUi();}
        void ReleaseControls(){directionTap.Reset();foreach(var button in buttons)button.Release();match?.ReleaseInputs();}
        void ShowSelection()
        {StopDuel();ResetReplay();challengeRun=null;pendingChallenge=null;if(challengesPanel)challengesPanel.SetActive(false);if(trainingPanel)trainingPanel.SetActive(false);if(trainingOpen)trainingOpen.SetActive(false);generation++;StopAllCoroutines();CloseMenuOverlays();ClearAdventure();loading=false;match=null;ClearActors();if(arenaMedia)arenaMedia.Clear();if(fightAudio)fightAudio.Stop();ReleaseControls();selection.SetActive(true);controls.SetActive(false);resultPanel.SetActive(false);hud.text="";RefreshSelection();ShowMenuPage(menuRoster);}
        void ClearActors(){if(blood){blood.Clear();blood.Visible(true);}bloodRound=0;bloodCamera=0;for(var i=0;i<2;i++){if(actors[i])Destroy(actors[i]);actors[i]=null;poses[i]=null;definitions[i]=null;}}
        void OnApplicationPause(bool pause){applicationPaused=pause;RefreshApplicationState();}
        void OnApplicationFocus(bool focus){applicationFocused=focus;RefreshApplicationState();}
        void OnDestroy(){disposed=true;StopDuel();cinema?.Stop();online?.Dispose();ClearAccountSecrets();generation++;ClearAdventure();ClearActors();if(canvas)Destroy(canvas.gameObject);}
    }
}
