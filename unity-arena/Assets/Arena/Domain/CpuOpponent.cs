using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public enum CpuLevel { Easy, Normal, Hard }
    public enum TrainingBehavior { Spar, Bag, Block, Move, Repeat, Counter, Grab }

    // Native decision policy retains the authored roster identities, reaction
    // delay, weighted attacks and measured reach. It submits ordinary commands.
    public sealed partial class CpuOpponent
    {
        readonly ArenaMatch match;
        readonly int side;
        readonly CpuLevel level;
        TrainingBehavior training;
        readonly MatchFighter self, enemy;
        readonly string[] repertoire, preferred;
        readonly double reaction, cooldownDuration, approach, blockChance, range, pressure, retreatDuration;
        double cooldown, observedMs, blockMs, retreatMs, comboCooldown,grabCooldown,retreatCooldown;
        int observedSerial = -1, previousRound;
        bool responded, wasLocked,blockLow;
        string lastAttack;
        string lockedAction;
        bool lockedAttack;
        public CpuOpponent(ArenaMatch match, int side, CpuLevel level = CpuLevel.Normal, TrainingBehavior training = TrainingBehavior.Spar, string drillAttack = "LIGHT_PUNCH")
        {
            this.match = match; this.side = side; this.level = level; this.training = training;
            self = match.Fighter(side); enemy = match.Fighter(1-side);
            ConfigureTraining(training,drillAttack);
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
            repertoire = ArenaMatch.BasicMoves(self.Configuration.Character)
                .Where(n=>self.Configuration.Has(n)&&self.Configuration[n].Attack).Distinct().ToArray();
            cooldown=cooldownDuration;
            previousRound=match.Round;
        }
        internal bool CanDecideClinch => !match.Training||training==TrainingBehavior.Spar;
        internal double ClinchReactionMs => Math.Max(650,reaction+300);
        internal void ResetClinchCooldown(){cooldown=cooldownDuration;}
        internal void Delay(double milliseconds){cooldown=Math.Max(0,milliseconds);}
        internal void AdvanceTimers(double dt)
        {comboCooldown=Math.Max(0,comboCooldown-dt);grabCooldown=Math.Max(0,grabCooldown-dt);retreatCooldown=Math.Max(0,retreatCooldown-dt);}
        internal void Tick(double dt)
        {
            if(match.Round!=previousRound){previousRound=match.Round;cooldown=cooldownDuration;observedSerial=-1;responded=false;blockMs=retreatMs=comboCooldown=grabCooldown=retreatCooldown=0;wasLocked=false;}
            if(match.Paused||match.Phase!=MatchPhase.Fighting||match.HoldingContact||match.PairActive)return;
            match.SetInput(side,default);
            self.MovementFactor=1;
            if(observedSerial!=enemy.Serial){observedSerial=enemy.Serial;observedMs=0;responded=false;}
            if(enemy.Action.Attack)observedMs+=dt;
            if(wasLocked&&!self.Locked)
            {
                cooldown=lockedAction?.StartsWith("HIT_",StringComparison.Ordinal)==true?(level==CpuLevel.Easy?300:level==CpuLevel.Normal?80:0):cooldownDuration;
                if(lockedAttack&&retreatCooldown<=0){retreatMs=retreatDuration;retreatCooldown=1200;}
            }
            wasLocked=self.Locked;if(wasLocked){lockedAction=self.ActionId;lockedAttack=self.Action.Attack;}
            if(self.Locked||self.StunMs>0||self.DownPhase!=null||self.PushMs>0)return;
            var distance=Math.Abs(self.X-enemy.X);var toward=Math.Sign(enemy.X-self.X);
            if(match.Training&&training!=TrainingBehavior.Spar)
            {
                TrainingTick(dt,distance,toward);
                return;
            }
            if(self.ApproachingCombo)return;
            cooldown-=dt;
            if(blockMs>0){blockMs=Math.Max(0,blockMs-dt);if(blockMs>0)match.SetInput(side,new FightInput(0,block:true,down:blockLow));else cooldown=Math.Min(cooldown,level==CpuLevel.Easy?reaction:0);return;}
            if(enemy.Action.Attack&&enemy.Clock.Frame>enemy.Action.LastHit)responded=true;
            if(enemy.Action.Attack&&!responded&&distance<match.Width*.24&&observedMs<reaction&&level!=CpuLevel.Easy&&self.Configuration.Character!="NINA")return;
            if(enemy.Action.Attack&&!responded&&observedMs>=reaction)
            {
                responded=true;
                if(distance<match.Width*.24&&match.NextRandom()<(self.Configuration.Character=="NINA"?blockChance*.25:level==CpuLevel.Hard&&enemy.RepeatedAttackCount>=3?.98:blockChance))
                {
                    if(self.Configuration.Character=="NINA")match.Press(side,FightButton.Evade);
                    else
                    {
                        var remaining=enemy.Action.Durations.Skip(enemy.Clock.Frame).Take(Math.Max(0,enemy.Action.LastHit-enemy.Clock.Frame+1)).Sum()/CombatRules.ActionTempo(enemy.Configuration.Character,enemy.Action,enemy.Clock.Frame);
                        blockMs=level==CpuLevel.Hard?Math.Max(260,Math.Min(1400,remaining+100)):level==CpuLevel.Normal?Math.Max(260,Math.Min(700,remaining+60)):260;
                        blockLow=LowTarget();match.SetInput(side,new FightInput(0,block:true,down:blockLow));
                    }
                    return;
                }
            }
            var ranges=repertoire.Select(Reach).OrderBy(x=>x).ToArray();if(ranges.Length==0)return;
            var desired=ranges[Math.Min(ranges.Length-1,(int)Math.Floor(range*(ranges.Length-1)))]*.88;
            if(self.Energy>=100&&self.ComboUses<2&&comboCooldown<=0&&level!=CpuLevel.Easy&&self.Configuration.Has("COMBO")&&self.Configuration["COMBO"].Attack&&cooldown<=0&&enemy.DownPhase==null&&enemy.ProtectionMs<=0)
            {if(match.Press(side,FightButton.Combo)){comboCooldown=18000;return;}}
            if(retreatMs>0)
            {
                var spent=Math.Min(dt,retreatMs);retreatMs-=spent;
                if(distance<desired*1.25&&enemy.DownPhase==null){self.MovementFactor=spent/dt;match.SetInput(side,new FightInput(-toward));return;}
                retreatMs=0;
            }
            var available=repertoire.Where(n=>distance<=Reach(n)&&enemy.DownPhase==null&&enemy.ProtectionMs<=0).ToArray();
            if(cooldown<=0&&available.Length>0)
            {
                if(grabCooldown<=0&&match.NextRandom()<(level==CpuLevel.Easy?.04:level==CpuLevel.Normal?.07:.10))
                {
                    var buttons=self.Configuration["IDLE"].Source["pairedCombat"]?["buttons"] as JObject;var moves=buttons?.Properties().Select(p=>(string)p.Value).ToArray();
                    if(moves?.Length>0&&match.TryPair(self,moves[(int)(match.NextRandom()*moves.Length)],false)){grabCooldown=level==CpuLevel.Easy?12000:level==CpuLevel.Normal?10000:8000;return;}
                }
                var choices=available.Where(n=>n!=lastAttack).ToArray();if(choices.Length==0)choices=available;
                var urgent=enemy.Action.Attack&&level!=CpuLevel.Easy&&self.Configuration.Character!="NINA"&&(level==CpuLevel.Hard&&enemy.RepeatedAttackCount>=3||match.NextRandom()<(level==CpuLevel.Hard?.65:.45));
                string selected;
                if(urgent)selected=choices.OrderBy(n=>{var c=self.Configuration[n];return c.Starts[c.FirstHit]/CombatRules.ActionTempo(self.Configuration.Character,c,0);}).First();
                else {var weights=choices.Select(n=>preferred.Contains(n)?3:1).ToArray();var pick=match.NextRandom()*weights.Sum();selected=choices.Last();for(var i=0;i<choices.Length;i++){pick-=weights[i];if(pick<0){selected=choices[i];break;}}}
                lastAttack=selected;
                match.Start(self,selected,true);return;
            }
            else if(distance>desired){self.MovementFactor=Math.Min(approach*pressure,(distance-desired)/Math.Max(1e-8,match.Speed(self)*dt/1000));match.SetInput(side,new FightInput(toward));}
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
