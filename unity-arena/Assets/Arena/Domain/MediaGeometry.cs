using System;

namespace Braxhorn.Arena.Domain
{
    // Same cover/contain projection as the published arena catalog. Coordinates
    // are screen pixels with origin at the top left, before Unity's Y conversion.
    public readonly struct MediaGeometry
    {
        public readonly double Width, Height, Left, Top, Floor;
        public MediaGeometry(double width,double height,double aspect,double ground,bool contain)
        {
            if(!Valid(width)||!Valid(height)||!Valid(aspect)||width<=0||height<=0||aspect<=0||!Valid(ground)||ground<0||ground>1)
                throw new ArgumentOutOfRangeException(nameof(width));
            Height=contain?Math.Min(height,width/aspect):Math.Max(height,width/aspect);
            Width=Height*aspect;Left=(width-Width)/2;Top=(height-Height)/2;Floor=Top+Height*ground;
        }
        static bool Valid(double x)=>!double.IsNaN(x)&&!double.IsInfinity(x);
        public static double AdventureSpan(double width,double height)=>width/Math.Max(width,height*898/512)*100;
        public static double LoopBlend(double seconds,double duration,double fade=.45)
        {
            if(duration<=0||seconds<0||fade<=0)return 0;
            var t=Math.Max(0,Math.Min(1,(seconds-(duration-fade))/fade));return t*t*(3-2*t);
        }
    }
}
