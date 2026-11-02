using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public enum MatchPhase { Countdown, Fighting, RoundOver, Complete }
    public enum FightButton { Punch, Heavy, Kick, HeavyKick, Evade, Jump, Combo, Energy }

    public readonly struct FightInput
    {
        public readonly int Direction;
        public readonly bool Block, Down, Sprint, Grab;
        public FightInput(int direction, bool block = false, bool down = false, bool sprint = false, bool grab = false)
        { Direction = Math.Sign(direction); Block = block; Down = down; Sprint = sprint; Grab = grab; }
    }

    public sealed class MatchFighter
    {
        public CombatConfiguration Configuration { get; }
        public ActionClock Clock { get; } = new ActionClock();
        public double X { get; internal set; }
        public double Height { get; internal set; }
        public double Hp { get; internal set; }
        public double Energy { get; internal set; }
        public int Face { get; internal set; }
        public int Serial { get; internal set; }
        public int ComboUses { get; internal set; }
        public string DownPhase { get; internal set; }
        public bool Locked { get; internal set; }
        public FightInput Input { get; internal set; }
        public CombatAction Action => Clock.Action;
        public string ActionId => Action.Id;
        public double StunMs { get; internal set; }
        public double ProtectionMs { get; internal set; }
        internal double PushMs, PushSpeed, RecoilCooldown, KnockdownCooldown, RecoverMs, GrabProtection;
        internal double? ReactionRate;
        internal double MovementFactor = 1;
        internal string Buffered, PendingPair;
        internal int PendingPairFrame;
        internal bool ApproachingCombo;
        internal AttackLedger Ledger = new AttackLedger();
        internal readonly HashSet<int> CleanComboGroups = new HashSet<int>();
        internal readonly HashSet<int> SoundGroups = new HashSet<int>();
        internal readonly HitPressure Pressure = new HitPressure();
        internal int HeadReactions, BodyReactions;
        internal string PendingGesture;
        internal double GestureExpires,GestureCooldown,GestureIdleMs;
        internal int TauntVariant,AngerVariant;
        internal MatchFighter ComboOwner;
        internal int ComboSerial,ComboEndpoint;
        internal string ComboReactionKey;
        internal readonly HashSet<string> ComboUsed=new HashSet<string>();
        internal MatchFighter(CombatConfiguration config) { Configuration = config ?? throw new ArgumentNullException(nameof(config)); }
    }

    public readonly struct MatchEvent
    {
        public readonly string Kind, Action, Region;
        public readonly int Actor, Target, Group;
        public readonly double Damage, TimeMs;
        public readonly Point2 Point;
        public MatchEvent(string kind, int actor, int target, string action, int group, double damage, string region, Point2 point, double time)
        { Kind = kind; Actor = actor; Target = target; Action = action; Group = group; Damage = damage; Region = region; Point = point; TimeMs = time; }
    }

    // One action contributes at most 14 pressure. Multi-hit attacks cannot bypass
    // the original requirement of three distinct actions for an ordinary launch.
    internal sealed class HitPressure
    {
        readonly Dictionary<int, double> actions = new Dictionary<int, double>();
        internal double Value, Remaining, Away;
        internal int Count => actions.Count;
        internal void Reset() { actions.Clear(); Value = Remaining = Away = 0; }
        internal void Add(int serial, double amount)
        {
            if (Remaining <= 0) Reset();
            actions.TryGetValue(serial, out var before);
            actions[serial] = before + amount;
            Value += Math.Min(14, before + amount) - Math.Min(14, before);
            Remaining = 3500;
        }
        internal void Advance(double dt, bool separated)
        { Remaining -= dt; Away = separated ? Away + dt : 0; if (Remaining <= 0 || Away >= 600) Reset(); }
    }

    // Authoritative native simulation. All positions use the original top-down
    // logical screen, not Unity physics. Rendering is a read-only consumer.
    public sealed partial class ArenaMatch
    {
        public const double StepMs = 1000.0 / 60;
        public MatchFighter Player { get; }
        public MatchFighter Opponent { get; private set; }
        readonly MatchFighter[] fighters;
        readonly Queue<MatchEvent> events = new Queue<MatchEvent>();
        readonly List<PendingHit> pending = new List<PendingHit>(16);
        readonly Defense[] defenses = new Defense[2];
        readonly CpuOpponent[] cpu = new CpuOpponent[2];
        readonly Func<double> random;
        readonly double initialHp;
        double accumulator, phaseMs, holdMs,celebrationEnd;
        bool celebrationStarted;
        public double Width { get; }
        public double Height { get; }
        public double Floor { get; }
        public double Scale { get; }
        public double ReferenceHeight => 640 / 3.25 * 1.7 * Scale;
        internal double WorldHeight => 640 / 3.05 * 1.7 * Scale;
        public double SimulationMs { get; private set; }
        public double RemainingSeconds { get; private set; } = 60;
        public MatchPhase Phase { get; private set; }
        public bool Paused { get; private set; }
        public bool Training { get; }
        public bool SingleRound { get; }
        public int Round { get; private set; } = 1;
        public int PlayerWins { get; private set; }
        public int OpponentWins { get; private set; }
        public int RoundWinner { get; private set; } = -1;
        public int Winner => PlayerWins == OpponentWins ? -1 : PlayerWins > OpponentWins ? 0 : 1;
        public int Countdown => Math.Max(1, 3 - (int)(phaseMs / 1000));
        public bool HoldingContact => holdMs > 0;
        public bool PairActive => pair != null || recovery != null || clinch;

        public ArenaMatch(CombatConfiguration player, CombatConfiguration opponent, Func<double> random,
            bool training = false, bool singleRound = false, double playerHp = 100,
            double width = 1024, double height = 576, double groundRatio = .81)
        {
            if (!Finite(width) || !Finite(height) || width < 320 || height < 200 || groundRatio < .5 || groundRatio > 1 || !Finite(groundRatio))
                throw new ArgumentException("Invalid logical arena dimensions.");
            if (!Finite(playerHp) || playerHp <= 0 || playerHp > 100) throw new ArgumentOutOfRangeException(nameof(playerHp));
            this.random = random ?? throw new ArgumentNullException(nameof(random));
            Width = width; Height = height; Floor = height * groundRatio;
            Scale = Math.Max(.1, Math.Min(Math.Min(height * 1.10 / 512, width * .55 / 512), Math.Min(680.0 / 512,
                (Floor - Math.Max(54, height * .16)) / (player.Character == "BRAX" || opponent.Character == "BRAX" ? 390 : 356))));
            Player = new MatchFighter(player); Opponent = new MatchFighter(opponent); fighters = new[] { Player, Opponent };
            Training = training; SingleRound = singleRound; initialHp = playerHp;
            ResetRound();
        }
        static bool Finite(double v) => !double.IsNaN(v) && !double.IsInfinity(v);
        internal static double Clamp(double v, double lo, double hi) => Math.Max(lo, Math.Min(hi, v));
        internal double NextRandom()
        { var v = random(); if (!Finite(v) || v < 0 || v >= 1) throw new InvalidOperationException("Random must return [0,1)."); return v; }
        public MatchFighter Fighter(int side) => side == 0 ? Player : side == 1 ? Opponent : throw new ArgumentOutOfRangeException(nameof(side));
        public void UseCpu(int side, CpuLevel level = CpuLevel.Normal, TrainingBehavior behavior = TrainingBehavior.Spar)
        { Fighter(side); cpu[side] = new CpuOpponent(this, side, level, behavior); }
        internal MatchFighter Other(MatchFighter f) => f == Player ? Opponent : Player;
        int Side(MatchFighter f) => f == Player ? 0 : 1;
        public bool TryDequeue(out MatchEvent value) { if (events.Count == 0) { value = default; return false; } value = events.Dequeue(); return true; }
        void Emit(string kind, MatchFighter a, MatchFighter z = null, CombatHit hit = null, CombatContact contact = default,string actionId=null)
        {
            if (events.Count >= 1024) events.Dequeue(); // Detached consumers cannot grow an unbounded queue.
            events.Enqueue(new MatchEvent(kind, Side(a), z == null ? -1 : Side(z), actionId??a.ActionId, hit?.Group ?? -1,
                hit?.Damage ?? 0, contact.Region, contact.Point, SimulationMs));
        }
        public void SetPaused(bool value)
        { Paused = value; accumulator = 0; if (value) ReleaseInputs(); }
        public void ReleaseInputs() { foreach (var f in fighters) { f.Input = default; f.Buffered = null; } }
        public void SetInput(int side, FightInput value)
        { var f = Fighter(side); if(clinch){if(!Paused&&Phase==MatchPhase.Fighting&&value.Grab)ReleaseClinch();return;} f.Input = !Paused && Phase == MatchPhase.Fighting && pair == null && recovery == null ? value : default; if(f.Input.Direction!=0||f.Input.Block||f.Input.Down)CancelGesture(f); }
        public bool Press(int side, FightButton button)
        {
            var f = Fighter(side);
            if (Paused || Phase != MatchPhase.Fighting || f.Hp <= 0 || recovery != null) return false;
            if(Adventure&&!AdventureCombat&&(side!=0||button==FightButton.Combo||f.Input.Grab))return false;
            if(clinch)return ClinchInput(f,button);
            if (pair != null) return button == FightButton.Evade && BreakPair(f);
            if (f.DownPhase != null || f.StunMs > 0) return false;
            CancelGesture(f);
            var kind = button switch { FightButton.Punch => "punch", FightButton.Heavy => "heavy", FightButton.Kick => "kick", FightButton.HeavyKick => "kick2", _ => null };
            if (f.Input.Grab && kind != null)
                return TryPair(f, (string)f.Configuration["IDLE"].Source["pairedCombat"]?["buttons"]?[kind], false);
            string action;
            if (kind != null) action = CombatRules.ButtonMove(f.Configuration, kind, f.Input.Direction == f.Face, f.Input.Down, f.Input.Sprint);
            else action = button switch { FightButton.Evade => "LEAN", FightButton.Jump => "JUMP", FightButton.Combo => "COMBO", FightButton.Energy => "ENERGY_SPECIAL", _ => null };
            if (!f.Configuration.Has(action)) return false;
            if (f.Locked)
            {
                if (f.Action.Attack && f.ActionId != "COMBO" && f.Buffered == null && f.Clock.RemainingMs(i => Tempo(f, i)) <= 100)
                { f.Buffered = action; return true; }
                return false;
            }
            if (action == "COMBO")
            {
                if ((!Training && (f.Energy < 100 || f.ComboUses >= 2)) || f.ApproachingCombo) return false;
                if (!Training) { f.Energy = 0; f.ComboUses++; }
                f.ApproachingCombo = true; f.Input = default; return true;
            }
            if (action == "ENERGY_SPECIAL")
            {
                if (!Training && f.Energy < 50) return false;
                if (!Training) f.Energy -= 50;
            }
            Start(f, CloseStrike(f, action), true); return true;
        }
        string CloseStrike(MatchFighter f, string action)
        {
            if (action != "LIGHT_PUNCH" || !f.Configuration.Has("LIGHT_PUNCH_CLOSE") || Other(f).DownPhase != null) return action;
            bool Connects(CombatAction c)
            {
                if (c.Hits.Count == 0) return false;
                var group = c.Hits.Values.Min(h => h.Group);
                foreach (var h in c.Hits)
                    if (h.Value.Group == group && CombatContacts.Find(new CombatPose(c, h.Key, f.Face, f.X, Floor, Scale), h.Value, Pose(Other(f))).Hit) return true;
                return false;
            }
            var a = Body(f); var z = Body(Other(f));
            var gap = Math.Abs(z.center - a.center) - a.radius - z.radius;
            return (gap <= Math.Max(3, ReferenceHeight * .03) || !Connects(f.Configuration[action])) && Connects(f.Configuration["LIGHT_PUNCH_CLOSE"])
                ? "LIGHT_PUNCH_CLOSE" : action;
        }
        internal void Start(MatchFighter f, string id, bool locked)
        {
            if (!f.Configuration.Has(id)) throw new InvalidOperationException(f.Configuration.Character + ": missing required action " + id);
            f.Clock.Start(f.Configuration[id], f.Configuration[id].StartFrame); f.Locked = locked; f.ReactionRate = null;
            f.SoundGroups.Clear();
            f.Ledger = new AttackLedger(); f.PendingPair = null;
            if(!id.StartsWith("HIT_COMBO_",StringComparison.Ordinal)){f.ComboReactionKey=null;f.ComboOwner=null;}
            if (f.Action.Attack) { f.Serial++; f.ProtectionMs = 0; f.CleanComboGroups.Clear(); }
        }
        internal void Idle(MatchFighter f) { f.Locked = false; Start(f, "IDLE", false); }
        double Tempo(MatchFighter f, int frame) => f.ActionId=="ADVENTURE_WALK"||f.ActionId=="ENTRY_RUN"?1:IsGait(f.ActionId) ? CombatRules.LocomotionTempo(f.Configuration.Character, f.Action)
            : f.ActionId == "IDLE" ? CombatRules.ActionSpeed * (f.Configuration.Character == "NINA" ? .93 : 1)
            : CombatRules.ActionTempo(f.Configuration.Character, f.Action, frame, f.ReactionRate);
        static bool IsGait(string id) => id == "RUN" || id == "WALK_FORWARD" || id == "WALK_BACK" || id == "APPROACH";
        internal double Speed(MatchFighter f, bool back = false) => CombatRules.Movement(f.Configuration.Character, ReferenceHeight, Width, back) * Width / 100;
        void ResetRound()
        {
            ResetClinch();phaseMs = holdMs = 0; celebrationStarted = false; pair = null; recovery=null; Phase = MatchPhase.Countdown;
            RemainingSeconds = 60; RoundWinner = -1; ReleaseInputs();
            for (var i = 0; i < 2; i++)
            {
                var f = fighters[i]; f.X = Width * (i == 0 ? .28 : .72); f.Face = i == 0 ? 1 : -1;
                f.Hp = i == 0 && Round == 1 ? initialHp : 100; f.Energy = Training ? 100 : 0;
                f.DownPhase = null; f.Height = f.StunMs = f.ProtectionMs = f.PushMs = f.PushSpeed = f.RecoilCooldown = f.KnockdownCooldown = f.RecoverMs = f.GrabProtection = 0;
                f.ComboUses = f.HeadReactions = f.BodyReactions = 0; f.ApproachingCombo = false; f.Pressure.Reset(); ResetGestures(f,18000);f.TauntVariant=f.AngerVariant=0; Idle(f);
            }
            Emit("three",Player);
        }
        public void Advance(double milliseconds)
        {
            if (!Finite(milliseconds) || milliseconds < 0) throw new ArgumentOutOfRangeException(nameof(milliseconds));
            if (Paused || Phase == MatchPhase.Complete) return;
            accumulator += milliseconds;
            // The host caps suspended wall time. Simulation never silently drops steps.
            while (accumulator + 1e-7 >= StepMs)
            { accumulator -= StepMs; Tick(StepMs); if (Phase == MatchPhase.Complete) { accumulator = 0; break; } }
        }
        void Tick(double dt)
        {
            SimulationMs += dt;
            if(Adventure&&!AdventureCombat){AdvanceAdventureExplore(dt);return;}
            if (holdMs > 0) { holdMs = Math.Max(0, holdMs - dt); return; }
            if (Phase == MatchPhase.Countdown)
            {
                foreach (var f in fighters) AdvancePose(f, dt, false);
                var previousCue=(int)((phaseMs+1e-6)/1000);
                phaseMs += dt;
                var currentCue=(int)((phaseMs+1e-6)/1000);
                if(currentCue!=previousCue&&currentCue<3)Emit(currentCue==1?"two":"one",Player);
                if (phaseMs + 1e-6 >= 3000) { Phase = MatchPhase.Fighting; phaseMs = 0; Emit("fight", Player); }
                return;
            }
            if (Phase == MatchPhase.RoundOver) { AdvanceCelebration(dt); return; }
            if(recovery!=null){AdvanceRecovery(dt);return;}
            if (!Training&&!Adventure) { RemainingSeconds = Math.Max(0, RemainingSeconds - dt / 1000); if (RemainingSeconds < 1e-8) RemainingSeconds = 0; }
            if (pair != null) { AdvancePair(dt); return; }
            if(clinch){AdvanceClinch(dt);CheckEnd();return;}
            AdvanceGestures(dt);
            foreach (var controller in cpu) controller?.Tick(dt);
            foreach (var f in fighters)
            {
                f.StunMs = Math.Max(0, f.StunMs - dt); f.ProtectionMs = Math.Max(0, f.ProtectionMs - dt);
                f.GrabProtection = Math.Max(0, f.GrabProtection - dt); f.RecoilCooldown = Math.Max(0, f.RecoilCooldown - dt);
                f.KnockdownCooldown = Math.Max(0, f.KnockdownCooldown - dt);
                f.Pressure.Advance(dt, Math.Abs(Player.X - Opponent.X) > Body(Player).radius + Body(Opponent).radius + ReferenceHeight * .35);
                if (f.PushMs > 0) { var spent = Math.Min(dt, f.PushMs); f.X += f.PushSpeed * spent / 1000; f.PushMs -= spent; }
                if (Training)
                {
                    f.Energy = 100; f.ComboUses = 0;
                    if (f.Hp <= 1) { f.RecoverMs += dt; if (f.RecoverMs >= 1200) { f.Hp = 100; f.RecoverMs = 0; } }
                    else f.RecoverMs = 0;
                }
                else if (f.ActionId != "COMBO" && f.ComboUses < 2) f.Energy = Math.Min(100, f.Energy + dt * .005);
                if (!f.Locked && f.StunMs <= 0 && f.DownPhase == null)
                {
                    f.Face = Math.Sign(Other(f).X - f.X) == 0 ? f.Face : Math.Sign(Other(f).X - f.X);
                    Locomotion(f, dt);
                }
            }
            foreach(var f in fighters)FollowCombo(f,dt);
            Separate(); Confine(); Separate();
            DetectClinch(dt);if(clinch)return;
            for (var i = 0; i < 2; i++) defenses[i] = new Defense(fighters[i], Pose(fighters[i]));
            pending.Clear();
            foreach (var f in fighters) AdvancePose(f, dt, true);
            // Contacts are collected before either reaction mutates the other side.
            foreach (var hit in pending) Apply(hit);
            foreach(var f in fighters)if(f.Clock.Finished&&f.Locked)FinishAction(f);
            foreach (var f in fighters)
            {
                if (f.PendingPair != null && f.ActionId == "COMBO" && f.Clock.Frame >= f.PendingPairFrame)
                { var move = f.PendingPair; f.PendingPair = null; TryPair(f, move, true); }
            }
            if (pair == null) { Separate(); Confine(); Separate(); CheckEnd(); }
        }
        void Locomotion(MatchFighter f, double dt)
        {
            if (f.PushMs > 0) return;
            if (f.ApproachingCombo)
            {
                var c = f.Configuration["COMBO"]; var px = (double?)c.Source["comboGapByOpponent"]?[Other(f).Configuration.Character] ?? (double?)c.Source["comboGapPx"] ?? 150;
                var desired = Math.Max(0, px * Scale * c.Scale - (f.Configuration.Character == "VEXA" ? 2 : 0));
                var delta = Other(f).X - f.Face * desired - f.X; var step = Speed(f) * dt / 1000;
                f.X += Math.Sign(delta) * Math.Min(Math.Abs(delta), step);
                if (Math.Abs(delta) <= step + Width * .001) { f.ApproachingCombo = false; Start(f, "COMBO", true); }
                else SetLocomotion(f, Forward(f));
                return;
            }
            if (f.Input.Block && f.Configuration.Character != "NINA" && f.Configuration.Has("BLOCK"))
            { SetLocomotion(f, f.Input.Down && f.Configuration.Has("BLOCK_LOW") ? "BLOCK_LOW" : "BLOCK"); return; }
            if (f.Input.Direction != 0)
            {
                var back = f.Input.Direction != f.Face; var run = !back && f.Input.Sprint && f.Configuration.Has("RUN");
                f.X += f.Input.Direction * Speed(f, back) * (run ? 1.4 : 1) * f.MovementFactor * dt / 1000;
                SetLocomotion(f, run ? "RUN" : back ? "WALK_BACK" : Forward(f));
            }
            else SetLocomotion(f, "IDLE");
        }
        string Forward(MatchFighter f) => f.Configuration.Has("APPROACH") && Math.Abs(f.X - Other(f).X) > ReferenceHeight * (f.ActionId == "APPROACH" ? 1.3 : 1.55) ? "APPROACH" : "WALK_FORWARD";
        void SetLocomotion(MatchFighter f, string action) { if (f.ActionId != action) Start(f, action, false); }
        public CombatPose Pose(MatchFighter f) => new CombatPose(f.Action, f.Clock.Frame, f.Face, f.X, Floor - f.Height, Scale);
        void AdvancePose(MatchFighter f, double dt, bool contacts)
        {
            var action = f.Action; var before = f.Clock.PoseSeconds;
            f.Clock.Advance(dt, frame => Tempo(f, frame), frame => {
                if (contacts)
                {
                    Collect(f);
                    if(IsGait(f.ActionId)&&(frame==0||frame==f.Action.Durations.Length/2))Emit("step",f);
                }
                return true;
            }, !f.Locked);
            if (f.Action == action) AuthoredMovement(f, before, f.Clock.PoseSeconds);
            if (!contacts && f.Clock.Finished && f.Locked && Phase != MatchPhase.RoundOver) FinishAction(f);
        }
        void AuthoredMovement(MatchFighter f, double before, double after)
        {
            foreach (var name in new[] { "openingAdvance", "advance", "retreat" })
            {
                if (!(f.Action.Source[name] is JObject a)) continue;
                var from = (double)a["from"]; var to = (double)a["to"]; if (to <= from) continue;
                double Portion(double t) { var u = Clamp((t - from) / (to - from), 0, 1); return name == "retreat" ? u * u * (3 - 2 * u) : u; }
                var distance = name == "retreat" ? -(double)a["height"] * WorldHeight : (double)a["px"] * Scale * f.Action.Scale;
                f.X += f.Face * distance * (Portion(after) - Portion(before));
            }
        }
        void FinishAction(MatchFighter f)
        {
            if(HoldComboReaction(f))return;
            if(f.ActionId=="JUMP")Emit("land",f);
            if (f.DownPhase != null) { AdvanceDown(f); return; }
            var queued = f.Buffered; f.Buffered = null; Idle(f);
            if (queued != null && f.Configuration.Has(queued) && queued != "COMBO" && queued != "ENERGY_SPECIAL") Start(f, CloseStrike(f, queued), true);
        }
        void Collect(MatchFighter f)
        {
            if (!f.Action.Attack || !f.Action.Hits.TryGetValue(f.Clock.Frame, out var hit)) return;
            // The source swish is tied to the authored active frame, including a
            // missed strike. Collision/damage ledgers must not suppress it.
            if(f.SoundGroups.Add(hit.Group))Emit("swing",f,hit:hit);
            if(f.Ledger.Contains(hit.Group))return;
            foreach (var p in pending) if (p.Actor == f && p.Serial == f.Serial && p.Hit.Group == hit.Group) return;
            var defense = defenses[1 - Side(f)]; var contact = CombatContacts.Find(Pose(f), hit, defense.Pose);
            if (contact.Hit) pending.Add(new PendingHit(f, Other(f), f.Action, hit, contact, defense, Pose(f)));
        }
        void Apply(PendingHit e)
        {
            var a = e.Actor; var z = e.Target; var d = e.Defense;
            if (d.Down || d.Pose.Action.Id == "GETUP" || d.Protection > 0 || CombatRules.Evades(d.Pose.Action, d.Pose.Frame, e.Contact.Region, false)) return;
            var blocked = CombatRules.Blocks(d.Guard, d.Low, e.Contact.Region);
            if (!e.Ledger.Register(e.Hit, blocked, e.Action, a.ComboUses < 2, out var energy)) return;
            a.Energy = Math.Min(100, a.Energy + energy);
            if (blocked) { z.Pressure.Reset(); Emit("block", a, z, e.Hit, e.Contact,e.Action.Id); return; }
            z.Hp = Math.Max(Training ? 1 : 0, z.Hp - e.Hit.Damage); z.Buffered = null; z.ApproachingCombo = false;
            z.Pressure.Add(e.Serial, e.Hit.Damage);
            var combo = e.Action.Id == "COMBO"; var finisher = (int?)e.Action.Source["finisherGroup"] == e.Hit.Group;
            var launch = (!combo || finisher) && (finisher || z.KnockdownCooldown <= 0 && z.Pressure.Value >= 36 && z.Pressure.Count >= 3);
            var push = (!combo || finisher) && z.RecoilCooldown <= 0 && z.Pressure.Value >= 20 && z.Pressure.Count >= 2;
            if (combo) a.CleanComboGroups.Add(e.Hit.Group);
            if (z.Hp <= 0) Down(z, "KO");
            else if (launch && z.Configuration.Has("FLY") && e.Action.Source["pairedFinisher"] == null) Launch(z);
            else
            {
                var tier = push || e.Hit.Damage >= 13 ? 3 : e.Hit.Damage >= 9 ? 2 : 1;
                z.StunMs = Math.Max(z.StunMs, new[] { 0, 90, 130, 170 }[tier]);
                var fallback = "HIT_R" + tier + "_" + (e.Contact.Region == "head" ? "HEAD" : "BODY");
                var onset=0;var comboRate=1d;double? rate=null;
                var reaction=combo?ComboReaction(a,z,e.Hit,e.Contact.Region,out onset,out comboRate):null;
                if(reaction!=null)rate=comboRate;
                else reaction=Reaction(z,fallback,e.Contact.Region,out rate);
                Start(z, reaction, true); z.ReactionRate = rate;
                if(onset>0)z.Clock.Seek(z.Action.Starts[onset]);
                if (!combo && z.RecoilCooldown <= 0) Recoil(z, e.Hit.Damage, push);
            }
            Emit("hit", a, z, e.Hit, e.Contact,e.Action.Id);
            if (combo && e.Action.Source["pairedFinisher"] != null && a.ActionId == "COMBO" && z.Hp > 0)
            {
                if (e.Hit.Group == 0)
                {
                    contactPresentation[Side(a)]=new FighterPresentation(e.AttackPose,e.AttackPose.Action.Starts[e.AttackPose.Frame]/1000,Floor);
                    contactPresentation[Side(z)]=new FighterPresentation(e.Defense.Pose,e.Defense.Seconds,Floor);
                    holdMs = 800;
                }
                var required = e.Action.Source["pairedRequiredGroups"]?.Values<int>().ToArray() ?? new[] { 0, 1, 2 };
                if (required.All(g => a.CleanComboGroups.Contains(g))) { a.PendingPair = (string)e.Action.Source["pairedFinisher"]; a.PendingPairFrame = a.Clock.Frame + 6; }
            }
        }
        string Reaction(MatchFighter f, string fallback, string region, out double? rate)
        {
            rate = null; if (!f.Configuration.Has(fallback)) fallback = f.Configuration.Has("HIT_BODY") ? "HIT_BODY" : "IDLE";
            var tag = region == "head" ? "HEAD" : "BODY"; var count = tag == "HEAD" ? f.HeadReactions++ : f.BodyReactions++;
            var pool = f.Configuration.Actions.Values.Where(c => c.Id.StartsWith("HIT_NORMAL_", StringComparison.Ordinal) && c.ReactionRegion == tag).ToArray();
            if (pool.Length == 0) return fallback;
            var chosen = pool[count % pool.Length]; var original = f.Configuration[fallback];
            var recovery = original.DurationMs / CombatRules.ActionTempo(f.Configuration.Character, original, 0);
            rate = Clamp(chosen.DurationMs / Math.Max(50, recovery), .85, 1.45); return chosen.Id;
        }
        void Recoil(MatchFighter f, double damage, bool strong)
        {
            var direction = Math.Sign(f.X - Other(f).X); if (direction == 0) direction = -f.Face;
            var distance = WorldHeight * (strong ? .40 : Math.Min(.08, .025 + damage * .0025));
            f.PushMs = strong ? 300 : 120; f.PushSpeed = direction * distance / (f.PushMs / 1000); f.RecoilCooldown = strong ? 900 : 160;
            if (strong)
            {
                var limits = Limits(f); var room = direction > 0 ? limits.max - f.X : f.X - limits.min;
                var overflow = Math.Max(0, distance - Math.Max(0, room));
                if (overflow > 0) { Other(f).PushMs = 300; Other(f).PushSpeed = -direction * overflow / .3; }
            }
        }
        void Down(MatchFighter f, string phase)
        {
            f.DownPhase = phase; f.Height = f.StunMs = f.PushMs = 0; f.Buffered = null; f.Pressure.Reset();
            Start(f, f.Configuration.Has(phase) ? phase : "FALL", true);
        }
        void Launch(MatchFighter f)
        {
            Down(f, "FLY"); var seconds = f.Clock.RemainingMs(i => Tempo(f, i)) / 1000;
            var natural = f.Face * f.Action.RootTravel * Scale * f.Action.Scale; var direction = -f.Face;
            var limits = Limits(f); var destination = Clamp(f.X + direction * WorldHeight * 2.5, limits.min, limits.max);
            f.PushMs = seconds * 1000; f.PushSpeed = direction * Math.Max(0, (destination - f.X - natural) * direction) / seconds;
        }
        void AdvanceDown(MatchFighter f)
        {
            if (f.DownPhase == "KO_HOLD") return;
            var phase = f.DownPhase; f.X += f.Face * f.Action.RootTravel * Scale * f.Action.Scale;
            var next = f.Hp <= 0 && phase != "FLY" ? "KO_HOLD" : phase switch
            { "FALL" => "LAND", "LAND" => "DOWN", "DOWN" => "GETUP", "THROW_DOWN" => "GETUP", "FLY" => "FLY_LAND", "FLY_LAND" => "FLY_DOWN", "FLY_DOWN" => "GETUP", _ => null };
            if (next != null) { if(phase=="FALL"||phase=="FLY")QueueGesture(Other(f),"AUTO_JOY"); f.DownPhase = next; if (next != "FLY_LAND") f.PushMs = 0; Start(f, next, true); return; }
            if(phase=="GETUP")QueueGesture(f,"AUTO_ANGER");
            f.DownPhase = null; f.StunMs = 0; f.KnockdownCooldown = 3500; f.ProtectionMs = 350; Idle(f);
        }
        void CheckEnd()
        {
            if(Adventure)return; // Route controller waits for the authored KO to settle.
            if (Training || Phase != MatchPhase.Fighting || Player.Hp > 0 && Opponent.Hp > 0 && RemainingSeconds > 0) return;
            RoundWinner = Player.Hp == Opponent.Hp ? -1 : Player.Hp > Opponent.Hp ? 0 : 1;
            if (RoundWinner == 0) PlayerWins++; if (RoundWinner == 1) OpponentWins++;
            ResetClinch();Phase = MatchPhase.RoundOver; phaseMs = 0; holdMs = 0; ReleaseInputs(); Emit("round", Player);
        }
        bool MatchOver => SingleRound || PlayerWins >= 2 || OpponentWins >= 2 || Round >= 3;
        void AdvanceCelebration(double dt)
        {
            phaseMs += dt;
            foreach (var f in fighters)
            {
                f.Clock.Advance(dt, i => Tempo(f, i), _ => true, !f.Locked);
                if (f.Clock.Finished && f.DownPhase != null) AdvanceDown(f);
            }
            if (!celebrationStarted && phaseMs >= 300)
            {
                celebrationStarted = true; var winner = MatchOver ? Winner : RoundWinner;
                celebrationEnd=phaseMs+1150;
                if (winner >= 0)
                {
                    var f = fighters[winner]; var z = fighters[1 - winner];
                    f.DownPhase = null; f.StunMs = f.PushMs = 0;
                    var name = MatchOver && f.Configuration.Has("WIN_MATCH") ? "WIN_MATCH" : f.Configuration.Has("WIN_ROUND") ? "WIN_ROUND" : "WIN";
                    if (f.Configuration.Has(name)) { Start(f, name, true);celebrationEnd=phaseMs+f.Clock.RemainingMs(i=>Tempo(f,i))+450; }
                    if (z.Hp > 0 && z.DownPhase == null && z.Configuration.Has("LOSE_MATCH")) Start(z, "LOSE_MATCH", true);
                }
            }
            var celebrated = MatchOver ? Winner : RoundWinner;
            if (!celebrationStarted || phaseMs < celebrationEnd || celebrated >= 0 && !fighters[celebrated].Clock.Finished) return;
            if (MatchOver) { Phase = MatchPhase.Complete; Emit("complete", Player); }
            else { Round++; ResetRound(); }
        }
        (double center, double radius) Body(MatchFighter f)
        {
            var a = f.Action; var p = a.PushCenters;
            if (p.Length > 0) { var v = p[Math.Min(f.Clock.Frame, p.Length - 1)]; return (f.X + f.Face * (v[0] - a.PivotAt(f.Clock.Frame)) * Scale * a.Scale, v[1] * Scale * a.Scale); }
            return (f.X, ReferenceHeight * .12);
        }
        (double min, double max) Limits(MatchFighter f)
        {
            var c = f.Action; if (c.Boxes.Length == 0) return (Width * .08, Width * .92);
            var b = c.Boxes[Math.Min(f.Clock.Frame, c.Boxes.Length - 1)]; var n = c.Boxes[Math.Min(f.Clock.Frame + 1, c.Boxes.Length - 1)];
            var pivot = c.PivotAt(f.Clock.Frame); var left = (pivot - Math.Min(b[0], n[0])) * Scale * c.Scale + 8;
            var right = (Math.Max(b[2], n[2]) - pivot) * Scale * c.Scale + 8;
            if (f.Face < 0) (left, right) = (right, left);
            var lo = Math.Max(Width * .08, left); var hi = Math.Min(Width * .92, Width - right);
            return lo <= hi ? (lo, hi) : (Width / 2, Width / 2);
        }
        void Confine() { foreach (var f in fighters) { var l = Limits(f); f.X = Clamp(f.X, l.min, l.max); } }
        void Separate()
        {
            if (pair != null || Player.DownPhase != null || Opponent.DownPhase != null) return;
            var a = Body(Player); var z = Body(Opponent); var face = Math.Sign(z.center - a.center); if (face == 0) face = Player.Face;
            var overlap = Math.Max(a.radius + z.radius - Math.Abs(z.center - a.center),TorsoCorrection(face)); if (overlap <= 0) return;
            var ba = Player.Action.Attack; var oa = Opponent.Action.Attack;
            var bp = IsGait(Player.ActionId) && Player.Input.Direction == Player.Face; var op = IsGait(Opponent.ActionId) && Opponent.Input.Direction == Opponent.Face;
            var share = ba && !oa ? 1 : oa && !ba ? 0 : bp && !op ? .85 : op && !bp ? .15 : .5;
            var bx = Player.X; var ox = Opponent.X;
            Player.X = Clamp(Player.X - face * overlap * share, Width * .08, Width * .92);
            Opponent.X = Clamp(Opponent.X + face * overlap * (1 - share), Width * .08, Width * .92);
            var remaining = overlap - (bx - Player.X) * face - (Opponent.X - ox) * face;
            if (remaining > 0)
            { if (Opponent.X == Width * .08 || Opponent.X == Width * .92) Player.X = Clamp(Player.X - face * remaining, Width * .08, Width * .92); else Opponent.X = Clamp(Opponent.X + face * remaining, Width * .08, Width * .92); }
        }
        double TorsoCorrection(int face)
        {
            if(Player.ApproachingCombo||Opponent.ApproachingCombo||Player.ActionId=="COMBO"||Opponent.ActionId=="COMBO")return 0;
            var first=Player.Action.Capsules;var second=Opponent.Action.Capsules;
            if(first==null||second==null||Player.Clock.Frame>=first.Length||Opponent.Clock.Frame>=second.Length)return 0;
            var p=Pose(Player);var q=Pose(Opponent);var correction=0d;
            foreach(var a in first[Player.Clock.Frame])foreach(var z in second[Opponent.Clock.Frame])
            {
                if(a.Region!="body"||z.Region!="body")continue;
                var aa=p.Transform(a.A,Player.Action.AnchorY);var ab=p.Transform(a.B,Player.Action.AnchorY);
                var za=q.Transform(z.A,Opponent.Action.AnchorY);var zb=q.Transform(z.B,Opponent.Action.AnchorY);
                var radius=a.Radius*p.Scale+z.Radius*q.Scale;
                if(CombatGeometry.SegmentDistance(aa,ab,za,zb)>=radius-.001)continue;
                var lo=0d;var hi=Math.Max(0,face>0?Math.Max(aa.X,ab.X)-Math.Min(za.X,zb.X)+radius:Math.Max(za.X,zb.X)-Math.Min(aa.X,ab.X)+radius)+.01;
                for(var i=0;i<14;i++){var mid=(lo+hi)/2;var a1=new Point2(aa.X-face*mid,aa.Y);var a2=new Point2(ab.X-face*mid,ab.Y);if(CombatGeometry.SegmentDistance(a1,a2,za,zb)<radius)lo=mid;else hi=mid;}
                correction=Math.Max(correction,hi);
            }
            return correction;
        }
        readonly struct Defense
        {
            internal readonly CombatPose Pose;
            internal readonly bool Down, Guard, Low;
            internal readonly double Protection;
            internal readonly double Seconds;
            internal Defense(MatchFighter f, CombatPose pose)
            { Pose = pose; Seconds=f.Clock.PoseSeconds; Down = f.DownPhase != null; Protection = f.ProtectionMs; Guard = f.ActionId == "BLOCK" || f.ActionId == "BLOCK_LOW"; Low = f.ActionId == "BLOCK_LOW"; }
        }
        readonly struct PendingHit
        {
            internal readonly MatchFighter Actor, Target;
            internal readonly CombatAction Action;
            internal readonly CombatHit Hit;
            internal readonly CombatContact Contact;
            internal readonly Defense Defense;
            internal readonly int Serial;
            internal readonly AttackLedger Ledger;
            internal readonly CombatPose AttackPose;
            internal PendingHit(MatchFighter a, MatchFighter z, CombatAction action, CombatHit hit, CombatContact contact, Defense defense, CombatPose attackPose)
            { Actor = a; Target = z; Action = action; Hit = hit; Contact = contact; Defense = defense; Serial = a.Serial; Ledger = a.Ledger; AttackPose=attackPose; }
        }
    }
}
