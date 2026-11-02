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
        public static double PointSegmentDistance(Point2 p, Point2 a, Point2 b)
        {
            var dx=b.X-a.X;var dy=b.Y-a.Y;var length=dx*dx+dy*dy;
            var u=length==0?0:Math.Max(0,Math.Min(1,((p.X-a.X)*dx+(p.Y-a.Y)*dy)/length));
            var x=p.X-a.X-u*dx;var y=p.Y-a.Y-u*dy;return Math.Sqrt(x*x+y*y);
        }
        public static double SegmentDistance(Point2 a, Point2 b, Point2 c, Point2 d)
        {
            double Cross(Point2 x,Point2 y,Point2 z)=>(y.X-x.X)*(z.Y-x.Y)-(y.Y-x.Y)*(z.X-x.X);
            if(Cross(a,b,c)*Cross(a,b,d)<0&&Cross(c,d,a)*Cross(c,d,b)<0)return 0;
            return Math.Min(Math.Min(PointSegmentDistance(a,c,d),PointSegmentDistance(b,c,d)),Math.Min(PointSegmentDistance(c,a,b),PointSegmentDistance(d,a,b)));
        }
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
