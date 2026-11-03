using System;
using System.Net;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    // Implementations must encrypt with a platform-owned key. No plaintext or
    // PlayerPrefs fallback is permitted. Passwords never enter this interface.
    public interface IArenaSessionStore
    {
        string Load();
        void Save(string value);
        void Clear();
    }
    public sealed partial class ArenaOnlineClient
    {
        readonly IArenaSessionStore sessionStore;
        readonly CookieContainer sessionCookies;
        public string SessionWarning {get;private set;}
        public bool HasRestoredSession {get;private set;}
        const string SessionFailure="Nie udało się bezpiecznie zapisać sesji. Po ponownym uruchomieniu aplikacji zaloguj się jeszcze raz.";
        static bool ValidSessionToken(string token)=>token!=null&&Regex.IsMatch(token,"\\A[a-f0-9]{64}\\z");
        void RestoreSession()
        {
            if(sessionStore==null||sessionCookies==null)return;
            try
            {
                var value=sessionStore.Load();if(string.IsNullOrEmpty(value))return;
                if(value.Length>2048)throw new FormatException();
                var data=JObject.Parse(value);var expiry=DateTimeOffset.FromUnixTimeSeconds((long)data["expires"]);
                if((int?)data["version"]!=1||(string)data["origin"]!=client.BaseAddress.AbsoluteUri||!ValidSessionToken((string)data["token"])||expiry<=DateTimeOffset.UtcNow||expiry>DateTimeOffset.UtcNow.AddDays(31))throw new FormatException();
                sessionCookies.Add(client.BaseAddress,new Cookie("brax_session",(string)data["token"],"/"){Secure=true,HttpOnly=true,Expires=expiry.UtcDateTime});
                sessionCookies.Add(client.BaseAddress,new Cookie("brax_entry","local","/"){Secure=true,HttpOnly=true,Expires=expiry.UtcDateTime});
                HasRestoredSession=true;
                // Restored cookies are not an authenticated profile. Only /me
                // can grant identity, inventory and owner controls after launch.
            }
            catch(Exception){ClearStoredSession();SessionWarning="Zapisana sesja jest niedostępna lub wygasła. Zaloguj się ponownie.";}
        }
        void PersistSession()
        {
            if(sessionStore==null||sessionCookies==null)return;
            try
            {
                var cookie=sessionCookies.GetCookies(client.BaseAddress)["brax_session"];
                var entry=sessionCookies.GetCookies(client.BaseAddress)["brax_entry"];
                if(!Authenticated||cookie==null||cookie.Expired||!cookie.Secure||!cookie.HttpOnly||cookie.Path!="/"||cookie.Expires.ToUniversalTime()<=DateTime.UtcNow||cookie.Expires.ToUniversalTime()>DateTime.UtcNow.AddDays(31)||!ValidSessionToken(cookie.Value)||entry?.Value!="local")
                {ClearStoredSession();return;}
                sessionStore.Save(new JObject{["version"]=1,["origin"]=client.BaseAddress.AbsoluteUri,["expires"]=new DateTimeOffset(cookie.Expires.ToUniversalTime()).ToUnixTimeSeconds(),["token"]=cookie.Value}.ToString(Formatting.None));
                SessionWarning=null;
            }
            catch(Exception){ClearStoredSession();SessionWarning=SessionFailure;}
        }
        void ClearStoredSession()
        {
            HasRestoredSession=false;
            try{sessionStore?.Clear();}catch(Exception){SessionWarning="Nie udało się usunąć zapisu sesji na tym urządzeniu.";}
        }
        void EndLocalSession(bool keepGuest=false)
        {
            HasRestoredSession=false;ClearStoredSession();
            if(sessionCookies!=null)foreach(Cookie cookie in sessionCookies.GetCookies(client.BaseAddress))cookie.Expired=true;
            ClearInventory();TournamentOwner=false;Authenticated=false;HasPassword=false;
            if(!keepGuest){PlayerId=null;Name="GRACZ";Avatar=null;}
        }
    }
}
