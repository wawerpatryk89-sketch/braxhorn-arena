using System;
using System.Linq;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

static class GestureParityRunner
{
    static int count;
    static void Check(bool condition,string label){count++;if(!condition)throw new Exception("Gesture: "+label);}
    static ArenaMatch Match()
    {
        var baseConfig=MatchParityRunner.Config();var root=new JObject(baseConfig.Actions.Select(p=>new JProperty(p.Key,p.Value.Source.DeepClone())));
        foreach(var id in new[]{"AUTO_TAUNT","AUTO_TAUNT_2","AUTO_ANGER","AUTO_ANGER_2","AUTO_JOY"})
        {var a=MatchParityRunner.Action(id);a["durations"]=new JArray(1000,1000,1000,1000);a["interruptibleGesture"]=true;root[id]=a;}
        var cfg=new CombatConfiguration("BRAX",root);var m=new ArenaMatch(cfg,cfg,()=>.5,training:true);m.Advance(3000);m.Player.X=200;m.Opponent.X=850;return m;
    }
    internal static void Run()
    {
        var m=Match();m.Advance(14900);Check(m.Player.ActionId=="IDLE","no premature initial taunt");m.Advance(200);Check(m.Player.ActionId=="AUTO_TAUNT","original taunt after initial cooldown");
        m.SetPaused(true);var t=m.Player.Clock.PoseSeconds;m.Advance(60000);Check(m.Player.Clock.PoseSeconds==t,"pause freezes gesture");m.SetPaused(false);
        m.SetInput(0,new FightInput(1));Check(m.Player.ActionId=="IDLE"&&!m.Player.Locked,"movement cancels immediately");var x=m.Player.X;m.Advance(100);Check(m.Player.X>x,"movement is not delayed by gesture");m.ReleaseInputs();
        m.Advance(1000);Check(m.Player.ActionId!="AUTO_TAUNT_2","cancel does not immediately restart gesture");
        m=Match();m.Advance(15100);Check(m.Press(0,FightButton.Punch)&&m.Player.Action.Attack,"attack cancels gesture without an extra tap");
        m=Match();m.Advance(15100);m.SetInput(0,new FightInput(0,block:true));m.Advance(ArenaMatch.StepMs);Check(m.Player.ActionId=="BLOCK","guard interrupts gesture");
        m=Match();m.Advance(15100);m.Opponent.X=m.Player.X+20;m.Advance(ArenaMatch.StepMs);Check(m.Player.ActionId!="AUTO_TAUNT","approaching enemy cancels gesture");
        m=Match();m.QueueGesture(m.Player,"AUTO_JOY");m.Advance(20);Check(m.Player.ActionId=="AUTO_JOY","queued celebration uses authored action");
        m=Match();m.QueueGesture(m.Player,"AUTO_ANGER");m.Advance(20);Check(m.Player.ActionId=="AUTO_ANGER","first anger variation");m.SetInput(0,new FightInput(1));m.ReleaseInputs();m.QueueGesture(m.Player,"AUTO_ANGER");m.Advance(20);Check(m.Player.ActionId=="AUTO_ANGER_2","second anger variation alternates");
        m=Match();m.QueueGesture(m.Player,"AUTO_JOY");m.SetInput(0,new FightInput(0,block:true));m.Advance(2600);m.ReleaseInputs();m.Advance(100);Check(m.Player.ActionId=="IDLE","expired celebration is discarded");
        m=Match();m.Advance(15100);m.Advance(21000);Check(m.Player.ActionId=="AUTO_TAUNT_2","second scheduled taunt uses alternative");
        m=Match();m.EnableAdventure();m.QueueGesture(m.Player,"AUTO_JOY");m.Advance(20000);Check(m.Player.ActionId=="IDLE","exploration has no combat gestures");
        Console.WriteLine("PASS "+count+" gesture checks: authored variants, cooldown, expiry, attack/movement/guard interruption, pause and adventure isolation.");
    }
}
