using System;

namespace Braxhorn.Arena.Domain
{
    public readonly struct Point2
    {
        public readonly double X;
        public readonly double Y;
        public Point2(double x, double y) { X = x; Y = y; }
    }

    public readonly struct ContactPoint
    {
        public readonly bool Hit;
        public readonly Point2 Point;
        public ContactPoint(bool hit, Point2 point) { Hit = hit; Point = point; }
    }

    public static class CombatGeometry
    {
        // sourceContact() narrow phase: authored strike circle against a body
        // capsule, including the contact point used for blood and hit effects.
        public static ContactPoint CircleCapsule(Point2 center, double strikeRadius, Point2 a, Point2 b, double bodyRadius)
        {
            if (strikeRadius < 0 || bodyRadius < 0) throw new ArgumentOutOfRangeException(nameof(strikeRadius));
            var dx = b.X - a.X;
            var dy = b.Y - a.Y;
            var lengthSquared = dx * dx + dy * dy;
            var u = lengthSquared == 0 ? 0 : Math.Max(0, Math.Min(1, ((center.X - a.X) * dx + (center.Y - a.Y) * dy) / lengthSquared));
            var x = a.X + u * dx;
            var y = a.Y + u * dy;
            var vx = center.X - x;
            var vy = center.Y - y;
            var distanceSquared = vx * vx + vy * vy;
            if (distanceSquared > (strikeRadius + bodyRadius) * (strikeRadius + bodyRadius)) return default;
            var length = Math.Sqrt(distanceSquared);
            var ratio = length == 0 ? 0 : Math.Min(1, bodyRadius / length);
            return new ContactPoint(true, new Point2(x + vx * ratio, y + vy * ratio));
        }
    }
}
