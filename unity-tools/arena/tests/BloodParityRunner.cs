using System;
using Braxhorn.Arena.Domain;

static class BloodParityRunner
{
    static int count;
    static void Check(bool value,string message){count++;if(!value)throw new Exception("Blood: "+message);}
    internal static void Run()
    {
        var blood=new BloodEffects(()=>0);blood.Hit(0,12,"head",new Point2(500,200),1,1024,390,320);
        Check(blood.Particles.Count==15&&blood.WoundLevel(0)==0,"source particle count and head mark threshold");var p=blood.Particles[0];
        Check(p.Life==1800&&p.VelocityX==65&&p.VelocityY==-95&&p.Gravity==700&&Math.Abs(p.Radius-1.4)<1e-9,"source deterministic burst parameters");
        blood.Step(100,1024,390);Check(Math.Abs(p.X-503.25)<1e-9&&Math.Abs(p.Y-195.25)<1e-9&&p.Life==1750,"source 50 ms frame cap and integration");
        blood.Hit(0,12,"head",new Point2(500,200),-1,1024,390,320);Check(blood.WoundLevel(0)==1&&blood.Particles[15].VelocityX==-65,"second head hit and mirrored direction");
        for(var i=0;i<30;i++)blood.Hit(0,20,"head",new Point2(500,200),1,1024,390,320);Check(blood.Particles.Count==96&&blood.WoundLevel(0)==6,"bounded particle and head wound counts");
        for(var i=0;i<60;i++)blood.Step(50,1024,390);Check(blood.Particles.Count==0&&blood.Stains.Count>0&&blood.Stains.Count<=100,"particles land and retire into bounded stains");
        var stain=blood.Stains[0];blood.Shift(.1,1024);Check(Math.Abs(blood.Stains[0].X-stain.X-.1)<1e-9,"stains follow adventure camera");
        blood.Clear(true);Check(blood.Stains.Count>0&&blood.WoundLevel(0)==6,"round reset retains marks and floor");blood.Clear();Check(blood.Stains.Count==0&&blood.WoundLevel(0)==0,"new match clears effects");
        var cfg=MatchParityRunner.Config();var pose=new CombatPose(cfg["IDLE"],0,1,500,320,1);var point=new Point2(500,305);
        blood.Hit(0,10,"body",point,1,1024,390,320,pose);Check(blood.Injuries(0).Count==0,"single body hit does not leave bruise");blood.Hit(0,10,"body",point,1,1024,390,320,pose);Check(blood.Injuries(0).Count==1&&blood.Injuries(0)[0].Severity==1&&Math.Abs(blood.Injuries(0)[0].U-.5)<1e-9,"body mark attaches to nearest authored capsule");
        for(var i=0;i<12;i++)blood.Hit(0,10,"body",point,1,1024,390,320,pose);Check(blood.Injuries(0).Count==1&&blood.Injuries(0)[0].Severity==3,"repeat bruising capped without duplicate marks");
        blood.Hit(1,10,"head",point,1,1024,390,320);blood.Hit(1,10,"head",point,1,1024,390,320);blood.ClearFighter(1);Check(blood.WoundLevel(1)==0&&blood.Injuries(0).Count==1,"new adventure opponent does not clear player's wounds");
        var before=blood.Particles.Count;blood.Hit(0,double.NaN,"head",point,1,1024,390,320);Check(blood.Particles.Count==before,"invalid damage rejected");
        Console.WriteLine("PASS "+count+" blood checks: source burst parameters, bounded particles/stains/wounds, gravity, camera shift, capsule attachment and reset. Shader/GPU rendering untested.");
    }
}
