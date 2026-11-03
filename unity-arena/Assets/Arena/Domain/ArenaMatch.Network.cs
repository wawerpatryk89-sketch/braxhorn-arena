using System;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public sealed partial class ArenaMatch
    {
        public JObject NetworkSnapshot(long id,long ack,long inputSequence,double sentAt)
        {
            var actors=new JArray();
            for(var side=0;side<2;side++)
            {
                var f=Fighter(side);var p=Presentation(side);var c=p.Action;
                var fraction=Clamp((p.Seconds*1000-c.Starts[p.Frame])/c.Durations[p.Frame],0,.999999);
                var gait=f.MovingGait;
                actors.Add(new JObject{
                    ["x"]=Clamp(p.X/Width*100,0,100),["y"]=side==0?p.Height/(Height*.007):0,
                    ["comboAirY"]=side==1?Clamp(p.Height/ReferenceHeight,0,.999999):0,["face"]=p.Face,["hp"]=f.Hp,["en"]=f.Energy,
                    ["a"]=c.Id.ToUpperInvariant(),["frame"]=p.Frame+fraction,["locked"]=f.Locked,["actionId"]=f.Serial,["comboUses"]=f.ComboUses,
                    ["poseLoop"]=!f.Locked,["poseRate"]=Tempo(f,f.Clock.Frame),["poseClockRate"]=1,
                    ["controlBlocked"]=PairActive||HoldingContact||f.StunMs>0||f.DownPhase!=null,["sprint"]=f.Input.Sprint,
                    ["strikeMotion"]=gait==null?null:new JObject{["run"]=gait=="RUN",["weight"]=f.MovingGaitWeight,["clock"]=f.MovingGaitSeconds*1000}
                });
            }
            return new JObject{
                ["sentAt"]=sentAt,["snapshotId"]=id,["ack"]=ack,["inputSeq"]=Math.Max(0,inputSequence),["worldHeight"]=ReferenceHeight/Width*100,
                ["freeze"]=Paused||HoldingContact||Phase!=MatchPhase.Fighting,["neutralClinch"]=ClinchActive,["packagePair"]=PairActive,["comboContactHold"]=HoldingContact,
                ["actors"]=actors,["state"]=new JObject{["clockRate"]=1,["simTime"]=SimulationMs,["poseClock"]=SimulationMs/1000,["t"]=RemainingSeconds,["round"]=Round,["wins"]=new JArray(PlayerWins,OpponentWins),["preFight"]=Phase==MatchPhase.Countdown,["ended"]=Phase==MatchPhase.RoundOver||Phase==MatchPhase.Complete,["matchOver"]=Phase==MatchPhase.Complete,["paused"]=Paused,["callout"]=Phase==MatchPhase.Countdown?Countdown.ToString():""}
            };
        }
    }
    // Read-only remote presentation. It cannot advance hit detection, health,
    // rounds or awards. At most 100 ms of animation may be extrapolated.
    public sealed class DuelRemoteView
    {
        readonly CombatConfiguration[] configs;
        readonly double width,height;
        JObject previous,latest;
        double arrival;
        public JObject Latest=>latest;
        public long SnapshotId=>latest==null?0:(long)latest["snapshotId"];
        public bool Complete=>latest!=null&&(bool)latest["state"]["matchOver"];
        public DuelRemoteView(CombatConfiguration a,CombatConfiguration b,double width,double height)
        {configs=new[]{a,b};this.width=width;this.height=height;}
        public bool Receive(JObject packet,double now)
        {
            if(!DuelWire.Renderable(packet,configs)||(long)packet["snapshotId"]<=SnapshotId||latest!=null&&(double)packet["state"]["simTime"]<(double)latest["state"]["simTime"])return false;
            previous=latest;latest=(JObject)packet.DeepClone();arrival=now;return true;
        }
        public FighterPresentation Pose(int side,double now)
        {
            if(latest==null)throw new InvalidOperationException("No accepted remote state");
            var a=latest["actors"][side];var c=DuelWire.ResolveAction(configs[side],(string)a["a"]);var frame=(double)a["frame"];
            var x=(double)a["x"];var y=Lift(latest,side);var elapsed=Math.Max(0,Math.Min(100,now-arrival));
            if(previous!=null)
            {
                var before=previous["actors"][side];var span=(double)latest["state"]["simTime"]-(double)previous["state"]["simTime"];
                var u=span<=0?1:Math.Min(1,(Math.Max(0,span-80)+elapsed)/span);
                if((bool?)latest["freeze"]!=true)
                {x=(double)before["x"]+(x-(double)before["x"])*u;y=Lift(previous,side)+(y-Lift(previous,side))*u;}
                if(u<1&&(string)before["a"]==(string)a["a"]&&JToken.DeepEquals(before["actionId"],a["actionId"])&&(double)before["frame"]<=frame)
                {frame=(double)before["frame"]+(frame-(double)before["frame"])*u;elapsed=0;}else elapsed=Math.Max(0,elapsed-80);
            }
            var index=Math.Min(c.Durations.Length-1,(int)frame);var fraction=Math.Min(.999999,Math.Max(0,frame-index));
            if((bool?)latest["freeze"]!=true)
            {
                var rate=(double?)a["poseRate"]??CombatRules.ActionTempo(configs[side].Character,c,index)*((double?)a["poseClockRate"]??1);
                var loop=(bool?)a["poseLoop"]??((bool?)a["locked"]!=true);
                for(var guard=0;elapsed>0&&rate>0&&guard<120;guard++)
                {var spent=Math.Min(elapsed,(1-fraction)*c.Durations[index]/rate);fraction+=spent*rate/c.Durations[index];elapsed-=spent;if(fraction<.999999)break;if(index==c.Durations.Length-1){if(!loop){fraction=.999999;break;}index=0;}else index++;fraction=0;}
            }
            return new FighterPresentation(c,(c.Starts[index]+fraction*c.Durations[index])/1000,x/100*width,y,(int)a["face"],index);
        }
        double Lift(JObject packet,int side)=>(side==0?(double)packet["actors"][side]["y"]*height*.007:0)+((double?)packet["actors"][side]["comboAirY"]??0)*((double?)packet["worldHeight"]??50)/100*width;
    }
}
