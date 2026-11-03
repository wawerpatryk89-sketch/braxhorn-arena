using System;

namespace Braxhorn.Arena.Domain
{
    public sealed partial class ArenaMatch
    {
        bool clinch, clinchNeedsSeparation, clinchCpuDecided;
        double clinchElapsed, clinchContactMs, clinchCooldown;
        public bool ClinchActive => clinch;
        void ResetClinch()
        {clinch=clinchNeedsSeparation=clinchCpuDecided=false;clinchElapsed=clinchContactMs=clinchCooldown=0;}
        double ClinchGap()
        {
            var a=Body(Player);var z=Body(Opponent);var gap=Math.Abs(z.center-a.center)-a.radius-z.radius;
            var first=Player.Action.Capsules;var second=Opponent.Action.Capsules;
            if(first==null||second==null||Player.Clock.Frame>=first.Length||Opponent.Clock.Frame>=second.Length)return gap;
            var p=Pose(Player);var q=Pose(Opponent);
            foreach(var x in first[Player.Clock.Frame])foreach(var y in second[Opponent.Clock.Frame])
                if(x.Region=="body"&&y.Region=="body")gap=Math.Min(gap,CombatGeometry.SegmentDistance(p.Transform(x.A,Player.Action.AnchorY),p.Transform(x.B,Player.Action.AnchorY),q.Transform(y.A,Opponent.Action.AnchorY),q.Transform(y.B,Opponent.Action.AnchorY))-x.Radius*p.Scale-y.Radius*q.Scale);
            return gap;
        }
        void DetectClinch(double dt)
        {
            clinchCooldown=Math.Max(0,clinchCooldown-dt);
            var gap=ClinchGap();var threshold=Math.Max(2,ReferenceHeight*.01);
            if(clinchNeedsSeparation&&gap>threshold+ReferenceHeight*.035)clinchNeedsSeparation=false;
            var eligible=!clinchNeedsSeparation&&clinchCooldown<=0&&pair==null&&recovery==null;
            foreach(var f in fighters)eligible&=f.Configuration.Has("CLINCH_HOLD")&&f.Configuration.Has("COMBO")&&(bool?)f.Configuration["IDLE"].Source["pairedCombat"]?["enabled"]==true&&f.Hp>0&&f.Height<=0&&f.DownPhase==null&&!f.Locked&&f.StunMs<=0&&f.PushMs<=0&&f.GrabProtection<=0&&!f.Action.Attack&&!f.ApproachingCombo&&f.ComboOwner==null;
            if(!eligible||gap>threshold||!(Player.Input.Direction*Player.Face>0||Opponent.Input.Direction*Opponent.Face>0||gap<-.01)){clinchContactMs=0;return;}
            clinchContactMs+=dt;if(clinchContactMs<64&&gap>=-.01)return;
            ReleaseInputs();holdMs=0;clinchContactMs=clinchElapsed=0;clinchCpuDecided=false;
            foreach(var f in fighters){f.Face=Math.Sign(Other(f).X-f.X)==0?f.Face:Math.Sign(Other(f).X-f.X);f.PushMs=f.StunMs=0;f.Pressure.Reset();ResetGestures(f,SimulationMs+12000);Start(f,"CLINCH_HOLD",true);}
            Separate();Confine();Separate();clinch=true;Emit("clinch",Player,Opponent);
        }
        void ReleaseClinch()
        {
            clinch=false;clinchCooldown=700;clinchNeedsSeparation=true;clinchContactMs=0;ReleaseInputs();
            foreach(var f in fighters){Idle(f);f.GrabProtection=700;f.PushMs=280;f.PushSpeed=-f.Face*WorldHeight*.20/.28;f.StunMs=0;}
            foreach(var controller in cpu)controller?.ResetClinchCooldown();
            Emit("break",Player,Opponent);
        }
        bool ClinchInput(MatchFighter f,FightButton button)
        {
            if(button==FightButton.Evade){ReleaseClinch();return true;}
            var kind=button switch{FightButton.Punch=>"punch",FightButton.Heavy=>"heavy",FightButton.Kick=>"kick",FightButton.HeavyKick=>"kick2",_=>null};
            var move=kind==null?null:(string)f.Configuration["IDLE"].Source["pairedCombat"]?["buttons"]?[kind];
            if(move==null)return false;
            clinch=false;foreach(var actor in fighters)actor.Locked=false;
            if(TryPair(f,move,false))return true;
            clinch=true;foreach(var actor in fighters)actor.Locked=true;return false;
        }
        void AdvanceClinch(double dt)
        {
            clinchElapsed+=dt;
            foreach(var f in fighters)f.Clock.Seek(Math.Min(Math.Min(280,clinchElapsed),f.Action.DurationMs));
            if(!clinchCpuDecided)
            {
                var first=cpu[0]!=null&&cpu[0].CanDecideClinch&&clinchElapsed>=cpu[0].ClinchReactionMs;
                var second=cpu[1]!=null&&cpu[1].CanDecideClinch&&clinchElapsed>=cpu[1].ClinchReactionMs;
                if(first||second)
                {
                    // Source spectator mode chooses either actor, rather than
                    // always giving the left-hand CPU the first throw.
                    var side=first&&second?(NextRandom()<.5?0:1):first?0:1;
                    clinchCpuDecided=true;ClinchInput(fighters[side],NextRandom()<.45?FightButton.Evade:NextRandom()<.5?FightButton.Punch:FightButton.Heavy);
                }
            }
            if(clinch&&clinchElapsed>=1800)ReleaseClinch();
        }
    }
}
