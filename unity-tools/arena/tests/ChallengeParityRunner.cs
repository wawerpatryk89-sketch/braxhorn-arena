using System;
using System.Linq;
using Newtonsoft.Json.Linq;
using Braxhorn.Arena.Domain;

static class ChallengeParityRunner
{
    static int checks;
    static void Check(bool value,string message){checks++;if(!value)throw new Exception("Challenge: "+message);}
    static ArenaMatch Match(string region="body")
    {var m=new ArenaMatch(MatchParityRunner.Config(region:region),MatchParityRunner.Config(region:region),()=>.1,training:true);m.Advance(3000);m.Player.X=500;m.Opponent.X=520;return m;}
    static int Events(ArenaMatch m,string kind){var count=0;while(m.TryDequeue(out var e))if(e.Kind=="objective:"+kind)count++;return count;}
    internal static void Run()
    {
        Check(ChallengeCatalog.All.Count==25&&ChallengeCatalog.All.Select(c=>c.Id).Distinct().Count()==25,"all original definitions");
        foreach(var c in ChallengeCatalog.All)
        {
            var run=new ChallengeRun(c,"BRAX");Check(!run.Note("not-the-event")&&run.Count==0,c.Id+" ignores unrelated event");
            for(var i=0;i<c.Goal-1;i++)Check(!run.Note(c.Event),c.Id+" not early");Check(run.Note(c.Event)&&run.Done,c.Id+" exact goal");Check(!run.Note(c.Event)&&run.Count==c.Goal,c.Id+" complete once");
        }
        Check(!ChallengeCatalog.Find("block8").Allows("NINA")&&!ChallengeCatalog.Find("block20").Allows("NINA")&&ChallengeCatalog.Find("evade5").Allows("NINA"),"Nina authored exclusions");
        Check(ChallengeCatalog.Find("bossfinal").Opponent=="BOSS"&&ChallengeCatalog.Find("bossfinal").Difficulty=="hard","boss final setup");
        Check(ChallengeCatalog.Find("counter3").Drill==TrainingBehavior.Counter&&ChallengeCatalog.Find("counter3").Mode=="training","counter setup");
        Check(ChallengeCatalog.Find("survivalhard5").Mode=="survival"&&ChallengeCatalog.Find("survivalhard5").Goal==5,"survival goal");
        var m=Match();m.Press(0,FightButton.Punch);m.Advance(200);Check(Events(m,"hit")==1,"clean hit counts once across active frames");
        m=Match();m.Press(0,FightButton.Kick);m.Advance(200);Check(Events(m,"kick")==1,"kick event");
        m=Match();m.SetInput(0,new FightInput(0,block:true));m.Advance(ArenaMatch.StepMs);m.Press(1,FightButton.Punch);m.Advance(200);Check(Events(m,"block")==1&&m.Player.Hp==100,"player guard counts once without damage");
        m=Match();m.SetInput(1,new FightInput(0,block:true));m.Advance(ArenaMatch.StepMs);m.Press(0,FightButton.Punch);m.Advance(200);Check(Events(m,"hit")==0,"opponent block is not a clean hit");
        m=Match("head");m.Press(0,FightButton.Evade);m.Press(1,FightButton.Punch);m.Advance(100);Check(Events(m,"evade")==1&&m.Player.Hp==100,"head dodge counts once");
        m=Match();m.Press(0,FightButton.Evade);m.Press(1,FightButton.Punch);m.Advance(100);Check(Events(m,"evade")==0&&m.Player.Hp<100,"head lean does not credit body hit");
        m=Match();m.SetInput(1,new FightInput(0,grab:true));m.Press(1,FightButton.Punch);m.Advance(50);m.Press(0,FightButton.Evade);Check(Events(m,"break")==1,"escaping opponent pair credited");
        m=Match();m.SetInput(0,new FightInput(0,grab:true));m.Press(0,FightButton.Punch);m.Advance(50);m.Press(0,FightButton.Evade);Check(Events(m,"break")==0,"cancelling own pair not credited");
        m=Match();m.Player.ProtectionMs=1000;m.Press(1,FightButton.Punch);m.Advance(100);Check(Events(m,"evade")==0,"getup immunity not a dodge");
        m=Match();m.Player.Energy=100;m.Press(0,FightButton.Combo);Check(m.PlayerComboUses==1,"special usage tracked across round resets separately");
        var root=new JObject(MatchParityRunner.Config().Actions.Select(p=>new JProperty(p.Key,p.Value.Source.DeepClone())));root["HEAVY_PUNCH"]["durations"]=new JArray(20,20,20,1000);
        var cfg=new CombatConfiguration("BRAX",root);
        m=new ArenaMatch(cfg,cfg,()=>.5,training:true);m.Advance(3000);m.Player.X=500;m.Opponent.X=520;m.Start(m.Opponent,"HEAVY_PUNCH",true);m.Opponent.Clock.Seek(61);m.Press(0,FightButton.Punch);m.Advance(100);Check(Events(m,"counter")==1,"hit during missed attack recovery is counter");
        m=new ArenaMatch(cfg,cfg,()=>.5,training:true);m.Advance(3000);m.Player.X=500;m.Opponent.X=520;m.Start(m.Opponent,"HEAVY_PUNCH",true);m.Opponent.Clock.Seek(61);m.Opponent.Ledger.Register(m.Opponent.Action.Hits[1],true,m.Opponent.Action,false,out _);m.Press(0,FightButton.Punch);m.Advance(100);Check(Events(m,"counter")==0,"blocked previous attack is not a missed attack");
        root=new JObject(MatchParityRunner.Config().Actions.Select(p=>new JProperty(p.Key,p.Value.Source.DeepClone())));
        foreach(var caps in root["LEAN"]["hurtCapsules"])foreach(var capsule in caps){capsule["a"][0]=200;capsule["b"][0]=200;}
        cfg=new CombatConfiguration("BRAX",root);m=new ArenaMatch(cfg,cfg,()=>.5,training:true);m.Advance(3000);m.Player.X=500;m.Opponent.X=520;m.Press(0,FightButton.Evade);m.Press(1,FightButton.Punch);m.Advance(100);Check(Events(m,"evade")==1&&m.Player.Hp==100,"geometric dodge compares original standing capsules");
        m=Match();m.SetPaused(true);m.Press(0,FightButton.Kick);m.Advance(1000);Check(Events(m,"kick")==0,"paused input cannot advance objective");
        Console.WriteLine("PASS "+checks+" challenge checks: 25 original goals, restrictions, setup, once-only completion and native contact events. UI/device validation is separate.");
    }
}
