using System;

namespace Braxhorn.Arena.Domain
{
    // Immutable outside BloodEffects. Recording never shares mutable particles
    // or injuries with the live match, and playback never touches its state.
    public sealed partial class BloodEffects
    {
        public sealed class ReplaySnapshot
        {
            internal readonly BloodParticle[] Particles;
            internal readonly BloodStain[] Stains;
            internal readonly int[] HeadHits;
            internal readonly BloodInjury[][] Injuries;
            internal ReplaySnapshot(BloodEffects source)
            {
                Particles=new BloodParticle[source.particles.Count];
                for(var i=0;i<Particles.Length;i++)Particles[i]=source.particles[i].Copy();
                Stains=source.stains.ToArray();HeadHits=(int[])source.headHits.Clone();
                Injuries=new BloodInjury[2][];
                for(var side=0;side<2;side++)
                {
                    Injuries[side]=new BloodInjury[source.injuries[side].Count];
                    for(var i=0;i<Injuries[side].Length;i++)Injuries[side][i]=Copy(source.injuries[side][i]);
                }
            }
        }
        static BloodInjury Copy(BloodInjury value)=>new BloodInjury{Capsule=value.Capsule,U=value.U,Region=value.Region,Severity=value.Severity};
        public ReplaySnapshot CaptureReplay()=>new ReplaySnapshot(this);
        public void RestoreReplay(ReplaySnapshot snapshot)
        {
            if(snapshot==null){Clear();return;}
            // Reuse playback objects while rendering the same or adjacent sample.
            while(particles.Count>snapshot.Particles.Length)particles.RemoveAt(particles.Count-1);
            for(var i=0;i<snapshot.Particles.Length;i++)
            {
                var s=snapshot.Particles[i];
                if(i==particles.Count)particles.Add(s.Copy());
                else
                {
                    var p=particles[i];p.X=s.X;p.Y=s.Y;p.PreviousX=s.PreviousX;p.PreviousY=s.PreviousY;
                    p.VelocityX=s.VelocityX;p.VelocityY=s.VelocityY;p.Life=s.Life;p.Total=s.Total;
                    p.Floor=s.Floor;p.Radius=s.Radius;p.Gravity=s.Gravity;p.Bright=s.Bright;
                }
            }
            stains.Clear();stains.AddRange(snapshot.Stains);
            for(var side=0;side<2;side++)
            {
                headHits[side]=snapshot.HeadHits[side];regionHits[side].Clear();var values=snapshot.Injuries[side];
                while(injuries[side].Count>values.Length)injuries[side].RemoveAt(injuries[side].Count-1);
                for(var i=0;i<values.Length;i++)
                {
                    var s=values[i];
                    if(i==injuries[side].Count)injuries[side].Add(Copy(s));
                    else{var m=injuries[side][i];m.Capsule=s.Capsule;m.U=s.U;m.Region=s.Region;m.Severity=s.Severity;}
                }
            }
        }
    }
}
