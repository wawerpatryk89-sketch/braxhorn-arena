using System;
using System.Linq;
using System.Threading.Tasks;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    public sealed partial class ArenaOnlineClient
    {
        static readonly string[] RankModes={"fight","training","arcade","tournament","survival"};
        static readonly string[] RankLevels={"easy","normal","hard"};
        void RequireIdentity(string expected)
        {if(!Authenticated||PlayerId!=expected)throw new ArenaServiceException("Konto zostało zmienione lub wylogowane. Wynik pozostaje przypisany do poprzedniego konta.",401);}
        public async Task<string> StartRankedMatch(string owner,string mode,string level,string fighter,string runId,string challenge,int targetWins)
        {
            if(!RankModes.Contains(mode)||!RankLevels.Contains(level)||!SurvivalRun.Roster.Contains(fighter)||string.IsNullOrEmpty(runId)||runId.Length>90||challenge!=null&&ChallengeCatalog.Find(challenge)==null)throw new ArgumentException("Invalid ranking setup");
            string match=null;
            await Locked(async()=>
            {
                RequireIdentity(owner);var response=await Request("api/arena?action=start",new JObject{["mode"]=mode,["difficulty"]=level,["fighter"]=fighter,["runId"]=runId,["challenge"]=challenge,["targetWins"]=targetWins});ThrowError(response);
                var id=response.data["match"];if(id?.Type!=JTokenType.String||string.IsNullOrWhiteSpace((string)id)||((string)id).Length>160)throw new ArenaServiceException("Serwer nie potwierdził rozpoczęcia walki.");match=(string)id;
            });return match;
        }
        public Task SubmitRankedResult(string owner,string action,JObject data)
        {
            if(action!="finish"&&action!="challenge")throw new ArgumentException("Invalid result action");
            var body=(JObject)data.DeepClone();
            return Locked(async()=>
            {
                RequireIdentity(owner);var response=await Request("api/arena?action="+action,body);ThrowError(response);
                if((bool?)response.data["saved"]!=true)throw new ArenaServiceException("Serwer nie potwierdził zapisania wyniku.");
            });
        }
        public async Task<JObject> ReadRankings(string mode,string level)
        {
            if(string.IsNullOrEmpty(mode)||mode!="multiplayer"&&!RankModes.Contains(mode)&&!(mode.StartsWith("challenge:")&&ChallengeCatalog.Find(mode.Substring(10))!=null)||!RankLevels.Contains(level))throw new ArgumentException("Invalid ranking category");
            JObject board=null;await Locked(async()=>
            {
                var response=await Request("api/arena?action=board&mode="+Uri.EscapeDataString(mode)+"&difficulty="+level,null);ThrowError(response);
                if(!(response.data["rows"] is JArray rows)||rows.Count>100)throw InvalidBoard();
                foreach(var row in rows)ValidateBoardRow(row,mode);
                if(response.data["own"]!=null&&response.data["own"].Type!=JTokenType.Null)ValidateBoardRow(response.data["own"],mode);
                if(rows.Any(r=>(long)r["rank"]>100)||rows.Select(r=>(long)r["rank"]).Distinct().Count()!=rows.Count)throw InvalidBoard();
                board=response.data;
            });return board;
        }
        static ArenaServiceException InvalidBoard()=>new ArenaServiceException("Serwer zwrócił nieprawidłowy ranking lub historię.");
        static bool TextValue(JToken value,int max)=>value?.Type==JTokenType.String&&((string)value).Length<=max;
        static bool Whole(JToken value,long min=0,long max=long.MaxValue)=>value?.Type==JTokenType.Integer&&long.TryParse((string)value,out var number)&&number>=min&&number<=max;
        static bool Flag(JToken value)=>value?.Type==JTokenType.Boolean||Whole(value,0,1);
        static void ValidateBoardRow(JToken row,string mode)
        {
            if(!(row is JObject)||!Whole(row["rank"],1)||!TextValue(row["name"],80)||!TextValue(row["playerId"],160)||!Whole(row["score"])||!Flag(row["own"]))throw InvalidBoard();
            if(mode=="multiplayer")
            {if(!Whole(row["matches"])||!Whole(row["wins"])||!TextValue(row["verification"],40)||(string)row["verification"]!="both_players_confirmed")throw InvalidBoard();}
            else if(!Whole(row["elapsed"])||!Flag(row["completed"])||!TextValue(row["fighter"],30)||!SurvivalRun.Roster.Contains((string)row["fighter"])||row["targetWins"]!=null&&row["targetWins"].Type!=JTokenType.Null&&!Whole(row["targetWins"],1,100))throw InvalidBoard();
        }
        public async Task<JArray> ReadHistory(string owner)
        {
            JArray history=null;await Locked(async()=>
            {
                RequireIdentity(owner);var response=await Request("api/arena?action=history",null);ThrowError(response);
                if(!(response.data["rows"] is JArray rows)||rows.Count>50)throw InvalidBoard();
                foreach(var row in rows)
                {
                    if(!(row is JObject)||!TextValue(row["playerId"],160)||(string)row["playerId"]!=owner||!TextValue(row["name"],80)||!TextValue(row["kind"],20)||!TextValue(row["verification"],40)||!Whole(row["created"],0,253402300799999))throw InvalidBoard();
                    if((string)row["kind"]=="online")
                    {if(!TextValue(row["opponentName"],80)||!TextValue(row["ownRole"],10)||!((string)row["ownRole"]=="host"||(string)row["ownRole"]=="guest")||!(row["score"] is JArray score)||score.Count!=2||score.Any(s=>!Whole(s,0,2))||!new[]{"both_players_confirmed","legacy"}.Contains((string)row["verification"]))throw InvalidBoard();}
                    else if((string)row["kind"]!="local"||!TextValue(row["mode"],90)||!Whole(row["score"])||!TextValue(row["fighter"],30)||!new[]{"verified","client_reported"}.Contains((string)row["verification"]))throw InvalidBoard();
                }
                history=rows;
            });return history;
        }
        public async Task<JObject> ReadServerProgress(string owner)
        {
            JObject progress=null;await Locked(async()=>
            {
                RequireIdentity(owner);var response=await Request("api/arena?action=me",null);ThrowError(response);
                if((bool?)response.data["authenticated"]!=true)throw new ArenaServiceException("Zaloguj się ponownie, aby odczytać postęp konta.",401);
                if(!(response.data["fighters"] is JObject fighters))throw new ArenaServiceException("Serwer zwrócił nieprawidłowy postęp.");
                foreach(var id in SurvivalRun.Roster)
                {
                    var f=fighters[id] as JObject;
                    if(f==null||f["wins"]?.Type!=JTokenType.Integer||f["bestSurvival"]?.Type!=JTokenType.Integer||!long.TryParse((string)f["wins"],out var wins)||wins<0||!long.TryParse((string)f["bestSurvival"],out var survival)||survival<0||!(f["challenges"] is JArray challenges)||challenges.Count>100||challenges.Any(c=>c.Type!=JTokenType.String))
                        throw new ArenaServiceException("Serwer zwrócił nieprawidłowy postęp zawodnika.");
                }
                progress=response.data;
            });return progress;
        }
    }
}
