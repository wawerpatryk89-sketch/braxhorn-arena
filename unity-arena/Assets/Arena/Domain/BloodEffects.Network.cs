using System;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public sealed partial class BloodEffects
    {
        public JObject NetworkSnapshot(double width,double height)=>new JObject{
            ["size"]=new JObject{["width"]=width,["height"]=height},
            ["stains"]=new JArray(stains.Select(s=>new JObject{["x"]=s.X,["y"]=s.Y,["r"]=s.Radius})),
            ["particles"]=new JArray(particles.Select(p=>new JObject{["x"]=p.X,["y"]=p.Y,["px"]=p.PreviousX,["py"]=p.PreviousY,["vx"]=p.VelocityX,["vy"]=p.VelocityY,["life"]=p.Life,["total"]=p.Total,["floor"]=p.Floor,["r"]=p.Radius,["gravity"]=p.Gravity,["color"]=p.Bright?"#d54845":"#a91d27"})),
            ["marks"]=new JArray(WoundLevel(0),WoundLevel(1)),
            ["damageMarks"]=new JArray(injuries.Select(rows=>new JArray(rows.Select(m=>new JObject{["cap"]=m.Capsule,["u"]=m.U,["severity"]=m.Severity,["region"]=m.Region}))))
        };
        public bool RestoreNetwork(JObject data,double width,double height)
        {
            if(data==null||!DuelWire.Input(new JObject{["held"]=new JObject(),["events"]=new JArray(),["blood"]=data})||width<=0||height<=0)return false;
            var sx=width/((double?)data["size"]?["width"]??width);var sy=height/((double?)data["size"]?["height"]??height);
            // Renderer bounds are tighter than backend storage bounds. A huge
            // finite peer value must not become Infinity in Unity float meshes.
            bool Safe(double value)=>!double.IsNaN(value)&&!double.IsInfinity(value)&&Math.Abs(value)<=10000000;
            if(!Safe(sx)||!Safe(sy))return false;
            var restored=((JArray)data["particles"]).Select(p=>new BloodParticle{X=(double)p["x"]*sx,Y=(double)p["y"]*sy,PreviousX=(double)p["px"]*sx,PreviousY=(double)p["py"]*sy,VelocityX=(double)p["vx"]*sx,VelocityY=(double)p["vy"]*sy,Life=(double)p["life"],Total=(double)p["total"],Floor=(double)p["floor"]*sy,Radius=(double)p["r"]*sy,Gravity=(double)p["gravity"]*sy,Bright=(string)p["color"]=="#d54845"}).ToArray();
            if(restored.Any(p=>new[]{p.X,p.Y,p.PreviousX,p.PreviousY,p.VelocityX,p.VelocityY,p.Life,p.Total,p.Floor,p.Radius,p.Gravity}.Any(v=>!Safe(v))))return false;
            var ground=((JArray)data["stains"]).Select(s=>new BloodStain((double)s["x"],(double)s["y"],(double)s["r"])).ToArray();
            if(ground.Any(s=>!Safe(s.X*width)||!Safe(s.Y*height)||!Safe(s.Radius*height)))return false;
            particles.Clear();particles.AddRange(restored);stains.Clear();stains.AddRange(ground);
            for(var i=0;i<2;i++)
            {
                headHits[i]=2*(int)Math.Ceiling(Math.Max(0,Math.Min(6,(double)data["marks"][i])));injuries[i].Clear();
                foreach(var m in data["damageMarks"][i])
                {if((double)m["cap"]>int.MaxValue)continue;injuries[i].Add(new BloodInjury{Capsule=(int)m["cap"],U=Math.Max(0,Math.Min(1,(double)m["u"])),Severity=(int)Math.Max(1,Math.Min(3,(double)m["severity"])),Region=(string)m["region"]});}
            }
            return true;
        }
    }
}
