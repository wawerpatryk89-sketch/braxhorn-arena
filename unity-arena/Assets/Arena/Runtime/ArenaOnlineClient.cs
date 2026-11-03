using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    public sealed class ArenaServiceException : Exception
    {
        public int Status {get;}
        public ArenaServiceException(string message,int status=0):base(message){Status=status;}
    }
    // Native adapter to the existing v271 backend. Only the server grants an
    // identity, inventory or balance. Cookies stay in this client's memory;
    // credentials/tokens are never put in PlayerPrefs, logs or progress JSON.
    public sealed partial class ArenaOnlineClient : IDisposable
    {
        static readonly HashSet<string> OutfitIds=new HashSet<string>{"BRAX_WHITE","BRAX_STREET","NYXA_SPORT","NYXA_PINK","VEXA_PURPLE","VEXA_STREET","KROV_TRACKSUIT","KROV_SUMMER"};
        readonly HttpClient client;
        readonly SemaphoreSlim serial=new SemaphoreSlim(1,1);
        readonly CancellationTokenSource lifetime=new CancellationTokenSource();
        readonly HashSet<string> owned=new HashSet<string>();
        readonly Dictionary<string,int> prices=new Dictionary<string,int>();
        bool disposed;
        public bool Authenticated {get;private set;}
        public string PlayerId {get;private set;}
        public string Name {get;private set;}="GRACZ";
        public bool HasPassword {get;private set;}
        public string Avatar {get;private set;}
        public bool HasInventory {get;private set;}
        public int Balance {get;private set;}
        public bool CanManagePrices {get;private set;}
        public bool Owns(string id)=>OutfitIds.Contains(id)&&HasInventory&&owned.Contains(id);
        public int? Price(string id)=>HasInventory&&prices.TryGetValue(id,out var price)?price:(int?)null;
        public ArenaOnlineClient(string origin):this(origin,new HttpClientHandler{UseCookies=true,CookieContainer=new CookieContainer(),AllowAutoRedirect=false}){}
        // Handler injection is only for protocol tests; the runtime uses TLS and
        // the standard certificate verifier. No certificate bypass is provided.
        public ArenaOnlineClient(string origin,HttpMessageHandler handler)
        {
            if(!Uri.TryCreate(origin,UriKind.Absolute,out var uri)||uri.Scheme!="https"||uri.AbsolutePath!="/"||uri.UserInfo.Length>0||uri.Query.Length>0||uri.Fragment.Length>0)
            {handler.Dispose();throw new ArgumentException("Expected an HTTPS service origin",nameof(origin));}
            client=new HttpClient(handler,true){BaseAddress=uri,Timeout=TimeSpan.FromSeconds(20)};
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Braxhorn-Arena-Unity/1.0");
        }
        public Task RefreshAccount()=>Account("me",null);
        public Task Login(string nick,string password)=>Account("login",new JObject{["nick"]=nick,["password"]=password});
        public Task Register(string nick,string password,string avatar)=>Account("register",new JObject{["nick"]=nick,["password"]=password,["avatar"]=avatar,["language"]="pl"});
        public Task Logout()=>Account("logout",new JObject());
        public Task Guest()=>Account("guest",new JObject());
        public Task ChangePassword(string current,string password)
        {
            if(password==null||password.Length<8||password.Length>128||current?.Length>128)throw new ArgumentException("Invalid password length");
            return Account("password",new JObject{["currentPassword"]=current,["password"]=password},PlayerId);
        }
        public Task SetAvatar(string avatar)
        {
            if(avatar!="male"&&avatar!="female")throw new ArgumentException("Invalid avatar preset");
            return Account("avatar",new JObject{["avatar"]=avatar},PlayerId);
        }
        async Task Account(string action,JObject body,string expectedOwner=null)
        {
            await Locked(async()=>
            {
                var editing=action=="password"||action=="avatar";if(editing)RequireIdentity(expectedOwner);
                var response=await Request("api/account?action="+action,body);
                ThrowError(response);
                if(!(response.data["player"] is JObject player)||player["authenticated"]?.Type!=JTokenType.Boolean||player["id"]?.Type!=JTokenType.String||player["name"]?.Type!=JTokenType.String)
                    throw new ArenaServiceException("Serwer zwrócił nieprawidłowy profil.");
                var id=(string)player["id"];if(string.IsNullOrWhiteSpace(id)||id.Length>160)throw new ArenaServiceException("Serwer zwrócił nieprawidłowy profil.");
                if(editing&&(id!=expectedOwner||(bool?)response.data["saved"]!=true||(bool)player["authenticated"]!=true||action=="password"&&(bool?)player["hasPassword"]!=true||action=="avatar"&&(string)player["avatar"]!="/assets/avatar-"+(string)body["avatar"]+".jpg"))throw new ArenaServiceException("Serwer nie potwierdził zmiany ustawień konta.");
                if(PlayerId!=id||action=="login"||action=="register"||action=="logout"||action=="guest"){ClearInventory();TournamentOwner=false;}
                PlayerId=id;Authenticated=(bool)player["authenticated"];Name=((string)player["name"]).Substring(0,Math.Min(80,((string)player["name"]).Length));
                HasPassword=player["hasPassword"]?.Type==JTokenType.Boolean&&(bool)player["hasPassword"];
                Avatar=player["avatar"]?.Type==JTokenType.String&&((string)player["avatar"]).Length<=200?(string)player["avatar"]:null;
            });
        }
        public Task RefreshShop()=>Locked(async()=>
        {
            var response=await Request("api/shop",null);
            ThrowError(response);ApplyInventory(response.data);
        });
        public Task Buy(string outfit,int expectedPrice)
        {
            if(!OutfitIds.Contains(outfit)||expectedPrice<0||expectedPrice>1000000)throw new ArgumentException("Invalid outfit purchase");
            return Locked(async()=>
            {
                var response=await Request("api/shop",new JObject{["action"]="buy",["outfit"]=outfit,["expectedPrice"]=expectedPrice});
                // Source 409 includes refreshed inventory/price. Never grant an
                // outfit optimistically, and do not retry a purchase on timeout.
                if(response.data["owned"] is JArray)ApplyInventory(response.data);
                ThrowError(response);
                if(!Owns(outfit))throw new ArenaServiceException("Zakup nie został potwierdzony przez serwer. Odśwież sklep.");
            });
        }
        public Task SetPrice(string outfit,int price)
        {
            if(!OutfitIds.Contains(outfit)||price<0||price>1000000)throw new ArgumentException("Invalid outfit price");
            var owner=PlayerId;
            return Locked(async()=>
            {
                RequireIdentity(owner);
                if(!CanManagePrices)throw new ArenaServiceException("Tylko właściciel gry może zmieniać ceny.",403);
                var response=await Request("api/shop",new JObject{["action"]="price",["outfit"]=outfit,["price"]=price});ThrowError(response);ApplyInventory(response.data);
                if(Price(outfit)!=price)throw new ArenaServiceException("Serwer nie potwierdził nowej ceny. Odśwież sklep.");
            });
        }
        void ClearInventory(){owned.Clear();prices.Clear();HasInventory=false;Balance=0;CanManagePrices=false;}
        void ApplyInventory(JObject data)
        {
            if(!(data["owned"] is JArray list)||!(data["prices"] is JObject values)||data["balance"]?.Type!=JTokenType.Integer||!int.TryParse((string)data["balance"],out var balance)||balance<0)
                throw new ArenaServiceException("Serwer zwrócił nieprawidłowe dane sklepu.");
            var nextOwned=new HashSet<string>();var nextPrices=new Dictionary<string,int>();
            foreach(var value in list)
            {if(value.Type!=JTokenType.String)throw new ArenaServiceException("Serwer zwrócił nieprawidłowe dane sklepu.");var id=(string)value;if(OutfitIds.Contains(id))nextOwned.Add(id);}
            foreach(var id in OutfitIds)
            {
                if(values[id]?.Type!=JTokenType.Integer||!int.TryParse((string)values[id],out var price)||price<0||price>1000000)throw new ArenaServiceException("Serwer zwrócił nieprawidłową cenę stroju.");
                nextPrices[id]=price;
            }
            ClearInventory();foreach(var id in nextOwned)owned.Add(id);foreach(var item in nextPrices)prices[item.Key]=item.Value;
            Balance=balance;CanManagePrices=(bool?)data["canManage"]==true;HasInventory=true;
        }
        async Task Locked(Func<Task> operation)
        {
            if(disposed)throw new ObjectDisposedException(nameof(ArenaOnlineClient));
            await serial.WaitAsync(lifetime.Token);
            try{await operation();}
            catch(OperationCanceledException){if(disposed)throw;throw new ArenaServiceException("Serwer nie odpowiedział na czas. Sprawdź połączenie i odśwież dane.");}
            catch(HttpRequestException){throw new ArenaServiceException("Nie udało się połączyć z serwerem. Sprawdź połączenie.");}
            catch(IOException){throw new ArenaServiceException("Połączenie zostało przerwane. Odśwież dane przed ponowną próbą.");}
            finally{serial.Release();}
        }
        async Task<(int status,JObject data)> Request(string path,JObject body,int timeoutSeconds=20)
        {
            using var request=new HttpRequestMessage(body==null?HttpMethod.Get:HttpMethod.Post,path);
            if(body!=null)request.Content=new StringContent(body.ToString(Formatting.None),Encoding.UTF8,"application/json");
            // HttpClient's timeout also bounds streamed body reads via our CTS.
            using var timeout=CancellationTokenSource.CreateLinkedTokenSource(lifetime.Token);timeout.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));
            using var response=await client.SendAsync(request,HttpCompletionOption.ResponseHeadersRead,timeout.Token);
            var status=(int)response.StatusCode;
            if(status>=300&&status<400)throw new ArenaServiceException("Serwer przekierował żądanie. Sprawdź adres usługi.",status);
            const int maximum=262144;
            if(response.Content.Headers.ContentLength>maximum)throw new ArenaServiceException("Odpowiedź serwera jest zbyt duża.");
            using var input=await response.Content.ReadAsStreamAsync();using var output=new MemoryStream();var buffer=new byte[8192];
            for(;;){var count=await input.ReadAsync(buffer,0,buffer.Length,timeout.Token);if(count==0)break;if(output.Length+count>maximum)throw new ArenaServiceException("Odpowiedź serwera jest zbyt duża.");output.Write(buffer,0,count);}
            if(disposed)throw new ObjectDisposedException(nameof(ArenaOnlineClient));
            try
            {
                using var reader=new JsonTextReader(new StringReader(Encoding.UTF8.GetString(output.ToArray()))){MaxDepth=32};
                var data=JObject.Load(reader);if(reader.Read())throw new JsonReaderException();return(status,data);
            }
            catch(JsonException){throw new ArenaServiceException("Serwer zwrócił nieprawidłową odpowiedź.",status);}
        }
        static void ThrowError((int status,JObject data) response)
        {
            if(response.status>=200&&response.status<300)return;
            var message=response.data["error"]?.Type==JTokenType.String?(string)response.data["error"]:null;
            if(string.IsNullOrWhiteSpace(message)||message.Length>300)message="Serwer nie przyjął żądania. Spróbuj ponownie.";
            throw new ArenaServiceException(message,response.status);
        }
        public void Dispose(){if(disposed)return;disposed=true;lifetime.Cancel();client.Dispose();ClearInventory();Authenticated=false;HasPassword=false;Avatar=null;PlayerId=null;Name="GRACZ";}
    }
}
