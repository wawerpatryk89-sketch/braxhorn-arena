using System;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    public sealed class ArenaRankTracker
    {
        sealed class Session {public string Owner,Match;}
        readonly ArenaOnlineClient online;
        readonly PendingArenaResults pending;
        Task serial=Task.CompletedTask;
        Session current;
        public string Status {get;private set;}="Wyniki lokalne.";
        public Task Idle=>serial;
        public ArenaRankTracker(ArenaOnlineClient online,PendingArenaResults pending){this.online=online;this.pending=pending;}
        void Queue(Func<Task> action){serial=Run(serial,action);}
        async Task Run(Task previous,Func<Task> action)
        {
            try{await previous.ConfigureAwait(false);await action().ConfigureAwait(false);}
            catch(ArenaServiceException e){Status=e.Message;}
            catch(Exception){Status="Postęp online nie został potwierdzony. Wynik lokalny pozostaje zapisany.";}
        }
        public void Begin(string mode,string level,string fighter,string runId,string challenge,int targetWins)
        {
            var session=new Session{Owner=online.Authenticated?online.PlayerId:null};current=session;
            if(session.Owner==null){Status="Gra gościa — wyniki lokalne.";return;}
            Queue(async()=>
            {
                if(!await Flush(session.Owner).ConfigureAwait(false)){Status="Poprzedni wynik oczekuje na zapis. Ta walka pozostaje lokalna.";return;}
                session.Match=await online.StartRankedMatch(session.Owner,mode,level,fighter,runId,challenge,targetWins).ConfigureAwait(false);
                Status="Walka połączona z prywatnym postępem konta.";
            });
        }
        public void Finish(int wins,int losses,int rounds,double elapsed,double hp,int specials)
        {Submit("finish",new JObject{["rounds"]=new JArray(wins,losses),["roundsPlayed"]=rounds,["elapsed"]=Math.Floor(elapsed+.5),["hp"]=Math.Floor(hp+.5),["specials"]=specials});}
        public void Challenge(string id,double elapsed,int count)
        {Submit("challenge",new JObject{["challenge"]=id,["elapsed"]=Math.Floor(elapsed+.5),["count"]=count});}
        void Submit(string action,JObject body)
        {
            var session=current;if(session?.Owner==null)return;
            Queue(async()=>
            {
                if(session.Match==null)return;
                body["match"]=session.Match;
                if(!pending.Add(session.Owner,action,body)){Status=pending.Error;return;}
                await Flush(session.Owner).ConfigureAwait(false);
            });
        }
        public void Retry()
        {var owner=online.Authenticated?online.PlayerId:null;if(owner!=null)Queue(async()=>{await Flush(owner).ConfigureAwait(false);});}
        async Task<bool> Flush(string owner)
        {
            if(!online.Authenticated||online.PlayerId!=owner)return false;
            for(var item=pending.First(owner);item!=null;item=pending.First(owner))
            {
                if(!online.Authenticated||online.PlayerId!=owner)return false;
                try
                {
                    await online.SubmitRankedResult(owner,(string)item["action"],(JObject)item["body"]).ConfigureAwait(false);
                    pending.Remove(item);Status="Prywatny postęp zapisany na serwerze.";
                }
                catch(ArenaServiceException e)
                {
                    if(e.Status==401){Status="Zaloguj się ponownie, aby zapisać oczekujące wyniki.";return false;}
                    if(e.Status>=400&&e.Status<500&&e.Status!=429){pending.Remove(item);Status="Serwer odrzucił wynik: "+e.Message;continue;}
                    Status="Wynik oczekuje na ponowny zapis: "+e.Message;return false;
                }
            }
            if(pending.Error!=null)Status=pending.Error;
            return true;
        }
    }
}
