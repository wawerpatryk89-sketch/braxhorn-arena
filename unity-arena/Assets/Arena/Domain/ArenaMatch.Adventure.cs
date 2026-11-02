using System;

namespace Braxhorn.Arena.Domain
{
    public sealed partial class ArenaMatch
    {
        public bool Adventure { get; private set; }
        public bool AdventureCombat { get; private set; }
        public void EnableAdventure()
        {
            Adventure=true;AdventureCombat=false;Phase=MatchPhase.Fighting;RemainingSeconds=999999;events.Clear();ReleaseInputs();Opponent.X=-10000;
        }
        public void InstallAdventureOpponent(CombatConfiguration config,double hp,double x)
        {
            if(!Adventure||AdventureCombat)throw new InvalidOperationException("Opponent replacement outside adventure exploration");
            if(hp<=0||hp>100||!Finite(x))throw new ArgumentOutOfRangeException(nameof(hp));
            Opponent=new MatchFighter(config){Hp=hp,X=x,Face=-1};fighters[1]=Opponent;Idle(Opponent);cpu[1]=null;pair=null;recovery=null;
        }
        public void BeginAdventureEncounter(CpuLevel level)
        {
            if(!Adventure||AdventureCombat)throw new InvalidOperationException("Invalid adventure encounter transition");
            AdventureCombat=true;UseCpu(1,level);cpu[1].Delay(650);RemainingSeconds=999999;
        }
        public void EndAdventureEncounter()
        {
            if(!Adventure||!AdventureCombat||Opponent.Hp>0)throw new InvalidOperationException("Unfinished encounter");
            AdventureCombat=false;cpu[1]=null;pair=null;recovery=null;holdMs=0;Player.ApproachingCombo=false;Player.PendingPair=null;
            Player.Hp=Math.Min(100,Player.Hp+20);Opponent.X=-10000;ReleaseInputs();
        }
        public void PlaceAdventureFighter(int side,double x,double height=0)
        {if(!Adventure||!Finite(x)||!Finite(height))throw new InvalidOperationException("Invalid adventure position");var f=Fighter(side);f.X=x;f.Height=height;}
        public void SampleAdventurePose(int side,string action,double seconds)
        {
            if(!Adventure||AdventureCombat)throw new InvalidOperationException("External pose cannot replace combat authority");
            var f=Fighter(side);if(f.ActionId!=action)Start(f,action,false);
            f.Clock.Seek((Math.Max(0,seconds)*1000)%f.Action.DurationMs);
        }
        public void AdvanceAdventureClock(double milliseconds)
        {if(!Adventure||milliseconds<0||!Finite(milliseconds))throw new ArgumentException("Invalid adventure clock");if(!Paused)SimulationMs+=milliseconds;}
        public double HealAdventure(double amount)
        {if(!Adventure||amount<0||!Finite(amount))throw new ArgumentException("Invalid adventure heal");var before=Player.Hp;Player.Hp=Math.Min(100,Player.Hp+amount);return Player.Hp-before;}
        public void ShiftAdventureCamera(double pixels)
        {
            if(!Adventure||!Finite(pixels))throw new ArgumentException("Invalid adventure camera shift");
            foreach(var f in fighters)f.X-=pixels;
            if(holdMs>0)for(var i=0;i<2;i++){var p=contactPresentation[i];contactPresentation[i]=new FighterPresentation(p.Action,p.Seconds,p.X-pixels,p.Height,p.Face,p.Frame);}
        }
        void AdvanceAdventureExplore(double dt)
        {
            var f=Player;f.StunMs=Math.Max(0,f.StunMs-dt);f.ProtectionMs=Math.Max(0,f.ProtectionMs-dt);
            if(!f.Locked&&f.DownPhase==null&&f.StunMs<=0)
            {
                var direction=f.Input.Direction;if(direction!=0)f.Face=direction;
                var walk=f.Configuration.Has("ADVENTURE_WALK")?"ADVENTURE_WALK":"PREFIGHT_WALK";
                var action=f.Input.Block&&f.Configuration.Character!="NINA"&&f.Configuration.Has("BLOCK")?f.Input.Down&&f.Configuration.Has("BLOCK_LOW")?"BLOCK_LOW":"BLOCK":direction==0?"IDLE":f.Input.Sprint&&f.Configuration.Has("RUN")?"RUN":walk;
                if(f.ActionId!=action)Start(f,action,false);
                if(direction!=0&&!f.Input.Block)
                {
                    var w=f.Configuration[walk];var t=f.Clock.PoseSeconds;
                    var speed=AuthoredTravel.Distance(w,(double)w.Source["duration"])/(double)w.Source["duration"]*640/3.25*Scale*w.Scale;
                    var step=action=="RUN"?Math.Max(Speed(f)*1.4,speed*1.6)*dt/1000:(AuthoredTravel.Distance(w,t+dt/1000)-AuthoredTravel.Distance(w,t))*640/3.25*Scale*w.Scale;
                    f.X+=direction*step;
                }
            }
            AdvancePose(f,dt,false);
        }
    }
}
