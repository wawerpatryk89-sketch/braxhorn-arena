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
        readonly System.Collections.Generic.List<Button> challengeButtons=new System.Collections.Generic.List<Button>();
        int challengeIndex;
        ArenaChallenge pendingChallenge;
        ChallengeRun challengeRun;
        void BuildChallengeUi()
        {

            challengesPanel=Panel("Challenges",new Rect(0,0,1024,576),MenuInk);
            MenuArt(challengesPanel.transform,"background",new Rect(0,0,1024,576),true).GetComponent<UnityEngine.UI.RawImage>().color=new Color(.3f,.35f,.28f,1);
            MenuHeading(challengesPanel,"WYZWANIA — ROZWÓJ TECHNIKI");
            var viewport=new GameObject("Challenge list",typeof(RectTransform),typeof(Image),typeof(RectMask2D),typeof(ScrollRect));Place(viewport,challengesPanel.transform,new Rect(32,90,366,394));viewport.GetComponent<Image>().color=new Color(0,0,0,.25f);
            var content=new GameObject("Challenges",typeof(RectTransform));Place(content,viewport.transform,new Rect(0,0,366,ChallengeCatalog.All.Count*66));
            var scroll=viewport.GetComponent<ScrollRect>();scroll.viewport=(RectTransform)viewport.transform;scroll.content=(RectTransform)content.transform;scroll.horizontal=false;scroll.vertical=true;scroll.movementType=ScrollRect.MovementType.Clamped;
            for(var i=0;i<ChallengeCatalog.All.Count;i++)
            {
                var index=i;var button=Click(content.transform,(i+1)+". "+ChallengeCatalog.All[i].Title,new Rect(0,i*66,350,58),()=>{challengeIndex=index;RefreshChallenge();});
                button.GetComponentInChildren<Text>().fontSize=17;challengeButtons.Add(button.GetComponent<Button>());
            }
            MenuArt(challengesPanel.transform,"mode-challenges",new Rect(446,86,500,142),true);
            challengeDescription=Label(challengesPanel.transform,"Challenge",new Rect(434,246,558,244),21);
            Click(challengesPanel.transform,"WRÓĆ",new Rect(32,510,170,46),()=>challengesPanel.SetActive(false));
            challengeStart=Click(challengesPanel.transform,"ROZPOCZNIJ",new Rect(674,510,318,46),LaunchChallenge);
            challengesPanel.SetActive(false);
        }
        void RefreshChallenge()
        {
            var c=ChallengeCatalog.All[challengeIndex];var fighter=Base(Variants[variantIndex]);var allowed=c.Allows(fighter);
            var done=progress!=null&&((Newtonsoft.Json.Linq.JArray)progress.Fighter(fighter)["challenges"]).Values<string>().Contains(c.Id);
            challengeDescription.text=(challengeIndex+1)+" / "+ChallengeCatalog.All.Count+" · "+Display(fighter)+"\n"+c.Title+"\n\n"+c.Description+"\n"+(allowed?(done?"UKOŃCZONE — MOŻESZ POWTÓRZYĆ":"CEL: "+c.Goal):"Ta postać nie ma gardy. Wybierz inną postać.");
            challengeStart.GetComponent<Button>().interactable=allowed;
            for(var i=0;i<challengeButtons.Count;i++)
            {
                var item=ChallengeCatalog.All[i];var available=item.Allows(fighter);
                challengeButtons[i].GetComponent<Image>().color=i==challengeIndex?new Color(.22f,.36f,.14f,1):new Color(.06f,.1f,.07f,1);
                challengeButtons[i].GetComponentInChildren<Text>().text=(i+1)+". "+item.Title+(available?"":" · NIEDOSTĘPNE");
            }
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
            rankTracker?.Challenge(c.Id,match.ActiveMs,challengeRun.Count);
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
