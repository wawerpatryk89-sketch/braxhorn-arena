using System;
using Braxhorn.Arena.Domain;

static class ArmContactParityRunner
{
    static int count;
    static void Check(bool pass,string label){count++;if(!pass)throw new Exception("Arm contact: "+label);}
    static void Near(double a,double b,string label)=>Check(Math.Abs(a-b)<1e-9,label);
    internal static void Run()
    {
        var random=new Random(271);
        for(var i=0;i<1000;i++)
        {
            var a=new Point3(random.NextDouble(),random.NextDouble()*2,random.NextDouble());
            var b=a+new Point3(.1+random.NextDouble()*.3,-.2,0);
            var c=b+new Point3(.1,-.1-random.NextDouble()*.3,.1);
            var goal=a+new Point3(random.NextDouble()*4-2,random.NextDouble()*4-2,random.NextDouble()*4-2);
            Check(ArmContactGeometry.Solve(a,b,c,goal,out var elbow,out var hand),"valid rig solves");
            Near((elbow-a).Length,(b-a).Length,"upper arm length unchanged");Near((hand-elbow).Length,(c-b).Length,"forearm length unchanged");
            var expected=Math.Max(Math.Abs((b-a).Length-(c-b).Length)+.002,Math.Min((b-a).Length+(c-b).Length-.008,(goal-a).Length));
            Near((hand-a).Length,expected,"original reach margins");
        }
        var origin=new Point3(0,0,0);var elbow0=new Point3(.3,0,0);var hand0=new Point3(.6,0,0);
        foreach(var goal in new[]{new Point3(0,1,0),new Point3(0,-1,0),new Point3(.1,0,0),new Point3(100,0,0)})
        {Check(ArmContactGeometry.Solve(origin,elbow0,hand0,goal,out var elbow,out var hand),"vertical and unreachable targets");Near((elbow-origin).Length,.3,"fallback pole preserves upper arm");Near((hand-elbow).Length,.3,"fallback pole preserves forearm");}
        Check(!ArmContactGeometry.Solve(origin,origin,hand0,hand0,out _,out _),"zero bone rejected");
        Check(!ArmContactGeometry.Solve(origin,elbow0,hand0,origin,out _,out _),"zero direction rejected");
        Check(!ArmContactGeometry.Solve(origin,elbow0,hand0,new Point3(double.NaN,0,0),out _,out _),"non-finite target rejected");
        Near(ArmContactGeometry.Weight(0),0,"entry weight");Near(ArmContactGeometry.Weight(.09),.5,"entry midpoint");Near(ArmContactGeometry.Weight(.18),1,"source 180 ms contact blend");Near(ArmContactGeometry.Weight(10),1,"held pose");
        Console.WriteLine("PASS "+count+" arm contact geometry checks: segment lengths, source reach margins, pole singularities and blend timing. Unity transform/skin rendering requires runtime validation.");
    }
}
