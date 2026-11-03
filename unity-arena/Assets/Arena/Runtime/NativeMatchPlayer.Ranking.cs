using System;
using System.IO;
using UnityEngine;
using UnityEngine.UI;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        ArenaRankTracker rankTracker;
        Text resultOnlineStatus;
        JObject serverFighters;
        string serverFightersOwner;
        string recordsServiceMessage;
        void LoadServerProgress()
        {
            JObject value=null;string owner=null;
            RunAccount(async()=>
            {
                await online.RefreshAccount();owner=online.PlayerId;
                value=await online.ReadServerProgress(owner);
            },()=>{serverFighters=(JObject)value["fighters"];serverFightersOwner=owner;ResetAccountSelection();recordsServiceMessage="Odczytano prywatny postęp konta: "+online.Name;RefreshRecords();});
        }
        void EnsureRanking()
        {
            EnsureOnline();
            if(rankTracker==null)rankTracker=new ArenaRankTracker(online,new PendingArenaResults(Path.Combine(Application.persistentDataPath,"braxhorn.online.pending.v1.json")));
        }
        void BeginServerMatch()
        {
            if(adventure!=null||spectating)return;
            try{EnsureRanking();rankTracker.Begin(Modes[modeIndex],new[]{"easy","normal","hard"}[difficulty],match.Player.Configuration.Character,sessionRecordId,challengeRun?.Definition.Id,3);}
            catch(Exception){status.text="Nie udało się połączyć zapisu online. Walka pozostaje lokalna.";}
        }
        void SubmitServerMatch()
        {
            if(match==null||match.Training||adventure!=null||spectating)return;
            rankTracker?.Finish(match.PlayerWins,match.OpponentWins,match.Round,match.ActiveMs,match.Player.Hp,match.PlayerComboUses);
        }
        void RetryServerResults()
        {
            recordsServiceMessage=null;
            try{EnsureRanking();rankTracker.Retry();}catch(Exception){status.text="Nie udało się odświeżyć zapisu online.";}
        }
    }
}
