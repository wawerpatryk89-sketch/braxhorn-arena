using System;
using System.Linq;
using System.Threading.Tasks;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    public sealed class AdventureLease
    {
        internal readonly string Id,Token;
        internal AdventureLease(string id,string token){Id=id;Token=token;}
        // Deliberately no ToString/serialization: the source run token is an
        // in-memory capability, never a profile field or a logged identifier.
    }
    public sealed partial class ArenaOnlineClient
    {
        static readonly string[] AdventureRoutes={"city-01","industrial-01","underground-01","airport-01","forest-01"};
        public async Task<AdventureLease> StartAdventure(string route,string level,string fighter,string name)
        {
            if(!AdventureRoutes.Contains(route)||!RankLevels.Contains(level)||!SurvivalRun.Roster.Contains(fighter))throw new ArgumentException("Invalid adventure setup");
            AdventureLease run=null;await Locked(async()=>
            {
                var response=await Request("api/adventure/runs",new JObject{["action"]="start",["route"]=route,["difficulty"]=level,["fighter"]=fighter,["name"]=name});ThrowError(response);
                var data=response.data;if(!TextValue(data["id"],160)||string.IsNullOrWhiteSpace((string)data["id"])||!TextValue(data["token"],100)||string.IsNullOrWhiteSpace((string)data["token"])||!Whole(data["score"],0,0))throw new ArenaServiceException("Serwer nie potwierdził rozpoczęcia wyprawy.");
                run=new AdventureLease((string)data["id"],(string)data["token"]);
            });return run;
        }
        public Task SubmitAdventure(AdventureLease run,AdventureProgressEvent value)
        {
            if(run==null||!new[]{"encounter","result","heal","complete"}.Contains(value.Action)||value.Index<0||value.Index>6)throw new ArgumentException("Invalid adventure event");
            var body=new JObject{["action"]=value.Action,["id"]=run.Id,["token"]=run.Token};
            if(value.Action=="encounter"||value.Action=="result")body["index"]=value.Index;
            if(value.Action=="result"){body["hp"]=Math.Floor(value.Hp*1000+.5)/1000;body["enemyHp"]=value.EnemyHp;}
            if(value.Action=="result"||value.Action=="complete")body["elapsed"]=Math.Floor(value.ElapsedMs+.5);
            return Locked(async()=>
            {
                var response=await Request("api/adventure/runs",body);ThrowError(response);var data=response.data;
                if(!Whole(data["score"],0,3100)||!Whole(data["next"],0,6)||!TextValue(data["status"],20)||(int)data["score"]!=value.Score||(int)data["next"]!=value.Next||(string)data["status"]!=value.Status)
                    throw new ArenaServiceException("Serwer nie potwierdził kolejności lub wyniku wyprawy.");
            });
        }
        public async Task<JArray> ReadAdventureBoard(string route,string level)
        {
            if(!AdventureRoutes.Contains(route)||!RankLevels.Contains(level))throw new ArgumentException("Invalid adventure ranking");
            JArray runs=null;await Locked(async()=>
            {
                var response=await Request("api/adventure/runs?route="+route+"&difficulty="+level,null);ThrowError(response);var data=response.data;
                if(!(data["runs"] is JArray rows)||rows.Count>25||!TextValue(data["verification"],40)||(string)data["verification"]!="sequence-and-score")throw InvalidBoard();
                foreach(var row in rows)
                    if(!(row is JObject)||!TextValue(row["name"],80)||!TextValue(row["fighter"],30)||!SurvivalRun.Roster.Contains((string)row["fighter"])||!Whole(row["score"],0,3100)||!Whole(row["elapsed"],0,21600000)||!TextValue(row["route"],30)||!TextValue(row["difficulty"],10)||(string)row["route"]!=route||(string)row["difficulty"]!=level)throw InvalidBoard();
                runs=rows;
            });return runs;
        }
    }
}
