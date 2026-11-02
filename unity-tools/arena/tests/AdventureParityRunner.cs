using System;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using Braxhorn.Arena.Domain;

static class AdventureParityRunner
{
    static int assertions;
    static void Check(bool yes,string message){assertions++;if(!yes)throw new Exception("Adventure: "+message);}
    static void Near(double a,double b,string message)=>Check(Math.Abs(a-b)<1e-7,message+" ("+a+", "+b+")");
    static CombatConfiguration Config()
    {
        var original=MatchParityRunner.Config();var root=new JObject(original.Actions.Select(p=>new JProperty(p.Key,p.Value.Source.DeepClone())));
        foreach(var id in new[]{"ADVENTURE_WALK","ENTRY_RUN"})
        {
            var a=MatchParityRunner.Action(id);a["duration"]=1;a["durations"]=new JArray(250,250,250,250);
            a["prefightRootSamples"]=new JArray(new JArray(0,0),new JArray(.25,.3),new JArray(.6,1.2),new JArray(1,2));
            a["prefightMotion"]=true;a["entryStopTime"]=.6;a["union"]=new JArray(450,100,574,550);a["pivotX"]=512;a["anchorY"]=550;root[id]=a;
        }
        root["IDLE"]["testNpc"]=new JObject{["gapPx"]=new JObject{["KROV"]=180,["BOSS"]=190},["allowedTargets"]=new JArray("KROV"),["attackers"]=new JObject{["KROV"]=new JObject{["x"]=1}}};
        return new CombatConfiguration("BRAX",root);
    }
    static JObject Route()=>new JObject{
        ["id"]="city-01",["entry"]=new JObject{["xFrom"]=-10,["xTo"]=16,["groundFrom"]=.6,["depthFrom"]=.6,["yawFrom"]=1,["fromEdge"]=true},
        ["chapters"]=new JArray(Enumerable.Range(0,6).Select(i=>new JObject{["trigger"]=44+100*i})),["heal"]=new JObject{["index"]=4,["x"]=411}};
    static AdventureRun New(bool install=true)
    {
        var cfg=Config();var a=new AdventureRun(Route(),"BRAX",cfg,cfg,new[]{"NYXA","VEXA","KROV","NINA","ZOMBIE","BOSS"},CpuLevel.Normal,1024,576,()=>.5);
        if(install)a.InstallOpponent("NYXA",cfg);return a;
    }
    static void Until(AdventureRun a,AdventurePhase phase,int steps=12000)
    {for(var i=0;i<steps&&a.Phase!=phase;i++)a.Step(ArenaMatch.StepMs);Check(a.Phase==phase,"reaches "+phase+", was "+a.Phase);}
    static void Enter(AdventureRun a){a.Match.SetInput(0,new FightInput(1));Until(a,AdventurePhase.Combat);a.Match.ReleaseInputs();}
    static void Defeat(AdventureRun a)
    {a.Match.Opponent.Hp=0;a.Match.Opponent.DownPhase="KO_HOLD";a.Match.Start(a.Match.Opponent,"KO_HOLD",true);a.Step(ArenaMatch.StepMs);}
    static void Lifecycle()
    {
        var cfg=Config();var c=cfg["ENTRY_RUN"];Near(AuthoredTravel.Distance(c,2.25),4.3,"root travel spans cycles");
        foreach(var d in new[]{0,.1,1.2,2,4.3,50.75})Near(AuthoredTravel.Distance(c,AuthoredTravel.Time(c,d)),d,"authored travel inverse");
        var npc=cfg["IDLE"].Source["testNpc"];Check((double)npc["gapPx"]["BOSS"]==190&&(double)npc["gapPx"]["ZOMBIE"]==180,"NPC explicit gap preserved and missing inherited");
        Check(npc["allowedTargets"].Values<string>().SequenceEqual(new[]{"KROV","BOSS","ZOMBIE"}),"NPC pair target extension");
        Check(!ReferenceEquals(npc["attackers"]["KROV"],npc["attackers"]["BOSS"]),"NPC receiver metadata cloned");
        var a=New();a.Step(400);Check(a.Phase==AdventurePhase.Entrance&&a.X<0,"establishing shot has no premature movement");
        a.Match.SetPaused(true);var t=a.ElapsedMs;var x=a.X;a.Step(60000);Near(a.ElapsedMs,t,"pause stops route clock");Near(a.X,x,"pause stops entrance");a.Match.SetPaused(false);
        Until(a,AdventurePhase.Explore);Near(a.X,16,"entrance reaches exact authored destination");Near(a.Depth,1,"entrance finishes at normal scale");Near(a.EntryGround,.84,"entrance finishes at floor");
        Check(!a.Match.TryDequeue(out _),"adventure omits match countdown");Check(!a.Match.Press(0,FightButton.Combo),"no phantom combo before encounter");
        var gate=New(false);Until(gate,AdventurePhase.Explore);gate.Match.SetInput(0,new FightInput(1));gate.Step(60000);Near(gate.X,69,"unloaded encounter gate cannot be bypassed");
        Check(gate.Defeated==0&&gate.Score==0,"walking cannot award encounters");gate.Match.SetInput(0,new FightInput(-1));gate.Step(60000);Near(gate.X,8,"route left boundary");
        var split=New();var whole=New();split.Match.SetInput(0,new FightInput(1));whole.Match.SetInput(0,new FightInput(1));for(var i=0;i<400;i++)split.Step(10);whole.Step(4000);Near(split.X,whole.X,"render tick partition position");Near(split.ElapsedMs,whole.ElapsedMs,"render tick partition clock");
        bool invalid=false;try{a.Step(double.PositiveInfinity);}catch(ArgumentOutOfRangeException){invalid=true;}Check(invalid,"invalid host time rejected");
        var choices=AdventureRun.ChooseOpponents("BRAX_WHITE",new[]{"BRAX_WHITE","NYXA_SPORT","BRAX_STREET"},()=>.5);Check(choices.Length==6&&choices[5]=="BOSS"&&!choices.Any(id=>id.StartsWith("BRAX")),"route opponents exclude player and outfits and end in boss");
    }
    static void Encounters()
    {
        var a=New();Until(a,AdventurePhase.Explore);a.Match.Player.Hp=40;a.Match.Player.Energy=33;Enter(a);
        Check(a.Match.Opponent.Hp==70,"normal encounter HP");Near(a.Match.Player.Hp,40,"entrance does not reset HP");
        a.PrepareIncoming(a.PreloadOpponentId,Config());a.Match.Opponent.Hp=14;a.Step(ArenaMatch.StepMs);Check(a.IncomingVisible,"next rival revealed at 20 percent HP");
        var incomingX=a.IncomingX;a.Step(100);Check(a.IncomingX<incomingX&&a.IncomingSeconds>0,"incoming rival uses root travel while combat continues");
        a.Match.Player.Hp=39;Defeat(a);Check(a.Phase==AdventurePhase.Aftermath&&a.Defeated==0,"lethal hit waits for grounded final pose");
        a.Match.Opponent.PushMs=1000;a.Step(500);Check(a.Defeated==0,"sliding body cannot be frozen early");a.Match.Opponent.PushMs=0;
        Until(a,AdventurePhase.Explore);Check(a.Defeated==1&&a.Score==200,"damaged win awards once without perfect bonus");Near(a.Match.Player.Hp,59,"encounter heals 20 without resetting HP");
        var player=a.Match.Player;var energy=player.Energy;var incomingTime=a.IncomingSeconds;var oldWorld=a.IncomingX;
        Check(a.TryTakeCorpse(out var pose,out _)&&pose.Action.Id=="KO_HOLD","one actual final pose provided for capture");Check(!a.TryTakeCorpse(out _,out _),"corpse capture cannot repeat");
        a.InstallOpponent(a.PendingOpponentId,Config());Check(ReferenceEquals(player,a.Match.Player),"opponent replacement preserves player instance");Near(player.Energy,energy,"replacement preserves energy");Near(player.Hp,59,"replacement preserves HP");
        Near(a.Camera+a.Match.Opponent.X/a.Match.Width*a.Span,oldWorld,"promoted incoming rival keeps world position");Check(a.EnemyEntering&&!a.IncomingVisible&&incomingTime>0,"incoming promoted without double draw");
        for(var encounter=1;encounter<6;encounter++)
        {
            Enter(a);Check(a.Match.Opponent.Hp==(encounter==5?100:70),"boss and ordinary HP");Defeat(a);Until(a,encounter==5?AdventurePhase.Complete:AdventurePhase.Explore);
            Check(a.TryTakeCorpse(out _,out _),"each grounded rival has one corpse");
            if(encounter<5){if(encounter==3)a.Match.Player.Hp=10;a.InstallOpponent(a.PendingOpponentId,Config());}
            if(encounter==4)Check(a.Healed,"city medical pickup reached once after four victories");
        }
        Check(a.Score==3000&&a.Defeated==6&&a.Match.Paused,"six victories plus perfect and completion bonuses");
        var score=a.Score;var elapsed=a.ElapsedMs;a.Step(999999);Check(a.Score==score&&a.ElapsedMs==elapsed,"completed route is idempotent");
        var dead=New();Until(dead,AdventurePhase.Explore);Enter(dead);dead.Match.Player.Hp=0;dead.Match.Opponent.Hp=0;dead.Step(1000);
        Check(dead.Phase==AdventurePhase.Dead&&dead.Score==0&&dead.Defeated==0&&dead.Match.Paused,"simultaneous KO is adventure loss without reward");
    }
    static void Actual(string root,string fixtures)
    {
        var cases=JArray.Parse(File.ReadAllText(Path.Combine(fixtures,"entrance-reference.json")));var routes=cases.Select(c=>(JObject)c["input"]["entry"]).GroupBy(e=>e.ToString()).Select(g=>g.First()).ToArray();
        var variants=0;
        var npcs=new[]{"BOSS","ZOMBIE"}.Select(id=>CombatConfiguration.Read(id,File.ReadAllBytes(Path.Combine(root,id,"config.bytes")))).ToArray();
        foreach(var folder in Directory.GetDirectories(root).OrderBy(x=>x))
        {
            var file=Path.Combine(folder,"fighter.json");if(!File.Exists(file))continue;var meta=JObject.Parse(File.ReadAllText(file));
            var cfg=CombatConfiguration.Read((string)meta["base"],File.ReadAllBytes(Path.Combine(folder,"config.bytes")));
            Check(cfg.Has("ENTRY_RUN"),meta["id"]+" original entrance action present");if((bool)meta["npc"])continue;variants++;
            Check(cfg.Has("ADVENTURE_WALK"),meta["id"]+" original outfit walk present");
            foreach(var npc in npcs)
            {
                var moves=cfg["IDLE"].Source["pairedCombat"]?["moves"] as JObject;
                if(moves==null)continue;
                foreach(var move in moves.Properties())
                {
                    if(move.Value["gapPx"]?[npc.Character]==null||move.Value["allowedTargets"] is JArray allowed&&!allowed.Values<string>().Contains(npc.Character))continue;
                    var match=new ArenaMatch(cfg,npc,()=>.5,training:true);match.Advance(3000);
                    match.Player.X=300;match.Opponent.X=300+(double)move.Value["gapPx"][npc.Character]*match.Scale*cfg["IDLE"].Scale;
                    Check(match.TryPair(match.Player,move.Name,false),meta["id"]+" authored grab starts against "+npc.Character+" / "+move.Name);
                    match.Advance(((double)move.Value["duration"]/((double?)move.Value["rate"]??1.15))*1000+1000);
                    Check(!match.PairActive&&match.Opponent.Hp<100,meta["id"]+" NPC grab completes with contact");
                }
            }
            foreach(var entry in routes)
            {
                var route=Route();route["entry"]=entry.DeepClone();var a=new AdventureRun(route,(string)meta["id"],cfg,cfg,new[]{"NYXA","VEXA","KROV","NINA","ZOMBIE","BOSS"},CpuLevel.Normal,1024,576,()=>.5);
                Until(a,AdventurePhase.Explore,3600);Near(a.X,(double)entry["xTo"],meta["id"]+" exact authored entrance endpoint");
                a.Match.SetInput(0,new FightInput(1));var x=a.X;a.Step(500);Check(a.X>x&&!double.IsNaN(a.Camera),meta["id"]+" original walking movement advances");
            }
        }
        Check(variants==16,"all playable variants and outfits tested on five entrances");
    }
    internal static void Run(string source=null,string fixtures=null)
    {Lifecycle();Encounters();if(source!=null)Actual(source,fixtures);Console.WriteLine("PASS "+assertions+" adventure checks: entrance, gates, pause, authored travel, incoming rivals, persistent player state, KO settlement, score and completion. GPU/device validation is separate.");}
}
