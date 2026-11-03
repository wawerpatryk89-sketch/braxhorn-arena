using System;
using System.Collections.Generic;
using Braxhorn.Arena.Domain;
using UnityEngine;
using UnityEngine.Rendering;

namespace Braxhorn.Arena
{
    // Source procedural colours/shapes. One pooled mesh per layer, no per-hit objects.
    public sealed class NativeBloodEffects : MonoBehaviour
    {
        readonly BloodEffects state=new BloodEffects(new System.Random().NextDouble);
        readonly BloodEffects playback=new BloodEffects(()=>.5);
        readonly FighterPresentation[] replayPoses=new FighterPresentation[2];
        public void CaptureReplay(KnockoutReplay replay,double time,ReplayActor first,ReplayActor second,bool clinch)
            =>replay.Capture(time,first,second,state,clinch);
        public void PresentReplay(ArenaMatch match,ReplayFrame frame)
        {
            if(frame==null)return;
            playback.RestoreReplay(frame.Blood);replayPoses[0]=frame.First.Pose;replayPoses[1]=frame.Second.Pose;
            PresentState(match,playback,replayPoses,false);
        }
        readonly List<Vector3> vertices=new List<Vector3>(12000);
        readonly List<Color32> colours=new List<Color32>(12000);
        readonly List<int> triangles=new List<int>(30000);
        Mesh foreground,floor;
        Material material;
        readonly CombatPose?[] previousPoses=new CombatPose?[2];
        GameObject frontObject,floorObject;
        double width,height,ground,world;
        static readonly double[,] Marks={{-.28,.18,.34},{.24,-.12,.28},{-.12,.48,.26},{.38,.32,.24},{-.35,-.22,.22},{.12,.64,.20}};
        public void Initialize(Shader shader)
        {
            if(!shader)throw new InvalidOperationException("Missing original blood shader");
            material=new Material(shader){name="Original blood colours"};foreground=Layer("Blood particles and wounds",-1.5f,out frontObject);floor=Layer("Blood floor stains",1.5f,out floorObject);
        }
        Mesh Layer(string name,float z,out GameObject obj)
        {
            obj=new GameObject(name,typeof(MeshFilter),typeof(MeshRenderer));obj.transform.SetParent(transform,false);obj.transform.localPosition=new Vector3(0,0,z);
            var mesh=new Mesh{name=name};mesh.MarkDynamic();obj.GetComponent<MeshFilter>().sharedMesh=mesh;
            var renderer=obj.GetComponent<MeshRenderer>();renderer.sharedMaterial=material;renderer.shadowCastingMode=ShadowCastingMode.Off;renderer.receiveShadows=false;return mesh;
        }
        public void Hit(MatchEvent e,ArenaMatch match)
        {if((e.Kind=="hit"||e.Kind=="slam")&&e.Target>=0)state.Hit(e.Target,e.Damage,e.Region,e.Point,match.Fighter(e.Actor).Face,match.Width,match.Height,match.Floor,previousPoses[e.Target]);}
        public void Clear(bool keepMarks=false){state.Clear(keepMarks);previousPoses[0]=previousPoses[1]=null;if(foreground)foreground.Clear();if(floor)floor.Clear();}
        public void ClearFighter(int side){state.ClearFighter(side);previousPoses[side]=null;}
        public void Shift(double fraction,double width)=>state.Shift(fraction,width);
        public Newtonsoft.Json.Linq.JObject NetworkSnapshot(ArenaMatch match)=>state.NetworkSnapshot(match.Width,match.Height);
        public bool RestoreNetwork(Newtonsoft.Json.Linq.JObject data,ArenaMatch match)=>state.RestoreNetwork(data,match.Width,match.Height);
        public void Visible(bool value){if(frontObject)frontObject.SetActive(value);if(floorObject)floorObject.SetActive(value);}
        static Color Colour(byte r,byte g,byte b,double alpha)=>new Color32(r,g,b,(byte)Math.Max(0,Math.Min(255,Math.Round(alpha*255))));
        void Vertex(double x,double y,Color colour){vertices.Add(new Vector3((float)((x-width/2)*world),(float)((ground-y)*world),0));colours.Add(colour);}
        void Ellipse(double x,double y,double rx,double ry,Color colour,int sides=12)
        {
            var start=vertices.Count;Vertex(x,y,colour);
            for(var i=0;i<sides;i++){var angle=i*Math.PI*2/sides;Vertex(x+Math.Cos(angle)*rx,y+Math.Sin(angle)*ry,colour);}
            for(var i=0;i<sides;i++){triangles.Add(start);triangles.Add(start+1+i);triangles.Add(start+1+(i+1)%sides);}
        }
        void Line(double x,double y,double endX,double endY,double thickness,Color colour)
        {
            var dx=endX-x;var dy=endY-y;var length=Math.Sqrt(dx*dx+dy*dy);if(length<1e-8)return;
            var nx=-dy/length*thickness/2;var ny=dx/length*thickness/2;var start=vertices.Count;
            Vertex(x+nx,y+ny,colour);Vertex(x-nx,y-ny,colour);Vertex(endX-nx,endY-ny,colour);Vertex(endX+nx,endY+ny,colour);
            triangles.Add(start);triangles.Add(start+1);triangles.Add(start+2);triangles.Add(start);triangles.Add(start+2);triangles.Add(start+3);
        }
        void Begin(){vertices.Clear();colours.Clear();triangles.Clear();}
        void Upload(Mesh mesh){mesh.Clear();mesh.SetVertices(vertices);mesh.SetColors(colours);mesh.SetTriangles(triangles,0);mesh.RecalculateBounds();}
        public void Present(ArenaMatch match,double milliseconds,FighterPresentation[] remote=null)
        {
            if(!match.Paused||remote!=null)state.Step(milliseconds,match.Width,match.Height);
            PresentState(match,state,remote,true);
        }
        void PresentState(ArenaMatch match,BloodEffects source,FighterPresentation[] remote,bool rememberPose)
        {
            if(!foreground)return;width=match.Width;height=match.Height;ground=match.Floor;world=3.25/640/match.Scale;
            Begin();foreach(var stain in source.Stains)
            {
                var x=stain.X*width;var y=stain.Y*height;var r=Math.Max(2,stain.Radius*height);
                Ellipse(x,y,r,r*.28,Colour(101,13,25,.86));Ellipse(x-r*.12,y-r*.04,r*.68,r*.16,Colour(177,34,48,.72));
                for(var i=0;i<3;i++)Ellipse(x+(i-1)*r*.9,y+(i%2==1?.35:-.28)*r,r*.17,r*.09,Colour(143,20,34,.8),8);
            }
            Upload(floor);Begin();
            for(var side=0;side<2;side++)
            {
                var f=remote==null?match.Presentation(side):remote[side];var pose=new CombatPose(f.Action,f.Frame,f.Face,f.X,match.Floor-f.Height,match.Scale);
                if(rememberPose)previousPoses[side]=pose;
                BodyWounds(pose,side,source);HeadWounds(match,side,f,source);
            }
            foreach(var p in source.Particles)
            {
                var alpha=Math.Max(0,Math.Min(.95,p.Life/180));Line(p.PreviousX,p.PreviousY,p.X,p.Y,p.Radius*1.5,Colour(99,11,24,alpha));
                Ellipse(p.X,p.Y,p.Radius,p.Radius,p.Bright?Colour(213,72,69,alpha):Colour(169,29,39,alpha),8);
            }
            Upload(foreground);
        }
        void BodyWounds(CombatPose pose,int side,BloodEffects source)
        {
            var capsules=pose.Action.Capsules;if(capsules==null||pose.Frame>=capsules.Length)return;
            foreach(var mark in source.Injuries(side))
            {
                if(mark.Capsule>=capsules[pose.Frame].Length)continue;var cap=capsules[pose.Frame][mark.Capsule];if(cap.Region!=mark.Region)continue;
                var point=pose.Transform(new Point2(cap.A.X+(cap.B.X-cap.A.X)*mark.U,cap.A.Y+(cap.B.Y-cap.A.Y)*mark.U),pose.Action.AnchorY);var r=Math.Max(2,cap.Radius*pose.Scale*.52);
                Ellipse(point.X,point.Y,r,r,Colour(64,51,70,.30+.07*mark.Severity));Ellipse(point.X+r*.18,point.Y,r*.67,r*.67,Colour(148,54,63,.22));
            }
        }
        void HeadWounds(ArenaMatch match,int side,FighterPresentation f,BloodEffects source)
        {
            var level=source.WoundLevel(side);if(level==0)return;var caps=f.Action.Capsules;if(caps==null||f.Frame>=caps.Length)return;
            if(f.Action.Id=="BLOCK"||f.Action.Id=="BLOCK_LOW"||f.Action.Id=="CONTACT_PUSH"||f.Action.Id=="CONTACT_RECEIVE"||f.Action.Id=="THROW_ATTACKER"||f.Action.Id=="THROW_VICTIM")return;
            foreach(var cap in caps[f.Frame])
            {
                if(cap.Region!="head")continue;
                var pose=new CombatPose(f.Action,f.Frame,f.Face,f.X,match.Floor-f.Height,match.Scale);var center=pose.Transform(new Point2((cap.A.X+cap.B.X)/2,(cap.A.Y+cap.B.Y)/2),f.Action.AnchorY);var radius=Math.Max(1,cap.Radius*pose.Scale);
                for(var i=0;i<level;i++)
                {
                    var x=center.X+f.Face*Marks[i,0]*radius;var y=center.Y+Marks[i,1]*radius;var r=radius*Marks[i,2];
                    Ellipse(x,y,r,r,i%2==1?Colour(87,37,51,.28+level*.045):Colour(80,27,44,.28+level*.045));
                    Line(x-radius*.18,y-radius*.07,x+radius*.2,y+radius*.06,Math.Max(1.3,radius*.18),Colour(107,12,23,.85));
                    Line(x-radius*.12,y-radius*.08,x+radius*.13,y,Math.Max(.65,radius*.07),Colour(197,58,60,.65));
                    if(i>1)Line(x,y+radius*.04,x+f.Face*radius*.03,y+radius*(.2+i*.025),Math.Max(.8,radius*.1),Colour(152,27,38,.7));
                }
                return;
            }
        }
        void OnDestroy(){if(foreground)Destroy(foreground);if(floor)Destroy(floor);if(material)Destroy(material);if(frontObject)Destroy(frontObject);if(floorObject)Destroy(floorObject);}
    }
}
