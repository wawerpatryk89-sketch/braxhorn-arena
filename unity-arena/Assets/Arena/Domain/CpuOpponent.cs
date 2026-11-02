using System;
using System.Collections.Generic;
using System.Linq;

namespace Braxhorn.Arena.Domain
{
    public enum CpuLevel { Easy, Normal, Hard }
    public enum TrainingBehavior { Spar, Bag, Block, Move }

    // Native decision policy retains the authored roster identities, reaction
    // delay, weighted attacks and measured reach. It submits ordinary commands.
    public sealed class CpuOpponent
    {
        readonly ArenaMatch match;
        readonly int side;
        readonly CpuLevel level;
        readonly TrainingBehavior training;
        readonly MatchFighter self, enemy;
        readonly string[] repertoire, preferred;
        readonly double reaction, cooldownDuration, approach, blockChance, range, pressure, retreatDuration;
        double cooldown, observedMs, blockMs, retreatMs;
        int observedSerial = -1, previousRound;
        bool responded, wasLocked;
        string lastAttack;
        public CpuOpponent(ArenaMatch match, int side, CpuLevel level = CpuLevel.Normal, TrainingBehavior training = TrainingBehavior.Spar)
        {
            this.match = match; this.side = side; this.level = level; this.training = training;
            self = match.Fighter(side); enemy = match.Fighter(1-side);
            (reaction,cooldownDuration,approach,blockChance) = level switch {
                CpuLevel.Easy => (380d,900d,.78,.22), CpuLevel.Hard => (130d,100d,1d,.86), _ => (180d,280d,.90,.60) };
            var style = self.Configuration.Character switch {
                "BOSS" => (.50,80d,1.20,new[]{"HEAVY_PUNCH","HEAVY_KICK","UPPERCUT"}),
                "ZOMBIE" => (.15,40d,1.05,new[]{"LIGHT_PUNCH","HEAVY_PUNCH","UPPERCUT"}),
                "BEAR" => (.30,300d,.96,new[]{"HEAVY_PUNCH","SHOULDER","UPPERCUT"}),
                "DEMON" => (.36,160d,1.06,new[]{"LIGHT_PUNCH","HEAVY_KICK","UPPERCUT"}),
                "NYXA" => (.55,240d,.95,new[]{"LIGHT_KICK","CLINCH_KNEE","ELBOW"}),
                "VEXA" => (.85,330d,1d,new[]{"HEAVY_KICK","SPIN_KICK","FLYING_KICK"}),
                "KROV" => (.10,80d,1.10,new[]{"ELBOW","UPPERCUT","HEAVY_PUNCH"}),
                "NINA" => (.65,280d,.98,new[]{"SPIN_KICK","MEIA_LUA","CRESCENT_KICK","GROUND_KICK"}),
                "DANNY" => (.35,220d,1.02,new[]{"LIGHT_PUNCH","HEAVY_PUNCH","HOOK"}),
                _ => (.20,100d,1.10,new[]{"HEAVY_PUNCH","DOUBLE_PUNCH","UPPERCUT"}) };
            range=style.Item1;retreatDuration=style.Item2;pressure=style.Item3;preferred=style.Item4;
            repertoire = new[]{"punch","heavy","kick","kick2"}.SelectMany(k=>new[]{false,true}.Select(f=>CombatRules.ButtonMove(self.Configuration,k,f,false,false)))
                .Where(n=>self.Configuration.Has(n)&&self.Configuration[n].Attack).Distinct().ToArray();
            cooldown=cooldownDuration;
            previousRound=match.Round;
        }
        internal bool CanDecideClinch => !match.Training||training==TrainingBehavior.Spar;
        internal double ClinchReactionMs => Math.Max(650,reaction+300);
        internal void ResetClinchCooldown(){cooldown=cooldownDuration;}
        internal void Delay(double milliseconds){cooldown=Math.Max(0,milliseconds);}
        internal void Tick(double dt)
        {
            if(match.Round!=previousRound){previousRound=match.Round;cooldown=cooldownDuration;observedSerial=-1;responded=false;blockMs=retreatMs=0;wasLocked=false;}
            if(match.Paused||match.Phase!=MatchPhase.Fighting||match.HoldingContact||match.PairActive)return;
            match.SetInput(side,default);
            self.MovementFactor=1;
            if(observedSerial!=enemy.Serial){observedSerial=enemy.Serial;observedMs=0;responded=false;}
            if(enemy.Action.Attack)observedMs+=dt;
            if(wasLocked&&!self.Locked){cooldown=cooldownDuration;retreatMs=retreatDuration;}wasLocked=self.Locked;
            if(self.Locked||self.StunMs>0||self.DownPhase!=null)return;
            var distance=Math.Abs(self.X-enemy.X);var toward=Math.Sign(enemy.X-self.X);
            if(match.Training&&training!=TrainingBehavior.Spar)
            {
                if(training==TrainingBehavior.Block)
                { if(self.Configuration.Character=="NINA"){if(enemy.Action.Attack&&!responded){responded=true;match.Press(side,FightButton.Evade);}}else match.SetInput(side,new FightInput(0,block:true)); }
                else if(training==TrainingBehavior.Move)
                { var goal=match.ReferenceHeight*.6;match.SetInput(side,new FightInput(distance>goal*1.08?toward:distance<goal*.8?-toward:0)); }
                return;
            }
            cooldown-=dt;
            if(blockMs>0){blockMs-=dt;match.SetInput(side,new FightInput(0,block:true,down:LowTarget()));return;}
            if(enemy.Action.Attack&&enemy.Clock.Frame>enemy.Action.LastHit)responded=true;
            if(enemy.Action.Attack&&!responded&&observedMs>=reaction)
            {
                responded=true;
                if(distance<match.Width*.24&&match.NextRandom()<(self.Configuration.Character=="NINA"?blockChance*.25:blockChance))
                {
                    if(self.Configuration.Character=="NINA")match.Press(side,FightButton.Evade);
                    else {blockMs=level==CpuLevel.Hard?700:level==CpuLevel.Normal?500:260;match.SetInput(side,new FightInput(0,block:true,down:LowTarget()));}
                    return;
                }
            }
            var ranges=repertoire.Select(Reach).OrderBy(x=>x).ToArray();if(ranges.Length==0)return;
            var desired=ranges[Math.Min(ranges.Length-1,(int)Math.Floor(range*(ranges.Length-1)))]*.88;
            if(self.Energy>=100&&self.ComboUses<2&&level!=CpuLevel.Easy&&self.Configuration.Has("COMBO")&&cooldown<=0&&enemy.DownPhase==null&&enemy.ProtectionMs<=0)
            {if(match.Press(side,FightButton.Combo)){cooldown=18000;return;}}
            if(retreatMs>0&&distance<desired*1.25&&enemy.DownPhase==null)
            {retreatMs=Math.Max(0,retreatMs-dt);match.SetInput(side,new FightInput(-toward));return;}
            var available=repertoire.Where(n=>distance<=Reach(n)&&enemy.DownPhase==null&&enemy.ProtectionMs<=0).ToArray();
            if(cooldown<=0&&available.Length>0)
            {
                var choices=available.Where(n=>n!=lastAttack).ToArray();if(choices.Length==0)choices=available;
                var urgent=enemy.Action.Attack&&level!=CpuLevel.Easy&&self.Configuration.Character!="NINA"&&match.NextRandom()<(level==CpuLevel.Hard?.65:.45);
                string selected;
                if(urgent)selected=choices.OrderBy(n=>{var c=self.Configuration[n];return c.Starts[c.FirstHit]/CombatRules.ActionTempo(self.Configuration.Character,c,0);}).First();
                else {var weights=choices.Select(n=>preferred.Contains(n)?3:1).ToArray();var pick=match.NextRandom()*weights.Sum();selected=choices.Last();for(var i=0;i<choices.Length;i++){pick-=weights[i];if(pick<0){selected=choices[i];break;}}}
                lastAttack=selected;
                foreach(var forward in new[]{false,true})for(var i=0;i<4;i++)
                {
                    var kind=new[]{"punch","heavy","kick","kick2"}[i];
                    if(CombatRules.ButtonMove(self.Configuration,kind,forward,false,false)!=selected)continue;
                    match.SetInput(side,new FightInput(forward?toward:0));match.Press(side,(FightButton)i);return;
                }
            }
            else if(distance>desired){self.MovementFactor=approach*pressure;match.SetInput(side,new FightInput(toward));}
        }
        bool LowTarget()
        {var hit=enemy.Action.Hits.Values.FirstOrDefault();return hit!=null&&hit.Box[1]+hit.Box[3]/2>enemy.Action.AnchorY-110;}
        double Reach(string name)
        {
            var c=self.Configuration[name];var calibrated=(double?)c.Source["attackRangeByOpponent"]?[enemy.Configuration.Character]??(double?)c.Source["attackRangePx"];
            if(calibrated.HasValue)return calibrated.Value*match.Scale*c.Scale*((int?)c.Source["contactCalibrationVersion"]==235?1:.94);
            if(c.Hits.Count==0)return 0;
            var reach=c.Hits.Min(h=>h.Value.Box[0]+h.Value.Box[2]-c.PivotAt(h.Key))*match.Scale*c.Scale;
            var target=enemy.Action;var box=target.Boxes.Length>0?target.Boxes[Math.Min(enemy.Clock.Frame,target.Boxes.Length-1)]:new[]{target.PivotX-40,0,target.PivotX+40,0};
            var near=(enemy.Face<0?box[2]-target.PivotAt(enemy.Clock.Frame):target.PivotAt(enemy.Clock.Frame)-box[0])*match.Scale*target.Scale;
            return Math.Max(match.Width/100,reach+near-12);
        }
    }
}
