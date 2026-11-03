using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    public sealed class DuelLease
    {
        public string Code {get;}
        public string Role {get;}
        public string Fighter {get;}
        public string Outfit {get;}
        internal string Token {get;}
        internal DuelLease(string code,string token,string role,string fighter,string outfit){Code=code;Token=token;Role=role;Fighter=fighter;Outfit=outfit;}
    }
    public sealed partial class ArenaOnlineClient
    {
        static readonly string[] DuelArenas={"rooftop-city","jungle","volcano","temple","himalaya","beach","carrier","reactor","savanna","brooklyn","dragon","aquarium","snow","underground","metro","harbor","nocny-targ","foundry","storm-complex","octagon","winter-station"};
        static bool Cosmetic(string fighter,JToken outfit)=>TextValue(outfit,40)&&((string)outfit==fighter||OutfitIds.Contains((string)outfit)&&((string)outfit).StartsWith(fighter+"_",StringComparison.Ordinal));
        static bool RoomCode(string value)=>value!=null&&Regex.IsMatch(value,"^[A-F0-9]{8}$");
        public Task<DuelLease> CreateDuel(string fighter,string outfit,string arena)=>EnterDuel("create",null,fighter,outfit,arena);
        public Task<DuelLease> JoinDuel(string code,string fighter,string outfit)=>EnterDuel("join",code?.Trim().ToUpperInvariant(),fighter,outfit,null);
        async Task<DuelLease> EnterDuel(string action,string code,string fighter,string outfit,string arena)
        {
            if(!SurvivalRun.Roster.Contains(fighter)||!Cosmetic(fighter,outfit)||action=="create"&&!DuelArenas.Contains(arena)||action=="join"&&!RoomCode(code))throw new ArgumentException("Invalid duel setup");
            DuelLease lease=null;await Locked(async()=>
            {
                if(outfit!=fighter&&!Owns(outfit))throw new ArenaServiceException("Ten strój nie należy do aktualnego konta.",403);
                var body=new JObject{["action"]=action,["fighter"]=fighter,["outfit"]=outfit};if(code!=null)body["code"]=code;if(arena!=null)body["arena"]=arena;
                var response=await Request("api/duel",body,5);ThrowError(response);var data=response.data;var role=action=="create"?"host":"guest";
                if(!TextValue(data["code"],8)||!RoomCode((string)data["code"])||code!=null&&(string)data["code"]!=code||!TextValue(data["token"],100)||string.IsNullOrWhiteSpace((string)data["token"])||!TextValue(data["role"],5)||(string)data["role"]!=role)throw new ArenaServiceException("Serwer nie potwierdził pokoju walki.");
                lease=new DuelLease((string)data["code"],(string)data["token"],role,fighter,outfit);
            });return lease;
        }
        static JObject DuelBody(DuelLease lease,string action)
        {if(lease==null)throw new ArgumentNullException(nameof(lease));return new JObject{["action"]=action,["code"]=lease.Code,["token"]=lease.Token,["role"]=lease.Role};}
        public async Task<JObject> SyncDuel(DuelLease lease,bool ready,long sequence,string outfit,JObject packet=null)
        {
            if(lease==null)throw new ArgumentNullException(nameof(lease));
            if(outfit!=lease.Outfit)throw new ArgumentException("Duel outfit cannot change during a room");
            if(sequence<0||sequence>9007199254740991||packet!=null&&!(lease.Role=="host"?DuelWire.Snapshot(packet):DuelWire.Input(packet)))throw new ArgumentException("Invalid duel packet");
            var body=DuelBody(lease,"sync");body["ready"]=ready;body["seq"]=sequence;body["outfit"]=outfit;
            if(packet!=null)body[lease.Role=="host"?"snapshot":"input"]=packet.DeepClone();
            JObject room=null;await Locked(async()=>
            {
                var response=await Request("api/duel",body,5);ThrowError(response);var r=response.data;
                if(!TextValue(r["code"],8)||(string)r["code"]!=lease.Code||!TextValue(r["status"],10)||!new[]{"waiting","playing","closed"}.Contains((string)r["status"])||!Whole(r["seq"],0,9007199254740991)||!Whole(r["now"])||!Whole(r["peerSeen"]))throw BadRoom();
                if(r["peerReady"]?.Type!=JTokenType.Boolean||r["cosmeticsReady"]?.Type!=JTokenType.Boolean||!Whole(r["scheduledAt"])||!TextValue(r["resultStatus"],30)||!new[]{"","pending","confirmed","disputed"}.Contains((string)r["resultStatus"]))throw BadRoom();
                if(!TextValue(r["hostFighter"],20)||!SurvivalRun.Roster.Contains((string)r["hostFighter"])||!Cosmetic((string)r["hostFighter"],r["hostOutfit"])||!TextValue(r["hostName"],80)||!TextValue(r["arena"],40)||!DuelArenas.Contains((string)r["arena"]))throw BadRoom();
                if(r["guestFighter"]!=null&&r["guestFighter"].Type!=JTokenType.Null&&(!TextValue(r["guestFighter"],20)||!SurvivalRun.Roster.Contains((string)r["guestFighter"])||!Cosmetic((string)r["guestFighter"],r["guestOutfit"])||!TextValue(r["guestName"],80)))throw BadRoom();
                if((string)r[lease.Role+"Fighter"]!=lease.Fighter||(string)r[lease.Role+"Outfit"]!=lease.Outfit||(string)r["status"]=="playing"&&r["guestFighter"]?.Type!=JTokenType.String)throw BadRoom();
                if(r["snapshot"]!=null&&r["snapshot"].Type!=JTokenType.Null&&!DuelWire.Snapshot(r["snapshot"])||r["input"]!=null&&r["input"].Type!=JTokenType.Null&&!DuelWire.Input(r["input"]))throw BadRoom();
                room=r;
            });return room;
        }
        static ArenaServiceException BadRoom()=>new ArenaServiceException("Serwer zwrócił nieprawidłowe dane pokoju.");
        public Task LeaveDuel(DuelLease lease)=>DuelAction(lease,"leave");
        public Task<JObject> DisputeDuel(DuelLease lease)=>DuelAction(lease,"review");
        // Call only after the local user presses the explicit score-confirmation
        // button; a terminal snapshot alone never authorizes this write.
        public Task<JObject> ConfirmDuel(DuelLease lease,int hostWins,int guestWins)
        {
            if(hostWins<0||guestWins<0||hostWins>2||guestWins>2||hostWins+guestWins>3)throw new ArgumentException("Invalid duel score");
            return DuelAction(lease,"result",new JObject{["score"]=new JArray(hostWins,guestWins),["confirmed"]=true});
        }
        async Task<JObject> DuelAction(DuelLease lease,string action,JObject values=null)
        {
            var body=DuelBody(lease,action);if(values!=null)foreach(var p in values.Properties())body[p.Name]=p.Value.DeepClone();JObject result=null;
            await Locked(async()=>{var response=await Request("api/duel",body,5);ThrowError(response);result=response.data;
                if(action!="leave"&&(!TextValue(result["resultStatus"],30)||!new[]{"pending","confirmed","disputed","confirmation_required"}.Contains((string)result["resultStatus"])))throw BadRoom();
                if(action=="result"&&result["score"]!=null&&!JToken.DeepEquals(result["score"],values["score"]))throw BadRoom();
            });return result;
        }
    }
}
