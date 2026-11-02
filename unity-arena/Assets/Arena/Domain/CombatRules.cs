using System;
using System.Collections.Generic;

namespace Braxhorn.Arena.Domain
{
    public static class CombatRules
    {
        public const double ActionSpeed = 1.10, MoveSpeed = 1.20;
        public static readonly string[] Roster = { "BRAX", "NYXA", "VEXA", "KROV", "NINA", "DANNY", "BEAR", "DEMON" };
        static readonly Dictionary<string, string[]> Attacks = new Dictionary<string, string[]>(StringComparer.Ordinal)
        {
            ["BRAX"] = Moves("DOUBLE_PUNCH", "UPPERCUT"), ["NYXA"] = Moves("ELBOW", "CLINCH_KNEE"),
            ["VEXA"] = Moves("SPIN_KICK", "FLYING_KICK"), ["KROV"] = Moves("ELBOW", "UPPERCUT"),
            ["DANNY"] = Moves("HOOK", "SIDE_KICK"), ["BEAR"] = Moves("SHOULDER", "UPPERCUT"),
            ["DEMON"] = Moves("SHOULDER", "UPPERCUT"),
            ["NINA"] = new[] { "LIGHT_PUNCH", "HEAVY_PUNCH", "LIGHT_KICK", "HEAVY_KICK", "CRESCENT_KICK", "SPIN_KICK", "MEIA_LUA", "GROUND_KICK" },
            ["BOSS"] = new[] { "LIGHT_PUNCH", "HEAVY_PUNCH", "LIGHT_KICK", "HEAVY_KICK", "UPPERCUT" },
            ["ZOMBIE"] = new[] { "LIGHT_PUNCH", "HEAVY_PUNCH", "LIGHT_KICK", "HEAVY_KICK", "UPPERCUT" }
        };
        static string[] Moves(string fifth, string sixth) => new[] { "LIGHT_PUNCH", "HEAVY_PUNCH", "LIGHT_KICK", "HEAVY_KICK", fifth, sixth };

        public static string ButtonMove(CombatConfiguration config, string kind, bool forward, bool down, bool running)
        {
            var who = config.Character;
            if (down && kind == "heavy" && config.Has("ACROBATIC_PUNCH")) return "ACROBATIC_PUNCH";
            if (who == "BEAR" && config.Has("RUN_SHOULDER") && forward && kind == "punch" && running) return "RUN_SHOULDER";
            if (forward && running && who != "BEAR")
                return kind switch { "punch" => who == "NINA" ? "LIGHT_KICK" : "LIGHT_PUNCH", "heavy" => who == "NINA" ? "SPIN_KICK" : "HEAVY_PUNCH", "kick" => "LIGHT_KICK", "kick2" => who == "VEXA" ? "FLYING_KICK" : who == "NINA" ? "SPIN_KICK" : "HEAVY_KICK", _ => null };
            var index = kind switch { "punch" => forward ? 4 : 0, "heavy" => forward ? 5 : 1, "kick" => who == "NINA" && forward ? 6 : 2, "kick2" => who == "NINA" && forward ? 7 : 3, _ => -1 };
            return Attacks.TryGetValue(who, out var moves) && index >= 0 && index < moves.Length ? moves[index] : null;
        }

        public static double BaseTempo(CombatAction action, int frame)
        {
            var phase = frame < action.PhaseFirst ? action.PhaseStartup : frame > action.PhaseLast ? action.PhaseRecovery : 1;
            var time = frame * action.Durations[0] / 1000;
            var beat = 1.0;
            foreach (var item in action.TempoBeats) if (time >= item.From && time < item.To) { beat = item.Rate; break; }
            return action.PlaybackRate * phase * beat;
        }
        // Dynamic reaction overrides are supplied by the authoritative match.
        public static double ActionTempo(string character, CombatAction action, int frame, double? reactionRate = null)
        {
            if (action.GroundCombo) return 1.15;
            if (action.Id == "COMBO") return BaseTempo(action, frame) * (frame <= action.OpeningEnd ? 1.05 : 1.15);
            if (reactionRate.HasValue) return reactionRate.Value;
            if (action.AuthoredTempo) return BaseTempo(action, frame);
            if (action.ContactRecovery) return 1;
            return (character == "NINA" ? .93 : 1) * ActionSpeed * BaseTempo(action, frame);
        }
        public static double LocomotionTempo(string character, CombatAction action) => (character == "NINA" ? .93 : 1) * MoveSpeed * action.GaitRate;
        public static double Movement(string character, double referenceHeight, double viewportWidth, bool backwards)
        {
            var factor = character switch { "BRAX" => .60, "NYXA" => .67, "VEXA" => .73, "KROV" => .58, "BEAR" => .54, "NINA" => .70, "DANNY" => .66, _ => .60 };
            return (character == "NINA" ? .93 : 1) * MoveSpeed * referenceHeight / viewportWidth * 100 * factor * (backwards ? .8 : 1);
        }
        public static bool Blocks(bool guarding, bool low, string region, bool comboCommitted = false) => !comboCommitted && guarding && (low ? region == "leg" : region != "leg");
        public static bool Evades(CombatAction pose, int frame, string region, bool immunityWindow)
        {
            var range = pose.EvadeFrames;
            return (immunityWindow || range != null && range.Length == 2 && frame >= range[0] && frame <= range[1]) && (pose.Id != "LEAN" || region == "head");
        }
    }

    public sealed class ActionClock
    {
        public CombatAction Action { get; private set; }
        public int Frame { get; private set; }
        public double FrameMs { get; private set; }
        public bool Finished { get; private set; }
        public double PoseSeconds => (Action.Starts[Frame] + FrameMs) / 1000;
        public void Start(CombatAction action, int firstFrame = 0)
        {
            Action = action ?? throw new ArgumentNullException(nameof(action));
            if (firstFrame < 0 || firstFrame >= action.Durations.Length) throw new ArgumentOutOfRangeException(nameof(firstFrame));
            Frame = firstFrame; FrameMs = 0; Finished = false;
        }
        // Visits every crossed authored frame even when the renderer drops frames.
        // Returning false pauses exactly at that contact (e.g. shared hitstop).
        public double Advance(double milliseconds, Func<int, double> tempo, Func<int, bool> visit, bool loop = false)
        {
            if (milliseconds < 0 || double.IsNaN(milliseconds) || double.IsInfinity(milliseconds)) throw new ArgumentOutOfRangeException(nameof(milliseconds));
            if (Action == null || Finished) return milliseconds;
            var remaining = milliseconds;
            while (remaining > 0)
            {
                if (!visit(Frame)) return remaining;
                var rate = tempo(Frame);
                if (rate <= 0 || double.IsNaN(rate) || double.IsInfinity(rate)) throw new InvalidOperationException("Invalid action tempo.");
                var spent = Math.Min(remaining, Math.Max(0, Action.Durations[Frame] - FrameMs) / rate);
                FrameMs += spent * rate; remaining -= spent;
                if (FrameMs + 1e-6 < Action.Durations[Frame]) break;
                FrameMs = 0; Frame++;
                if (Frame == Action.Durations.Length)
                {
                    if (loop) Frame = 0;
                    else { Frame--; FrameMs = Action.Durations[Frame]; Finished = true; break; }
                }
                if (!visit(Frame)) return remaining;
            }
            return remaining;
        }
        public double RemainingMs(Func<int, double> tempo)
        {
            if (Finished) return 0;
            var sum = (Action.Durations[Frame] - FrameMs) / tempo(Frame);
            for (var i = Frame + 1; i < Action.Durations.Length; i++) sum += Action.Durations[i] / tempo(i);
            return sum;
        }
    }
}
