using System;
using System.IO;
using System.IO.Compression;
using System.Collections.Generic;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

static class CombatParityRunner
{
    static JArray Read(string file)
    {
        using var stream = File.OpenRead(file);
        using var gzip = new GZipStream(stream, CompressionMode.Decompress);
        using var reader = new StreamReader(gzip);
        return JArray.Parse(reader.ReadToEnd());
    }
    static void Near(double actual, double expected, string where)
    {
        if (double.IsNaN(actual) || Math.Abs(actual - expected) > 1e-8) throw new Exception(where + ": " + actual + " != " + expected);
    }
    public static void Run(string directory)
    {
        var input = Read(Path.Combine(directory,"combat-inputs.json.gz"));
        var expected = Read(Path.Combine(directory,"combat-reference.json.gz"));
        var comparisons = 0;
        for (var i = 0; i < input.Count; i++)
        {
            var row = input[i]; var reference = expected[i];
            var config = new CombatConfiguration((string)row["base"], (JObject)row["config"]);
            foreach (var action in reference["actions"])
            {
                var c = config[(string)action["id"]];
                foreach (var state in action["frames"])
                {
                    Near(CombatRules.BaseTempo(c,(int)state["frame"]),(double)state["base"],c.Id+" base");
                    Near(CombatRules.ActionTempo(config.Character,c,(int)state["frame"]),(double)state["tempo"],c.Id+" action");
                    comparisons += 2;
                }
                Near(CombatRules.LocomotionTempo(config.Character,c),(double)action["locomotion"],c.Id+" gait");
                comparisons++;
            }
            foreach (var button in reference["buttons"])
            {
                var actual = CombatRules.ButtonMove(config,(string)button["kind"],(bool)button["forward"],(bool)button["down"],(bool)button["running"]);
                if (actual != (string)button["expected"]) throw new Exception(row["id"]+" input changed: "+button);
                comparisons++;
            }
            Near(CombatRules.Movement(config.Character,300,844,false),(double)reference["movement"][0],"forward");
            Near(CombatRules.Movement(config.Character,300,844,true),(double)reference["movement"][1],"backwards");
            comparisons += 2;
        }
        // Partitioning a time interval must not skip a one-frame active window.
        var sample = new CombatAction("CLOCK",JObject.Parse("{durations:[10,10,10,10],hits:{'1':{box:[0,0,2,2],damage:4,group:0}},attack:true}"));
        var a = new ActionClock(); var b = new ActionClock(); a.Start(sample);b.Start(sample);
        var crossed = new HashSet<int>();a.Advance(35,_=>1,f=>{crossed.Add(f);return true;});
        for (var i=0;i<7;i++)b.Advance(5,_=>1,_=>true);
        if (!crossed.Contains(1) || a.Frame != b.Frame) throw new Exception("Frame-rate dependent hit timing");
        Near(a.PoseSeconds,b.PoseSeconds,"partitioned clock");
        var held = new ActionClock();held.Start(sample);var remainder=held.Advance(35,_=>1,f=>f!=1);
        if(held.Frame!=1||held.FrameMs!=0||remainder!=25)throw new Exception("Contact hold did not stop at the exact frame");
        var invalid=false;try{new CombatAction("INVALID",JObject.Parse("{durations:[0]}"));}catch(InvalidDataException){invalid=true;}
        if(!invalid)throw new Exception("Zero frame duration can hang simulation");
        if(CombatRules.Blocks(true,false,"leg")||!CombatRules.Blocks(true,true,"leg")||CombatRules.Blocks(true,true,"head"))throw new Exception("Regional guard changed");
        var target = new CombatAction("IDLE",JObject.Parse("{durations:[10],pivotX:0,anchorY:0,hits:{},hurtCapsules:[[{region:'head',a:[0,0],b:[0,2],radius:1}]]}"));
        var strike = new CombatAction("PUNCH",JObject.Parse("{durations:[10],pivotX:0,anchorY:0,gain:10,hits:{'0':{box:[0,0,2,2],damage:4,group:0}}}"));
        foreach(var facing in new[]{-1,1})
        {
            var contact = CombatContacts.Find(new CombatPose(strike,0,facing,0,0,1),strike.Hits[0],new CombatPose(target,0,-facing,2*facing,0,1));
            if(!contact.Hit||contact.Region!="head")throw new Exception("Mirrored source contact missed");
            if(CombatContacts.Find(new CombatPose(strike,0,facing,0,0,1),strike.Hits[0],new CombatPose(target,0,-facing,20*facing,0,1)).Hit)throw new Exception("Out-of-range strike connected");
        }
        var ledger=new AttackLedger();
        if(!ledger.Register(strike.Hits[0],true,strike,true,out var gain)||gain!=0)throw new Exception("Blocked hit awarded energy");
        if(ledger.Register(strike.Hits[0],false,strike,true,out gain)||gain!=0)throw new Exception("Repeated frame reapplied hit group");
        ledger.Reset();
        if(!ledger.Register(strike.Hits[0],false,strike,true,out gain)||gain!=10)throw new Exception("Clean hit lost authored energy");
        var secondHit=new CombatHit(JObject.Parse("{box:[0,0,2,2],damage:4,group:1}"));
        if(!ledger.Register(secondHit,false,strike,true,out gain)||gain!=0)throw new Exception("Second group awarded energy twice");
        Console.WriteLine("PASS "+comparisons+" combat reference comparisons across "+input.Count+" variants; timeline partition, contact hold, malformed duration and regional guard checks. Full paired combat is not covered.");
    }
}
