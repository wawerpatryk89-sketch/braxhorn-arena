using System;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    // Main-thread pump owns one HTTP request at a time. No room credentials are
    // persisted, and neither terminal snapshots nor retries confirm a result.
    public sealed class ArenaDuelSession
    {
        readonly ArenaOnlineClient client;
        long sequence;
        double lastSuccess,peerAge;
        bool active=true,polling,reporting;
        int? hostScore,guestScore;
        string hostOutfit,guestOutfit,arena;
        public DuelLease Lease {get;}
        public JObject Room {get;private set;}
        public bool Ready {get;set;}
        public bool Playing {get;private set;}
        public bool Closed=>!active;
        public bool ConfirmedByMe {get;private set;}
        public bool Reporting=>reporting;
        public string ResultStatus {get;private set;}="";
        public string Status {get;private set;}="Łączenie z pokojem…";
        public ArenaDuelSession(ArenaOnlineClient client,DuelLease lease,double now)
        {this.client=client??throw new ArgumentNullException(nameof(client));Lease=lease??throw new ArgumentNullException(nameof(lease));lastSuccess=now;}
        public bool Connected(double now)=>active&&Playing&&Room!=null&&(bool)Room["peerReady"]&&now-lastSuccess+peerAge<=2500;
        public bool Expired(double now)=>active&&Playing&&hostScore==null&&now-lastSuccess+peerAge>20000;
        public void Terminal(int host,int guest)
        {if(hostScore!=null||host<0||guest<0||host>2||guest>2||host+guest>3)return;hostScore=host;guestScore=guest;}
        public async Task Poll(double now,JObject packet=null)
        {
            if(!active||polling)return;polling=true;
            try
            {
                var r=await client.SyncDuel(Lease,Ready,++sequence,Lease.Outfit,Ready?packet:null);if(!active)return;
                if(hostOutfit!=null&&((string)r["hostOutfit"]!=hostOutfit||(string)r["arena"]!=arena||guestOutfit!=null&&(string)r["guestOutfit"]!=guestOutfit))throw new ArenaServiceException("Zmieniono zawodników rozpoczętego pokoju.",409);
                hostOutfit=(string)r["hostOutfit"];guestOutfit=(string)r["guestOutfit"];arena=(string)r["arena"];
                Room=r;lastSuccess=now;peerAge=Math.Max(0,(double)r["now"]-(double)r["peerSeen"]);
                ResultStatus=(string)r["resultStatus"];Playing=(string)r["status"]=="playing";
                if((string)r["status"]=="closed"){active=false;Status="Pokój został zamknięty.";return;}
                Status=ResultStatus=="confirmed"?"Obaj gracze potwierdzili wynik.":ResultStatus=="disputed"?"Wynik jest sporny — bez potwierdzenia.":ResultStatus=="pending"?"Oczekiwanie na potwierdzenie wyniku przez rywala.":Playing?"Połączono przez serwer.":"Pokój "+Lease.Code+" · oczekiwanie na gotowość rywala.";
            }
            catch(Exception e)
            {
                if(!active)return;
                Status=e is ArenaServiceException?e.Message:"Przywracanie połączenia…";
                if(e is ArenaServiceException service&&(service.Status==403||service.Status==404||service.Status==409))active=false;
                // A failed poll must pause immediately; don't let stale input
                // continue merely because the previous success was recent.
                peerAge=Math.Max(peerAge,2501);
            }
            finally{polling=false;}
        }
        public async Task Confirm()
        {
            if(!active||reporting||ConfirmedByMe||hostScore==null||ResultStatus=="confirmed"||ResultStatus=="disputed")return;
            reporting=true;
            try{var r=await client.ConfirmDuel(Lease,hostScore.Value,guestScore.Value);if(!active)return;ResultStatus=(string)r["resultStatus"];ConfirmedByMe=ResultStatus=="pending"||ResultStatus=="confirmed";Status=ResultStatus=="confirmed"?"Obaj gracze potwierdzili wynik.":ResultStatus=="disputed"?"Wynik jest sporny.":"Twój wynik wysłano. Czekamy na rywala.";}
            catch(Exception e){if(active)Status=e is ArenaServiceException?e.Message:"Nie potwierdzono zapisu. Spróbuj ponownie.";}
            finally{reporting=false;}
        }
        public async Task Dispute()
        {
            if(!active||reporting||ResultStatus=="confirmed")return;reporting=true;
            try{var r=await client.DisputeDuel(Lease);if(active){ResultStatus=(string)r["resultStatus"];Status=ResultStatus=="confirmed"?"Wynik był już potwierdzony przez obie strony.":"Zgłoszono problem z wynikiem.";}}
            catch(Exception e){if(active)Status=e is ArenaServiceException?e.Message:"Nie wysłano zgłoszenia.";}
            finally{reporting=false;}
        }
        public async Task Leave()
        {if(!active)return;active=false;Ready=false;try{await client.LeaveDuel(Lease);}catch(Exception){/* No retry of a stale room operation. */}}
    }
}
