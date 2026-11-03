using System;
using System.IO;
using System.Linq;
using Braxhorn.Arena.Domain;
using UnityEngine;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        ArenaProgress progress;
        ProgressFileStore progressStore;
        string matchRecordId,sessionRecordId;
        double sessionActiveMs;
        int sessionPlayed;
        void LoadProgress()
        {
            progressStore=new ProgressFileStore(Path.Combine(Application.persistentDataPath,"braxhorn.progress.v2.json"));
            progress=progressStore.Load();if(progressStore.Error!=null)status.text=progressStore.Error;
        }
        void BeginProgressSession(){sessionRecordId=Guid.NewGuid().ToString("N");sessionActiveMs=0;sessionPlayed=0;}
        void SaveMatchProgress()
        {
            if(progress==null||match.Training||adventure!=null)return;
            var fighter=match.Player.Configuration.Character;var level=new[]{"easy","normal","hard"}[difficulty];
            sessionActiveMs+=match.ActiveMs;sessionPlayed++;
            if(match.Winner==0)
            {
                progress.Win(fighter);
                if(campaign==null&&survival==null)progress.Record("fight",level,matchRecordId,fighter,match.PlayerWins-match.OpponentWins,match.ActiveMs,true,rounds:new[]{match.PlayerWins,match.OpponentWins});
            }
            if(survival!=null)
            {
                progress.Survival(fighter,survival.Score);
                if(survival.Score>0)progress.Record("survival",level,sessionRecordId,fighter,survival.Score,sessionActiveMs,false);
            }
            else if(campaign?.Finished==true)
                progress.Record(campaign.Mode,level,sessionRecordId,fighter,campaign.History.Count(r=>r.Outcome==BoutOutcome.Win),campaign.Mode=="tournament"?sessionActiveMs/Math.Max(1,sessionPlayed):sessionActiveMs,campaign.Champion==fighter,campaign.Mode=="arcade"?Roster.Length-1:5);
            if(!progressStore.Save(progress))result.text+="\n"+progressStore.Error;
        }
    }
}
