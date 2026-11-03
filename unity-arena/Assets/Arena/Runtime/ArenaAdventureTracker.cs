using System;
using System.Threading.Tasks;
using Braxhorn.Arena.Domain;

namespace Braxhorn.Arena
{
    // The original adventure protocol is sequential and capability-based. On a
    // failed write, gameplay continues locally; never invent/retry a saved rank.
    public sealed class ArenaAdventureTracker
    {
        readonly ArenaOnlineClient client;
        Task tail=Task.CompletedTask;
        sealed class Session { internal AdventureLease Lease;internal bool Failed,Finished; }
        Session active;
        public string Status { get; private set; }="Przejście lokalne.";
        public Task Idle=>tail;
        public ArenaAdventureTracker(ArenaOnlineClient client){this.client=client??throw new ArgumentNullException(nameof(client));}
        public void Begin(string route,string level,string fighter,string name)
        {
            var session=active=new Session();Status="Łączenie zapisu wyprawy…";
            Enqueue(session,async()=>{var lease=await client.StartAdventure(route,level,fighter,name);if(active!=session)return;session.Lease=lease;Status="Zapis przebiegu wyprawy aktywny.";});
        }
        public void Submit(AdventureProgressEvent value)
        {
            var session=active;if(session==null||session.Failed||session.Finished)return;
            Enqueue(session,async()=>
            {
                if(session.Lease==null||session.Failed)return;
                await client.SubmitAdventure(session.Lease,value);
                if(active!=session)return;
                if(value.Action=="complete"){session.Finished=true;Status="Serwer potwierdził ukończenie wyprawy i zapis "+value.Score+" punktów.";}
                else if(value.Status=="dead"){session.Finished=true;Status="Serwer zapisał koniec wyprawy. Ranking obejmuje ukończone trasy.";}
                else Status="Serwer potwierdził "+value.Next+"/6 starć · "+value.Score+" pkt.";
            });
        }
        void Enqueue(Session session,Func<Task> action){tail=After(tail,session,action);}
        async Task After(Task previous,Session session,Func<Task> action)
        {
            await previous;if(active!=session||session.Failed||session.Finished)return;
            try{await action();}
            catch(Exception)
            {
                session.Failed=true;session.Lease=null;
                if(active==session)Status="Nie potwierdzono zapisu wyprawy. Dalsze przejście lokalne, poza rankingiem.";
            }
        }
        public void Cancel(){if(active!=null)active.Lease=null;active=null;Status="Przejście lokalne.";}
    }
}
