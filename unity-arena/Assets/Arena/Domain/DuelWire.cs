using System;
using System.Linq;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    // Bounds from the pinned v271 duel-wire.ts / duel-api.ts. Network data is
    // validated before touching animation, match input or local presentation.
    public static class DuelWire
    {
        public static readonly string[] Buttons={"punch","heavy","kick","kick2","special","grab","evade","left","right"};
        public static readonly string[] Holds={"left","right","down","block","grab","sprint"};
        // Authored paired clips include mixed-case move names, while the v271
        // server permits uppercase wire IDs only. Resolve a unique alias back
        // to the untouched imported action; never substitute a different pose.
        public static CombatAction ResolveAction(CombatConfiguration config,string wireId)
        {
            if(config.Has(wireId))return config[wireId];CombatAction found=null;
            foreach(var a in config.Actions.Values)if(a.Id.ToUpperInvariant()==wireId){if(found!=null)return null;found=a;}return found;
        }
        static bool Number(JToken t)=>t!=null&&(t.Type==JTokenType.Integer||t.Type==JTokenType.Float)&&double.TryParse((string)t,System.Globalization.NumberStyles.Float,System.Globalization.CultureInfo.InvariantCulture,out var n)&&!double.IsNaN(n)&&!double.IsInfinity(n);
        static bool Integer(JToken t,long min=0,long max=9007199254740991)=>Number(t)&&(double)t>=min&&(double)t<=max&&Math.Floor((double)t)==(double)t;
        static bool Text(JToken t,int max)=>t?.Type==JTokenType.String&&((string)t).Length<=max;
        static bool Optional(JToken t)=>t==null||t.Type==JTokenType.Null;
        static bool Bool(JToken t)=>t?.Type==JTokenType.Boolean;
        static bool Range(JToken t,double lo,double hi)=>Number(t)&&(double)t>=lo&&(double)t<=hi;
        public static bool Signal(JToken value)
        {
            if(Optional(value))return true;
            if(!(value is JObject s)||!Text(s["type"],6)||!new[]{"offer","answer"}.Contains((string)s["type"])||!Text(s["sdp"],16000))return false;
            if(s["candidates"]==null)return true;
            return s["candidates"] is JArray list&&list.Count<=24&&list.All(c=>c is JObject&&Text(c["candidate"],2000)&&(Optional(c["sdpMid"])||Text(c["sdpMid"],256))&&(Optional(c["sdpMLineIndex"])||Integer(c["sdpMLineIndex"])));
        }
        static bool Extras(JToken p)
        {
            if(!(p is JObject)||!Signal(p["signal"]))return false;
            var voice=p["voice"];
            if(!Optional(voice)&&( !(voice is JObject)||!Optional(voice["consent"])&&(!Text(voice["consent"],7)||!new[]{"yes","no","pending"}.Contains((string)voice["consent"]))||!Signal(voice["description"])))return false;
            if(p["sounds"]!=null&&(!(p["sounds"] is JArray sounds)||sounds.Count>64||sounds.Any(s=>!(s is JObject)||!Integer(s["id"])||!Text(s["key"],80)||!Number(s["volume"])||!Number(s["pitch"]))))return false;
            var b=p["blood"];if(Optional(b))return true;
            if(!(b is JObject))return false;
            if(!Optional(b["size"])&&(!(b["size"] is JObject)||!Number(b["size"]["width"])||(double)b["size"]["width"]<=0||!Number(b["size"]["height"])||(double)b["size"]["height"]<=0))return false;
            return b["stains"] is JArray stains&&stains.Count<=100&&stains.All(s=>s is JObject&&Number(s["x"])&&Number(s["y"])&&Range(s["r"],0,double.MaxValue))
                &&b["particles"] is JArray particles&&particles.Count<=96&&particles.All(s=>s is JObject&&new[]{"x","y","px","py","vx","vy","life","total","floor","r","gravity"}.All(k=>Number(s[k]))&&(double)s["r"]>=0&&Text(s["color"],80))
                &&b["marks"] is JArray marks&&marks.Count==2&&marks.All(Number)
                &&b["damageMarks"] is JArray damage&&damage.Count==2&&damage.All(list=>list is JArray rows&&rows.Count<=6&&rows.All(m=>m is JObject&&Integer(m["cap"])&&Number(m["u"])&&Number(m["severity"])&&Text(m["region"],4)&&new[]{"head","body","leg"}.Contains((string)m["region"])));
        }
        public static bool Input(JToken p)
        {
            return Extras(p)&&p["held"] is JObject held&&held.Properties().All(v=>Holds.Contains(v.Name)&&Bool(v.Value))
                &&(p["visible"]==null||Bool(p["visible"]))&&(p["inputSeq"]==null||Integer(p["inputSeq"]))
                &&p["events"] is JArray events&&events.Count<=64&&events.All(e=>e is JObject&&Integer(e["id"])&&Text(e["kind"],7)&&Buttons.Contains((string)e["kind"])&&(e["grabHeld"]==null||Bool(e["grabHeld"]))&&(e["doubleTap"]==null||Bool(e["doubleTap"])));
        }
        public static bool Snapshot(JToken p)
        {
            if(!Extras(p)||!Integer(p["ack"])||!Integer(p["snapshotId"],1)||!(p["actors"] is JArray actors)||actors.Count!=2)return false;
            if(actors.Any(a=>!(a is JObject)||!Range(a["x"],0,100)||!Range(a["y"],-1000,1000)||!Number(a["face"])||Math.Abs((double)a["face"])!=1||!Range(a["hp"],0,100)||!Range(a["en"],0,100)||!Range(a["frame"],0,10000)||(double)a["frame"]>=10000||!Text(a["a"],64)||!Regex.IsMatch((string)a["a"],"^[A-Z_0-9]{1,64}$")))return false;
            var state=p["state"];
            return state is JObject&&Integer(state["round"],1,3)&&Range(state["t"],0,60)&&state["wins"] is JArray wins&&wins.Count==2&&wins.All(w=>Integer(w,0,2))&&wins.Sum(w=>(double)w)<=(double)state["round"];
        }
        // The backend deliberately validates only its storage contract. The
        // renderer additionally checks every optional value it actually uses.
        public static bool Renderable(JToken p,CombatConfiguration[] configurations)
        {
            if(configurations==null||configurations.Length!=2||!Snapshot(p)||!Range(p["state"]["simTime"],0,9007199254740991)||!Range(p["state"]["poseClock"],0,9007199254740991))return false;
            foreach(var k in new[]{"preFight","ended","matchOver","paused"})if(!Bool(p["state"][k]))return false;
            foreach(var k in new[]{"freeze","neutralClinch","packagePair","comboContactHold"})if(p[k]!=null&&!Bool(p[k]))return false;
            if(p["worldHeight"]!=null&&(!Range(p["worldHeight"],0,200)||(double)p["worldHeight"]<=0))return false;
            for(var i=0;i<2;i++)
            {
                var a=p["actors"][i];var c=configurations[i];var action=c==null?null:ResolveAction(c,(string)a["a"]);if(action==null||(double)a["frame"]>=action.Durations.Length+1)return false;
                foreach(var k in new[]{"locked","controlBlocked","poseLoop","sprint"})if(a[k]!=null&&!Bool(a[k]))return false;
                if(a["actionId"]!=null&&!Integer(a["actionId"])||a["comboUses"]!=null&&!Integer(a["comboUses"],0,2))return false;
                if(a["comboAirY"]!=null&&(!Range(a["comboAirY"],0,1)||(double)a["comboAirY"]>=1)||!Optional(a["poseRate"])&&!Range(a["poseRate"],0,20)||a["poseClockRate"]!=null&&!Range(a["poseClockRate"],0,4))return false;
                var motion=a["strikeMotion"];if(!Optional(motion)&&(!(motion is JObject)||!Range(motion["weight"],0,1)||!Range(motion["clock"],0,9007199254740991)||!Bool(motion["run"])))return false;
            }
            return true;
        }
    }
}
