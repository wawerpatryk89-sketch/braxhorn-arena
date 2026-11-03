using System;
using System.IO;
using System.Linq;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    // No credentials; only server match IDs and client-reported results. Access
    // is serialized by ArenaRankTracker. Preserve unreadable/newer files.
    public sealed class PendingArenaResults
    {
        readonly string path;
        JObject data;
        bool blocked,recovered;
        public string Error {get;private set;}
        public PendingArenaResults(string path)
        {
            this.path=path;data=new JObject{["version"]=1,["pending"]=new JArray()};
            if(!File.Exists(path)&&!File.Exists(path+".bak"))return;
            try{data=Read(path);}
            catch(NotSupportedException){blocked=true;Error="Kolejka wyników pochodzi z nowszej wersji gry. Zachowano plik.";}
            catch(Exception e) when(ReadFailure(e))
            {
                try{data=Read(path+".bak");recovered=true;}
                catch(Exception backup) when(ReadFailure(backup)||backup is NotSupportedException){blocked=true;Error="Nie można odczytać kolejki wyników. Zachowano pliki.";}
            }
        }
        static bool ReadFailure(Exception e)=>e is IOException||e is UnauthorizedAccessException||e is JsonException||e is FormatException||e is ArgumentException||e is InvalidCastException;
        static JObject Read(string path)
        {
            if(new FileInfo(path).Length>2*1024*1024)throw new FormatException("Queue too large");
            var value=JObject.Parse(File.ReadAllText(path));if((int?)value["version"]!=1)throw new NotSupportedException();
            if(!(value["pending"] is JArray rows)||rows.Count>3000)throw new FormatException("Invalid queue");
            foreach(var row in rows)
                if(!(row is JObject r)||!Valid((string)r["playerId"],(string)r["action"],r["body"] as JObject))throw new FormatException("Invalid pending result");
            return value;
        }
        static bool Valid(string owner,string action,JObject body)=>!string.IsNullOrEmpty(owner)&&owner.Length<=160&&(action=="finish"||action=="challenge")&&body!=null&&body.ToString(Formatting.None).Length<=8192&&body["match"]?.Type==JTokenType.String&&((string)body["match"]).Length>0&&((string)body["match"]).Length<=160;
        JArray Rows=>(JArray)data["pending"];
        public JObject First(string owner)=>Rows.OfType<JObject>().FirstOrDefault(r=>(string)r["playerId"]==owner) is JObject row?(JObject)row.DeepClone():null;
        public int Count(string owner)=>Rows.Count(r=>(string)r["playerId"]==owner);
        public bool Add(string owner,string action,JObject body)
        {
            if(!Valid(owner,action,body))throw new ArgumentException("Invalid pending result");
            if(Rows.Any(r=>(string)r["playerId"]==owner&&(string)r["action"]==action&&(string)r["body"]["match"]==(string)body["match"]))return true;
            if(Count(owner)>=30||Rows.Count>=3000){Error="Kolejka jest pełna. Odśwież zapis wyników online.";return false;}
            var row=new JObject{["playerId"]=owner,["action"]=action,["body"]=body.DeepClone()};Rows.Add(row);
            if(Encoding.UTF8.GetByteCount(data.ToString(Formatting.None))>2*1024*1024){row.Remove();Error="Kolejka wyników jest pełna. Odśwież zapis online.";return false;}
            Save();return true;
        }
        public void Remove(JObject entry)
        {
            var row=Rows.OfType<JObject>().FirstOrDefault(r=>JToken.DeepEquals(r,entry));if(row==null)return;row.Remove();Save();
        }
        void Save()
        {
            if(blocked)return;
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path)));
                using(var stream=new FileStream(path+".tmp",FileMode.Create,FileAccess.Write,FileShare.None)){var bytes=new UTF8Encoding(false).GetBytes(data.ToString(Formatting.None));stream.Write(bytes,0,bytes.Length);stream.Flush(true);}
                if(File.Exists(path)){File.Copy(path,path+(recovered?".corrupt":".bak"),true);File.Delete(path);}
                File.Move(path+".tmp",path);recovered=false;Error=null;
            }
            catch(Exception e) when(e is IOException||e is UnauthorizedAccessException){Error="Nie można zapisać kolejki na urządzeniu. Oczekujące wyniki pozostają tylko w pamięci.";}
        }
    }
}
