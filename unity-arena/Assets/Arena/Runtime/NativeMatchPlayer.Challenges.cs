using System;
using System.Linq;
using Braxhorn.Arena.Domain;
using UnityEngine;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        GameObject challengesPanel,challengeStart;
        Text challengeDescription;
        int challengeIndex;
        ArenaChallenge pendingChallenge;
        ChallengeRun challengeRun;
        void BuildChallengeUi()
        {
            Click(selection.transform,"WYZWANIA",new Rect(600,20,196,42),()=>{RefreshChallenge();challengesPanel.SetActive(true);challengesPanel.transform.SetAsLastSibling();});
            challengesPanel=Panel("Challenges",new Rect(100,76,824,420),new Color(.04f,.05f,.07f,.99f));
            challengeDescription=Label(challengesPanel.transform,"Challenge",new Rect(24,24,776,230),23);
            Click(challengesPanel.transform,"◀",new Rect(24,274,80,58),()=>{challengeIndex=(challengeIndex+ChallengeCatalog.All.Count-1)%ChallengeCatalog.All.Count;RefreshChallenge();});
            Click(challengesPanel.transform,"▶",new Rect(116,274,80,58),()=>{challengeIndex=(challengeIndex+1)%ChallengeCatalog.All.Count;RefreshChallenge();});
            Click(challengesPanel.transform,"WRÓĆ",new Rect(220,274,240,58),()=>challengesPanel.SetActive(false));
            challengeStart=Click(challengesPanel.transform,"ROZPOCZNIJ",new Rect(484,274,312,58),LaunchChallenge);
            challengesPanel.SetActive(false);
        }
        void RefreshChallenge()
        {
            var c=ChallengeCatalog.All[challengeIndex];var fighter=Base(Variants[variantIndex]);var allowed=c.Allows(fighter);
            var done=progress!=null&&((Newtonsoft.Json.Linq.JArray)progress.Fighter(fighter)["challenges"]).Values<string>().Contains(c.Id);
            challengeDescription.text=(challengeIndex+1)+" / "+ChallengeCatalog.All.Count+" · "+Display(fighter)+"\n"+c.Title+"\n\n"+c.Description+"\n"+(allowed?(done?"UKOŃCZONE — MOŻESZ POWTÓRZYĆ":"CEL: "+c.Goal):"Ta postać nie ma gardy. Wybierz inną postać.");
            challengeStart.GetComponent<Button>().interactable=allowed;
        }
        void LaunchChallenge()
        {
            var c=ChallengeCatalog.All[challengeIndex];if(!c.Allows(Base(Variants[variantIndex])))return;
            pendingChallenge=c;modeIndex=Array.IndexOf(Modes,c.Mode);difficulty=c.Difficulty=="hard"?2:c.Difficulty=="easy"?0:1;
            if(c.Drill.HasValue)trainingMode=Array.IndexOf(TrainingModes,c.Drill.Value);
            challengesPanel.SetActive(false);BeginSession();
        }
        void NoteChallenge(string kind)
        {
            if(challengeRun==null||!challengeRun.Note(kind))return;
            var c=challengeRun.Definition;
            progress.Complete(challengeRun.Fighter,c.Id);
            progress.Record("challenge:"+c.Id,c.Difficulty,sessionRecordId+"-"+c.Id,challengeRun.Fighter,1,match.ActiveMs,true);
            if(!progressStore.Save(progress))status.text=progressStore.Error;
        }
        void CompleteChallengeMatch()
        {
            if(challengeRun==null||match.Training||match.Winner!=0)return;
            if(match.Opponent.Configuration.Character=="BOSS")NoteChallenge("bosswin");
            if(difficulty==2)NoteChallenge("hardwin");
            if(match.Player.Hp>=60)NoteChallenge("healthywin");
            if(match.ActiveMs<=90000)NoteChallenge("fastwin");
            if(match.PlayerComboUses==0&&difficulty!=0)NoteChallenge("cleanwin");
            if(survival!=null)NoteChallenge("survival");
        }
    }
}
