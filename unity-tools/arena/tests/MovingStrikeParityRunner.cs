using System;
using System.Linq;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

static class MovingStrikeParityRunner
{
    static int count;
    static void Check(bool pass,string message){count++;if(!pass)throw new Exception("Moving strike: "+message);}
    static ArenaMatch Match()
    {
        var root=new JObject(MatchParityRunner.Config().Actions.Select(p=>new JProperty(p.Key,p.Value.Source.DeepClone())));
        foreach(var id in new[]{"LIGHT_PUNCH","HEAVY_PUNCH","LIGHT_KICK","HEAVY_KICK","DOUBLE_PUNCH","UPPERCUT"})
        {root[id]["durations"]=new JArray(1000,1000,1000,1000);root[id]["sourceVersion"]=1;foreach(var h in ((JObject)root[id]["hits"]).Properties())h.Value["bone"]=id.Contains("KICK")?"RightFoot":"RightHand";}
        var walk=MatchParityRunner.Action("ADVENTURE_WALK");walk["duration"]=1;walk["prefightRootSamples"]=new JArray(new JArray(0,0),new JArray(1,1));root["ADVENTURE_WALK"]=walk;
        var cfg=new CombatConfiguration("BRAX",root);var m=new ArenaMatch(cfg,cfg,()=>.5,training:true);m.Advance(3000);m.Player.X=200;m.Opponent.X=850;return m;
    }
    internal static void Run()
    {
        var m=Match();m.SetInput(0,new FightInput(1));m.Press(0,FightButton.Punch);var x=m.Player.X;m.Advance(100);
        Check(m.Player.X>x,"forward punch travels");Check(m.Player.MovingGait=="WALK_FORWARD"&&Math.Abs(m.Player.MovingGaitWeight-1)<1e-8,"walk legs blend in over 100 ms");
        m.SetInput(0,new FightInput(0,block:true));x=m.Player.X;m.Advance(100);Check(m.Player.X==x&&m.Player.MovingGaitWeight<1e-8,"guard stops travel and fades legs");
        m=Match();m.SetInput(0,new FightInput(1,sprint:true));m.Press(0,FightButton.Punch);m.Advance(100);Check(m.Player.MovingGait=="RUN","sprint selects raw run");
        m=Match();m.SetInput(0,new FightInput(1));m.Press(0,FightButton.Kick);x=m.Player.X;m.Advance(100);Check(m.Player.X>x&&m.Player.MovingGaitWeight==0,"kick travels without replacing striking leg");
        m=Match();m.Press(0,FightButton.Punch);m.SetInput(0,new FightInput(1));x=m.Player.X;m.Advance(100);Check(m.Player.X==x,"standing attack cannot acquire combat travel mid-action");
        m=Match();m.SetInput(0,new FightInput(1));m.Press(0,FightButton.Punch);m.SetInput(0,new FightInput(-1));x=m.Player.X;m.Advance(100);Check(m.Player.X==x,"reverse input cannot drag combat attack backward");
        m=Match();m.SetInput(0,new FightInput(1));m.Press(0,FightButton.Punch);m.Advance(100);m.SetPaused(true);x=m.Player.X;var t=m.Player.MovingGaitSeconds;m.Advance(1000);Check(m.Player.X==x&&m.Player.MovingGaitSeconds==t,"pause freezes stride clock");
        m=Match();m.SetInput(0,new FightInput(1));m.Press(0,FightButton.Punch);m.Advance(100);m.Player.StunMs=200;m.Advance(20);Check(m.Player.MovingGaitWeight==0&&m.Player.Motion==null,"stun clears movement layer");
        m=Match();m.SetInput(0,new FightInput(1));m.Press(0,FightButton.Punch);m.Opponent.X=m.Player.X+m.WorldHeight*.28+1;m.Advance(200);Check(m.Player.X<=201.001,"travel respects minimum opponent gap");
        m=Match();m.EnableAdventure();m.SetInput(0,new FightInput(-1));m.Press(0,FightButton.Punch);x=m.Player.X;m.Advance(100);Check(m.Player.X<x&&m.Player.MovingGait=="ADVENTURE_WALK","exploration allows original backward travel and walk");
        m.SetInput(0,new FightInput(1,sprint:true));x=m.Player.X;m.Advance(100);Check(m.Player.X>x&&m.Player.MovingGait=="RUN","exploration changes direction and sprint during strike");
        m=Match();m.SetInput(0,new FightInput(1,sprint:true));m.Press(0,FightButton.Punch);m.Advance(100);
        var expectedStride=(m.Player.Motion.Clock+ArenaMatch.StepMs*CombatRules.LocomotionTempo("BRAX",m.Player.Configuration["RUN"]))%m.Player.Configuration["RUN"].DurationMs;
        m.Player.Clock.Seek(m.Player.Action.DurationMs-1);m.Advance(ArenaMatch.StepMs);
        Check(m.Player.ActionId=="RUN"&&Math.Abs(m.Player.Clock.PoseSeconds*1000-expectedStride)<1e-7,"finishing attack resumes the existing run stride");
        var a=Match();var b=Match();foreach(var match in new[]{a,b}){match.SetInput(0,new FightInput(1));match.Press(0,FightButton.Punch);}a.Advance(400);for(var i=0;i<40;i++)b.Advance(10);Check(Math.Abs(a.Player.X-b.Player.X)<1e-8&&Math.Abs(a.Player.MovingGaitSeconds-b.Player.MovingGaitSeconds)<1e-8,"render partition does not change movement");
        Console.WriteLine("PASS "+count+" moving strike checks: authored gait selection, travel bounds, kick preservation, controls, pause, stun, adventure and frame partition.");
    }
}
