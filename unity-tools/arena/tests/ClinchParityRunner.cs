using System;
using System.Linq;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

static class ClinchParityRunner
{
    static int count;
    static void Check(bool condition,string label){count++;if(!condition)throw new Exception("Clinch: "+label);}
    static ArenaMatch Match(bool training=true,Func<double> random=null)
    {
        var root=new JObject(MatchParityRunner.Config().Actions.Select(p=>new JProperty(p.Key,p.Value.Source.DeepClone())));
        var hold=MatchParityRunner.Action("CLINCH_HOLD");hold["durations"]=new JArray(100,100,100,100);root["CLINCH_HOLD"]=hold;
        var cfg=new CombatConfiguration("BRAX",root);var m=new ArenaMatch(cfg,cfg,random??(()=>.2),training:training);
        m.Advance(3000);m.Player.X=500;m.Opponent.X=520;m.SetInput(0,new FightInput(1));m.Advance(100);return m;
    }
    internal static void Run()
    {
        var m=Match();Check(m.ClinchActive&&m.PairActive,"body pressure enters neutral hold");Check(m.Player.Hp==100&&m.Opponent.Hp==100,"contact deals no damage");
        Check(m.Player.ActionId=="CLINCH_HOLD"&&m.Opponent.ActionId=="CLINCH_HOLD","both use original hold");
        m.Advance(400);Check(Math.Abs(m.Player.Clock.PoseSeconds-.28)<.0001,"pose holds at original 280 ms");
        m.SetPaused(true);m.Advance(5000);Check(m.ClinchActive,"pause does not consume timeout");Check(!m.Press(0,FightButton.Evade),"paused command rejected");m.SetPaused(false);
        Check(m.Press(0,FightButton.Evade)&&!m.ClinchActive,"evade breaks hold");var gap=m.Opponent.X-m.Player.X;m.Advance(200);Check(m.Opponent.X-m.Player.X>gap,"release separates fighters");
        m=Match();m.SetInput(0,new FightInput(0,grab:true));Check(!m.ClinchActive,"grab breaks hold");
        m=Match();Check(!m.Press(0,FightButton.Jump)&&m.ClinchActive,"unsupported input preserves hold");
        Check(!m.Press(0,FightButton.Heavy)&&m.ClinchActive&&m.Player.Locked&&m.Opponent.Locked,"unconfigured pair restores hold locks");
        Check(m.Press(0,FightButton.Punch)&&!m.ClinchActive&&m.PairActive,"punch selects original paired move");m.Advance(600);Check(m.Opponent.Hp==84,"paired contact applies damage once");
        m=Match();m.Advance(1900);Check(!m.ClinchActive&&!m.Player.Locked,"timeout releases both actors");
        m=Match();m.UseCpu(1,CpuLevel.Normal);m.Advance(700);Check(!m.ClinchActive,"CPU uses normal break command after reaction window");
        m=Match(false);m.Advance(61000);Check(m.Phase==MatchPhase.RoundOver||m.Phase==MatchPhase.Countdown||m.Phase==MatchPhase.Complete,"round timer cannot be blocked by clinch");Check(!m.ClinchActive,"round end clears clinch");
        m=Match();m.EnableAdventure();Check(!m.ClinchActive,"exploration clears hold state");
        for(var side=0;side<2;side++)
        {
            var pick=side;var calls=0;m=Match(random:()=>++calls==1?(pick==0?.2:.8):calls==2?.8:.2);m.UseCpu(0);m.UseCpu(1);m.Advance(700);
            var actor=-1;while(m.TryDequeue(out var e))if(e.Kind=="grab")actor=e.Actor;
            Check(actor==side,"spectator clinch can choose CPU side "+side+" (actual "+actor+")");
        }
        Console.WriteLine("PASS "+count+" clinch checks: non-damaging contact, source pose time, break/throw inputs, pause, timeout, CPU and adventure reset. Dynamic hand IK remains unvalidated.");
    }
}
