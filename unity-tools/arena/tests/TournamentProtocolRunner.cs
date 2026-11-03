using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Braxhorn.Arena;
using Newtonsoft.Json.Linq;

static class TournamentProtocolRunner
{
    static int checks;
    static void Check(bool value,string why){checks++;if(!value)throw new Exception("Tournament: "+why);}
    static JObject Profile()=>new JObject{["player"]=new JObject{["id"]="a:player",["name"]="Gracz",["authenticated"]=true}};
    static JObject Detail(bool owner=false)
    {
        return new JObject
        {
            ["profile"]=new JObject{["name"]="Gracz",["authenticated"]=true,["isOwner"]=owner},["now"]=1000000,["organizer"]=owner,["ownEntry"]="one",
            ["tournament"]=new JObject{["id"]="tournament-one",["code"]="1234ABCD",["name"]="Testowy turniej",["status"]="running",["capacity"]=4,["startAt"]=900000,["intervalMinutes"]=0,["timezone"]="Europe/Zurich",["revision"]=1,["champion"]=null},
            ["entries"]=new JArray(new JObject{["id"]="one",["name"]="Gracz",["fighter"]="BRAX",["seed"]=1,["own"]=true,["pending"]=false},new JObject{["id"]="two",["name"]="Rywal",["fighter"]="NYXA",["seed"]=2,["own"]=false,["pending"]=false}),
            ["fights"]=new JArray(new JObject{["id"]="fight-one",["round"]=0,["position"]=0,["a"]="one",["b"]="two",["winner"]=null,["status"]="scheduled",["scheduledAt"]=900000,["score"]=null,["reason"]=null,["attempt"]=1,["code"]="ABCDEF01"}),["history"]=new JArray()
        };
    }
    static JObject List(bool owner=false)
    {var d=Detail(owner);var t=(JObject)d["tournament"].DeepClone();t["count"]=2;t["own"]=true;t["organizer"]=owner;return new JObject{["profile"]=d["profile"],["now"]=1000000,["tournaments"]=new JArray(t),["upcoming"]=new JArray()};}
    sealed class Handler:HttpMessageHandler
    {
        internal List<JObject> Calls=new List<JObject>();
        internal JObject Data=Detail();
        internal bool Owner,InvalidRole;
        internal int PostCount;
        internal string Fail;
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage r,CancellationToken token)
        {
            if(r.RequestUri.AbsolutePath=="/api/account")return Reply(Profile());
            Check(r.RequestUri.AbsolutePath=="/api/tournaments","original tournament endpoint only");
            if(r.Method==HttpMethod.Get){Calls.Add(new JObject{["query"]=r.RequestUri.Query});return Reply(r.RequestUri.Query==""?List(Owner):Data);}
            var b=JObject.Parse(await r.Content.ReadAsStringAsync());Calls.Add(b);PostCount++;var action=(string)b["action"];
            if(action==Fail)return Reply(new JObject{["error"]="Termin minął."},409);
            if(action=="enter")return Reply(new JObject{["code"]="ABCDEF01",["token"]="ephemeral-room",["role"]=InvalidRole?"guest":"host",["tournamentCode"]="1234ABCD",["tournamentFight"]="fight-one",["scheduledAt"]=900000});
            if(action=="delete")return Reply(new JObject{["deleted"]=true});
            return Reply(Data);
        }
        static HttpResponseMessage Reply(JObject d,int status=200)=>new HttpResponseMessage((HttpStatusCode)status){Content=new StringContent(d.ToString())};
    }
    static async Task Error(Func<Task> action,int? code=null)
    {try{await action();}catch(ArenaServiceException e){Check(code==null||e.Status==code,"expected service rejection");return;}catch(ArgumentException){Check(code==null,"invalid arguments rejected before mutation");return;}throw new Exception("Unexpected tournament success");}
    internal static void Run()=>RunAsync().GetAwaiter().GetResult();
    static async Task RunAsync()
    {
        checks=0;var h=new Handler();using var c=new ArenaOnlineClient("https://arena.invalid",h);
        await c.ReadTournaments();Check(h.PostCount==0&&!c.TournamentOwner,"opening list never writes or grants owner");
        await Error(()=>c.ChangeTournament("register","1234ABCD",new JObject{["fighter"]="BRAX"}),401);Check(h.PostCount==0,"unauthenticated registration blocked");
        await c.RefreshAccount();var data=await c.ReadTournaments(" 1234abcd ");Check((string)data["tournament"]["code"]=="1234ABCD"&&(string)h.Calls.Last()["query"]=="?code=1234ABCD","codes normalize once into original GET contract");
        await c.ChangeTournament("register","1234abcd",new JObject{["fighter"]="BRAX"});Check((string)h.Calls.Last()["code"]=="1234ABCD"&&(string)h.Calls.Last()["fighter"]=="BRAX","registration uses selected source roster");
        await c.ChangeTournament("claim",null,new JObject{["inviteCode"]="abcd ef01-2345 6789"});Check((string)h.Calls.Last()["inviteCode"]=="ABCDEF0123456789"&&h.Calls.Last()["code"]==null,"personal invitation is distinct from room/tournament code");
        var count=h.PostCount;await Error(()=>c.ChangeTournament("draw","1234ABCD"),403);Check(h.PostCount==count,"nonowner cannot initiate organizer mutation");
        await Error(()=>c.ChangeTournament("unknown","1234ABCD"));await Error(()=>c.ChangeTournament("register","1234ABCD",new JObject{["fighter"]="BOSS"}));await Error(()=>c.ChangeTournament("register","1234ABCD",new JObject{["fighter"]="BRAX",["isOwner"]=true}));Check(h.PostCount==count,"invalid roster/action/authority fields never transmitted");
        var lease=await c.EnterTournament("1234ABCD","fight-one","BRAX_WHITE");Check(lease.Role=="host"&&lease.Fighter=="BRAX"&&lease.Outfit=="BRAX"&&lease.Code=="ABCDEF01","server-assigned fighter and role retained; unowned outfit falls back to base");
        Check((string)h.Calls.Last()["action"]=="enter"&&(string)h.Calls.Last()["fight"]=="fight-one"&&h.Calls.Last().Count==3,"entry cannot invent a duel or pass arbitrary player fields");
        h.InvalidRole=true;await Error(()=>c.EnterTournament("1234ABCD","fight-one","BRAX"));h.InvalidRole=false;
        h.Data["ownEntry"]=null;count=h.PostCount;await Error(()=>c.EnterTournament("1234ABCD","fight-one","BRAX"),403);Check(h.PostCount==count,"foreign participant cannot enter room");h.Data=Detail();
        h.Fail="enter";count=h.PostCount;await Error(()=>c.EnterTournament("1234ABCD","fight-one","BRAX"),409);Check(h.PostCount==count+1,"expired entry never automatically retries or restarts");h.Fail=null;
        var invalid=Detail();invalid["entries"][0]["fighter"]="UNKNOWN";h.Data=invalid;await Error(()=>c.ReadTournaments("1234ABCD"));
        h.Data=Detail();((JArray)h.Data["entries"]).Add(h.Data["entries"][0].DeepClone());await Error(()=>c.ReadTournaments("1234ABCD"));
        h.Data=Detail();h.Data["fights"][0]["a"]="foreign";await Error(()=>c.ReadTournaments("1234ABCD"));
        h.Data=Detail();h.Data["fights"][0]["scheduledAt"]=-1;await Error(()=>c.ReadTournaments("1234ABCD"));
        h.Data=Detail();h.Data["tournament"]["code"]="FFFFFFFF";await Error(()=>c.ReadTournaments("1234ABCD"));
        h.Owner=true;h.Data=Detail(true);await c.ReadTournaments();Check(c.TournamentOwner,"server owner capability recognized");
        await c.ChangeTournament("schedule","1234ABCD",new JObject{["fight"]="fight-one",["startAt"]=2000000,["reason"]="Nowy termin"});Check((long)h.Calls.Last()["startAt"]==2000000,"scheduled time sent as original Unix milliseconds");
        await c.ChangeTournament("resolve","1234ABCD",new JObject{["fight"]="fight-one",["winner"]="one",["reason"]="Potwierdzony problem"});Check((string)h.Calls.Last()["winner"]=="one","organizer resolution uses participant entry ID");
        await c.ChangeTournament("delete","1234ABCD");Check((string)h.Calls.Last()["action"]=="delete","explicit deletion requires server receipt");
        await c.Login("Tester","test-password");Check(!c.TournamentOwner,"relogin clears stale owner capability");count=h.PostCount;await Error(()=>c.ChangeTournament("draw","1234ABCD"),403);Check(h.PostCount==count,"owner capability must be refreshed after account change");
        Console.WriteLine("PASS "+checks+" tournament contract checks: identity, bounded bracket data, server fighter/role, invite claims, owner authorization, explicit actions and rejected entry. No live tournament modified.");
    }
}
