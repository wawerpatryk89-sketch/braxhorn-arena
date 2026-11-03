using System;
using System.Linq;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

static class CpuParityRunner
{
    static int count;
    static void Check(bool pass,string message){count++;if(!pass)throw new Exception("CPU: "+message);}
    static ArenaMatch Match(CombatConfiguration cfg,CpuLevel level,Func<double> random,bool training=false)
    {var m=new ArenaMatch(cfg,cfg,random,training:training);m.UseCpu(1,level);m.Advance(3000);m.Player.X=500;m.Opponent.X=520;return m;}
    internal static void Run()
    {
        var m=Match(MatchParityRunner.Config(),CpuLevel.Hard,()=>.5,true);m.Advance(3000);
        var ordinary=0;var combos=0;while(m.TryDequeue(out var e))if(e.Kind=="swing"&&e.Actor==1){if(e.Action=="COMBO")combos++;else ordinary++;}
        Check(combos==1,"combo interval is independent even with infinite training energy");Check(ordinary>0,"CPU uses basic attacks during 18 second combo cooldown");
        var root=new JObject(MatchParityRunner.Config().Actions.Select(p=>new JProperty(p.Key,p.Value.Source.DeepClone())));
        foreach(var action in ArenaMatch.BasicMoves("NINA"))root[action]=MatchParityRunner.Action(action,true);
        m=Match(new CombatConfiguration("NINA",root),CpuLevel.Easy,()=>.999,true);m.Advance(1150);
        var ground=false;while(m.TryDequeue(out var e))if(e.Kind=="swing"&&e.Actor==1&&e.Action=="GROUND_KICK")ground=true;Check(ground,"full Nina repertoire reaches ground kick");
        Check(ArenaMatch.BasicMoves("NINA").SequenceEqual(new[]{"LIGHT_PUNCH","HEAVY_PUNCH","LIGHT_KICK","HEAVY_KICK","CRESCENT_KICK","SPIN_KICK","MEIA_LUA","GROUND_KICK"}),"source move order preserved");
        Check(ArenaMatch.BasicMoves("BOSS").Length==5&&ArenaMatch.BasicMoves("ZOMBIE").Length==5,"adventure opponents retain authored fifth attack");
        root=new JObject(MatchParityRunner.Config().Actions.Select(p=>new JProperty(p.Key,p.Value.Source.DeepClone())));root["HEAVY_PUNCH"]["durations"]=new JArray(1000,1000,1000,1000);
        m=Match(new CombatConfiguration("BRAX",root),CpuLevel.Hard,()=>.999);m.Press(0,FightButton.Heavy);m.Advance(100);Check(m.Opponent.Serial==0,"hard CPU waits for original reaction time");m.Advance(200);Check(m.Opponent.Serial>0,"CPU may answer after reaction window");
        foreach(var hit in ((JObject)root["HEAVY_PUNCH"]["hits"]).Properties())hit.Value["box"][1]=-150;
        m=Match(new CombatConfiguration("BRAX",root),CpuLevel.Hard,()=>.1);m.Press(0,FightButton.Heavy);m.Advance(1000);Check(m.Opponent.ActionId=="BLOCK","guard duration tracks long incoming attack, not fixed 700 ms: "+m.Opponent.ActionId);
        var serial=m.Opponent.Serial;m.SetPaused(true);m.Advance(20000);Check(m.Opponent.Serial==serial,"pause prevents CPU actions and timer consumption");
        Console.WriteLine("PASS "+count+" CPU checks: independent combo timer, complete source move sets, reaction delay, adaptive guard and pause.");
    }
}
