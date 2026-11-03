using System;
using System.Linq;
using Newtonsoft.Json.Linq;
using Braxhorn.Arena.Domain;

static class InputParityRunner
{
    static int checks;
    static void Check(bool pass,string message){checks++;if(!pass)throw new Exception("Input: "+message);}
    internal static void Run()
    {
        var tap=new DirectionTap();Check(!tap.Press(1,100,1)&&!tap.SprintHeld,"first tap walks");tap.Release(1);Check(!tap.Press(1,250,1)&&tap.SprintHeld,"released forward double tap sprints");tap.Release(1);Check(!tap.SprintHeld,"release stops sprint");
        tap.Reset();tap.Press(-1,100,1);Check(!tap.Press(-1,200,1),"second finger without release is not double tap");tap.Release(-1);Check(tap.Press(-1,250,1)&&!tap.SprintHeld,"backward double tap retreats");
        tap.Reset();tap.Press(1,100,1);tap.Release(1);tap.Press(1,400,1);Check(!tap.SprintHeld,"300 ms boundary excluded");
        tap.Reset();tap.Press(-1,100,-1);tap.Release(-1);tap.Press(-1,250,-1);Check(tap.SprintHeld,"forward is relative to facing");tap.Reset();Check(!tap.SprintHeld,"pause reset clears latch");
        var root=new JObject(MatchParityRunner.Config().Actions.Select(p=>new JProperty(p.Key,p.Value.Source.DeepClone())));var retreat=MatchParityRunner.Action("BACK_ROLL");retreat["durations"]=new JArray(100,100,100,100);retreat["retreat"]=new JObject{["from"]=0,["to"]=.4,["height"]=.3};root["BACK_ROLL"]=retreat;root["ENERGY_SPECIAL"]=MatchParityRunner.Action("ENERGY_SPECIAL",true);
        var cfg=new CombatConfiguration("BRAX",root);var m=new ArenaMatch(cfg,cfg,()=>.5,training:true);m.Advance(3000);m.Player.X=300;m.Opponent.X=700;
        Check(m.Press(0,FightButton.Retreat)&&m.Player.ActionId=="BACK_ROLL","authored retreat selected when backflip absent");m.Advance(200);Check(m.Player.X<300,"authored retreat distance applied");Check(!m.Press(0,FightButton.Retreat),"locked retreat cannot restart");
        m.Advance(1000);m.SetInput(0,new FightInput(0,block:true));Check(m.Press(0,FightButton.Combo)&&m.Player.ActionId=="ENERGY_SPECIAL"&&m.PlayerComboUses==0,"Brax guard plus combo selects energy action");
        m=new ArenaMatch(cfg,cfg,()=>.5,training:true);m.Advance(3000);m.Player.X=500;m.Opponent.X=520;m.SetInput(1,new FightInput(0,grab:true));m.Press(1,FightButton.Punch);Check(m.PairActive&&m.Press(0,FightButton.Grab)&&!m.PairActive,"grab press breaks pair during source escape window");
        var unsupported=new ArenaMatch(MatchParityRunner.Config(),MatchParityRunner.Config(),()=>.5);unsupported.Advance(3000);Check(!unsupported.Press(0,FightButton.Retreat),"missing retreat is not invented");
        Console.WriteLine("PASS "+checks+" input checks: released double taps, facing, sprint reset, authored retreat, special modifier and grab escape. Touch-device behavior remains untested.");
    }
}
