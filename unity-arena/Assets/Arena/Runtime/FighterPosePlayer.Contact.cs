using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Braxhorn.Arena
{
    public sealed partial class FighterPosePlayer
    {
        readonly Transform[,] contactArms=new Transform[2,3];
        void FindContactBones()
        {
            var names=new[]{"Arm","ForeArm","Hand"};
            for(var side=0;side<2;side++)for(var part=0;part<3;part++)contactArms[side,part]=null;
            foreach(var bone in GetComponentsInChildren<Transform>(true))
                for(var side=0;side<2;side++)for(var part=0;part<3;part++)
                    if(bone.name=="mixamorig"+(side==0?"Left":"Right")+names[part])contactArms[side,part]=bone;
        }
        static Point3 Point(Vector3 p)=>new Point3(p.x,p.y,p.z);
        static Vector3 Vector(Point3 p)=>new Vector3((float)p.X,(float)p.Y,(float)p.Z);
        static Vector3 ReadPoint(JToken p)=>new Vector3((float)p[0],(float)p[1],(float)p[2]);
        public void ApplyClinchContact(CombatAction self,CombatAction opponent,double gap,double seconds)
        {
            if((bool?)self.Source["neutralClinch"]!=true||(bool?)self.Source["mutualContact"]!=true)return;
            var shoulders=opponent.Source["contactShoulders"]?[0] as JArray;
            if(shoulders==null||shoulders.Count!=2)return;
            var frame=transform.parent;if(!frame)return;
            var ratio=(float)(opponent.Scale/self.Scale);var weight=(float)ArmContactGeometry.Weight(seconds);
            for(var side=0;side<2;side++)
            {
                var upper=contactArms[side,0];var lower=contactArms[side,1];var hand=contactArms[side,2];if(!upper||!lower||!hand)continue;
                var index=1-side;var p=ReadPoint(shoulders[index])*ratio;
                // Export reflects source Z. Actor transform owns facing and scale.
                var goal=new Vector3((float)gap-p.x-.07f,p.y-.06f,p.z);
                var a=frame.InverseTransformPoint(upper.position);var b=frame.InverseTransformPoint(lower.position);var c=frame.InverseTransformPoint(hand.position);
                var reach=Vector3.Distance(a,b)+Vector3.Distance(b,c)-.008f;
                if(Vector3.Distance(a,goal)>reach)
                {
                    goal.y=Mathf.Clamp(a.y,p.y-.20f,p.y+.08f);
                    var clavicles=opponent.Source["contactClavicles"]?[0] as JArray;
                    if(Vector3.Distance(a,goal)>reach&&clavicles!=null&&clavicles.Count==2)
                    {p=Vector3.Lerp(p,ReadPoint(clavicles[index])*ratio,.75f);goal=new Vector3((float)gap-p.x-.07f,Mathf.Clamp(a.y,p.y-.20f,p.y+.08f),p.z);}
                }
                if(!ArmContactGeometry.Solve(Point(a),Point(b),Point(c),Point(goal),out var elbowGoal,out var handGoal))continue;
                var uq=upper.localRotation;var lq=lower.localRotation;var hq=hand.localRotation;var worldHand=hand.rotation;
                Aim(upper,lower,frame.TransformPoint(Vector(elbowGoal)));
                Aim(lower,hand,frame.TransformPoint(Vector(handGoal)));hand.rotation=worldHand;
                upper.localRotation=Quaternion.Slerp(uq,upper.localRotation,weight);
                lower.localRotation=Quaternion.Slerp(lq,lower.localRotation,weight);
                hand.localRotation=Quaternion.Slerp(hq,hand.localRotation,weight);
            }
        }
        static void Aim(Transform joint,Transform end,Vector3 goal)
        {var from=end.position-joint.position;var to=goal-joint.position;if(from.sqrMagnitude>1e-12f&&to.sqrMagnitude>1e-12f)joint.rotation=Quaternion.FromToRotation(from,to)*joint.rotation;}
    }
}
