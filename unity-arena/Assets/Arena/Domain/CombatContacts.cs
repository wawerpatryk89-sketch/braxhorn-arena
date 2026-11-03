using System;
using System.Collections.Generic;

namespace Braxhorn.Arena.Domain
{
    public readonly struct CombatPose
    {
        public readonly CombatAction Action;
        public readonly int Frame, Face;
        public readonly double X, Y, Scale;
        public CombatPose(CombatAction action, int frame, int face, double x, double y, double scale)
        {
            if (action == null || frame < 0 || frame >= action.Durations.Length || Math.Abs(face) != 1 || scale <= 0)
                throw new ArgumentException("Invalid combat pose.");
            Action = action; Frame = frame; Face = face; X = x; Y = y; Scale = scale * action.Scale;
        }
        public Point2 Transform(Point2 point, double anchor) => new Point2(X + Face * (point.X - Action.PivotAt(Frame)) * Scale, Y + (point.Y - anchor) * Scale);
    }

    public readonly struct CombatContact
    {
        public readonly bool Hit;
        public readonly string Region;
        public readonly Point2 Point;
        public CombatContact(string region, Point2 point) { Hit = true; Region = region; Point = point; }
    }

    public static class CombatContacts
    {
        // Coordinates use the original top-down logical arena; presentation is
        // responsible for the single conversion to Unity's Y-up world.
        public static CombatContact Find(CombatPose attacker, CombatHit hit, CombatPose target)
        {
            var box = hit.Box;
            var center = attacker.Transform(new Point2(box[0] + box[2] / 2, box[1] + box[3] / 2), attacker.Action.AnchorAt(attacker.Frame));
            var radius = box[2] / 2 * attacker.Scale;
            var capsules = target.Action.Capsules;
            if (capsules != null && target.Frame < capsules.Length)
            {
                foreach (var capsule in capsules[target.Frame])
                {
                    var a = target.Transform(capsule.A, target.Action.AnchorY);
                    var b = target.Transform(capsule.B, target.Action.AnchorY);
                    var contact = CombatGeometry.CircleCapsule(center, radius, a, b, capsule.Radius * target.Scale);
                    if (contact.Hit) return new CombatContact(capsule.Region, contact.Point);
                }
                return default;
            }
            var bounds = target.Action.Boxes;
            if (bounds.Length == 0) return default;
            var frameBox = bounds[Math.Min(target.Frame, bounds.Length - 1)];
            var first = target.Transform(new Point2(frameBox[0], frameBox[1]), target.Action.AnchorY);
            var second = target.Transform(new Point2(frameBox[2], frameBox[3]), target.Action.AnchorY);
            var halfHeight = box[3] / 2 * attacker.Scale;
            return center.X-radius < Math.Max(first.X,second.X) && center.X+radius > Math.Min(first.X,second.X) && center.Y-halfHeight < second.Y && center.Y+halfHeight > first.Y
                ? new CombatContact("body",center) : default;
        }
    }

    // Each attack instance owns a ledger. A multi-frame contact or several
    // overlapping capsules can never award damage/energy repeatedly.
    public sealed class AttackLedger
    {
        readonly HashSet<int> groups = new HashSet<int>();
        bool energyAwarded;
        public void Reset() { groups.Clear(); energyAwarded = false; }
        public bool Contains(int group) => groups.Contains(group);
        public bool HasContact => groups.Count>0;
        public bool Register(CombatHit hit, bool blocked, CombatAction action, bool energyAllowed, out double energy)
        {
            energy = 0;
            if (!groups.Add(hit.Group)) return false;
            if (!blocked && !energyAwarded && energyAllowed && action.Id != "COMBO")
            {
                energyAwarded = true; energy = action.Gain;
            }
            return true;
        }
    }
}
