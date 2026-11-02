using System;
using System.IO;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

static class MediaParityRunner
{
    internal static void Run(string root)
    {
        var cases=JArray.Parse(File.ReadAllText(Path.Combine(root,"media-reference.json")));
        foreach(var c in cases)
        {
            var geometry=new MediaGeometry((double)c["width"],(double)c["height"],(double)c["aspect"],(double)c["ground"],(bool)c["contain"]);
            if(Math.Abs(geometry.Floor-(double)c["floor"])>1e-8)throw new Exception("Original arena floor mismatch: "+c["id"]);
            if(Math.Abs(geometry.Left*2+geometry.Width-(double)c["width"])>1e-8||Math.Abs(geometry.Top*2+geometry.Height-(double)c["height"])>1e-8)throw new Exception("Media is not centered");
        }
        if(MediaGeometry.LoopBlend(1,10)!=0||MediaGeometry.LoopBlend(10,10)!=1||Math.Abs(MediaGeometry.LoopBlend(9.775,10)-.5)>1e-8)throw new Exception("Loop cross-fade endpoints/midpoint changed");
        if(MediaGeometry.AdventureSpan(1920,1080)!=100||Math.Abs(MediaGeometry.AdventureSpan(800,600)-800.0/(600.0*898/512)*100)>1e-8)throw new Exception("Adventure viewport changed");
        var rejected=false;try{new MediaGeometry(1920,1080,double.NaN,.81,false);}catch(ArgumentOutOfRangeException){rejected=true;}if(!rejected)throw new Exception("Invalid arena aspect accepted");
        Console.WriteLine("PASS "+cases.Count+" original arena floor/crop cases plus loop, adventure viewport and invalid-input edges. Video/GPU playback remains untested.");
        var entrances=JArray.Parse(File.ReadAllText(Path.Combine(root,"entrance-reference.json")));var samples=0;
        void Equal(double a,double b){if(Math.Abs(a-b)>1e-8)throw new Exception("Adventure doorway projection changed: "+a+" != "+b);}
        foreach(var c in entrances)
        {
            var i=c["input"];var e=new AdventureEntrance((JObject)i["config"],(JObject)i["entry"],(double)i["width"],(double)i["height"],(double)i["scale"]);var expected=c["expected"];
            Equal(e.Distance,(double)expected["distance"]);Equal(e.Depth,(double)expected["depth"]);Equal(e.X0,(double)expected["x0"]);Equal(e.Yaw,(double)expected["yaw"]);
            if(e.Masked!=(bool)expected["masked"])throw new Exception("Adventure doorway mask changed");
            foreach(var s in c["samples"]){var point=e.Sample((double)s["travel"]);Equal(point.X,(double)s["x"]);Equal(point.Ground,(double)s["ground"]);Equal(point.Depth,(double)s["depth"]);Equal(point.Yaw,(double)s["yaw"]);samples++;}
        }
        Console.WriteLine("PASS "+entrances.Count+" original adventure entrance projections / "+samples+" source path samples; gameplay integration is separate.");
    }
}
