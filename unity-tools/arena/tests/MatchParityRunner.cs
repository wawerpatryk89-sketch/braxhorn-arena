using System;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using Braxhorn.Arena.Domain;

static class MatchParityRunner
{
    static int assertions;
    static void Check(bool condition,string message) { assertions++; if(!condition)throw new Exception("Match: "+message); }
    internal static JObject Action(string id, bool attack=false, double damage=10, string region="body")
    {
        return new JObject {
            ["durations"]=new JArray(20,20,20,20),["attack"]=attack,["scale"]=1,["gain"]=10,["pivotX"]=0,["anchorY"]=0,
            ["boxes"]=new JArray(Enumerable.Range(0,4).Select(_=>new JArray(-10,-30,10,0))),
            ["hurtCapsules"]=new JArray(Enumerable.Range(0,4).Select(_=>new JArray(new JObject {["a"]=new JArray(0,-20),["b"]=new JArray(0,-10),["radius"]=10,["region"]=region}))),
            ["pushCenters"]=new JArray(Enumerable.Range(0,4).Select(_=>new JArray(0,0))),
            ["hits"]=attack?new JObject {["1"]=new JObject {["box"]=new JArray(0,-30,50,30),["damage"]=damage,["group"]=0},["2"]=new JObject {["box"]=new JArray(0,-30,50,30),["damage"]=damage,["group"]=0}}:new JObject()
        };
    }
    internal static CombatConfiguration Config(double damage=10,string region="body")
    {
        var root=new JObject();foreach(var id in new[]{"IDLE","BLOCK","BLOCK_LOW","WALK_FORWARD","WALK_BACK","RUN","APPROACH","LEAN","HIT_BODY","FALL","LAND","DOWN","GETUP","KO","KO_HOLD","FLY","FLY_LAND","FLY_DOWN","THROW_DOWN","WIN","WIN_ROUND","WIN_MATCH","LOSE_MATCH"})root[id]=Action(id,false,damage,region);
        foreach(var id in new[]{"LIGHT_PUNCH","HEAVY_PUNCH","LIGHT_KICK","HEAVY_KICK","DOUBLE_PUNCH","UPPERCUT","COMBO"})root[id]=Action(id,true,damage,region);
        root["LEAN"]["evadeFrames"]=new JArray(0,3);
        root["COMBO"]["comboGapPx"]=10;
        root["IDLE"]["pairedCombat"]=new JObject {["enabled"]=true,["buttons"]=new JObject {["punch"]="Test"},["moves"]=new JObject {["Test"]=new JObject {
            ["attacker"]="TEST_PAIR",["reaction"]="TEST_REACT",["duration"]=.5,["rate"]=1,["gapPx"]=new JObject {["BRAX"]=10},["contacts"]=new JArray(new JObject {["time"]=.3,["damage"]=16,["ground"]=true})}}};
        foreach(var key in new[]{"TEST_PAIR","TEST_REACT"}){var a=Action(key);a["durations"]=new JArray(125,125,125,125);root[key]=a;}
        return new CombatConfiguration("BRAX",root);
    }
    static ArenaMatch Start(double damage=10,string region="body",bool training=false)
    {
        var m=new ArenaMatch(Config(damage,region),Config(damage,region),()=>.5,training:training);
        m.Advance(3000);m.Player.X=500;m.Opponent.X=520;return m;
    }
    static void ContactTests()
    {
        var m=Start();Check(m.Phase==MatchPhase.Fighting,"countdown enters fight");
        Check(m.Press(0,FightButton.Punch),"attack accepted");m.Advance(200);
        Check(m.Opponent.Hp==90,"one group damages once across repeated frames");
        var hits=0;while(m.TryDequeue(out var e))if(e.Kind=="hit")hits++;Check(hits==1,"one contact event");
        var a=Start();var b=Start();a.Press(0,FightButton.Punch);b.Press(0,FightButton.Punch);a.Advance(1000);for(var i=0;i<100;i++)b.Advance(10);
        Check(a.Player.Hp==b.Player.Hp&&a.Opponent.Hp==b.Opponent.Hp&&Math.Abs(a.RemainingSeconds-b.RemainingSeconds)<1e-8,"render frame partition invariance");
        var blocked=Start();blocked.SetInput(1,new FightInput(0,block:true));blocked.Advance(ArenaMatch.StepMs);blocked.Press(0,FightButton.Punch);blocked.Advance(100);
        Check(blocked.Opponent.Hp==100,"high guard stops body hit");
        var low=Start(region:"leg");low.SetInput(1,new FightInput(0,block:true,down:true));low.Advance(ArenaMatch.StepMs);low.Press(0,FightButton.Punch);low.Advance(100);
        Check(low.Opponent.Hp==100,"low guard stops leg hit");
        var wrong=Start(region:"leg");wrong.SetInput(1,new FightInput(0,block:true));wrong.Advance(ArenaMatch.StepMs);wrong.Press(0,FightButton.Punch);wrong.Advance(100);
        Check(wrong.Opponent.Hp==90,"high guard does not stop leg hit");
        var evade=Start(region:"head");evade.Press(1,FightButton.Evade);evade.Press(0,FightButton.Punch);evade.Advance(100);Check(evade.Opponent.Hp==100,"head lean evades head");
        var body=Start();body.Press(1,FightButton.Evade);body.Press(0,FightButton.Punch);body.Advance(100);Check(body.Opponent.Hp==90,"head lean cannot evade body");
        var trade=Start(100);trade.Press(0,FightButton.Punch);trade.Press(1,FightButton.Punch);trade.Advance(100);
        Check(trade.Player.Hp==0&&trade.Opponent.Hp==0,"same-step lethal contacts trade symmetrically");
        Check(trade.RoundWinner==-1&&trade.PlayerWins==0&&trade.OpponentWins==0,"simultaneous KO is draw");
        var practice=Start(150,training:true);practice.Press(0,FightButton.Punch);practice.Advance(100);
        Check(practice.Opponent.Hp==1&&practice.Phase==MatchPhase.Fighting,"training never kills or finishes match");practice.Advance(1500);Check(practice.Opponent.Hp==100,"training recovery");
        var pressure=new HitPressure();pressure.Add(1,30);pressure.Add(1,30);Check(pressure.Value==14&&pressure.Count==1,"pressure caps per action");pressure.Add(2,14);pressure.Add(3,14);Check(pressure.Value==42&&pressure.Count==3,"distinct actions build pressure");pressure.Advance(601,true);Check(pressure.Value==0,"disengagement clears pressure");
    }
    static void LifecycleTests()
    {
        var m=new ArenaMatch(Config(),Config(),()=>.5);Check(!m.Press(0,FightButton.Punch),"countdown blocks input");m.Advance(3000);
        m.SetInput(0,new FightInput(1));m.Advance(100);m.SetPaused(true);var x=m.Player.X;var t=m.RemainingSeconds;m.Advance(60000);m.SetInput(0,new FightInput(1));Check(!m.Press(0,FightButton.Punch),"pause blocks input");Check(m.Player.X==x&&m.RemainingSeconds==t,"pause freezes simulation");m.SetPaused(false);m.Advance(100);Check(m.Player.X==x,"held movement released on background/pause");
        var timeout=Start();timeout.Advance(60000);Check(timeout.Phase==MatchPhase.RoundOver&&timeout.RoundWinner==-1,"timer draw");timeout.Advance(1600);Check(timeout.Round==2&&timeout.Phase==MatchPhase.Countdown,"round transition");
        for(var i=0;i<2;i++)timeout.Advance(65000);Check(timeout.Phase==MatchPhase.Complete&&timeout.Winner==-1,"three tied rounds end match");
        var winner=Start(100);winner.Press(0,FightButton.Punch);winner.Advance(2200);Check(winner.Round==2&&winner.PlayerWins==1,"first win advances round");winner.Advance(3000);winner.Player.X=500;winner.Opponent.X=520;winner.Press(0,FightButton.Punch);winner.Advance(2200);Check(winner.Phase==MatchPhase.Complete&&winner.PlayerWins==2,"two wins finish match");var wins=winner.PlayerWins;winner.Advance(10000);Check(winner.PlayerWins==wins,"completed result counted once");
        bool bad=false;try{winner.Advance(double.NaN);}catch(ArgumentOutOfRangeException){bad=true;}Check(bad,"invalid time rejected");
    }
    static void PairTests()
    {
        var m=Start();m.SetInput(0,new FightInput(0,grab:true));Check(m.Press(0,FightButton.Punch)&&m.PairActive,"authored paired action starts");m.Advance(100);Check(m.Press(1,FightButton.Evade)&&!m.PairActive,"pair can break inside 200ms");Check(m.Opponent.Hp==100,"break has no phantom damage");
        m=Start();m.SetInput(0,new FightInput(0,grab:true));m.Press(0,FightButton.Punch);m.Advance(250);Check(!m.Press(1,FightButton.Evade),"late escape rejected");m.Advance(400);Check(m.Opponent.Hp==84&&!m.PairActive,"paired landing damages once and releases");
        m=Start();m.SetInput(1,new FightInput(0,block:true));m.Advance(ArenaMatch.StepMs);m.SetInput(0,new FightInput(0,grab:true));Check(!m.Press(0,FightButton.Punch),"guard rejects grab");
        m=Start();m.Opponent.X=850;m.SetInput(0,new FightInput(0,grab:true));Check(!m.Press(0,FightButton.Punch),"distant grab rejected");
    }
    static void AudioTimelineTests()
    {
        var m=new ArenaMatch(Config(),Config(),()=>.5);m.Advance(3000);
        var cues=new System.Collections.Generic.List<string>();while(m.TryDequeue(out var e))cues.Add(e.Kind);
        Check(string.Join(",",cues)=="three,two,one,fight","countdown emits original ordered cues even with a large host tick");
        m.Player.X=200;m.Opponent.X=850;m.Press(0,FightButton.Punch);m.Advance(500);
        var swings=0;var hits=0;while(m.TryDequeue(out var e)){if(e.Kind=="swing")swings++;if(e.Kind=="hit")hits++;}
        Check(swings==1&&hits==0,"missed strike has one swish for repeated authored hit group and no impact");
        m.Press(0,FightButton.Punch);m.Advance(500);swings=0;while(m.TryDequeue(out var e))if(e.Kind=="swing")swings++;
        Check(swings==1,"sound ledger resets on next attack");
        m.SetPaused(true);m.Advance(1000);Check(!m.TryDequeue(out _),"paused simulation emits no stale audio events");
    }
    static void ActualRoster(string root)
    {
        if(!Directory.Exists(root))throw new DirectoryNotFoundException(root);
        var cases=0;
        foreach(var folder in Directory.GetDirectories(root).OrderBy(p=>p))
        {
            var file=Path.Combine(folder,"config.bytes");if(!File.Exists(file))continue;
            var info=JObject.Parse(File.ReadAllText(Path.Combine(folder,"fighter.json")));
            var cfg=CombatConfiguration.Read((string)info["base"],File.ReadAllBytes(file));
            var match=new ArenaMatch(cfg,cfg,()=>.5,training:true);match.Advance(3000);
            foreach(var button in new[]{FightButton.Punch,FightButton.Heavy,FightButton.Kick,FightButton.HeavyKick,FightButton.Evade})
            {
                match.Player.X=450;match.Opponent.X=620;match.Press(0,button);match.Advance(5000);
                Check(!double.IsNaN(match.Player.X)&&!double.IsNaN(match.Opponent.X),Path.GetFileName(folder)+" finite positions");
            }
            if(cfg.Has("COMBO")&&cfg["COMBO"].Attack)
            {
                match=new ArenaMatch(cfg,cfg,()=>.5,training:true);match.Advance(3000);
                Check(match.Press(0,FightButton.Combo),Path.GetFileName(folder)+" combo accepted");match.Advance(18000);
                var clean=0;var grabs=0;while(match.TryDequeue(out var evt)){if(evt.Kind=="hit")clean++;if(evt.Kind=="grab")grabs++;}
                Check(clean>0,Path.GetFileName(folder)+" actual combo makes contact");
                if(cfg["COMBO"].Source["pairedFinisher"]!=null)Check(grabs==1,Path.GetFileName(folder)+" actual confirmed combo reaches paired finisher (hits="+clean+")");
            }
            if(!Path.GetFileName(folder).Contains("_"))
            {
                match=new ArenaMatch(cfg,cfg,()=>.5);match.UseCpu(0);match.UseCpu(1);match.Advance(210000);
                Check(match.Phase==MatchPhase.Complete,Path.GetFileName(folder)+" CPU match reaches a result");
                Check(match.PlayerWins<=2&&match.OpponentWins<=2,Path.GetFileName(folder)+" CPU score counted once");
            }
            Console.WriteLine("Native match asset checks: "+Path.GetFileName(folder));
            cases++;
        }
        Check(cases==18,"actual roster includes all 18 variants");
        Console.WriteLine("PASS 18 native exported fighter/outfit configurations in the C# match loop.");
    }
    internal static void Run(string sourceRoot=null)
    {
        ContactTests();LifecycleTests();PairTests();AudioTimelineTests();if(sourceRoot!=null)ActualRoster(sourceRoot);
        Console.WriteLine("PASS "+assertions+" match checks: contact, guard, evasion, trades, timing, round transitions, training, grabs, pause. Render/device validation is separate.");
    }
}
