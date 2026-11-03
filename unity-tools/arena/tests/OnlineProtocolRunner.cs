using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Braxhorn.Arena;
using Newtonsoft.Json.Linq;

static class OnlineProtocolRunner
{
    static int checks;
    static void Check(bool pass,string message){checks++;if(!pass)throw new Exception("Online protocol: "+message);}
    sealed class Handler : HttpMessageHandler
    {
        internal readonly Queue<Func<HttpRequestMessage,CancellationToken,Task<HttpResponseMessage>>> Steps=new Queue<Func<HttpRequestMessage,CancellationToken,Task<HttpResponseMessage>>>();
        internal int Calls;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken token)
        {Calls++;if(Steps.Count==0)throw new Exception("Unexpected request");return Steps.Dequeue()(request,token);}
        internal void Reply(JObject data,int status=200)=>Steps.Enqueue((r,t)=>Task.FromResult(Response(data.ToString(),status)));
    }
    static HttpResponseMessage Response(string json,int status=200)=>new HttpResponseMessage((HttpStatusCode)status){Content=new StringContent(json,Encoding.UTF8,"application/json")};
    static JObject Profile(string id="a:first",bool authenticated=true)=>new JObject{["player"]=new JObject{["id"]=id,["name"]="Tester",["authenticated"]=authenticated},["authenticated"]=authenticated};
    static readonly string[] Ids={"BRAX_WHITE","BRAX_STREET","NYXA_SPORT","NYXA_PINK","VEXA_PURPLE","VEXA_STREET","KROV_TRACKSUIT","KROV_SUMMER"};
    static JObject Shop(string[] owned=null,int balance=500,int price=400)=>new JObject{["owned"]=new JArray(owned??Array.Empty<string>()),["prices"]=new JObject(Ids.Select(id=>new JProperty(id,price))),["balance"]=balance,["canManage"]=false,["currency"]="ŻETONY"};
    static async Task Error(Func<Task> action,int? status=null)
    {try{await action();throw new Exception("Expected service failure");}catch(ArenaServiceException e){Check(!status.HasValue||e.Status==status.Value,"correct service status");}}
    internal static void Run()=>RunAsync().GetAwaiter().GetResult();
    static async Task RunAsync()
    {
        foreach(var origin in new[]{"http://arena.invalid","https://user:pass@arena.invalid","https://arena.invalid/elsewhere","https://arena.invalid/?q=1","https://arena.invalid/#x"})
        {try{using var bad=new ArenaOnlineClient(origin,new Handler());throw new Exception("Unsafe origin accepted");}catch(ArgumentException){Check(true,"HTTPS origin validation");}}
        var handler=new Handler();using var client=new ArenaOnlineClient("https://arena.invalid",handler);
        handler.Steps.Enqueue(async(r,t)=>{var body=JObject.Parse(await r.Content.ReadAsStringAsync());Check(r.Method==HttpMethod.Post&&r.RequestUri.AbsolutePath=="/api/account"&&r.RequestUri.Query=="?action=login","login endpoint");Check((string)body["nick"]=="Tester"&&(string)body["password"]=="test-only-password","credential form preserved");Check(!r.Headers.Contains("Authorization")&&!r.Headers.Contains("oai-authenticated-user-id"),"no invented authority headers");return Response(Profile().ToString());});
        await client.Login("Tester","test-only-password");Check(client.Authenticated&&client.PlayerId=="a:first"&&!client.HasInventory,"server profile accepted; no local inventory granted");
        handler.Reply(Shop());await client.RefreshShop();Check(client.Balance==500&&client.Price("BRAX_WHITE")==400&&!client.Owns("BRAX_WHITE"),"server prices and balance only");
        handler.Steps.Enqueue(async(r,t)=>{var body=JObject.Parse(await r.Content.ReadAsStringAsync());Check(r.RequestUri.AbsolutePath=="/api/shop"&&(string)body["outfit"]=="BRAX_WHITE"&&(int)body["expectedPrice"]==400,"purchase retains displayed price");var data=Shop(price:600);data["error"]="Cena została zmieniona.";return Response(data.ToString(),409);});
        await Error(()=>client.Buy("BRAX_WHITE",400),409);Check(client.Price("BRAX_WHITE")==600&&!client.Owns("BRAX_WHITE")&&client.Balance==500,"409 updates price without granting outfit");
        handler.Reply(Shop(new[]{"BRAX_WHITE"},100));await client.Buy("BRAX_WHITE",400);Check(client.Owns("BRAX_WHITE")&&client.Balance==100,"only confirmed inventory grants ownership");
        handler.Reply(Profile("a:second"));await client.Login("Other","test-only-password");Check(!client.HasInventory&&!client.Owns("BRAX_WHITE"),"account switch drops all old entitlements");
        handler.Reply(Shop());await client.RefreshShop();var malformed=Shop(new[]{"BRAX_WHITE"});malformed["prices"]["KROV_SUMMER"]=-1;handler.Reply(malformed);await Error(()=>client.RefreshShop());Check(!client.Owns("BRAX_WHITE")&&client.Price("KROV_SUMMER")==400,"invalid inventory applies no partial grants");
        handler.Reply(Profile("g:guest",false));await client.Logout();Check(!client.Authenticated&&!client.HasInventory&&client.PlayerId=="g:guest","logout replaces identity and invalidates inventory");
        handler.Steps.Enqueue(async(r,t)=>{var body=JObject.Parse(await r.Content.ReadAsStringAsync());Check(r.RequestUri.Query=="?action=register"&&(string)body["avatar"]=="female"&&(string)body["language"]=="pl","registration retains source contract");return Response(Profile().ToString(),201);});
        await client.Register("Tester","test-only-password","female");
        handler.Steps.Enqueue(async(r,t)=>{var body=JObject.Parse(await r.Content.ReadAsStringAsync());Check(r.RequestUri.Query=="?action=password"&&(string)body["currentPassword"]=="test-only-current"&&(string)body["password"]=="test-only-new","password change uses original contract");var data=Profile();data["saved"]=true;data["player"]["hasPassword"]=true;return Response(data.ToString());});
        await client.ChangePassword("test-only-current","test-only-new");Check(client.HasPassword,"password changes require server receipt");
        handler.Steps.Enqueue(async(r,t)=>{var body=JObject.Parse(await r.Content.ReadAsStringAsync());Check(r.RequestUri.Query=="?action=avatar"&&(string)body["avatar"]=="female","preset change uses original contract");var data=Profile();data["saved"]=true;data["player"]["avatar"]="/assets/avatar-female.jpg";data["player"]["hasPassword"]=true;return Response(data.ToString());});
        await client.SetAvatar("female");Check(client.Avatar=="/assets/avatar-female.jpg"&&client.HasPassword,"confirmed preset retains password capability");
        handler.Reply(Profile());await Error(()=>client.SetAvatar("male"));Check(client.Avatar=="/assets/avatar-female.jpg","unconfirmed mutation does not overwrite profile");
        handler.Reply(Shop());await client.RefreshShop();var before=handler.Calls;await Error(()=>client.SetPrice("BRAX_WHITE",900),403);Check(handler.Calls==before,"non-owner cannot initiate price change");
        var owner=Shop();owner["canManage"]=true;handler.Reply(owner);await client.RefreshShop();handler.Steps.Enqueue(async(r,t)=>{var body=JObject.Parse(await r.Content.ReadAsStringAsync());Check((string)body["action"]=="price"&&(int)body["price"]==900,"owner edit still goes to server authority");return Response(Shop(price:900).ToString());});await client.SetPrice("BRAX_WHITE",900);
        handler.Reply(owner);await client.RefreshShop();handler.Reply(Shop(price:400));await Error(()=>client.SetPrice("BRAX_WHITE",900));Check(client.Price("BRAX_WHITE")==400,"2xx with unchanged price is not a confirmed owner edit");
        handler.Steps.Enqueue((r,t)=>Task.FromResult(Response("<html>error</html>",503)));await Error(()=>client.RefreshAccount(),503);
        handler.Steps.Enqueue((r,t)=>Task.FromResult(Response("{} {}")));await Error(()=>client.RefreshAccount());
        handler.Steps.Enqueue((r,t)=>Task.FromResult(Response(new string('x',262145))));await Error(()=>client.RefreshShop());
        handler.Steps.Enqueue((r,t)=>Task.FromResult(Response("{}",302)));await Error(()=>client.RefreshAccount(),302);
        handler.Steps.Enqueue((r,t)=>throw new HttpRequestException("Transport detail that must not be exposed"));await Error(()=>client.RefreshAccount());
        handler.Steps.Enqueue((r,t)=>throw new OperationCanceledException());before=handler.Calls;await Error(()=>client.Buy("BRAX_WHITE",400));Check(handler.Calls==before+1,"no automatic retry of uncertain purchase");
        handler.Reply(Shop());await Error(()=>client.Buy("BRAX_WHITE",400));Check(!client.Owns("BRAX_WHITE"),"2xx without owned item is not purchase success");
        var gate=new TaskCompletionSource<HttpResponseMessage>();handler.Steps.Enqueue((r,t)=>gate.Task);handler.Reply(Shop());before=handler.Calls;
        var first=client.RefreshAccount();var second=client.RefreshShop();Check(handler.Calls==before+1&&!second.IsCompleted,"identity and inventory requests serialize");gate.SetResult(Response(Profile().ToString()));await Task.WhenAll(first,second);Check(handler.Calls==before+2,"queued inventory runs after identity");
        var cancelHandler=new Handler();var cancelled=new ArenaOnlineClient("https://arena.invalid",cancelHandler);cancelHandler.Steps.Enqueue(async(r,t)=>{await Task.Delay(Timeout.Infinite,t);return Response(Profile().ToString());});
        var pending=cancelled.RefreshAccount();cancelled.Dispose();try{await pending;throw new Exception("Disposed request applied");}catch(OperationCanceledException){Check(!cancelled.Authenticated,"dispose cancels request without accepting identity");}
        Console.WriteLine("PASS "+checks+" native account/shop protocol checks: source requests, server authority, price conflicts, account isolation, malformed responses, limits, serialization and cancellation. No live account, purchase, Android HTTP or TLS test was performed.");
    }
}
