using System;

namespace Braxhorn.Arena.Domain
{
    public readonly struct Point3
    {
        public readonly double X,Y,Z;
        public Point3(double x,double y,double z){X=x;Y=y;Z=z;}
        public static Point3 operator +(Point3 a,Point3 b)=>new Point3(a.X+b.X,a.Y+b.Y,a.Z+b.Z);
        public static Point3 operator -(Point3 a,Point3 b)=>new Point3(a.X-b.X,a.Y-b.Y,a.Z-b.Z);
        public static Point3 operator *(Point3 a,double s)=>new Point3(a.X*s,a.Y*s,a.Z*s);
        public double Length=>Math.Sqrt(Dot(this,this));
        public static double Dot(Point3 a,Point3 b)=>a.X*b.X+a.Y*b.Y+a.Z*b.Z;
    }
    // Original contactArm two-bone solution in the fighter's model-space units.
    // Rotations are applied by Unity; this solver never changes segment lengths.
    public static class ArmContactGeometry
    {
        public static bool Solve(Point3 shoulder,Point3 elbow,Point3 hand,Point3 target,out Point3 elbowGoal,out Point3 handGoal)
        {
            elbowGoal=elbow;handGoal=hand;
            var l1=(elbow-shoulder).Length;var l2=(hand-elbow).Length;var delta=target-shoulder;var distance=delta.Length;
            if(!Finite(l1)||!Finite(l2)||!Finite(distance)||l1<=.008||l2<=.008||distance<1e-10)return false;
            var d=Math.Max(Math.Abs(l1-l2)+.002,Math.Min(l1+l2-.008,distance));var dir=delta*(1/distance);
            var x=(l1*l1-l2*l2+d*d)/(2*d);var height=Math.Sqrt(Math.Max(0,l1*l1-x*x));
            var pole=new Point3(0,-1,0);pole=pole-dir*Point3.Dot(pole,dir);
            if(Point3.Dot(pole,pole)<1e-8){pole=new Point3(1,0,0);pole=pole-dir*Point3.Dot(pole,dir);}
            pole=pole*(1/pole.Length);elbowGoal=shoulder+dir*x+pole*height;handGoal=shoulder+dir*d;return true;
        }
        static bool Finite(double x)=>!double.IsNaN(x)&&!double.IsInfinity(x);
        public static double Weight(double seconds){var t=Math.Max(0,Math.Min(1,seconds/.18));return t*t*(3-2*t);}
    }
}
