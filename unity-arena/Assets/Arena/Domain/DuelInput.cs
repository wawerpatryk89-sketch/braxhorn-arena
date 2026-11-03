using System;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    // Resend unacknowledged input, never manufacture a new event on retry.
    public sealed class DuelInputQueue
    {
        readonly JArray events=new JArray();
        FightInput held;
        long eventId,sequence;
        bool visible=true;
        public int Pending=>events.Count;
        public long LastEvent=>eventId;
        public void Set(FightInput input,bool foreground)
        {
            if(!foreground)input=default;
            if(!held.Equals(input)||visible!=foreground){held=input;visible=foreground;sequence++;}
            if(!foreground&&events.Count>0){events.Clear();sequence++;}
        }
        public bool Press(string kind,bool doubleTap=false)
        {
            if(!visible||!DuelWire.Buttons.Contains(kind)||events.Count>=64)return false;
            events.Add(new JObject{["id"]=++eventId,["kind"]=kind,["grabHeld"]=held.Grab,["doubleTap"]=doubleTap});sequence++;return true;
        }
        public void Acknowledge(long ack)
        {if(ack<0||ack>eventId)return;foreach(var e in events.Where(e=>(long)e["id"]<=ack).ToArray())e.Remove();}
        public void Clear(){held=default;events.Clear();sequence++;}
        public JObject Packet()=>new JObject{["visible"]=visible,["inputSeq"]=sequence,["held"]=new JObject{["left"]=held.Direction<0,["right"]=held.Direction>0,["down"]=held.Down,["block"]=held.Block,["grab"]=held.Grab,["sprint"]=held.Sprint},["events"]=events.DeepClone()};
    }
    public sealed class DuelHostInput
    {
        FightInput held;
        JArray events=new JArray();
        bool restoreHeld;
        public long Acknowledged {get;private set;}
        public long Sequence {get;private set;}=-1;
        public bool Visible {get;private set;}=true;
        public bool Receive(JObject packet)
        {
            if(!DuelWire.Input(packet))return false;
            var seq=(long?)packet["inputSeq"]??Sequence+1;if(seq<Sequence||seq==Sequence&&!restoreHeld)return false;var fresh=seq>Sequence;Sequence=seq;restoreHeld=false;
            Visible=(bool?)packet["visible"]!=false;var h=packet["held"];
            held=Visible?new FightInput(((bool?)h["right"]==true?1:0)-((bool?)h["left"]==true?1:0),(bool?)h["block"]==true,(bool?)h["down"]==true,(bool?)h["sprint"]==true,(bool?)h["grab"]==true):default;
            events=Visible&&fresh?new JArray(((JArray)packet["events"]).Where(e=>(long)e["id"]>Acknowledged).OrderBy(e=>(long)e["id"]).Select(e=>e.DeepClone())):new JArray();return true;
        }
        public void Apply(ArenaMatch match)
        {
            if(match.Paused||match.Phase!=MatchPhase.Fighting||!Visible){match.SetInput(1,default);return;}
            match.SetInput(1,held);
            foreach(var e in events)
            {
                var id=(long)e["id"];if(id<=Acknowledged)continue;Acknowledged=id;
                var input=new FightInput(held.Direction,held.Block,held.Down,held.Sprint,(bool?)e["grabHeld"]==true);
                match.SetInput(1,input);var kind=(string)e["kind"];
                if(kind=="left"||kind=="right")
                {var direction=kind=="left"?-1:1;if((bool?)e["doubleTap"]==true&&direction!=match.Opponent.Face)match.Press(1,FightButton.Retreat);}
                else if(Button(kind) is FightButton button)match.Press(1,button);
            }
            events.Clear();match.SetInput(1,held);
        }
        public void DropPending(){foreach(var e in events)Acknowledged=Math.Max(Acknowledged,(long)e["id"]);events.Clear();held=default;restoreHeld=true;}
        static FightButton? Button(string kind)=>kind switch {"punch"=>FightButton.Punch,"heavy"=>FightButton.Heavy,"kick"=>FightButton.Kick,"kick2"=>FightButton.HeavyKick,"special"=>FightButton.Combo,"grab"=>FightButton.Grab,"evade"=>FightButton.Evade,_=>null};
    }
}
