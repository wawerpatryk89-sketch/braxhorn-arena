using System;
using Braxhorn.Arena.Domain;

static class TrainingParityRunner
{
    static int count;
    static void Check(bool pass,string message){count++;if(!pass)throw new Exception("Training: "+message);}
    static ArenaMatch Match(TrainingBehavior mode,string move="LIGHT_PUNCH")
    {
        var cfg=MatchParityRunner.Config();var m=new ArenaMatch(cfg,cfg,()=>.1,training:true);m.UseCpu(1,CpuLevel.Normal,mode,move);m.Advance(3000);m.Player.X=500;m.Opponent.X=520;return m;
    }
    internal static void Run()
    {
        var m=Match(TrainingBehavior.Repeat,"HEAVY_KICK");m.Advance(900);Check(m.Opponent.Serial==0,"repeat waits initial 1000 ms");m.Advance(200);Check(m.Opponent.Serial==1,"repeat starts chosen attack");
        var selected=false;while(m.TryDequeue(out var e))if(e.Actor==1&&e.Action=="HEAVY_KICK")selected=true;Check(selected,"selected kick reaches event stream");
        m=Match(TrainingBehavior.Counter);m.Advance(1150);Check(m.Opponent.Serial==0,"counter drill retains 1300 ms source spacing");m.Advance(250);Check(m.Opponent.Serial==1,"counter drill attacks after spacing");
        m=Match(TrainingBehavior.Bag);var x=m.Opponent.X;m.Advance(10000);Check(m.Opponent.Serial==0&&Math.Abs(m.Opponent.X-x)<1e-8,"bag never initiates movement or attack");
        m=Match(TrainingBehavior.Block);m.Advance(100);Check(m.Opponent.ActionId=="BLOCK","defensive drill uses guard");
        m=Match(TrainingBehavior.Repeat);m.Player.ProtectionMs=2000;m.Advance(1000);Check(m.Opponent.Serial==0,"get-up protection suspends drill clock");
        m=Match(TrainingBehavior.Repeat);m.Advance(500);m.SetPaused(true);m.Advance(10000);Check(m.Opponent.Serial==0,"pause freezes drill");m.SetPaused(false);m.Advance(300);Check(m.Opponent.Serial==0,"pause did not consume interval");m.Advance(300);Check(m.Opponent.Serial==1,"drill resumes remaining interval");
        m=Match(TrainingBehavior.Repeat);m.Advance(800);m.ConfigureTraining(TrainingBehavior.Counter,"HEAVY_PUNCH");m.Advance(1000);Check(m.Opponent.Serial==0,"settings change resets interval");m.Advance(400);Check(m.Opponent.Serial==1,"new drill applies after reset");
        m=Match(TrainingBehavior.Repeat,"COMBO");m.Advance(1100);Check(m.Opponent.ComboUses==0&&m.Opponent.Serial==1,"invalid drill cannot bypass combo rules");
        m=Match(TrainingBehavior.Grab);m.Advance(1050);Check(m.PairActive,"grab drill begins authored pair");Check(m.Press(0,FightButton.Evade)&&!m.PairActive,"player can break drill grab normally");
        m=Match(TrainingBehavior.Repeat);m.Player.X=200;m.Opponent.X=800;x=m.Opponent.X;m.Advance(100);Check(m.Opponent.X<x&&m.Opponent.Serial==0,"repeat approaches before timing attack");
        m=Match(TrainingBehavior.Move);m.Player.ApproachingCombo=true;x=m.Opponent.X;m.Advance(ArenaMatch.StepMs);Check(m.Opponent.X==x,"footwork does not kite combo approach");
        var notTraining=new ArenaMatch(MatchParityRunner.Config(),MatchParityRunner.Config(),()=>.5);var rejected=false;try{notTraining.ConfigureTraining(TrainingBehavior.Repeat,"LIGHT_PUNCH");}catch(InvalidOperationException){rejected=true;}Check(rejected,"match cannot enable training through settings");
        foreach(var who in new[]{"BRAX","NYXA","VEXA","KROV","NINA","DANNY","BEAR","DEMON"})Check(ArenaMatch.BasicMoves(who).Length>=6,"original roster drill repertoire "+who);
        Console.WriteLine("PASS "+count+" training checks: repeat/counter intervals, selected attacks, bag, guard, pause, get-up protection, grabs, live configuration and roster repertoire.");
    }
}
