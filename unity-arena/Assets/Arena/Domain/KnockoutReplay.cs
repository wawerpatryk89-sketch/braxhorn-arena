using System;
using System.Collections.Generic;
using System.Linq;

namespace Braxhorn.Arena.Domain
{
    public readonly struct ReplayActor
    {
        public readonly FighterPresentation Pose;
        public readonly string Gait;
        public readonly double GaitSeconds,GaitWeight;
        public ReplayActor(FighterPresentation pose,string gait=null,double seconds=0,double weight=0)
        {Pose=pose;Gait=gait;GaitSeconds=seconds;GaitWeight=weight;}
        internal static ReplayActor Mix(ReplayActor a,ReplayActor b,double u)
        {
            var x=a.Pose;var y=b.Pose;
            if(x.Action!=y.Action||x.Face!=y.Face||y.Seconds<x.Seconds)return a;
            double Mix(double first,double next)=>first+(next-first)*u;
            var seconds=Mix(x.Seconds,y.Seconds);var frame=Array.BinarySearch(x.Action.Starts,seconds*1000);if(frame<0)frame=Math.Max(0,~frame-1);frame=Math.Min(frame,x.Action.Durations.Length-1);
            return new ReplayActor(new FighterPresentation(x.Action,seconds,Mix(x.X,y.X),Mix(x.Height,y.Height),x.Face,frame),a.Gait,
                a.Gait==b.Gait&&b.GaitSeconds>=a.GaitSeconds?Mix(a.GaitSeconds,b.GaitSeconds):a.GaitSeconds,a.Gait==b.Gait?Mix(a.GaitWeight,b.GaitWeight):a.GaitWeight);
        }
    }
    public sealed class ReplayFrame
    {
        public double Time {get;}
        public ReplayActor First {get;}
        public ReplayActor Second {get;}
        internal readonly MatchEvent[] Sounds;
        internal ReplayFrame(double time,ReplayActor first,ReplayActor second,MatchEvent[] sounds)
        {Time=time;First=first;Second=second;Sounds=sounds;}
    }
    // Source ko-replay.js timing and bounded pose history; never advances gameplay.
    public sealed class KnockoutReplay
    {
        readonly Queue<ReplayFrame> history=new Queue<ReplayFrame>();
        readonly Queue<MatchEvent> pending=new Queue<MatchEvent>(),playbackSounds=new Queue<MatchEvent>();
        ReplayFrame[] clip=Array.Empty<ReplayFrame>();
        double? marked;
        double last=double.NegativeInfinity,elapsed;
        int soundIndex=-1;
        public bool Active {get;private set;}
        public ReplayFrame Current {get;private set;}
        public int Samples=>history.Count;
        public void Mark(double time){if(!marked.HasValue&&Finite(time))marked=time;}
        static bool Finite(double n)=>!double.IsNaN(n)&&!double.IsInfinity(n);
        public void Sound(MatchEvent e)
        {if(Active)return;pending.Enqueue(e);while(pending.Count>32)pending.Dequeue();}
        public void Capture(double time,ReplayActor first,ReplayActor second)
        {
            if(Active||!Finite(time)||time<last||marked.HasValue&&time>marked.Value+1200)return;
            if(time-last<15)return;
            last=time;history.Enqueue(new ReplayFrame(time,first,second,pending.ToArray()));pending.Clear();
            while(history.Count>240||history.Count>0&&history.Peek().Time<time-3600)history.Dequeue();
        }
        public bool Play()
        {
            if(Active||!marked.HasValue)return false;
            clip=history.Where(f=>f.Time>=marked.Value-850&&f.Time<=marked.Value+1200).ToArray();
            if(clip.Length<3)return false;Active=true;elapsed=0;soundIndex=-1;Current=clip[0];return true;
        }
        public static double Rate(double offset)
        {
            double Smooth(double value){var x=Math.Max(0,Math.Min(1,value));return x*x*(3-2*x);}
            if(offset<-240)return .9;if(offset<0)return .9-.62*Smooth((offset+240)/240);
            if(offset<160)return .28;return .28+.72*Smooth((offset-160)/440);
        }
        public void Step(double milliseconds)
        {
            if(!Finite(milliseconds)||milliseconds<0)throw new ArgumentOutOfRangeException(nameof(milliseconds));if(!Active)return;
            var remaining=Math.Min(100,milliseconds);while(remaining>0){var chunk=Math.Min(8,remaining);elapsed+=chunk*Rate(clip[0].Time+elapsed-marked.Value);remaining-=chunk;}
            var time=clip[0].Time+elapsed;var index=0;while(index+1<clip.Length&&clip[index+1].Time<=time)index++;
            while(soundIndex<index){soundIndex++;foreach(var e in clip[soundIndex].Sounds)playbackSounds.Enqueue(e);}
            var a=clip[index];if(index==clip.Length-1){Current=a;Active=false;return;}
            var b=clip[index+1];var u=Math.Max(0,Math.Min(1,(time-a.Time)/(b.Time-a.Time)));
            Current=new ReplayFrame(time,ReplayActor.Mix(a.First,b.First,u),ReplayActor.Mix(a.Second,b.Second,u),Array.Empty<MatchEvent>());
        }
        public bool TrySound(out MatchEvent e){if(playbackSounds.Count==0){e=default;return false;}e=playbackSounds.Dequeue();return true;}
        public void Clear(){Active=false;history.Clear();pending.Clear();playbackSounds.Clear();clip=Array.Empty<ReplayFrame>();Current=null;marked=null;last=double.NegativeInfinity;elapsed=0;soundIndex=-1;}
    }
}
