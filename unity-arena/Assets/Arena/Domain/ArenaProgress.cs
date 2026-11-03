using System;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    // Local v2 data contract from arena-features.js. This is never online authority.
    public sealed class ArenaProgress
    {
        static readonly string[] Roster={"BRAX","NYXA","VEXA","KROV","NINA","DANNY","BEAR","DEMON"};
        static readonly string[] Challenges={"evade5","block8","break3","evade10","block20","break6","counter3","push3","hits12","kicks6","combohits5","counter8","cleanwin","hardwin","healthywin","fastwin","cleanwinhard","healthyhard","survival3","survival5","survival10","survivalhard3","survivalhard5","survivalhard10","bossfinal"};
        readonly JObject data;
        readonly Func<long> now;
        public string Name=>(string)data["name"];
        public ArenaProgress(string json=null,Func<long> now=null)
        {
            this.now=now??(()=>DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
            data=string.IsNullOrWhiteSpace(json)?new JObject{["version"]=2}:JObject.Parse(json);
            var version=(int?)data["version"];
            if(version!=1&&version!=2)throw new NotSupportedException("Unsupported local progress version");
            var profiles=new JObject();
            if(version==1)profiles["GRACZ"]=CleanFighters(data["fighters"] as JObject);
            else if(data["profiles"] is JObject source)
                foreach(var p in source.Properties().Take(100)){var name=CleanName(p.Name);if(name.Length>0)profiles[name]=CleanFighters(p.Value as JObject);}
            data["version"]=2;data["name"]=CleanName((string)data["name"]);data["profiles"]=profiles;
            var boards=new JObject();
            if(data["boards"] is JObject existing)
                foreach(var p in existing.Properties())
                {
                    var key=p.Name.Split('|');if(!ValidMode(key[0])||!(p.Value is JArray rows))continue;
                    boards[BoardKey(key[0],key.Length>1?key[1]:null)]=Sort(new JArray(rows.OfType<JObject>().Where(r=>Roster.Contains((string)r["fighter"])&&CleanName((string)r["name"]).Length>0).Select(CleanRow)));
                }
            data["boards"]=boards;
        }
        static int Number(JToken token)
        {var n=token?.Type==JTokenType.Integer||token?.Type==JTokenType.Float?(double)token:0;return double.IsNaN(n)||double.IsInfinity(n)?0:(int)Math.Max(0,Math.Min(1000000,Math.Floor(n)));}
        static double Elapsed(JToken token)
        {double n;return double.TryParse((string)token,System.Globalization.NumberStyles.Float,System.Globalization.CultureInfo.InvariantCulture,out n)&&!double.IsNaN(n)?Math.Max(1,Math.Min(86400000,n)):1;}
        static string Short(string value,int length)=>value?.Substring(0,Math.Min(value.Length,length))??"";
        public static string CleanName(string value)=>Short(Regex.Replace(Regex.Replace((value??"").Normalize(NormalizationForm.FormKC),@"[^\p{L}\p{N} ._-]","" ).Trim(),@"\s+"," "),20);
        static JObject CleanFighters(JObject source)
        {
            var result=source==null?new JObject():(JObject)source.DeepClone();
            foreach(var fighter in Roster)
            {
                var f=result[fighter] as JObject??new JObject();f["wins"]=Number(f["wins"]);f["bestSurvival"]=Number(f["bestSurvival"]);
                f["challenges"]=new JArray((f["challenges"] as JArray??new JArray()).Values<string>().Where(Challenges.Contains).Distinct());result[fighter]=f;
            }
            return result;
        }
        static JToken Rounds(JToken value)=>value is JArray a&&a.Count==2&&a.All(n=>n.Type==JTokenType.Integer&&(int)n>=0&&(int)n<=3)?a.DeepClone():JValue.CreateNull();
        static JObject CleanRow(JObject input)
        {
            var row=(JObject)input.DeepClone();row["name"]=CleanName((string)row["name"]);row["score"]=Number(row["score"]);row["targetWins"]=Number(row["targetWins"]) is int target&&target>0?target:5;
            row["rounds"]=Rounds(row["rounds"]);row["elapsed"]=Elapsed(row["elapsed"]);row["completed"]=(bool?)row["completed"]??false;row["at"]=row["at"]?.Type==JTokenType.Integer||row["at"]?.Type==JTokenType.Float?row["at"]:new JValue(0);row["id"]=Short((string)row["id"],80);return row;
        }
        static bool ValidMode(string mode)=>mode=="fight"||mode=="arcade"||mode=="tournament"||mode=="survival"||Challenges.Any(c=>mode=="challenge:"+c);
        static string BoardKey(string mode,string difficulty)=>mode+"|"+(difficulty=="easy"||difficulty=="hard"?difficulty:"normal");
        static JArray Sort(JArray rows)=>new JArray(rows.OfType<JObject>().OrderByDescending(r=>(bool)r["completed"]).ThenByDescending(r=>(int)r["score"]).ThenBy(r=>(double)r["elapsed"]).ThenBy(r=>(double)r["at"]).Take(5));
        JObject Current
        {
            get{var profiles=(JObject)data["profiles"];var name=Name.Length>0?Name:"GRACZ";if(!(profiles[name] is JObject))profiles[name]=CleanFighters(null);return (JObject)profiles[name];}
        }
        public bool SetName(string value)
        {
            var name=CleanName(value);if(name.Length<2)return false;var profiles=(JObject)data["profiles"];
            if(Name.Length==0&&profiles["GRACZ"]!=null&&profiles[name]==null){profiles[name]=profiles["GRACZ"].DeepClone();profiles.Remove("GRACZ");}
            data["name"]=name;_ = Current;return true;
        }
        public JObject Fighter(string fighter)=>(JObject)(Current[fighter]??Current["BRAX"]).DeepClone();
        public void Win(string fighter){if(Roster.Contains(fighter))Current[fighter]["wins"]=Math.Min(1000000,(int)Current[fighter]["wins"]+1);}
        public void Survival(string fighter,int score){if(Roster.Contains(fighter))Current[fighter]["bestSurvival"]=Math.Max((int)Current[fighter]["bestSurvival"],Number(new JValue(score)));}
        public bool Complete(string fighter,string challenge)
        {
            if(!Roster.Contains(fighter)||!Challenges.Contains(challenge))return false;var list=(JArray)Current[fighter]["challenges"];
            if(list.Values<string>().Contains(challenge))return false;list.Add(challenge);return true;
        }
        public bool Record(string mode,string difficulty,string id,string fighter,int score,double elapsed,bool completed,int targetWins=5,int[] rounds=null)
        {
            if(!ValidMode(mode)||!Roster.Contains(fighter))return false;
            var key=BoardKey(mode,difficulty);var boards=(JObject)data["boards"];var rows=boards[key] as JArray??new JArray();id=Short(id,80);score=Number(new JValue(score));
            var previous=rows.OfType<JObject>().FirstOrDefault(r=>(string)r["id"]==id);
            if(previous!=null){if(score<=(int)previous["score"])return false;previous.Remove();}
            rows.Add(CleanRow(new JObject{["name"]=Name.Length>0?Name:"GRACZ",["fighter"]=fighter,["score"]=score,["targetWins"]=targetWins,["rounds"]=rounds==null?null:new JArray(rounds),["elapsed"]=elapsed,["completed"]=completed,["at"]=now(),["id"]=id}));
            boards[key]=Sort(rows);return true;
        }
        public JArray Top(string mode,string difficulty)=>(JArray)((JArray)data["boards"][BoardKey(mode,difficulty)]??new JArray()).DeepClone();
        public string Serialize()=>data.ToString(Formatting.None);
    }
}
