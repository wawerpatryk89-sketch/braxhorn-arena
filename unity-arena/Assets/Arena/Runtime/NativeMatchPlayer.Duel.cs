using System;
using System.Collections;
using System.Linq;
using System.Threading.Tasks;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        GameObject menuDuel,duelResults;
        Text duelMessage,duelChoice,duelArena,duelResultText,duelResultStatus;
        Button duelConfirm,duelDispute;
        InputField duelCode;
        ArenaDuelSession duel;
        DuelInputQueue duelInput;
        DuelHostInput duelHost;
        DuelRemoteView duelView;
        Task duelPoll,duelReport;
        Task<ArenaIceServer[]> duelIce;
        NativeDuelPeer duelPeer;
        double duelNextDirect;
        bool duelEntryBusy,duelPreparing,duelUserPaused,duelWasConnected;
        long duelSnapshot,duelReceived;
        int duelEntry;
        double duelNextPoll,duelTerminalAt=-1;
        long duelSoundId,duelHeard;
        readonly JArray duelSounds=new JArray();
        readonly FighterPresentation[] duelPoses=new FighterPresentation[2];
        string duelCallout;
        bool duelPrefight=true;
        int DuelSide=>duel?.Lease.Role=="guest"?1:0;
        double NetworkNow=>Time.realtimeSinceStartupAsDouble*1000;
        void BuildDuelUi()
        {
            menuDuel=MenuPage("Online duel");MenuHeading(menuDuel,"WALKA ONLINE");
            duelChoice=Label(menuDuel.transform,"Your fighter",new Rect(44,100,936,52),28);
            Label(menuDuel.transform,"Lobby hint",new Rect(44,160,936,52),18).text="Utwórz pokój i przekaż kod rywalowi albo dołącz do jego pokoju.";
            duelArena=Click(menuDuel.transform,"",new Rect(44,228,430,54),()=>{if(duel==null&&!duelEntryBusy){arenaIndex=(arenaIndex+1)%mediaCatalog.Arenas.Length;RefreshDuelMenu();}}).GetComponentInChildren<Text>();
            Click(menuDuel.transform,"UTWÓRZ POKÓJ",new Rect(44,304,430,54),()=>EnterDuel(false));
            duelCode=AccountInput("Kod pokoju (8 znaków)",new Rect(540,228,440,54),false,8,menuDuel.transform);
            Click(menuDuel.transform,"DOŁĄCZ KODEM",new Rect(540,304,440,54),()=>EnterDuel(true));
            duelMessage=Label(menuDuel.transform,"Room status",new Rect(44,390,936,110),22);
            Click(menuDuel.transform,"‹ WRÓĆ / OPUŚĆ",new Rect(32,510,264,46),()=>{ShowSelection();ShowMenuPage(menuModes);});
            Click(menuDuel.transform,"KOPIUJ KOD",new Rect(714,510,278,46),()=>{if(duel!=null)GUIUtility.systemCopyBuffer=duel.Lease.Code;});
            duelResults=Panel("Duel result confirmation",new Rect(202,134,620,324),new Color(.03f,.04f,.05f,.98f));
            duelResultText=Label(duelResults.transform,"Score",new Rect(24,18,572,70),28);
            duelResultStatus=Label(duelResults.transform,"Confirmation",new Rect(24,92,572,74),18);
            duelConfirm=Click(duelResults.transform,"POTWIERDZAM WYNIK",new Rect(24,180,280,54),()=>{if(duel!=null)duelReport=duel.Confirm();}).GetComponent<Button>();
            duelDispute=Click(duelResults.transform,"ZGŁOŚ PROBLEM",new Rect(320,180,276,54),()=>{if(duel!=null)duelReport=duel.Dispute();}).GetComponent<Button>();
            Click(duelResults.transform,"MENU",new Rect(192,254,236,46),ShowSelection);duelResults.SetActive(false);
            Click(menuModes.transform,"WALKA ONLINE",new Rect(450,510,254,46),OpenDuel);
        }
        void RefreshDuelMenu()
        {duelChoice.text="TWÓJ ZAWODNIK: "+Display(Variants[variantIndex]);duelArena.text="ARENA: "+mediaCatalog.Arenas[arenaIndex].name;}
        void OpenDuel(){RefreshDuelMenu();duelMessage.text="Wybierz pokój. Wynik wymaga potwierdzenia obu graczy.";ShowMenuPage(menuDuel);}
        void EnterDuel(bool join)
        {
            if(duel!=null||duelEntryBusy)return;
            var code=duelCode.text.Trim().ToUpperInvariant();
            if(join&&!System.Text.RegularExpressions.Regex.IsMatch(code,"^[A-F0-9]{8}$")){duelMessage.text="Kod pokoju ma 8 znaków: 0–9, A–F.";return;}
            try{EnsureOnline();}catch(Exception){duelMessage.text="Nieprawidłowy adres serwera.";return;}
            StartCoroutine(EnterDuelRequest(join,code,++duelEntry));
        }
        IEnumerator EnterDuelRequest(bool join,string code,int attempt)
        {
            duelEntryBusy=true;duelMessage.text="Łączenie…";DuelLease lease=null;
            async Task Enter()
            {
                await online.RefreshAccount();
                var outfit=Variants[variantIndex];if(outfit.Contains("_")&&!online.Owns(outfit))outfit=Base(outfit);
                lease=join?await online.JoinDuel(code,Base(outfit),outfit):await online.CreateDuel(Base(outfit),outfit,mediaCatalog.Arenas[arenaIndex].id);
                // Leaving the lobby while HTTP was pending must not orphan a
                // late room or activate it on top of a different match.
                if(disposed||attempt!=duelEntry)await online.LeaveDuel(lease);
            }
            var task=Enter();while(!task.IsCompleted)yield return null;
            if(disposed||attempt!=duelEntry)yield break;
            duelEntryBusy=false;
            if(task.IsFaulted||task.IsCanceled){duelMessage.text=ServiceMessage(task.Exception?.GetBaseException());yield break;}
            duel=new ArenaDuelSession(online,lease,NetworkNow);duelInput=new DuelInputQueue();duelHost=new DuelHostInput();duelSnapshot=duelReceived=0;duelNextPoll=0;duelTerminalAt=-1;duelPreparing=duelUserPaused=duelWasConnected=false;duelView=null;
            duelSounds.Clear();duelSoundId=duelHeard=duelEffectsId=0;duelCallout=null;duelPrefight=true;
            fightAudio.NetworkSound=(key,volume,pitch,channel)=>
            {if(duel==null||DuelSide!=0)return;duelSounds.Add(new JObject{["id"]=++duelSoundId,["key"]=key,["volume"]=volume,["pitch"]=pitch,["channel"]=channel});while(duelSounds.Count>24)duelSounds.First.Remove();};
            duelMessage.text="KOD POKOJU: "+lease.Code+"\nOczekiwanie na drugiego gracza…";
        }
        void StopDuel()
        {
            duelEntry++;duelEntryBusy=false;var old=duel;duel=null;
            if(old!=null)_=old.Leave();duelPoll=duelReport=null;duelInput=null;duelHost=null;duelView=null;
            duelIce=null;if(duelPeer){duelPeer.Close();Destroy(duelPeer);duelPeer=null;}
            if(fightAudio)fightAudio.NetworkSound=null;duelSounds.Clear();
            if(duelResults)duelResults.SetActive(false);
        }
        void DuelLoaded()
        {
            duel.Ready=true;loading=false;match.SetPaused(true);duelView=new DuelRemoteView(match.Player.Configuration,match.Opponent.Configuration,match.Width,match.Height);
            duelIce=ReadDuelIce(duel.Lease);duelNextDirect=0;
            controls.SetActive(false);Present();duelNextPoll=0;
        }
        async Task<ArenaIceServer[]> ReadDuelIce(DuelLease lease)
        {try{return await online.ReadIce(lease);}catch(Exception){return ArenaOnlineClient.FallbackIce();}}
        bool DuelConnected(double now)=>duel!=null&&(duel.Connected(now)||duel.Playing&&duelPeer&&duelPeer.Alive);
        JObject DuelPacket(double now,bool signaling)
        {
            var packet=DuelSide==0?match.NetworkSnapshot(++duelSnapshot,duelHost.Acknowledged,duelHost.Sequence,now):duelInput.Packet();
            if(DuelSide==0){packet["sounds"]=duelSounds.DeepClone();packet["blood"]=blood.NetworkSnapshot(match);}
            if(signaling&&duelPeer)packet["signal"]=duelPeer.Signal;return packet;
        }
        bool UpdateDuel()
        {
            if(duel==null)return false;
            var now=NetworkNow;
            if(duelIce?.IsCompleted==true)
            {
                var servers=duelIce.Result;duelIce=null;var owner=duel;duelPeer=gameObject.AddComponent<NativeDuelPeer>();
                if(!duelPeer.Initialize(DuelSide==0,servers,packet=>
                {if(duel!=owner)return;if(DuelSide==0)duelHost.Receive(packet);else if(duelView.Receive(packet,NetworkNow))duelInput.Acknowledge((long)packet["ack"]);},()=>{if(duel==owner)duelNextPoll=0;}))
                {Destroy(duelPeer);duelPeer=null;}
            }
            if(duelPoll?.IsCompleted==true)
            {
                duelPoll=null;duelNextPoll=now+(duel.Playing?(duelPeer&&duelPeer.Alive?1000:25):500);
                var r=duel.Room;
                if(r!=null)
                {
                    duelMessage.text="KOD POKOJU: "+duel.Lease.Code+"\n"+(string)r["hostName"]+" — "+(string)r["guestName"]+"\n"+duel.Status;
                    if(!duelPreparing&&r["guestFighter"]?.Type==JTokenType.String&&(bool)r["cosmeticsReady"])
                    {
                        duelPreparing=true;modeIndex=0;spectating=false;campaign=null;survival=null;challengeRun=null;pendingChallenge=null;
                        arenaIndex=Array.FindIndex(mediaCatalog.Arenas,a=>a.id==(string)r["arena"]);
                        StartCoroutine(LoadMatch((string)r["hostOutfit"],(string)r["guestOutfit"],100,false));
                    }
                    var seq=(long)r["seq"];
                    var remote=(DuelSide==0?r["input"]:r["snapshot"]) as JObject;if(duelPeer&&remote?["signal"] is JObject signal)duelPeer.Accept(signal);
                    if(duel.Ready&&seq>duelReceived)
                    {
                        if(DuelSide==0&&r["input"] is JObject input){duelHost.Receive(input);duelReceived=seq;}
                        if(DuelSide==1&&r["snapshot"] is JObject packet&&duelView.Receive(packet,now))
                        {duelReceived=seq;duelInput.Acknowledge((long)packet["ack"]);}
                    }
                }
            }
            if(duel.Closed||duel.Expired(now)&&!(duelPeer&&duelPeer.Alive))
            {var message=duel.Closed?duel.Status:"Połączenie przerwane. Walka nie otrzymała wyniku.";ShowSelection();OpenDuel();duelMessage.text=message;return true;}
            var connected=DuelConnected(now);
            if(duelWasConnected&&!connected){duelInput.Clear();duelHost.DropPending();ReleaseControls();}duelWasConnected=connected;
            if(duel.Ready&&match!=null)
            {
                if(Input.GetKeyDown(KeyCode.Escape))TogglePause();
                var paused=!connected||applicationSuspended||duelUserPaused||DuelSide==0&&!duelHost.Visible;
                arenaMedia.SetPaused(paused||duelTerminalAt>=0);fightAudio.SetPaused(paused);
                if(DuelSide==0)
                {
                    if(match.Paused!=paused){match.SetPaused(paused);ReleaseControls();}
                    ReadInput();ReadDuelKeys();duelHost.Apply(match);match.Advance(Math.Min(100,Time.unscaledDeltaTime*1000));Present();
                    if(match.Phase==MatchPhase.Complete)DuelTerminal(match.PlayerWins,match.OpponentWins,now);
                }
                else
                {
                    ReadInput();ReadDuelKeys();PresentRemoteDuel(now);
                    if(duelView.Complete)DuelTerminal((int)duelView.Latest["state"]["wins"][0],(int)duelView.Latest["state"]["wins"][1],now);
                }
                pauseLabel.text=duelUserPaused?"WZNÓW":"PAUZA";
                controls.SetActive(connected&&!applicationSuspended&&!duelUserPaused&&duelTerminalAt<0);RefreshPauseUi();
                status.text=(DuelSide==0?"TY: LEWA STRONA":"TY: PRAWA STRONA")+" · "+(connected?(duelPeer&&duelPeer.Alive?"ONLINE":"POŁĄCZENIE PRZEZ SERWER"):"CZEKAM NA POŁĄCZENIE RYWALA");
            }
            if(duel.Ready&&duel.Playing&&duelPeer&&duelPeer.Open&&now>=duelNextDirect)
            {duelPeer.Send(DuelPacket(now,false));duelNextDirect=now+(DuelSide==0?1000.0/30:20);}
            if(duelPoll==null&&now>=duelNextPoll)
            {
                JObject packet=duel.Ready?DuelPacket(now,true):null;
                duelPoll=duel.Poll(now,packet);
            }
            if(duelTerminalAt>=0&&now-duelTerminalAt>=2500)
            {
                duelResults.SetActive(true);duelResults.transform.SetAsLastSibling();duelResultStatus.text=duel.ResultStatus==""?"Sprawdź wynik i potwierdź go. Wymagane jest potwierdzenie obu graczy.":duel.Status;
                duelConfirm.interactable=!duel.Reporting&&!duel.ConfirmedByMe&&duel.ResultStatus!="confirmed"&&duel.ResultStatus!="disputed";
                duelDispute.interactable=!duel.Reporting&&duel.ResultStatus!="confirmed"&&duel.ResultStatus!="disputed";
            }
            return true;
        }
        void ReadDuelKeys()
        {
            var keys=new[]{KeyCode.J,KeyCode.K,KeyCode.U,KeyCode.I,KeyCode.L,KeyCode.Space,KeyCode.O,KeyCode.P};
            for(var i=0;i<keys.Length;i++)if(Input.GetKeyDown(keys[i]))PressLocal((FightButton)i);
        }
        void DuelTerminal(int host,int guest,double now)
        {
            if(duelTerminalAt>=0)return;duelTerminalAt=now;duel.Terminal(host,guest);ReleaseControls();controls.SetActive(false);
            duelResultText.text=(host==guest?"REMIS":(host>guest)==(DuelSide==0)?"WYGRYWASZ":"WYGRYWA RYWAL")+" · "+host+" : "+guest;
            duelResultStatus.text="Sprawdź wynik i potwierdź go. Wymagane jest potwierdzenie obu graczy.";
        }
        void PresentRemoteDuel(double now)
        {
            var packet=duelView.Latest;if(packet==null)return;
            RefreshFightControls(match.Opponent.Configuration);
            for(var side=0;side<2;side++)
            {
                var p=duelView.Pose(side,now);duelPoses[side]=p;RenderFighter(side,p,(double)packet["state"]["poseClock"],(bool?)packet["comboContactHold"]==true);
                var motion=packet["actors"][side]["strikeMotion"];
                var gait=motion is JObject?((bool)motion["run"]?"RUN":"WALK_FORWARD"):null;
                poses[side].ApplyMovingGait(gait,(double?)motion?["clock"]/1000??0,(double?)motion?["weight"]??0);
            }
            if((bool?)packet["neutralClinch"]==true)for(var side=0;side<2;side++)
            {var self=duelPoses[side];var other=duelPoses[1-side];poses[side].ApplyClinchContact(self.Action,other.Action,Math.Abs(self.X-other.X)/match.Scale/self.Action.Scale*3.25/640,self.Seconds);}
            var snapshot=(long)packet["snapshotId"];
            if(snapshot!=duelEffectsId)
            {
                duelEffectsId=snapshot;if(packet["blood"] is JObject stains)blood.RestoreNetwork(stains,match);
                if(packet["sounds"] is JArray sounds)foreach(var sound in sounds)
                {var id=(long)sound["id"];if(id<=duelHeard)continue;duelHeard=id;fightAudio.RemoteSound((string)sound["key"],(float)sound["volume"],(float)sound["pitch"],sound["channel"]?.Type==JTokenType.String?(string)sound["channel"]:null);}
                var callout=packet["state"]["callout"]?.Type==JTokenType.String?(string)packet["state"]["callout"]:"";
                if(callout!=duelCallout&&(bool)packet["state"]["preFight"]){var key=callout=="3"?"three":callout=="2"?"two":callout=="1"?"one":null;if(key!=null)fightAudio.RemoteSound(key,.94f,1);}
                if(duelPrefight&&!(bool)packet["state"]["preFight"]){fightAudio.RemoteSound("fight",.94f,1);fightAudio.RemoteSound("gong",.5f,1);}
                duelCallout=callout;duelPrefight=(bool)packet["state"]["preFight"];
            }
            blood.Present(match,(bool?)packet["freeze"]==true||!DuelConnected(now)||applicationSuspended||duelUserPaused?0:Math.Min(50,Time.unscaledDeltaTime*1000),duelPoses);
            hud.text=Display(definitions[0].id)+" "+Math.Ceiling((double)packet["actors"][0]["hp"])+" HP     "+Math.Ceiling((double)packet["state"]["t"])+"     "+Display(definitions[1].id)+" "+Math.Ceiling((double)packet["actors"][1]["hp"])+" HP\nRUNDA "+(int)packet["state"]["round"]+" · "+(int)packet["state"]["wins"][0]+" : "+(int)packet["state"]["wins"][1]+" · TWOJA ENERGIA "+(int)packet["actors"][1]["en"];
        }
        long duelEffectsId;
        void PressLocal(FightButton button)
        {
            if(duel==null){match?.Press(0,button);return;}
            if(!duel.Ready||!DuelConnected(NetworkNow)||duelUserPaused||applicationSuspended||duelTerminalAt>=0)return;
            if(DuelSide==0){match?.Press(0,button);return;}
            if(duelView?.Latest==null||(bool)duelView.Latest["state"]["preFight"]||(bool)duelView.Latest["state"]["ended"])return;
            var kind=button switch{FightButton.Punch=>"punch",FightButton.Heavy=>"heavy",FightButton.Kick=>"kick",FightButton.HeavyKick=>"kick2",FightButton.Combo=>"special",FightButton.Grab=>"grab",FightButton.Evade=>"evade",_=>null};
            if(kind!=null)duelInput.Press(kind);
        }
    }
}
