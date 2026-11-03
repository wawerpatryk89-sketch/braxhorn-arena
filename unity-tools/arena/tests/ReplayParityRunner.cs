using System;
using Braxhorn.Arena.Domain;

static class ReplayParityRunner
{
    static int checks;
    static void Check(bool value,string message){checks++;if(!value)throw new Exception("Replay: "+message);}
    static ReplayActor Actor(CombatAction action,double seconds,double x=500,int face=1)=>new ReplayActor(new FighterPresentation(action,seconds,x,0,face,0));
    internal static void Run()
    {
        var cfg=MatchParityRunner.Config();var idle=cfg["IDLE"];var replay=new KnockoutReplay();var a=Actor(idle,0);
        Check(!replay.Play(),"no unmarked replay");for(var i=0;i<1000;i++)replay.Capture(i*16,a,a);Check(replay.Samples<=226,"history bounded to 3.6 seconds and 240 samples");
        replay.Clear();replay.Mark(1000);for(var i=0;i<=3000;i+=20)replay.Capture(i,a,a);Check(replay.Samples==111,"recording stops 1200 ms after KO");Check(replay.Play(),"marked clip starts");Check(replay.Current.Time==160,"clip begins within 850 ms before KO");
        var previous=replay.Current.Time;replay.Step(16);Check(replay.Current.Time>previous,"playback advances");replay.Clear();Check(!replay.Active&&replay.Samples==0&&replay.Current==null&&!replay.Play(),"cancel clears all replay state");
        Check(Math.Abs(KnockoutReplay.Rate(-500)-.9)<1e-9&&Math.Abs(KnockoutReplay.Rate(0)-.28)<1e-9&&Math.Abs(KnockoutReplay.Rate(100)-.28)<1e-9&&Math.Abs(KnockoutReplay.Rate(600)-1)<1e-9,"source contact slowdown curve");
        Check(KnockoutReplay.Rate(-120)>.28&&KnockoutReplay.Rate(-120)<.9&&KnockoutReplay.Rate(380)>.28&&KnockoutReplay.Rate(380)<1,"smooth speed ramps");
        var b=Actor(idle,.06,600);var mix=ReplayActor.Mix(a,b,.5);Check(Math.Abs(mix.Pose.X-550)<1e-9&&Math.Abs(mix.Pose.Seconds-.03)<1e-9,"same clip pose interpolation");
        Check(ReplayActor.Mix(a,Actor(cfg["BLOCK"],.06,600),.5).Pose.X==500,"action boundary not interpolated");
        Check(ReplayActor.Mix(a,Actor(idle,.06,600,-1),.5).Pose.X==500,"facing change not interpolated");
        Check(ReplayActor.Mix(b,a,.5).Pose.X==600,"loop wrap not interpolated backwards");
        replay.Mark(100);for(var i=0;i<5;i++){replay.Sound(new MatchEvent("hit",0,1,"LIGHT_PUNCH",i,10,"body",default,i*20));replay.Capture(i*20,a,a);}Check(replay.Play(),"short marked clip");
        var sounds=0;for(var i=0;i<1000&&replay.Active;i++){replay.Step(16);while(replay.TrySound(out _))sounds++;}Check(!replay.Active&&sounds==5,"audio events replay once including final sample");
        var m=new ArenaMatch(cfg,cfg,()=>.5);m.Advance(3000);var hp=m.Player.Hp;var time=m.SimulationMs;var wins=m.PlayerWins;
        replay.Clear();replay.Mark(100);for(var i=0;i<20;i++)replay.Capture(i*20,new ReplayActor(m.Presentation(0)),new ReplayActor(m.Presentation(1)));replay.Play();while(replay.Active)replay.Step(16);
        Check(m.Player.Hp==hp&&m.SimulationMs==time&&m.PlayerWins==wins,"replay never advances match or awards score");
        var rejected=false;try{replay.Step(double.NaN);}catch(ArgumentOutOfRangeException){rejected=true;}Check(rejected,"invalid clock rejected");
        Console.WriteLine("PASS "+checks+" replay checks: bounded history, KO window, source speed ramps, clip/side boundaries, once-only audio and no gameplay mutations. Rendered replay remains untested.");
    }
}
