using System;

namespace Braxhorn.Arena.Domain
{
    public sealed partial class ArenaMatch
    {
        bool IsGesture(MatchFighter fighter)=>(bool?)fighter.Action.Source["interruptibleGesture"]==true;
        void CancelGesture(MatchFighter fighter)
        {
            if(!IsGesture(fighter)||pair!=null||recovery!=null)return;
            fighter.GestureCooldown=Math.Max(fighter.GestureCooldown,SimulationMs+12000);
            fighter.GestureIdleMs=0;Idle(fighter);
        }
        internal void QueueGesture(MatchFighter fighter,string action)
        {
            if(Adventure&&!AdventureCombat||!fighter.Configuration.Has(action))return;
            if(action=="AUTO_ANGER"&&++fighter.AngerVariant%2==0&&fighter.Configuration.Has("AUTO_ANGER_2"))action="AUTO_ANGER_2";
            fighter.PendingGesture=action;fighter.GestureExpires=SimulationMs+2500;
        }
        void ResetGestures(MatchFighter fighter,double cooldown=0)
        {fighter.PendingGesture=null;fighter.GestureIdleMs=0;fighter.GestureCooldown=cooldown;}
        void AdvanceGestures(double dt)
        {
            if(Phase!=MatchPhase.Fighting||pair!=null||recovery!=null||holdMs>0||Adventure&&!AdventureCombat)return;
            foreach(var f in fighters)
            {
                if(f.Hp<=0||Other(f).Hp<=0)continue;
                if(!f.Configuration.Has("AUTO_TAUNT")&&!f.Configuration.Has("AUTO_ANGER"))continue;
                var enemy=Other(f);var near=Math.Abs(f.X-enemy.X)<WorldHeight*.78;
                var input=f.Input.Direction!=0||f.Input.Block||f.Input.Down;
                if(IsGesture(f))
                {if(f.StunMs>0||f.DownPhase!=null||f.PushMs>0||near||enemy.Action.Attack||input)CancelGesture(f);continue;}
                if(f.PendingGesture!=null&&SimulationMs>f.GestureExpires)f.PendingGesture=null;
                if(f.ActionId!="IDLE"||f.StunMs>0||f.DownPhase!=null||f.PushMs>0||f.Locked||input||near||enemy.Action.Attack)
                {f.GestureIdleMs=0;continue;}
                f.GestureIdleMs+=dt;
                var name=f.PendingGesture??(f.GestureIdleMs>3500&&SimulationMs>(f.GestureCooldown==0?18000:f.GestureCooldown)?"AUTO_TAUNT":null);
                if(name==null||!f.Configuration.Has(name))continue;
                if(name=="AUTO_TAUNT"&&++f.TauntVariant%2==0&&f.Configuration.Has("AUTO_TAUNT_2"))name="AUTO_TAUNT_2";
                f.Face=Math.Sign(enemy.X-f.X)==0?f.Face:Math.Sign(enemy.X-f.X);
                ResetGestures(f,SimulationMs+20000);Start(f,name,true);
            }
        }
    }
}
