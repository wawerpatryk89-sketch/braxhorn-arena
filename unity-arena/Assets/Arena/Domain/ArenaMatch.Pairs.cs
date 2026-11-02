using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public sealed partial class ArenaMatch
    {
        sealed class PairState
        {
            internal MatchFighter Attacker, Target;
            internal JObject Data;
            internal double Elapsed, Time, Alignment, Aligned;
            internal readonly double[] Roots = new double[2];
            internal readonly HashSet<int> Events = new HashSet<int>();
            internal int Face;
            internal bool FromCombo;
        }
        PairState pair;
        sealed class RecoveryState
        {
            internal MatchFighter Attacker,Target;
            internal double Elapsed;
            internal bool Recovered;
        }
        RecoveryState recovery;
        internal bool TryPair(MatchFighter a, string move, bool fromCombo)
        {
            if (move == null || pair != null || Phase != MatchPhase.Fighting || Paused) return false;
            var z = Other(a); var ac = a.Configuration; var zc = z.Configuration;
            var settings = ac["IDLE"].Source["pairedCombat"];
            var data = settings?["moves"]?[move] as JObject;
            if ((bool?)settings?["enabled"] != true || !ac.Has("COMBO") || data == null) return false;
            var attack = (string)data["attackers"]?[zc.Character] ?? (string)data["attacker"];
            var reaction = (string)data["reaction"];
            if (!ac.Has(attack) || !zc.Has(reaction) || (data["allowedTargets"] is JArray allowed && !allowed.Values<string>().Contains(zc.Character))) return false;
            if (a.Hp <= 0 || z.Hp <= 0 || a.DownPhase != null || z.DownPhase != null || z.ProtectionMs > 0 || z.GrabProtection > 0 || (!fromCombo && (a.Locked || a.StunMs > 0))) return false;
            if (z.ActionId == "BLOCK" || z.ActionId == "BLOCK_LOW" || CombatRules.Evades(z.Action, z.Clock.Frame, "head", false)) return false;
            var pixels = (double?)data["gapPx"]?[zc.Character]; if (!pixels.HasValue) return false;
            var desired = pixels.Value * Scale * ac["IDLE"].Scale;
            var gap = (z.X - a.X) * a.Face; if (gap <= 0 || gap > desired + WorldHeight * (fromCombo ? .18 : .10)) return false;
            // Middle-grab continuations retain the existing serial/groups. They
            // require their own ground/bridge state, never restart a paid COMBO.
            if (fromCombo && (bool?)ac["COMBO"].Source["middleGrab"] == true) return false;
            pair = new PairState { Attacker = a, Target = z, Data = data, Face = a.Face,
                Alignment = (gap - desired) * a.Face / 2, FromCombo = fromCombo };
            holdMs = 0; ReleaseInputs();
            foreach (var f in new[] { a, z }) { f.PushMs = f.StunMs = 0; f.Pressure.Reset(); f.ApproachingCombo = false; }
            Start(a, attack, true); Start(z, reaction, true); Emit("grab", a, z); return true;
        }
        bool BreakPair(MatchFighter requester)
        {
            if (pair == null || pair.Elapsed > 200 || pair.Events.Count > 0) return false;
            var a = pair.Attacker; var z = pair.Target; pair = null;
            foreach (var f in new[] { a, z }) { f.GrabProtection = 600; Idle(f); }
            ReleaseInputs(); Emit("break", requester, Other(requester)); return true;
        }
        void AdvancePair(double dt)
        {
            var e = pair; var a = e.Attacker; var z = e.Target; var data = e.Data;
            e.Elapsed += dt;
            var u = Math.Min(1, e.Elapsed / 180); var aligned = e.Alignment * u * u * (3 - 2 * u);
            a.X += aligned - e.Aligned; z.X -= aligned - e.Aligned; e.Aligned = aligned;
            a.Face = e.Face; z.Face = -e.Face;
            var duration = (double)data["duration"]; var rate = (double?)data["rate"] ?? 1.15;
            var contacts = (JArray)data["contacts"];
            var nextContact = double.PositiveInfinity;
            if (e.FromCombo) for (var i = 0; i < contacts.Count; i++)
                if (!e.Events.Contains(i) && (double)contacts[i]["time"] >= e.Time) { nextContact = (double)contacts[i]["time"]; break; }
            e.Time = Math.Min(duration, Math.Min(nextContact, e.Time + dt / 1000 * rate));
            for (var i = 0; i < 2; i++)
            {
                var f = i == 0 ? a : z; var c = f.Action;
                var position = e.Time * 1000 / c.Durations[0]; var frame = (int)Math.Floor(position); var fraction = position - frame;
                var track = c.RootTrack; var root = track.Length == 0 ? 0 : track[Math.Min(frame, track.Length - 1)] * (1 - fraction) + track[Math.Min(frame + 1, track.Length - 1)] * fraction;
                f.X += f.Face * (root - e.Roots[i]) * Scale * c.Scale; e.Roots[i] = root;
                f.Clock.Seek(Math.Min(e.Time * 1000, c.DurationMs));
            }
            for (var i = 0; i < contacts.Count; i++)
            {
                var contact = contacts[i]; if (e.Time + 1e-8 < (double)contact["time"] || !e.Events.Add(i)) continue;
                var damage = (double)contact["damage"]; z.Hp = Math.Max(Training ? 1 : 0, z.Hp - damage);
                var ground = (bool?)contact["ground"] ?? false;
                var point = new Point2(z.X, ground ? Floor : Floor - ReferenceHeight * .65);
                var hit = new CombatHit(new JObject { ["box"] = new JArray(0, 0, 0, 0), ["damage"] = damage, ["group"] = i });
                Emit(ground ? "slam" : "hit", a, z, hit, new CombatContact(ground ? "body" : "head", point));
            }
            if (e.Time + 1e-8 < duration) return;
            pair = null;
            foreach (var f in new[] { a, z }) { f.GrabProtection = 600; f.PushMs = f.StunMs = 0; }
            Idle(a); z.DownPhase = z.Hp <= 0 ? "KO_HOLD" : "THROW_DOWN";
            var down = (string)data["downState"];
            Start(z, z.Configuration.Has(down) ? down : z.DownPhase, true);
            if ((bool?)data["recoverySameFacing"] == true) z.Face = e.Face;
            if(e.FromCombo&&a.Hp>0&&z.Hp>0)
            {
                recovery=new RecoveryState{Attacker=a,Target=z};
                a.Face=Math.Sign(z.X-a.X)==0?a.Face:Math.Sign(z.X-a.X);
                Start(a,"WALK_BACK",false);z.DownPhase="GETUP";
                Start(z,z.Configuration.Has("COMBO_RECOVER")?"COMBO_RECOVER":"GETUP",true);
            }
            ReleaseInputs(); CheckEnd();
        }
        void AdvanceRecovery(double dt)
        {
            var e=recovery;var a=e.Attacker;var z=e.Target;e.Elapsed+=dt;ReleaseInputs();
            var desired=Math.Min(Width*.4,WorldHeight*1.15);var gap=Math.Abs(a.X-z.X);
            if(gap<desired)
            {
                var l=Limits(a);var step=Math.Min(desired-gap,Speed(a)*.55*dt/1000);
                a.X+=Clamp(Clamp(a.X-a.Face*step,l.min,l.max)-a.X,-step,step);
            }
            a.Clock.Advance(dt,i=>Tempo(a,i),_=>true,true);
            if(!e.Recovered)
            {
                z.Clock.Advance(dt,i=>Tempo(z,i),_=>true);
                if(z.Clock.Finished){e.Recovered=true;z.DownPhase=null;Idle(z);}
            }
            if(!e.Recovered)return;
            gap=Math.Abs(a.X-z.X);
            if(gap<desired)
            {
                var l=Limits(z);var step=Math.Min(desired-gap,Speed(z)*.45*dt/1000);
                z.X+=Clamp(Clamp(z.X+a.Face*step,l.min,l.max)-z.X,-step,step);
                if(z.ActionId!="WALK_BACK")Start(z,"WALK_BACK",false);
                z.Clock.Advance(dt,i=>Tempo(z,i),_=>true,true);
            }
            if(Math.Abs(a.X-z.X)>=desired-Width*.003||e.Elapsed>2400)
            {
                recovery=null;
                foreach(var f in new[]{a,z}){f.DownPhase=null;f.StunMs=0;f.ProtectionMs=f.GrabProtection=350;f.KnockdownCooldown=3500;f.Face=Math.Sign(Other(f).X-f.X)==0?f.Face:Math.Sign(Other(f).X-f.X);Idle(f);}
                CheckEnd();
            }
        }
    }
}
