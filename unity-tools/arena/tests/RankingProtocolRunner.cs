using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Braxhorn.Arena;
using Newtonsoft.Json.Linq;

static class RankingProtocolRunner
{
    static int checks;
    static void Check(bool pass,string message){checks++;if(!pass)throw new Exception("Ranking: "+message);}
    sealed class Handler:HttpMessageHandler
    {
        internal string Identity="a:first";
        internal readonly List<(string action,JObject body)> Calls=new List<(string,JObject)>();
        internal bool NetworkFailure,Reject,RateLimit;
        internal bool ProgressAuthenticated=true,MalformedProgress;
        internal JObject Board,History;
        internal TaskCompletionSource<bool> StartGate;
        internal int matches;
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage r,CancellationToken token)
        {
            if(r.RequestUri.AbsolutePath=="/api/account")return Reply(new JObject{["player"]=new JObject{["id"]=Identity,["name"]="Tester",["authenticated"]=true}});
            var action=r.RequestUri.Query.Substring("?action=".Length);var body=r.Content==null?null:JObject.Parse(await r.Content.ReadAsStringAsync());Calls.Add((action,body));
            if(action.StartsWith("board&"))return Reply(Board??new JObject{["rows"]=new JArray(),["own"]=null});
            if(action=="history")return Reply(History??new JObject{["rows"]=new JArray()});
            if(action=="me")
            {
                var fighters=new JObject(Braxhorn.Arena.Domain.SurvivalRun.Roster.Select(id=>new JProperty(id,new JObject{["wins"]=3,["bestSurvival"]=2,["challenges"]=new JArray("cleanwin")})));
                if(MalformedProgress)fighters["BRAX"]["challenges"]="invalid";
                return Reply(new JObject{["authenticated"]=ProgressAuthenticated,["fighters"]=fighters});
            }
            if(action=="start")
            {
                if(StartGate!=null)await StartGate.Task;
                return Reply(new JObject{["match"]="server-match-"+(++matches),["targetWins"]=3});
            }
            if(NetworkFailure)throw new HttpRequestException();
            if(Reject)return Reply(new JObject{["error"]="Wynik odrzucony"},400);
            if(RateLimit)return Reply(new JObject{["error"]="Poczekaj"},429);
            return Reply(new JObject{["saved"]=true,["verification"]="client_reported"});
        }
        static HttpResponseMessage Reply(JObject data,int status=200)=>new HttpResponseMessage((HttpStatusCode)status){Content=new StringContent(data.ToString())};
    }
    static JObject Body(string match)=>new JObject{["match"]=match,["rounds"]=new JArray(2,0),["elapsed"]=20000};
    internal static void Run()=>RunAsync().GetAwaiter().GetResult();
    static async Task RunAsync()
    {
        var dir=Path.Combine(Path.GetTempPath(),"arena-ranking-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(dir);
        try
        {
            var path=Path.Combine(dir,"queue.json");var queue=new PendingArenaResults(path);
            Check(queue.Add("a:first","finish",Body("first")),"enqueue first result");Check(queue.Add("a:first","finish",Body("first"))&&queue.Count("a:first")==1,"same match/action deduplicated");
            queue.Add("a:second","finish",Body("second"));var restored=new PendingArenaResults(path);Check(restored.Count("a:first")==1&&restored.Count("a:second")==1,"durable queue remains account scoped");
            var copy=restored.First("a:first");copy["body"]["match"]="tampered";Check((string)restored.First("a:first")["body"]["match"]=="first","queue snapshots cannot mutate stored request");
            restored.Remove(restored.First("a:first"));Check(restored.Count("a:first")==0&&restored.Count("a:second")==1,"remove only acknowledged account result");
            File.WriteAllText(path,"broken");restored=new PendingArenaResults(path);Check(restored.Error==null&&restored.Count("a:first")==1,"recover last valid queue backup");restored.Add("a:first","finish",Body("third"));Check(File.ReadAllText(path+".corrupt")=="broken","preserve corrupted primary");
            File.WriteAllText(path,"{\"version\":2}");restored=new PendingArenaResults(path);restored.Add("a:first","finish",Body("fourth"));Check(File.ReadAllText(path)=="{\"version\":2}"&&restored.Error!=null,"future schema never overwritten");
            var limited=new PendingArenaResults(Path.Combine(dir,"limited.json"));for(var i=0;i<30;i++)limited.Add("a:first","finish",Body("m"+i));Check(!limited.Add("a:first","finish",Body("overflow"))&&limited.Count("a:first")==30,"full queue preserves older pending results");
            var handler=new Handler();using var client=new ArenaOnlineClient("https://arena.invalid",handler);await client.RefreshAccount();
            var trackerQueue=new PendingArenaResults(Path.Combine(dir,"tracker.json"));var tracker=new ArenaRankTracker(client,trackerQueue);
            handler.StartGate=new TaskCompletionSource<bool>();tracker.Begin("fight","normal","BRAX","run1","cleanwin",3);tracker.Finish(2,0,2,20000.5,80.5,0);tracker.Challenge("cleanwin",20000.5,1);
            Check(handler.Calls.Count==1&&handler.Calls[0].action=="start","results wait for server-issued match ID");handler.StartGate.SetResult(true);await tracker.Idle;
            Check(handler.Calls.Count==3&&handler.Calls[1].action=="finish"&&handler.Calls[2].action=="challenge","finish is acknowledged before win challenge");
            var finish=handler.Calls[1].body;Check((string)finish["match"]=="server-match-1"&&(int)finish["elapsed"]==20001&&(int)finish["hp"]==81&&(int)finish["roundsPlayed"]==2,"original rounding, round count and server match ID");Check(trackerQueue.Count("a:first")==0,"acknowledged results removed");
            handler.StartGate=null;tracker.Begin("survival","hard","BRAX","series",null,3);await tracker.Idle;handler.NetworkFailure=true;tracker.Finish(1,0,1,9000,50,0);await tracker.Idle;Check(trackerQueue.Count("a:first")==1&&tracker.Status.Contains("oczekuje"),"transient result failure remains pending");
            var firstPending=(string)trackerQueue.First("a:first")["body"]["match"];handler.NetworkFailure=false;tracker.Begin("survival","hard","BRAX","series",null,3);await tracker.Idle;Check(handler.Calls[handler.Calls.Count-2].action=="finish"&&(string)handler.Calls[handler.Calls.Count-2].body["match"]==firstPending&&handler.Calls[handler.Calls.Count-1].action=="start","next bout flushes previous result before start");
            handler.RateLimit=true;tracker.Finish(1,0,1,9000,50,0);await tracker.Idle;Check(trackerQueue.Count("a:first")==1,"429 is retryable");handler.RateLimit=false;tracker.Retry();await tracker.Idle;Check(trackerQueue.Count("a:first")==0,"manual retry settles queued result");
            tracker.Begin("fight","normal","BRAX","rejected",null,3);await tracker.Idle;handler.Reject=true;tracker.Finish(2,0,2,1,100,0);await tracker.Idle;Check(trackerQueue.Count("a:first")==0&&tracker.Status.Contains("odrzucił"),"permanent rejection is surfaced without endless retry");handler.Reject=false;
            tracker.Begin("fight","normal","BRAX","switch",null,3);await tracker.Idle;handler.Identity="a:second";await client.RefreshAccount();var calls=handler.Calls.Count;tracker.Finish(2,0,2,20000,80,0);await tracker.Idle;
            Check(handler.Calls.Count==calls&&trackerQueue.Count("a:first")==1,"account switch never submits old account result under new identity");tracker.Retry();await tracker.Idle;Check(handler.Calls.Count==calls,"new account cannot flush old queue");
            handler.Identity="a:first";await client.RefreshAccount();tracker.Retry();await tracker.Idle;Check(trackerQueue.Count("a:first")==0,"same owner can resume pending result");
            var server=await client.ReadServerProgress("a:first");Check((int)server["fighters"]["BRAX"]["wins"]==3,"read server progress without mutating local wins");
            handler.MalformedProgress=true;try{await client.ReadServerProgress("a:first");throw new Exception("Malformed stats accepted");}catch(ArenaServiceException){Check(true,"malformed server fighter rejected");}handler.MalformedProgress=false;
            handler.ProgressAuthenticated=false;try{await client.ReadServerProgress("a:first");throw new Exception("Expired account accepted");}catch(ArenaServiceException e){Check(e.Status==401,"expired cookie cannot masquerade as authenticated progress");}
            using var guestClient=new ArenaOnlineClient("https://arena.invalid",new Handler());var guest=new ArenaRankTracker(guestClient,new PendingArenaResults(Path.Combine(dir,"guest.json")));guest.Begin("fight","normal","BRAX","guest",null,3);guest.Finish(2,0,2,20000,90,0);await guest.Idle;Check(guest.Status.Contains("gościa")&&!File.Exists(Path.Combine(dir,"guest.json")),"guest fight stays local");
            var row=new JObject{["rank"]=1,["name"]="Tester",["playerId"]="a:first",["score"]=6,["own"]=1,["matches"]=3,["wins"]=2,["verification"]="both_players_confirmed"};
            handler.Board=new JObject{["rows"]=new JArray(row),["own"]=row.DeepClone()};var board=await client.ReadRankings("multiplayer","normal");Check(((JArray)board["rows"]).Count==1,"public PvP board reads confirmed server rows");
            handler.Board["own"]["rank"]=150;board=await client.ReadRankings("multiplayer","normal");Check((int)board["own"]["rank"]==150,"own rank outside top 100 preserved");
            handler.Board["rows"][0]["verification"]="client_reported";try{await client.ReadRankings("multiplayer","normal");throw new Exception("Unconfirmed PvP accepted");}catch(ArenaServiceException){Check(true,"unconfirmed row cannot be presented as public PvP");}
            row.Remove("matches");row.Remove("wins");row.Remove("verification");row["elapsed"]=12345;row["completed"]=1;row["fighter"]="BRAX";row["targetWins"]=7;handler.Board=new JObject{["rows"]=new JArray(row),["own"]=null};board=await client.ReadRankings("arcade","hard");Check((long)board["rows"][0]["elapsed"]==12345,"CPU board retains source numeric flags and time");
            handler.Board["rows"][0]["elapsed"]=-1;try{await client.ReadRankings("arcade","hard");throw new Exception("Bad elapsed accepted");}catch(ArenaServiceException){Check(true,"negative board elapsed rejected");}
            var historyRow=new JObject{["kind"]="online",["playerId"]="a:first",["name"]="Tester",["opponentName"]="Rival",["ownRole"]="guest",["score"]=new JArray(2,1),["created"]=1793664000000L,["verification"]="both_players_confirmed"};
            handler.History=new JObject{["rows"]=new JArray(historyRow)};var history=await client.ReadHistory("a:first");Check((string)history[0]["ownRole"]=="guest"&&(int)history[0]["score"][1]==1,"history retains host/guest score orientation");
            handler.History["rows"][0]["playerId"]="a:second";try{await client.ReadHistory("a:first");throw new Exception("Foreign history accepted");}catch(ArenaServiceException){Check(true,"history from different identity rejected");}
            calls=handler.Calls.Count;try{await client.ReadHistory("a:second");throw new Exception("Wrong account queried");}catch(ArenaServiceException e){Check(e.Status==401&&handler.Calls.Count==calls,"wrong expected owner blocked before history request");}
            handler.History=new JObject{["rows"]=new JArray(Enumerable.Range(0,51).Select(_=>historyRow.DeepClone()))};try{await client.ReadHistory("a:first");throw new Exception("Oversize history accepted");}catch(ArenaServiceException){Check(true,"history bounded to original fifty records");}
            Console.WriteLine("PASS "+checks+" ranking checks: durable per-account queue, backup recovery, source payloads, result ordering, retries, rejection, account switching and guest isolation. No live ranking was written.");
        }
        finally{Directory.Delete(dir,true);}
    }
}
