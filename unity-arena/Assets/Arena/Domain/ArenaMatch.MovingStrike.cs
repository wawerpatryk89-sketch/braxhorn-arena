using System;
using System.Linq;

namespace Braxhorn.Arena.Domain
{
    public sealed partial class ArenaMatch
    {
        internal sealed class StrikeMotion
        {internal string Action;internal int Face;internal double Clock,Weight;internal bool Run,Leg;}
        static bool BasicStrike(string who,string action)
        {
            if(action=="LIGHT_PUNCH"||action=="HEAVY_PUNCH"||action=="LIGHT_KICK"||action=="HEAVY_KICK")return who!="BOSS"&&who!="ZOMBIE";
            return who switch{
                "BRAX"=>action=="DOUBLE_PUNCH"||action=="UPPERCUT",
                "NYXA"=>action=="ELBOW"||action=="CLINCH_KNEE",
                "KROV"=>action=="ELBOW"||action=="UPPERCUT",
                "VEXA"=>action=="SPIN_KICK"||action=="FLYING_KICK",
                "NINA"=>action=="CRESCENT_KICK"||action=="SPIN_KICK"||action=="MEIA_LUA"||action=="GROUND_KICK",
                "DANNY"=>action=="HOOK"||action=="SIDE_KICK",
                "BEAR" or "DEMON"=>action=="SHOULDER"||action=="UPPERCUT",_=>false};
        }
        StrikeMotion CreateStrikeMotion(MatchFighter f,string id,bool locked)
        {
            var c=f.Configuration[id];var explore=Adventure&&!AdventureCombat;
            if(!locked||!c.Attack||c.Source["sourceVersion"]==null||!BasicStrike(f.Configuration.Character,(string)c.Source["shortRangeOf"]??id)||f.Height>0||f.DownPhase!=null||cpu[Side(f)]!=null)return null;
            if(!explore&&(f.Input.Block||f.Input.Direction!=f.Face))return null;
            var previous=f.Motion;var clock=previous?.Clock??(f.Clock.Action!=null&&(IsGait(f.ActionId)||f.ActionId=="ADVENTURE_WALK")?f.Clock.PoseSeconds*1000:0);
            return new StrikeMotion{Action=id,Face=explore&&f.Input.Direction!=0?f.Input.Direction:f.Face,Clock=clock,Run=f.Input.Sprint,Leg=c.Hits.Values.Any(h=>h.Bone!=null&&(h.Bone.Contains("Foot")||h.Bone.Contains("Leg")||h.Bone.Contains("Toe")))};
        }
        string StrikeGait(MatchFighter f)=>f.Motion.Run&&f.Configuration.Has("RUN")?"RUN":Adventure&&!AdventureCombat?"ADVENTURE_WALK":"WALK_FORWARD";
        void AdvanceMovingStrike(MatchFighter f,double dt)
        {
            var m=f.Motion;if(m==null)return;
            if(!f.Locked||f.ActionId!=m.Action||f.StunMs>0||f.PushMs>0||f.Height>0||f.DownPhase!=null||Phase!=MatchPhase.Fighting||PairActive){f.Motion=null;f.MovingGait=null;f.MovingGaitWeight=0;return;}
            var explore=Adventure&&!AdventureCombat;var direction=f.Input.Direction;double travel=0;
            if(explore)
            {
                m.Run=f.Input.Sprint&&f.Configuration.Has("RUN");
                var walk=f.Configuration.Has("ADVENTURE_WALK")?f.Configuration["ADVENTURE_WALK"]:null;
                var duration=walk==null?0:(double?)walk.Source["duration"]??walk.DurationMs/1000;
                var speed=walk==null||duration<=0?Speed(f):AuthoredTravel.Distance(walk,duration)/duration*640/3.25*Scale*walk.Scale;
                if(m.Run)speed=Math.Max(Speed(f)*1.4,speed*1.6);
                if(direction!=0&&!f.Input.Block)travel=speed*dt/1000;
                f.X+=direction*travel;
            }
            else
            {
                var available=Math.Max(0,Math.Abs(f.X-Other(f).X)-WorldHeight*.28);
                if(direction==m.Face&&f.Face==m.Face&&!f.Input.Block)travel=Math.Min(Speed(f)*(m.Run?1.4:.78)*dt/1000,available);
                f.X+=m.Face*travel;
            }
            var gait=StrikeGait(f);
            m.Clock+=dt*(gait=="ADVENTURE_WALK"?1:f.Configuration.Has(gait)?CombatRules.LocomotionTempo(f.Configuration.Character,f.Configuration[gait]):1);
            var target=travel>0&&!m.Leg?1:0;var blend=explore?70:100;m.Weight+=Clamp(target-m.Weight,-dt/blend,dt/blend);
            f.MovingGait=f.Configuration.Has(gait)?gait:null;f.MovingGaitSeconds=m.Clock/1000;f.MovingGaitWeight=m.Weight;
        }
    }
}
