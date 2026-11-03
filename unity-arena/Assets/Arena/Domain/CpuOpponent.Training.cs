using System;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public sealed partial class CpuOpponent
    {
        string drillAttack;
        double drillMs,trainingMoveMs;
        bool trainingRetreat;
        internal void ConfigureTraining(TrainingBehavior behavior,string move)
        {
            if(!Enum.IsDefined(typeof(TrainingBehavior),behavior))throw new ArgumentOutOfRangeException(nameof(behavior));
            var available=ArenaMatch.BasicMoves(self.Configuration.Character).Where(n=>self.Configuration.Has(n)&&self.Configuration[n].Attack).ToArray();
            drillAttack=available.Contains(move)?move:available.FirstOrDefault();training=behavior;drillMs=trainingMoveMs=0;trainingRetreat=false;
        }
        void TrainingTick(double dt,double distance,int toward)
        {
            if(self.PushMs>0)return;
            if(training==TrainingBehavior.Block)
            {
                if(self.Configuration.Character=="NINA")
                {if(enemy.Action.Attack&&!responded&&distance<match.Width*.24){responded=true;match.Press(side,FightButton.Evade);}}
                else match.SetInput(side,new FightInput(0,block:true));
                return;
            }
            if(training==TrainingBehavior.Move){TrainingFootwork(dt,distance,toward);return;}
            if(training==TrainingBehavior.Bag||enemy.DownPhase!=null||enemy.ProtectionMs>0||drillAttack==null)return;
            var desired=training==TrainingBehavior.Grab?match.WorldHeight*.34:Reach(drillAttack)*.90;
            if(distance>desired+match.Width*.0015&&match.TrainingTorsoGap>match.ReferenceHeight*.025)
            {
                self.MovementFactor=Math.Min(1,(distance-desired)/Math.Max(1e-8,match.Speed(self)*dt/1000));
                match.SetInput(side,new FightInput(toward));return;
            }
            drillMs+=dt;
            if(drillMs<(training==TrainingBehavior.Counter?1300:1000))return;
            drillMs=0;
            if(training==TrainingBehavior.Grab)
            {
                var buttons=self.Configuration["IDLE"].Source["pairedCombat"]?["buttons"] as JObject;
                var moves=buttons?.Properties().Select(p=>(string)p.Value).ToArray();
                if(moves==null||moves.Length==0||!match.TryPair(self,moves[(int)(match.NextRandom()*moves.Length)],false))drillMs=500;
            }
            else match.Start(self,drillAttack,true);
        }
        void TrainingFootwork(double dt,double distance,int toward)
        {
            if(enemy.ApproachingCombo||enemy.ActionId=="COMBO")return;
            var combo=enemy.Configuration.Has("COMBO")?enemy.Configuration["COMBO"]:null;
            var pixels=(double?)combo?.Source["comboGapByOpponent"]?[self.Configuration.Character]??(double?)combo?.Source["comboGapPx"];
            var reach=pixels.HasValue?Math.Max(0,pixels.Value*match.Scale*combo.Scale-(enemy.Configuration.Character=="VEXA"?2:0)):match.WorldHeight*.40;
            var near=Math.Max(match.TrainingBodyRadii,reach*.80);var far=Math.Max(near+match.Width*.01,reach*1.08);
            trainingMoveMs=Math.Max(0,trainingMoveMs-dt);
            if(trainingMoveMs==0){trainingRetreat=distance<near?true:distance>far?false:!trainingRetreat;trainingMoveMs=1100;}
            if(trainingRetreat&&distance>=far||!trainingRetreat&&distance<=near||trainingMoveMs<600)return;
            var remaining=trainingRetreat?far-distance:distance-near;
            self.MovementFactor=Math.Min(1,remaining/Math.Max(1e-8,match.Speed(self,trainingRetreat)*dt/1000));
            match.SetInput(side,new FightInput(trainingRetreat?-toward:toward));
        }
    }
    public sealed partial class ArenaMatch
    {
        public static string[] BasicMoves(string character)=>new[]{"LIGHT_PUNCH","HEAVY_PUNCH","LIGHT_KICK","HEAVY_KICK","DOUBLE_PUNCH","UPPERCUT","ELBOW","CLINCH_KNEE","SPIN_KICK","FLYING_KICK","CRESCENT_KICK","MEIA_LUA","GROUND_KICK","HOOK","SIDE_KICK","SHOULDER"}.Where(n=>BasicStrike(character,n)).ToArray();
        internal double TrainingTorsoGap=>ClinchGap();
        internal double TrainingBodyRadii=>Body(Player).radius+Body(Opponent).radius;
        public void ConfigureTraining(TrainingBehavior behavior,string move)
        {
            if(!Training)throw new InvalidOperationException("Training settings require a training match");
            if(cpu[1]==null)UseCpu(1,behavior:behavior,drillAttack:move);else cpu[1].ConfigureTraining(behavior,move);
            ReleaseInputs();
        }
    }
}
