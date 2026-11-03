using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Braxhorn.Arena;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

static class AdventureProtocolRunner
{
    static int checks;
    static void Check(bool value,string message){checks++;if(!value)throw new Exception("Adventure protocol: "+message);}
    sealed class Handler:HttpMessageHandler
    {
        internal readonly List<JObject> Calls=new List<JObject>();
        internal TaskCompletionSource<bool> StartGate;
        internal string FailAction;
        internal bool WrongReceipt;
        internal int Next,Score;
        internal JObject Board;
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken token)
        {
            if(request.Method==HttpMethod.Get)return Reply(Board??new JObject{["runs"]=new JArray(),["verification"]="sequence-and-score"});
            var b=JObject.Parse(await request.Content.ReadAsStringAsync());Calls.Add(b);var action=(string)b["action"];
            if(action==FailAction)return Reply(new JObject{["error"]="Unavailable"},503);
            if(action=="start")
            {if(StartGate!=null)await StartGate.Task;Next=Score=0;return Reply(new JObject{["id"]="test-run",["token"]="test-capability",["score"]=0},201);}
            Check((string)b["id"]=="test-run"&&(string)b["token"]=="test-capability","write carries server capability");
            var status="explore";
            if(action=="encounter")status="combat";
            else if(action=="result")
            {if((double)b["hp"]>0){Score+=(Next==5?1000:200)+((double)b["hp"]==100?100:0);Next++;}else status="dead";}
            else if(action=="complete"){Score+=500;status="complete";}
            return Reply(new JObject{["next"]=Next,["score"]=WrongReceipt?Score+1:Score,["status"]=status});
        }
        static HttpResponseMessage Reply(JObject data,int status=200)=>new HttpResponseMessage((HttpStatusCode)status){Content=new StringContent(data.ToString())};
    }
    static AdventureProgressEvent Encounter(int index,int score)=>new AdventureProgressEvent("encounter",index,index,score,"combat",100,70,10000+index*10000);
    static AdventureProgressEvent Result(int index,int score,double hp=100)=>new AdventureProgressEvent("result",index,index+1,score,"explore",hp,0,15000.5+index*10000);
    internal static void Run()=>RunAsync().GetAwaiter().GetResult();
    static async Task RunAsync()
    {
        checks=0;var h=new Handler{StartGate=new TaskCompletionSource<bool>()};using var client=new ArenaOnlineClient("https://arena.invalid",h);var tracker=new ArenaAdventureTracker(client);
        tracker.Begin("city-01","normal","BRAX","Tester");tracker.Submit(Encounter(0,0));tracker.Submit(Result(0,300));
        Check(h.Calls.Count==1,"encounter waits for start capability");h.StartGate.SetResult(true);await tracker.Idle;h.StartGate=null;
        Check(h.Calls.Select(c=>(string)c["action"]).SequenceEqual(new[]{"start","encounter","result"}),"source event order preserved");
        Check((int)h.Calls[2]["elapsed"]==15001,"source JS time rounding retained");
        for(var i=1;i<6;i++)
        {var before=h.Score;tracker.Submit(Encounter(i,before));tracker.Submit(Result(i,before+(i==5?1100:300)));await tracker.Idle;}
        tracker.Submit(new AdventureProgressEvent("complete",6,6,3100,"complete",100,0,80000));await tracker.Idle;
        Check(tracker.Status.Contains("3100")&&h.Next==6&&h.Score==3100,"full server receipt required before completed rank message");
        var count=h.Calls.Count;tracker.Submit(new AdventureProgressEvent("complete",6,6,3100,"complete",100,0,80000));await tracker.Idle;Check(h.Calls.Count==count,"completed run cannot double-submit");
        tracker.Begin("forest-01","hard","NYXA","Tester");await tracker.Idle;h.FailAction="encounter";tracker.Submit(Encounter(0,0));tracker.Submit(Result(0,300));await tracker.Idle;
        Check((string)h.Calls.Last()["action"]=="encounter"&&tracker.Status.Contains("poza rankingiem"),"failed encounter prevents later results without stopping game");
        h.FailAction=null;h.WrongReceipt=true;tracker.Begin("city-01","easy","BRAX","Tester");await tracker.Idle;tracker.Submit(Encounter(0,0));await tracker.Idle;Check(tracker.Status.Contains("Nie potwierdzono"),"mismatched receipt never presented as saved");h.WrongReceipt=false;
        h.StartGate=new TaskCompletionSource<bool>();tracker.Begin("city-01","normal","BRAX","Old");tracker.Submit(Encounter(0,0));tracker.Cancel();count=h.Calls.Count;h.StartGate.SetResult(true);await tracker.Idle;h.StartGate=null;
        Check(h.Calls.Count==count&&tracker.Status=="Przejście lokalne.","leaving run drops queued writes and stale completion status");
        tracker.Begin("city-01","normal","BRAX","New");await tracker.Idle;tracker.Submit(Encounter(0,0));tracker.Submit(Result(0,200,99.12349));await tracker.Idle;Check((double)h.Calls.Last()["hp"]==99.123,"HP is captured before native reward healing, rounded to thousandths");
        var board=await client.ReadAdventureBoard("city-01","normal");Check(board.Count==0,"empty original adventure board valid");
        h.Board=new JObject{["runs"]=new JArray(new JObject{["name"]="Tester",["fighter"]="BRAX",["score"]=3100,["elapsed"]=80000,["route"]="city-01",["difficulty"]="normal"}),["verification"]="sequence-and-score"};board=await client.ReadAdventureBoard("city-01","normal");Check((int)board[0]["score"]==3100,"read original route leaderboard");
        h.Board["runs"][0]["route"]="forest-01";try{await client.ReadAdventureBoard("city-01","normal");throw new Exception("Wrong route accepted");}catch(ArenaServiceException){Check(true,"wrong-route board rejected");}
        Console.WriteLine("PASS "+checks+" adventure protocol checks: start capability, ordered encounters/results, receipts, completion, cancellation, failure and board scope. No live run submitted.");
    }
}
