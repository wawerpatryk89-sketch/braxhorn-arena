using Braxhorn.Arena.Domain;
using UnityEngine;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        static readonly TrainingBehavior[] TrainingModes={TrainingBehavior.Move,TrainingBehavior.Repeat,TrainingBehavior.Counter,TrainingBehavior.Grab,TrainingBehavior.Bag,TrainingBehavior.Block,TrainingBehavior.Spar};
        static readonly string[] TrainingNames={"RUCH I DYSTANS","POWTARZANIE CIOSU","ĆWICZENIE KONTRY","ĆWICZENIE CHWYTÓW","NIERUCHOMY CEL","OBRONA","SPARING"};
        int trainingMode,trainingAttack;
        GameObject trainingSelection,trainingPanel,trainingOpen;
        Text trainingModeLabel,trainingAttackLabel,liveTrainingModeLabel,liveTrainingAttackLabel,selectionScope;
        bool trainingWasPaused;
        string[] DrillMoves=>ArenaMatch.BasicMoves(match?.Training==true?match.Opponent.Configuration.Character:Roster[opponentIndex]);
        string DrillMove {get{var moves=DrillMoves;return moves.Length==0?"LIGHT_PUNCH":moves[trainingAttack%moves.Length];}}
        static string MoveName(string id)=>id switch{
            "LIGHT_PUNCH"=>"LEKKI CIOS","HEAVY_PUNCH"=>"MOCNY CIOS","LIGHT_KICK"=>"LEKKIE KOPNIĘCIE","HEAVY_KICK"=>"MOCNE KOPNIĘCIE",
            "UPPERCUT"=>"PODBRÓDKOWY","DOUBLE_PUNCH"=>"PODWÓJNY CIOS","ELBOW"=>"ŁOKIEĆ","CLINCH_KNEE"=>"KOLANO",
            "HOOK"=>"SIERPOWY","SIDE_KICK"=>"KOPNIĘCIE BOCZNE","SHOULDER"=>"BARK","SPIN_KICK"=>"KOPNIĘCIE OBROTOWE","FLYING_KICK"=>"KOPNIĘCIE Z WYSKOKU",
            "CRESCENT_KICK"=>"KOPNIĘCIE OKRĘŻNE","MEIA_LUA"=>"MEIA LUA","GROUND_KICK"=>"KOPNIĘCIE Z ZIEMI",_=>id};
        void BuildTrainingUi()
        {
            trainingSelection=Panel("Training selection",new Rect(24,348,776,56),Color.clear);Place(trainingSelection,menuSetup.transform,new Rect(124,364,776,56));
            trainingModeLabel=Click(trainingSelection.transform,"",new Rect(0,0,380,48),()=>ChangeTraining(false)).GetComponentInChildren<Text>();
            trainingAttackLabel=Click(trainingSelection.transform,"",new Rect(396,0,380,48),()=>ChangeTraining(true)).GetComponentInChildren<Text>();
            trainingOpen=Click(uiRoot,"TRENING",new Rect(550,12,144,36),OpenTraining);
            trainingPanel=Panel("Training settings",new Rect(172,166,680,238),new Color(.04f,.05f,.07f,.98f));
            Label(trainingPanel.transform,"Title",new Rect(24,16,632,40),24).text="USTAWIENIA TRENINGU";
            liveTrainingModeLabel=Click(trainingPanel.transform,"",new Rect(24,68,308,60),()=>ChangeTraining(false)).GetComponentInChildren<Text>();
            liveTrainingAttackLabel=Click(trainingPanel.transform,"",new Rect(348,68,308,60),()=>ChangeTraining(true)).GetComponentInChildren<Text>();
            Click(trainingPanel.transform,"WRÓĆ",new Rect(24,152,308,60),CloseTraining);
            Click(trainingPanel.transform,"MENU",new Rect(348,152,308,60),ShowSelection);
            trainingPanel.SetActive(false);trainingOpen.SetActive(false);RefreshTrainingLabels();
        }
        void RefreshTrainingLabels()
        {
            if(!trainingSelection)return;
            var selected=Modes[modeIndex]=="training";trainingSelection.SetActive(selected);if(selectionScope)selectionScope.gameObject.SetActive(!selected);
            var mode=TrainingNames[trainingMode];var attack=MoveName(DrillMove);trainingModeLabel.text=liveTrainingModeLabel.text=mode;
            trainingAttackLabel.text=liveTrainingAttackLabel.text=attack;
            var usesAttack=TrainingModes[trainingMode]==TrainingBehavior.Repeat||TrainingModes[trainingMode]==TrainingBehavior.Counter;
            trainingAttackLabel.transform.parent.GetComponent<Button>().interactable=usesAttack;
            liveTrainingAttackLabel.transform.parent.GetComponent<Button>().interactable=usesAttack;
            liveTrainingModeLabel.transform.parent.GetComponent<Button>().interactable=challengeRun==null;
        }
        void ChangeTraining(bool attack)
        {
            if(!attack&&challengeRun!=null)return;
            if(attack)trainingAttack=(trainingAttack+1)%System.Math.Max(1,DrillMoves.Length);else trainingMode=(trainingMode+1)%TrainingModes.Length;
            if(match?.Training==true)match.ConfigureTraining(TrainingModes[trainingMode],DrillMove);
            RefreshTrainingLabels();
        }
        void OpenTraining()
        {
            if(match?.Training!=true||loading||error!=null||trainingPanel.activeSelf)return;
            trainingWasPaused=match.Paused;Pause(true);RefreshTrainingLabels();trainingPanel.SetActive(true);RefreshPauseUi();trainingPanel.transform.SetAsLastSibling();controls.SetActive(false);
        }
        void CloseTraining()
        {
            trainingPanel.SetActive(false);
            if(match?.Training==true){Pause(trainingWasPaused||applicationSuspended);controls.SetActive(!match.Paused);}
        }
    }
}
