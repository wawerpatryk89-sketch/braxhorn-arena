using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Braxhorn.Arena
{
    public sealed partial class FighterPosePlayer
    {
        sealed class GaitTrack {internal Transform Bone;internal float[] Times;internal Quaternion[] Values;}
        sealed class GaitLayer {internal double Duration,Start;internal GaitTrack[] Tracks;}
        readonly Dictionary<string,GaitLayer> gaitLayers=new Dictionary<string,GaitLayer>(StringComparer.Ordinal);
        readonly Transform[,] gaitLegs=new Transform[2,4];
        void LoadGaitLayers(FighterDefinition fighter)
        {
            gaitLayers.Clear();for(var s=0;s<2;s++)for(var p=0;p<4;p++)gaitLegs[s,p]=null;
            if(!fighter.gaitLayers)return; // Existing serialized review definitions remain loadable.
            var bones=new Dictionary<string,Transform>(StringComparer.Ordinal);
            foreach(var bone in GetComponentsInChildren<Transform>(true))if(bone.name.StartsWith("mixamorig",StringComparison.Ordinal))bones[bone.name]=bone;
            var parts=new[]{"UpLeg","Leg","Foot","ToeBase"};
            for(var side=0;side<2;side++)for(var part=0;part<4;part++)bones.TryGetValue("mixamorig"+(side==0?"Left":"Right")+parts[part],out gaitLegs[side,part]);
            var root=JObject.Parse(fighter.gaitLayers.text);
            if((int?)root["schema"]!=1)throw new InvalidOperationException("Unsupported gait layer schema");
            foreach(var row in (JArray)root["layers"])
            {
                var layer=new GaitLayer{Duration=(double)row["duration"],Start=(double)row["start"]};
                if(layer.Duration<=0||double.IsNaN(layer.Duration)||double.IsInfinity(layer.Duration))throw new InvalidOperationException("Invalid gait duration");
                var tracks=new List<GaitTrack>();
                foreach(var entry in (JArray)row["tracks"])
                {
                    var name=(string)entry["bone"];if(!bones.TryGetValue(name,out var bone))throw new InvalidOperationException(fighter.id+": missing gait bone "+name);
                    var times=entry["times"].Values<float>().ToArray();var values=entry["values"].Values<float>().ToArray();
                    if(times.Length==0||values.Length!=times.Length*4)throw new InvalidOperationException("Invalid gait track length");
                    var rotations=new Quaternion[times.Length];
                    for(var i=0;i<times.Length;i++)
                    {
                        if(float.IsNaN(times[i])||float.IsInfinity(times[i])||i>0&&times[i]<=times[i-1])throw new InvalidOperationException("Invalid gait sample time");
                        for(var j=0;j<4;j++)if(float.IsNaN(values[i*4+j])||float.IsInfinity(values[i*4+j]))throw new InvalidOperationException("Invalid gait rotation");
                        rotations[i]=new Quaternion(values[i*4],values[i*4+1],values[i*4+2],values[i*4+3]);
                    }
                    tracks.Add(new GaitTrack{Bone=bone,Times=times,Values=rotations});
                }
                layer.Tracks=tracks.ToArray();gaitLayers.Add((string)row["id"],layer);
            }
        }
        public void ApplyMovingGait(string id,double seconds,double weight)
        {
            if(id==null||weight<=0||!gaitLayers.TryGetValue(id,out var layer))return;
            var time=(float)(Math.Max(0,seconds)%layer.Duration+layer.Start);
            foreach(var track in layer.Tracks)
            {
                var index=Array.BinarySearch(track.Times,time);if(index<0)index=~index-1;
                index=Math.Max(0,Math.Min(track.Times.Length-1,index));var next=Math.Min(index+1,track.Times.Length-1);
                var fraction=next==index?0:Mathf.Clamp01((time-track.Times[index])/(track.Times[next]-track.Times[index]));
                var target=Quaternion.Slerp(track.Values[index],track.Values[next],fraction);
                track.Bone.localRotation=Quaternion.Slerp(track.Bone.localRotation,target,Mathf.Clamp01((float)weight));
            }
            for(var side=0;side<2;side++)FloorGaitLeg(gaitLegs[side,0],gaitLegs[side,1],gaitLegs[side,2],gaitLegs[side,3]);
        }
        void FloorGaitLeg(Transform upper,Transform lower,Transform foot,Transform toe)
        {
            if(!upper||!lower||!foot||!transform.parent)return;
            var frame=transform.parent;var a=frame.InverseTransformPoint(upper.position);var b=frame.InverseTransformPoint(lower.position);var c=frame.InverseTransformPoint(foot.position);
            var lift=.065f-Mathf.Min(c.y,toe?frame.InverseTransformPoint(toe.position).y:c.y);if(lift<=0)return;
            var goal=c+Vector3.up*lift;var saved=foot.rotation;var l1=Vector3.Distance(a,b);var l2=Vector3.Distance(b,c);
            if(l1<=.001f||l2<=.001f||(goal-a).sqrMagnitude<1e-12f)return;
            var d=Mathf.Clamp(Vector3.Distance(a,goal),Mathf.Abs(l1-l2)+.001f,l1+l2-.001f);var dir=(goal-a).normalized;
            var x=(l1*l1-l2*l2+d*d)/(2*d);var h=Mathf.Sqrt(Mathf.Max(0,l1*l1-x*x));var pole=b-a;pole-=dir*Vector3.Dot(pole,dir);
            if(pole.sqrMagnitude<1e-8f){pole=frame.InverseTransformDirection(upper.TransformDirection(Vector3.back));pole-=dir*Vector3.Dot(pole,dir);}
            if(pole.sqrMagnitude<1e-12f)return;
            Aim(upper,lower,frame.TransformPoint(a+dir*x+pole.normalized*h));Aim(lower,foot,frame.TransformPoint(a+dir*d));foot.rotation=saved;
        }
    }
}
