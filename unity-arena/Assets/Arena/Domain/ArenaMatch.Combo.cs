using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public readonly struct FighterPresentation
    {
        public readonly CombatAction Action;
        public readonly double Seconds, X, Height;
        public readonly int Face, Frame;
        internal FighterPresentation(MatchFighter f)
        { Action=f.Action;Seconds=f.Clock.PoseSeconds;X=f.X;Height=f.Height;Face=f.Face;Frame=f.Clock.Frame; }
        internal FighterPresentation(CombatPose pose,double seconds,double floor)
        {Action=pose.Action;Seconds=seconds;X=pose.X;Height=floor-pose.Y;Face=pose.Face;Frame=pose.Frame;}
        internal FighterPresentation(CombatAction action,double seconds,double x,double height,int face,int frame)
        {Action=action;Seconds=seconds;X=x;Height=height;Face=face;Frame=frame;}
    }
    public sealed partial class ArenaMatch
    {
        readonly FighterPresentation[] contactPresentation=new FighterPresentation[2];
        public FighterPresentation Presentation(int side) => holdMs>0 ? contactPresentation[side] : new FighterPresentation(Fighter(side));

        string ComboReaction(MatchFighter a,MatchFighter z,CombatHit hit,string region,out int onset,out double rate)
        {
            onset=0;rate=1;
            if(z.ComboOwner!=a||z.ComboSerial!=a.Serial)z.ComboUsed.Clear();
            z.ComboOwner=a;z.ComboSerial=a.Serial;
            var c=a.Action;var next=c.Hits.OrderBy(h=>h.Key).FirstOrDefault(h=>h.Key>a.Clock.Frame&&h.Value.Group>hit.Group);
            var seconds=.24;
            if(next.Value!=null){seconds=0;for(var i=a.Clock.Frame;i<next.Key;i++)seconds+=c.Durations[i]/1000/CombatRules.ActionTempo(a.Configuration.Character,c,i);}
            var regionTag=region=="head"?"HEAD":"BODY";
            string selected=null;var best=double.PositiveInfinity;var endpoint=0;
            foreach(var r in z.Configuration.Actions.Values)
            {
                if(!r.Id.StartsWith("HIT_COMBO_",StringComparison.Ordinal)||z.ComboUsed.Contains(r.Id)||(string)r.Source["comboReactionRegion"]!=regionTag||r.Capsules==null)continue;
                var first=next.Value!=null?12:Math.Min(r.Durations.Length-1,24);var end=next.Value!=null?r.Durations.Length:first+1;
                for(var frame=first;frame<end;frame++)
                {
                    var score=0d;
                    if(next.Value!=null)
                    {
                        var h=next.Value;var attack=new CombatPose(c,a.Clock.Frame,a.Face,a.X,Floor-a.Height,Scale);
                        var center=attack.Transform(new Point2(h.Box[0]+h.Box[2]/2,h.Box[1]+h.Box[3]/2),c.AnchorY);
                        var pose=new CombatPose(r,frame,z.Face,z.X,Floor-z.Height,Scale);score=double.PositiveInfinity;
                        foreach(var cap in r.Capsules[Math.Min(frame,r.Capsules.Length-1)])
                        {
                            var p=pose.Transform(cap.A,r.AnchorY);var q=pose.Transform(cap.B,r.AnchorY);
                            var u=p.Y==q.Y?0:Clamp((center.Y-p.Y)/(q.Y-p.Y),0,1);
                            var cy=p.Y+(q.Y-p.Y)*u;var cx=p.X+(q.X-p.X)*u;var radius=cap.Radius*pose.Scale+h.Box[2]/2*attack.Scale;
                            score=Math.Min(score,Math.Max(0,Math.Abs(center.Y-cy)-radius*.75)*8+Math.Max(0,Math.Abs(center.X-cx)-radius*.75));
                        }
                    }
                    var style=(string)hit.Source["reactionStyle"];
                    var preferred=style=="side"?r.Id.Contains("SIDE")||r.Id.Contains("RIB")||r.Id.Contains("KIDNEY"):style=="rise"?r.Id.Contains("BIG_HIT")||r.Id.Contains("HEAD_HIT"):r.Id.Contains("HIT_TO_BODY")||r.Id.Contains("HEAD_HIT");
                    var avoid=next.Value?.Bone!=null?c.Source["reactionAvoidBeforeBone"]?[next.Value.Bone] as JArray:null;
                    if(avoid!=null&&avoid.Values<string>().Any(r.Id.Contains))score+=1000;
                    score+=Math.Abs(frame/60d-Math.Min(.55,seconds))*.5+(preferred?0:8);
                    var baseName=r.Id.Replace("_MIRROR","");if(z.ComboUsed.Any(k=>k.Replace("_MIRROR","")==baseName))score+=1000;
                    if(score<best){best=score;selected=r.Id;endpoint=frame;}
                }
            }
            if(selected==null)return null;
            z.ComboUsed.Add(selected);z.ComboEndpoint=endpoint;z.ComboReactionKey=selected;
            onset=Math.Max(0,Math.Min(endpoint-2,8));rate=((endpoint-onset)/60d)/Math.Max(.18,seconds);return selected;
        }
        bool HoldComboReaction(MatchFighter f)
        {
            var a=f.ComboOwner;
            if(a==null||f.ActionId!=f.ComboReactionKey)return false;
            if(a.ActionId!="COMBO"||a.Serial!=f.ComboSerial||a.Hp<=0||a.StunMs>0||Phase!=MatchPhase.Fighting||pair!=null)
            {f.ComboOwner=null;f.ComboReactionKey=null;return false;}
            return true;
        }
        void FollowCombo(MatchFighter a,double dt)
        {
            if(a.ActionId!="COMBO"||a.StunMs>0)return;
            var z=Other(a);if(z.DownPhase!=null)return;
            var c=a.Action;var next=c.Hits.OrderBy(h=>h.Key).FirstOrDefault(h=>h.Key>=a.Clock.Frame&&!a.CleanComboGroups.Contains(h.Value.Group));
            if(next.Value==null||c.Starts[next.Key]-c.Starts[a.Clock.Frame]>650)return;
            var targetFrame=z.ComboOwner==a&&z.ActionId==z.ComboReactionKey?z.ComboEndpoint:z.Clock.Frame;
            var caps=z.Action.Capsules;if(caps==null||targetFrame>=caps.Length)return;
            var hit=next.Value;var ap=new CombatPose(c,a.Clock.Frame,a.Face,a.X,Floor-a.Height,Scale);
            var center=ap.Transform(new Point2(hit.Box[0]+hit.Box[2]/2,hit.Box[1]+hit.Box[3]/2),c.AnchorY);
            var zp=new CombatPose(z.Action,targetFrame,z.Face,z.X,Floor-z.Height,Scale);double? desired=null;
            foreach(var cap in caps[targetFrame])
            {
                var p=zp.Transform(cap.A,z.Action.AnchorY);var q=zp.Transform(cap.B,z.Action.AnchorY);var u=p.Y==q.Y?0:Clamp((center.Y-p.Y)/(q.Y-p.Y),0,1);
                var cy=p.Y+(q.Y-p.Y)*u;var radius=hit.Box[2]/2*ap.Scale+cap.Radius*zp.Scale;var dy=Math.Abs(center.Y-cy);if(dy>=radius)continue;
                var cx=p.X+(q.X-p.X)*u;var reach=((center.X-a.X)-(cx-z.X))*a.Face+Math.Sqrt(radius*radius-dy*dy)*.65;
                if(reach>0)desired=Math.Max(desired??0,reach);
            }
            if(!desired.HasValue)return;var gap=(z.X-a.X)*a.Face;
            if(gap>=ReferenceHeight*1.1||Math.Abs(gap-desired.Value)<=Width*.002)return;
            a.X+=a.Face*Math.Sign(gap-desired.Value)*Math.Min(Math.Abs(gap-desired.Value),Speed(a)*.8*dt/1000);
        }
    }
}
