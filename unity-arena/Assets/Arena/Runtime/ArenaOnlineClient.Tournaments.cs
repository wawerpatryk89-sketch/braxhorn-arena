using System;
using System.Linq;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    public sealed partial class ArenaOnlineClient
    {
        public bool TournamentOwner {get;private set;}
        static string TournamentCode(string value)
        {value=value?.Trim().ToUpperInvariant();if(!RoomCode(value))throw new ArgumentException("Kod turnieju ma 8 znaków: 0–9, A–F.");return value;}
        static ArenaServiceException BadTournament()=>new ArenaServiceException("Serwer zwrócił nieprawidłowe dane turnieju.");
        static bool TxString(JToken value,int max=160)=>TextValue(value,max)&&!string.IsNullOrWhiteSpace((string)value);
        static bool TxOptional(JToken value,int max=160)=>value==null||value.Type==JTokenType.Null||TextValue(value,max);
        static bool TxStatus(JToken value,params string[] states)=>value?.Type==JTokenType.String&&states.Contains((string)value);
        static void TournamentProfile(JObject data)
        {if(!(data["profile"] is JObject p)||!TextValue(p["name"],80)||p["authenticated"]?.Type!=JTokenType.Boolean||p["isOwner"]?.Type!=JTokenType.Boolean||!Whole(data["now"]))throw BadTournament();}
        static void TournamentSummary(JToken t)
        {
            if(!(t is JObject)||!TextValue(t["code"],8)||!RoomCode((string)t["code"])||!TxString(t["name"],60)||!TxStatus(t["status"],"registration","running","completed","cancelled")||!Whole(t["capacity"],4,10)||!Whole(t["startAt"]))throw BadTournament();
        }
        static void ValidateTournament(JObject d,string code=null,bool detail=true)
        {
            TournamentProfile(d);
            if(!detail)
            {
                if(!(d["tournaments"] is JArray all)||all.Count>50||!(d["upcoming"] is JArray upcoming)||upcoming.Count>8)throw BadTournament();
                foreach(var summary in all){TournamentSummary(summary);if(!Whole(summary["count"],0,10)||summary["own"]?.Type!=JTokenType.Boolean||summary["organizer"]?.Type!=JTokenType.Boolean)throw BadTournament();}
                foreach(var f in upcoming)if(!(f is JObject)||!TxString(f["id"])||!Whole(f["scheduled_at"])||!TextValue(f["code"],8)||!RoomCode((string)f["code"])||!TxString(f["name"],60)||!TxOptional(f["opponent_name"],80))throw BadTournament();
                return;
            }
            var t=d["tournament"];TournamentSummary(t);
            if(code!=null&&(string)t["code"]!=code||!TxString(t["id"])||!Whole(t["revision"])||!Whole(t["intervalMinutes"],0,60)||!new[]{0,15,30,60}.Contains((int)t["intervalMinutes"])||!TxString(t["timezone"],80)||!TxOptional(t["champion"])||d["organizer"]?.Type!=JTokenType.Boolean||!TxOptional(d["ownEntry"]))throw BadTournament();
            if(!(d["entries"] is JArray entries)||entries.Count>10||!(d["fights"] is JArray fights)||fights.Count>15||!(d["history"] is JArray history)||history.Count>30)throw BadTournament();
            foreach(var e in entries)if(!(e is JObject)||!TxString(e["id"])||!TextValue(e["name"],80)||!TxString(e["fighter"],20)||!SurvivalRun.Roster.Contains((string)e["fighter"])||!Whole(e["seed"],0,16)||e["own"]?.Type!=JTokenType.Boolean||e["pending"]?.Type!=JTokenType.Boolean||!TxOptional(e["inviteCode"],16))throw BadTournament();
            var ids=entries.Select(e=>(string)e["id"]).ToArray();if(ids.Distinct().Count()!=ids.Length||!TxOptional(t["champion"])||t["champion"]?.Type==JTokenType.String&&!ids.Contains((string)t["champion"])||d["ownEntry"]?.Type==JTokenType.String&&!ids.Contains((string)d["ownEntry"]))throw BadTournament();
            foreach(var f in fights)
            {
                if(!(f is JObject)||!TxString(f["id"])||!Whole(f["round"],0,3)||!Whole(f["position"],0,7)||!Whole(f["attempt"],1,10000)||!Whole(f["scheduledAt"])||!TxStatus(f["status"],"scheduled","waiting","playing","review","finished","bye")||!TxOptional(f["code"],8)||!TxOptional(f["score"],30)||!TxOptional(f["reason"],300))throw BadTournament();
                foreach(var side in new[]{"a","b","winner"})if(!TxOptional(f[side])||f[side]?.Type==JTokenType.String&&!ids.Contains((string)f[side]))throw BadTournament();
                if(f["winner"]?.Type==JTokenType.String&&(string)f["winner"]!=(string)f["a"]&&(string)f["winner"]!=(string)f["b"])throw BadTournament();
                if(f["code"]?.Type==JTokenType.String&&!RoomCode((string)f["code"]))throw BadTournament();
            }
            if(fights.Select(f=>(string)f["id"]).Distinct().Count()!=fights.Count)throw BadTournament();
            foreach(var h in history)if(!(h is JObject)||!TxString(h["action"],40)||!TextValue(h["detail"],600)||!Whole(h["created"]))throw BadTournament();
        }
        public async System.Threading.Tasks.Task<JObject> ReadTournaments(string code=null)
        {
            if(code!=null)code=TournamentCode(code);JObject data=null;
            await Locked(async()=>{var r=await Request("api/tournaments"+(code==null?"":"?code="+code),null,12);ThrowError(r);ValidateTournament(r.data,code,code!=null);data=r.data;TournamentOwner=(bool)data["profile"]["isOwner"];});return data;
        }
        public async System.Threading.Tasks.Task<JObject> ChangeTournament(string action,string code,JObject values=null)
        {
            var participant=new[]{"register","withdraw","claim"}.Contains(action);
            if(!participant&&!new[]{"create","draw","schedule","restart","resolve","cancel","delete","addParticipant","removeParticipant"}.Contains(action))throw new ArgumentException("Nieznane działanie turnieju.");
            var body=new JObject{["action"]=action};if(action!="create"&&action!="claim"){code=TournamentCode(code);body["code"]=code;}
            var allowed=action switch{"register"=>new[]{"fighter"},"claim"=>new[]{"inviteCode"},"create"=>new[]{"name","capacity","startAt","intervalMinutes","timezone"},"schedule"=>new[]{"startAt","fight","reason"},"restart"=>new[]{"fight","startAt","reason"},"resolve"=>new[]{"fight","winner","reason"},"addParticipant"=>new[]{"name","fighter"},"removeParticipant"=>new[]{"entry"},_=>Array.Empty<string>()};
            if(values!=null)foreach(var p in values.Properties()){if(!allowed.Contains(p.Name))throw new ArgumentException("Niedozwolone pole turnieju.");body[p.Name]=p.Value.DeepClone();}
            if(action=="register"||action=="addParticipant")if(!TxString(body["fighter"],20)||!SurvivalRun.Roster.Contains((string)body["fighter"]))throw new ArgumentException("Wybierz zawodnika.");
            if(action=="claim"){var invite=((string)body["inviteCode"]??"").Replace(" ","").Replace("-","").ToUpperInvariant();if(!System.Text.RegularExpressions.Regex.IsMatch(invite,"^[A-F0-9]{16}$"))throw new ArgumentException("Osobisty kod ma 16 znaków.");body["inviteCode"]=invite;}
            if(System.Text.Encoding.UTF8.GetByteCount(body.ToString())>4096)throw new ArgumentException("Za duże dane turnieju.");
            var owner=PlayerId;JObject data=null;
            await Locked(async()=>
            {
                RequireIdentity(owner);if(!participant&&!TournamentOwner)throw new ArenaServiceException("Zaloguj się na konto organizatora.",403);
                var r=await Request("api/tournaments",body,12);ThrowError(r);data=r.data;
                if(action=="delete"){if(data["deleted"]?.Type!=JTokenType.Boolean||!(bool)data["deleted"])throw BadTournament();}
                else {ValidateTournament(data,action=="create"||action=="claim"?null:code);TournamentOwner=(bool)data["profile"]["isOwner"];}
            });return data;
        }
        public async System.Threading.Tasks.Task<DuelLease> EnterTournament(string code,string fight,string preferredOutfit)
        {
            code=TournamentCode(code);if(string.IsNullOrWhiteSpace(fight)||fight.Length>160)throw new ArgumentException("Nieprawidłowa walka.");
            var owner=PlayerId;DuelLease lease=null;
            await Locked(async()=>
            {
                RequireIdentity(owner);
                var detail=await Request("api/tournaments?code="+code,null,12);ThrowError(detail);ValidateTournament(detail.data,code);
                var d=detail.data;var mine=(string)d["ownEntry"];var f=((JArray)d["fights"]).FirstOrDefault(x=>(string)x["id"]==fight);
                if(mine==null||f==null||!new[]{(string)f["a"],(string)f["b"]}.Contains(mine))throw new ArenaServiceException("Ta walka jest przeznaczona dla innej pary zawodników.",403);
                var fighter=(string)((JArray)d["entries"]).First(e=>(string)e["id"]==mine)["fighter"];
                var outfit=Cosmetic(fighter,preferredOutfit)&&(preferredOutfit==fighter||Owns(preferredOutfit))?preferredOutfit:fighter;
                var response=await Request("api/tournaments",new JObject{["action"]="enter",["code"]=code,["fight"]=fight},12);ThrowError(response);var r=response.data;
                var role=(string)f["a"]==mine?"host":"guest";
                if(!TextValue(r["code"],8)||!RoomCode((string)r["code"])||(string)r["tournamentCode"]!=code||(string)r["tournamentFight"]!=fight||(string)r["role"]!=role||!TxString(r["token"],100)||!Whole(r["scheduledAt"]))throw BadTournament();
                lease=new DuelLease((string)r["code"],(string)r["token"],role,fighter,outfit);
            });return lease;
        }
    }
}
