using System;
using Braxhorn.Arena.Domain;
using UnityEngine;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        readonly KnockoutReplay replay=new KnockoutReplay();
        GameObject replaySkip;
        int replayRound;
        bool replayAttempted;
        void BuildReplayUi()
        {replaySkip=Click(uiRoot,"POMIŃ POWTÓRKĘ",new Rect(372,476,280,60),FinishReplay);replaySkip.SetActive(false);}
        void ResetReplay(){replay.Clear();replayRound=0;replayAttempted=false;if(replaySkip)replaySkip.SetActive(false);}
        void CaptureReplay()
        {
            if(adventure!=null||match.Training||replay.Active)return;
            if(replayRound!=match.Round){replay.Clear();replayRound=match.Round;}
            if(match.Phase==MatchPhase.Countdown)return;
            if(match.Player.Hp<=0||match.Opponent.Hp<=0)replay.Mark(match.SimulationMs);
            ReplayActor Actor(int i){var f=match.Fighter(i);return new ReplayActor(match.Presentation(i),f.MovingGait,f.MovingGaitSeconds,f.MovingGaitWeight);}
            replay.Capture(match.SimulationMs,Actor(0),Actor(1));
        }
        bool BeginReplay()
        {
            if(replayAttempted)return false;replayAttempted=true;
            if(!replay.Play())return false;ReleaseControls();controls.SetActive(false);arenaMedia.SetPaused(true);fightAudio.Stop();
            hud.text="DECYDUJĄCY CIOS";replaySkip.SetActive(true);replaySkip.transform.SetAsLastSibling();RenderReplay();return true;
        }
        void UpdateReplay()
        {
            if(Input.GetKeyDown(KeyCode.Escape))Pause(!match.Paused);
            pauseLabel.text=match.Paused?"WZNÓW":"PAUZA";
            if(match.Paused||applicationSuspended)return;
            replay.Step(Math.Min(100,Time.unscaledDeltaTime*1000));RenderReplay();
            while(replay.TrySound(out var e))fightAudio.Consume(e,match,mediaCatalog.Arenas[arenaIndex]);
            if(!replay.Active)FinishReplay();
        }
        void RenderReplay()
        {
            if(replay.Current==null)return;
            var samples=new[]{replay.Current.First,replay.Current.Second};
            for(var i=0;i<2;i++)
            {
                var f=samples[i];RenderFighter(i,f.Pose,replay.Current.Time/1000,true);
                // Replay owns pose time; bypass transition blending against the completed match clock.
                poses[i].ApplyMovingGait(f.Gait,f.GaitSeconds,f.GaitWeight);
            }
        }
        void FinishReplay()
        {
            if(!replaySkip||!replaySkip.activeSelf)return;
            replay.Clear();replaySkip.SetActive(false);fightAudio.Stop();
            if(match!=null){for(var i=0;i<2;i++)RenderFighter(i,match.Presentation(i));if(!resultApplied)CompleteMatch();}
        }
    }
}
