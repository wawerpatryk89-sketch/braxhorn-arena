using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public sealed class CombatConfiguration
    {
        public readonly string Character;
        public readonly IReadOnlyDictionary<string, CombatAction> Actions;

        public CombatConfiguration(string character, JObject source)
        {
            Character = character ?? throw new ArgumentNullException(nameof(character));
            ExtendNpcReceivers(source);
            Actions = source.Properties().ToDictionary(p => p.Name, p => new CombatAction(p.Name, (JObject)p.Value), StringComparer.Ordinal);
            if (!Actions.ContainsKey("IDLE")) throw new InvalidDataException(character + ": IDLE is missing.");
        }

        public static CombatConfiguration Read(string character, byte[] packed)
        {
            using var input = new MemoryStream(packed, false);
            using var gzip = new GZipStream(input, CompressionMode.Decompress);
            using var reader = new StreamReader(gzip);
            return new CombatConfiguration(character, JObject.Parse(reader.ReadToEnd()));
        }

        public CombatAction this[string key] => Actions[key];
        public bool Has(string key) => key != null && Actions.ContainsKey(key);

        // Same receiver extension as fighter-source.js: adventure NPCs use the
        // authored KROV compatibility entries, preserving any explicit override.
        static void ExtendNpcReceivers(JToken token)
        {
            if(token is JObject obj)
            {
                foreach(var key in new[]{"gapPx","attackers"})
                    if(obj[key] is JObject map&&map["KROV"]!=null)
                        foreach(var id in new[]{"BOSS","ZOMBIE"})if(map[id]==null)map[id]=map["KROV"].DeepClone();
                if(obj["allowedTargets"] is JArray targets&&targets.Values<string>().Contains("KROV"))
                    foreach(var id in new[]{"BOSS","ZOMBIE"})if(!targets.Values<string>().Contains(id))targets.Add(id);
            }
            if(token is JContainer container)foreach(var child in container.Children().ToArray())ExtendNpcReceivers(child);
        }
    }

    public sealed class CombatAction
    {
        // Keep authored metadata for paired choreography, ground support and VFX.
        // Typed fields serve the hot simulation path; nothing is silently dropped.
        public readonly JObject Source;
        public readonly string Id;
        public readonly double[] Durations, Starts;
        public readonly double DurationMs, PlaybackRate, Scale, PivotX, AnchorY, Gain, Cost, TransitionMs;
        public readonly bool Attack, Air, AuthoredTempo, ContactRecovery, GroundCombo;
        public readonly int FirstHit, LastHit, OpeningEnd;
        public readonly Dictionary<int, CombatHit> Hits;
        public readonly CombatCapsule[][] Capsules;
        public readonly double[][] Boxes;
        public readonly double[][] PushCenters;
        public readonly double[] RootTrack;
        public readonly double RootTravel;
        public readonly int StartFrame;
        public readonly string ReactionRegion;
        public readonly double[] FootY, Pivots;
        public readonly int[] EvadeFrames;
        public readonly double PhaseStartup, PhaseRecovery, GaitRate;
        public readonly int PhaseFirst, PhaseLast;
        public readonly TempoBeat[] TempoBeats;

        public CombatAction(string id, JObject source)
        {
            Id = id; Source = source ?? throw new ArgumentNullException(nameof(source));
            Durations = source["durations"]?.Values<double>().ToArray() ?? throw new InvalidDataException(id + ": missing durations.");
            if (Durations.Length == 0 || Durations.Any(d => double.IsNaN(d) || double.IsInfinity(d) || d <= 0))
                throw new InvalidDataException(id + ": invalid frame duration.");
            Starts = new double[Durations.Length + 1];
            for (var i = 0; i < Durations.Length; i++) Starts[i + 1] = Starts[i] + Durations[i];
            DurationMs = Starts[Durations.Length];
            PlaybackRate = Number("playbackRate", 1); Scale = Number("scale", 1);
            PivotX = Number("pivotX", 512); AnchorY = Number("anchorY", 550);
            Gain = Number("gain", 5); Cost = Number("cost", 0); TransitionMs = Number("transitionMs", 80);
            Attack = Flag("attack"); Air = (string)source["mode"] == "air";
            AuthoredTempo = Flag("authoredTempo"); ContactRecovery = Flag("contactRecovery"); GroundCombo = Flag("groundCombo");
            GaitRate = Number("gaitRate", 1);
            PhaseFirst = (int?)source["phaseTempo"]?["first"] ?? -1;
            PhaseLast = (int?)source["phaseTempo"]?["last"] ?? int.MaxValue;
            PhaseStartup = (double?)source["phaseTempo"]?["startup"] ?? 1;
            PhaseRecovery = (double?)source["phaseTempo"]?["recovery"] ?? 1;
            if (PlaybackRate <= 0 || PhaseStartup <= 0 || PhaseRecovery <= 0 || Scale <= 0)
                throw new InvalidDataException(id + ": nonpositive timing or scale.");
            Hits = new Dictionary<int, CombatHit>();
            foreach (var item in ((JObject)source["hits"] ?? new JObject()).Properties())
            {
                var frame = int.Parse(item.Name, System.Globalization.CultureInfo.InvariantCulture);
                if (frame < 0 || frame >= Durations.Length) throw new InvalidDataException(id + ": hit outside timeline.");
                Hits.Add(frame, new CombatHit((JObject)item.Value));
            }
            FirstHit = Hits.Count == 0 ? int.MaxValue : Hits.Keys.Min();
            LastHit = Hits.Count == 0 ? -1 : Hits.Keys.Max();
            OpeningEnd = Hits.Where(p => p.Value.Group == 0).Select(p => p.Key).DefaultIfEmpty(0).Max();
            TempoBeats = (source["comboTempo"] as JArray ?? new JArray()).Select(t => new TempoBeat((double)t["from"], (double)t["to"], (double?)t["rate"] ?? 1)).ToArray();
            Boxes = ReadRows(source["boxes"]);
            PushCenters = ReadRows(source["pushCenters"]);
            RootTrack = source["rootTrackPx"]?.Values<double>().ToArray() ?? Array.Empty<double>();
            RootTravel = Number("rootTravelPx", 0);
            StartFrame = (int?)source["startFrame"] ?? 0;
            if (StartFrame < 0 || StartFrame >= Durations.Length) throw new InvalidDataException(id + ": invalid start frame.");
            ReactionRegion = (string)source["reactionRegion"];
            FootY = source["footY"]?.Values<double>().ToArray() ?? Array.Empty<double>();
            Pivots = source["pivots"]?.Values<double>().ToArray() ?? Array.Empty<double>();
            EvadeFrames = source["evadeFrames"]?.Values<int>().ToArray();
            Capsules = (source["hurtCapsules"] as JArray)?.Select(frame => frame.Select(cap => new CombatCapsule(cap)).ToArray()).ToArray();
        }

        static double[][] ReadRows(JToken value) => (value as JArray ?? new JArray()).Select(row => row.Values<double>().ToArray()).ToArray();
        double Number(string key, double fallback) => (double?)Source[key] ?? fallback;
        bool Flag(string key) => (bool?)Source[key] ?? false;
        public int FrameAt(double milliseconds)
        {
            var index = Array.BinarySearch(Starts, Math.Max(0, milliseconds));
            return Math.Min(Durations.Length - 1, index >= 0 ? index : Math.Max(0, ~index - 1));
        }
        public double PivotAt(int frame) => Pivots.Length > 0 ? Pivots[Math.Min(frame, Pivots.Length - 1)] : PivotX;
        public double AnchorAt(int frame)
        {
            if (Flag("syntheticJump") || (!Flag("followJumpPhysics") && (Air || (Flag("liftFromFrames") && Id != "JUMP")))) return AnchorY;
            return FootY.Length > 0 ? FootY[Math.Min(frame, FootY.Length - 1)] : AnchorY;
        }
    }

    public readonly struct TempoBeat
    {
        public readonly double From, To, Rate;
        public TempoBeat(double from, double to, double rate) { From = from; To = to; Rate = rate; }
    }

    public sealed class CombatHit
    {
        public readonly double[] Box;
        public readonly double Damage;
        public readonly int Group;
        public readonly string Bone;
        public readonly JObject Source;
        public CombatHit(JObject source)
        {
            Source = source; Box = source["box"].Values<double>().ToArray();
            if (Box.Length != 4 || Box[2] < 0 || Box[3] < 0) throw new InvalidDataException("Invalid hit box.");
            Damage = (double)source["damage"]; Group = (int)source["group"]; Bone = (string)source["bone"];
        }
    }

    public readonly struct CombatCapsule
    {
        public readonly Point2 A, B;
        public readonly double Radius;
        public readonly string Region;
        public CombatCapsule(JToken source)
        {
            A = new Point2((double)source["a"][0], (double)source["a"][1]);
            B = new Point2((double)source["b"][0], (double)source["b"][1]);
            Radius = (double)source["radius"]; Region = (string)source["region"];
        }
    }
}
