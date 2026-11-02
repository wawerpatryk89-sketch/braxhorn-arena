using System;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public readonly struct EntrancePoint
    {
        public readonly double X,Ground,Depth,Yaw;
        public EntrancePoint(double x,double ground,double depth,double yaw){X=x;Ground=ground;Depth=depth;Yaw=yaw;}
    }
    // Exact authored doorway projection. The walk/run clock is driven by original
    // root travel; reciprocal depth avoids a fake linear shrink/grow animation.
    public sealed class AdventureEntrance
    {
        public double Distance { get; }
        public double Depth { get; }
        public double X0 { get; }
        public double Yaw { get; }
        public bool Masked { get; }
        readonly double xTo,groundFrom,panelWidth,unit,doorwayX,approach,outward;
        static double Clamp(double value,double min,double max)=>Math.Max(min,Math.Min(max,value));
        static bool Valid(double value)=>!double.IsNaN(value)&&!double.IsInfinity(value);
        public AdventureEntrance(JObject config,JObject entry,double width,double height,double scale)
        {
            if(config==null||entry==null||!Valid(width)||!Valid(height)||!Valid(scale)||width<=0||height<=0||scale<=0)throw new ArgumentException("Invalid entrance inputs");
            panelWidth=Math.Max(width,height*898/512);unit=640/3.25*scale;
            var box=(JArray)(config["entranceBounds"]??config["union"]);
            if(box==null||box.Count!=4)throw new ArgumentException("Missing original entrance bounds");
            var pivot=(double?)config["pivotX"]??512;var anchor=(double?)config["anchorY"]??550;
            var halfWidth=Math.Max(pivot-(double)box[0],(double)box[2]-pivot);
            xTo=(double)entry["xTo"];groundFrom=(double)entry["groundFrom"];
            var mask=entry["mask"] as JObject;var depth=(double)entry["depthFrom"];
            if(mask!=null)depth=Math.Min(depth,Math.Min((groundFrom-(double)mask["y"]-.02)*height/((anchor-(double)box[1])*scale),((double)mask["w"]*panelWidth-12)/(2*halfWidth*scale)));
            var door=mask!=null?((double)mask["x"]+(double)mask["w"]/2)*100:(double)entry["xFrom"];
            var yaw=(double)entry["yawFrom"];var travel=(xTo-door)/100*panelWidth/unit/Math.Sin(yaw);
            var roots=config["prefightRootSamples"] as JArray;
            var stride=roots!=null&&roots.Count>0?(double)roots[roots.Count-1][1]:0;
            if(mask==null||(bool?)entry["fromEdge"]==true||!(depth>0&&depth<1)||!Valid(travel)||travel<=0||stride<=0)
            {
                Depth=1;Yaw=Math.PI/2;Masked=false;X0=-Math.Max(12,(pivot-(double)box[0])*scale/panelWidth*100+3);
                Distance=(xTo-X0)/100*panelWidth/unit;return;
            }
            Depth=depth;Yaw=yaw;Masked=true;doorwayX=door;
            X0=(double)mask["x"]*100-halfWidth*scale*depth/panelWidth*100-.5;
            approach=(doorwayX-X0)/100*panelWidth/(unit*depth);outward=travel;Distance=approach+outward;
        }
        public EntrancePoint Sample(double travel)
        {
            if(!Valid(travel))throw new ArgumentOutOfRangeException(nameof(travel));
            if(!Masked){var u=Clamp(travel/Distance,0,1);return new EntrancePoint(X0+(xTo-X0)*u,.84,1,Math.PI/2);}
            var s=Clamp(travel,0,Distance);var turn=Clamp((s-approach+.4)/.8,0,1);var yaw=Math.PI/2+(Yaw-Math.PI/2)*turn*turn*(3-2*turn);
            if(s<=approach)return new EntrancePoint(X0+s*unit*Depth/panelWidth*100,groundFrom,Depth,yaw);
            var u2=(s-approach)/outward;var depth=Depth/(1-u2*(1-Depth));var projected=u2*depth;
            return new EntrancePoint(doorwayX+(xTo-doorwayX)*projected,groundFrom+(.84-groundFrom)*projected,depth,yaw);
        }
    }
}
