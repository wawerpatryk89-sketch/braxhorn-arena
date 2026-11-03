using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;
static class RulesParityRunner
{
    static Func<double> Random(uint seed) => () => { seed = unchecked(seed * 1664525 + 1013904223); return seed / 4294967296.0; };
    static object History(System.Collections.Generic.List<CampaignResult> history) => history.Select(h => new {opponent=h.Opponent,outcome=h.Outcome.ToString().ToLowerInvariant()}).ToArray();
    static JObject Snapshot(CampaignRun r)
    {
        var next=r.Next();
        return JObject.FromObject(new {next,finished=r.Finished,eliminated=r.Eliminated,champion=r.Champion,index=r.Index,score=0,hp=(double?)null,resultApplied=false,history=History(r.History),rounds=r.Rounds.Select(round=>round.Select(b=>new {a=b.A,b=b.B,winner=b.Winner,simulated=b.Simulated}).ToArray()).ToArray()});
    }
    static JObject Snapshot(SurvivalRun r) => JObject.FromObject(new {next=r.Next(),finished=r.Finished,eliminated=false,champion=r.Champion,index=0,score=r.Score,hp=(double?)r.Hp,resultApplied=r.ResultApplied,history=History(r.History),rounds=new object[0]});
    static void Equal(JToken expected,JToken actual,string where)
    {
        if(!Equivalent(expected,actual)) throw new Exception(where+"\nExpected: "+expected+"\nActual: "+actual);
    }
    static bool Equivalent(JToken a,JToken b)
    {
        if(a==null||b==null)return a==b;
        if((a.Type==JTokenType.Integer||a.Type==JTokenType.Float)&&(b.Type==JTokenType.Integer||b.Type==JTokenType.Float))return Math.Abs((double)a-(double)b)<1e-9;
        if(a is JObject ao&&b is JObject bo)return ao.Count==bo.Count&&ao.Properties().All(p=>bo.ContainsKey(p.Name)&&Equivalent(p.Value,bo[p.Name]));
        if(a is JArray aa&&b is JArray ba)return aa.Count==ba.Count&&aa.Select((v,i)=>Equivalent(v,ba[i])).All(x=>x);
        return JToken.DeepEquals(a,b);
    }
    static int Main(string[] args)
    {
        using var input=File.OpenRead(args[0]);using var gzip=new GZipStream(input,CompressionMode.Decompress);using var reader=new StreamReader(gzip);
        var cases=JArray.Parse(reader.ReadToEnd());int states=0;
        foreach(var entry in cases)
        {
            var mode=(string)entry["mode"];var player=(string)entry["player"];var seed=(uint)entry["seed"];var trace=(JArray)entry["trace"];int step=0;
            if(mode=="survival")
            {
                var run=new SurvivalRun(player,Random(seed),(int)entry["limit"]);
                Equal(trace[step++],Snapshot(run),mode+seed+player);
                foreach(var value in entry["outcomes"])
                {
                    var outcome=(BoutOutcome)Enum.Parse(typeof(BoutOutcome),(string)value,true);
                    run.Result(outcome,47);Equal(trace[step++],Snapshot(run),mode+seed+player);
                    run.Result(outcome,1);Equal(trace[step++],Snapshot(run),mode+seed+player);
                    run.Advance();Equal(trace[step++],Snapshot(run),mode+seed+player);
                }
            }
            else
            {
                var run=new CampaignRun(mode,player,SurvivalRun.Roster,Random(seed));
                Equal(trace[step++],Snapshot(run),mode+seed+player);
                foreach(var value in entry["outcomes"])
                {
                    run.Result((BoutOutcome)Enum.Parse(typeof(BoutOutcome),(string)value,true));Equal(trace[step++],Snapshot(run),mode+seed+player);
                }
            }
            states+=step;
        }
        var grazing=CombatGeometry.CircleCapsule(new Point2(3,5),1,new Point2(0,0),new Point2(0,10),2);
        if(!grazing.Hit||Math.Abs(grazing.Point.X-2)>1e-10||Math.Abs(grazing.Point.Y-5)>1e-10)throw new Exception("Capsule grazing contact changed");
        if(CombatGeometry.CircleCapsule(new Point2(3.001,5),1,new Point2(0,0),new Point2(0,10),2).Hit)throw new Exception("Separated capsule accepted");
        if(!CombatGeometry.CircleCapsule(new Point2(0,0),0,new Point2(0,0),new Point2(0,0),0).Hit)throw new Exception("Degenerate capsule rejected");
        Console.WriteLine("PASS "+cases.Count+" campaign parity cases / "+states+" reference states / 3 collision edge cases. This does not validate the full combat loop.");
        if(args.Length>1){CombatParityRunner.Run(args[1]);MediaParityRunner.Run(args[1]);}
        MatchParityRunner.Run(args.Length > 2 ? args[2] : null);
        AdventureParityRunner.Run(args.Length > 2 ? args[2] : null,args.Length>1?args[1]:null);
        GestureParityRunner.Run();
        ClinchParityRunner.Run();
        ArmContactParityRunner.Run();
        MovingStrikeParityRunner.Run();
        TrainingParityRunner.Run();
        ProgressParityRunner.Run();
        return 0;
    }
}
