using System;
using System.Collections.Generic;

namespace Braxhorn.Arena.Domain
{
    public sealed class BloodParticle
    {
        public double X,Y,PreviousX,PreviousY,VelocityX,VelocityY,Life,Total,Floor,Radius,Gravity;
        public bool Bright;
        internal BloodParticle Copy()=>(BloodParticle)MemberwiseClone();
    }
    public readonly struct BloodStain
    {
        public readonly double X,Y,Radius;
        public BloodStain(double x,double y,double radius){X=x;Y=y;Radius=radius;}
    }
    public sealed class BloodInjury
    {
        public int Capsule,Severity;
        public double U;
        public string Region;
    }
    public sealed partial class BloodEffects
    {
        readonly Func<double> random;
        readonly List<BloodParticle> particles=new List<BloodParticle>(96);
        readonly List<BloodStain> stains=new List<BloodStain>(100);
        readonly int[] headHits=new int[2];
        readonly List<BloodInjury>[] injuries={new List<BloodInjury>(6),new List<BloodInjury>(6)};
        readonly Dictionary<int,int>[] regionHits={new Dictionary<int,int>(),new Dictionary<int,int>()};
        public IReadOnlyList<BloodParticle> Particles=>particles;
        public IReadOnlyList<BloodStain> Stains=>stains;
        public BloodEffects(Func<double> random){this.random=random??throw new ArgumentNullException(nameof(random));}
        public int WoundLevel(int side)=>Math.Min(6,headHits[side]/2);
        public IReadOnlyList<BloodInjury> Injuries(int side)=>injuries[side];
        double Random(){var n=random();if(double.IsNaN(n)||n<0||n>=1)throw new InvalidOperationException("Random must return [0,1)");return n;}
        public void Hit(int side,double damage,string region,Point2 point,int direction,double width,double height,double floor,CombatPose? previousPose=null)
        {
            if(side<0||side>1||double.IsNaN(damage)||double.IsInfinity(damage)||damage<=0)return;
            if(region=="head")headHits[side]++;
            else if(previousPose.HasValue)Injury(side,region,point,previousPose.Value);
            var size=Math.Max(.8,Math.Min(1.8,height/390));var power=Math.Min(1.5,damage/12);var count=Math.Min(20,9+(int)Math.Ceiling(damage/2));
            for(var i=0;i<count;i++)
            {
                var life=1800+Random()*400;
                particles.Add(new BloodParticle{X=point.X,Y=point.Y,PreviousX=point.X,PreviousY=point.Y,VelocityX=direction*(65+Random()*110)*size*(.7+power*.3),VelocityY=(-95+Random()*95)*size,Life=life,Total=life,Floor=floor,Radius=(1.4+Random()*1.8)*size,Bright=i%4==0,Gravity=700*size});
            }
            if(particles.Count>96)particles.RemoveRange(0,particles.Count-96);
        }
        void Injury(int side,string region,Point2 point,CombatPose pose)
        {
            var capsules=pose.Action.Capsules;if(capsules==null||pose.Frame>=capsules.Length)return;
            var index=-1;var best=double.PositiveInfinity;var position=0d;
            for(var i=0;i<capsules[pose.Frame].Length;i++)
            {
                var cap=capsules[pose.Frame][i];if(cap.Region!=region)continue;
                var a=pose.Transform(cap.A,pose.Action.AnchorY);var b=pose.Transform(cap.B,pose.Action.AnchorY);var dx=b.X-a.X;var dy=b.Y-a.Y;
                var u=Math.Max(.15,Math.Min(.85,((point.X-a.X)*dx+(point.Y-a.Y)*dy)/Math.Max(1e-8,dx*dx+dy*dy)));
                var x=point.X-a.X-u*dx;var y=point.Y-a.Y-u*dy;var distance=x*x+y*y;
                if(distance<best){best=distance;index=i;position=u;}
            }
            if(index<0)return;regionHits[side].TryGetValue(index,out var hits);regionHits[side][index]=++hits;if(hits<2)return;
            var old=injuries[side].Find(m=>m.Capsule==index);if(old!=null)old.Severity=Math.Min(3,hits/2);
            else{injuries[side].Add(new BloodInjury{Capsule=index,U=position,Region=region,Severity=1});if(injuries[side].Count>6)injuries[side].RemoveAt(0);}
        }
        public void Step(double milliseconds,double width,double height)
        {
            if(double.IsNaN(milliseconds)||double.IsInfinity(milliseconds)||milliseconds<0||width<=0||height<=0)throw new ArgumentOutOfRangeException(nameof(milliseconds));
            var dt=Math.Min(50,milliseconds);
            foreach(var p in particles)
            {
                p.Life-=dt;p.PreviousX=p.X;p.PreviousY=p.Y;p.X+=p.VelocityX*dt/1000;p.Y+=p.VelocityY*dt/1000;p.VelocityY+=p.Gravity*dt/1000;
                if(p.Life>0&&p.Y>=p.Floor){stains.Add(new BloodStain(Math.Max(0,Math.Min(1,p.X/width)),p.Floor/height,p.Radius*(2+Random()*2)/height));p.Life=0;}
            }
            if(stains.Count>100)stains.RemoveRange(0,stains.Count-100);particles.RemoveAll(p=>p.Life<=0);
        }
        public void Shift(double fraction,double width)
        {
            for(var i=stains.Count-1;i>=0;i--){var s=stains[i];var x=s.X+fraction;if(x<=-2||x>=3)stains.RemoveAt(i);else stains[i]=new BloodStain(x,s.Y,s.Radius);}
            foreach(var p in particles){p.X+=fraction*width;p.PreviousX+=fraction*width;}
        }
        public void Clear(bool keepMarks=false)
        {particles.Clear();if(!keepMarks){stains.Clear();ClearFighter(0);ClearFighter(1);}}
        public void ClearFighter(int side){headHits[side]=0;injuries[side].Clear();regionHits[side].Clear();}
    }
}
