using System;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    public sealed class ArenaIceServer
    {
        public string[] Urls {get;}
        public string Username {get;}
        public string Credential {get;}
        internal ArenaIceServer(string[] urls,string username=null,string credential=null){Urls=urls;Username=username;Credential=credential;}
    }
    public sealed partial class ArenaOnlineClient
    {
        public static ArenaIceServer[] FallbackIce()=>new[]{new ArenaIceServer(new[]{"stun:stun.l.google.com:19302"}),new ArenaIceServer(new[]{"stun:stun.cloudflare.com:3478"})};
        public async Task<ArenaIceServer[]> ReadIce(DuelLease lease)
        {
            if(lease==null)throw new ArgumentNullException(nameof(lease));ArenaIceServer[] result=null;
            await Locked(async()=>
            {
                var response=await Request("api/rtc",new JObject{["code"]=lease.Code,["token"]=lease.Token},7);ThrowError(response);
                if(!(response.data["iceServers"] is JArray rows)||rows.Count==0||rows.Count>16)throw new ArenaServiceException("Nieprawidłowa konfiguracja połączenia bezpośredniego.");
                result=rows.Select(row=>
                {
                    if(!(row is JObject))throw BadRoom();var list=row["urls"] is JArray urls?urls:new JArray(row["urls"]);
                    if(list.Count==0||list.Count>16||list.Any(u=>!TextValue(u,512)||!System.Text.RegularExpressions.Regex.IsMatch((string)u,@"^(stun|stuns|turn|turns):[^\s]+$")))throw BadRoom();
                    if(row["username"]!=null&&!TextValue(row["username"],2048)||row["credential"]!=null&&!TextValue(row["credential"],4096))throw BadRoom();
                    return new ArenaIceServer(list.Values<string>().ToArray(),(string)row["username"],(string)row["credential"]);
                }).ToArray();
            });return result;
        }
    }
}
