using System;

namespace Braxhorn.Arena.Domain
{
    public enum CinematicPhase { Idle, Preparing, Playing, Failed, Notice }

    // Time spent outside the foreground never consumes the original four-second
    // copyright card or the decoder preparation deadline.
    public sealed class CinematicSequence
    {
        public CinematicPhase Phase { get; private set; }
        public bool Active => Phase != CinematicPhase.Idle;
        bool notice;
        double elapsed;
        public void Begin(bool copyright) { notice=copyright;elapsed=0;Phase=CinematicPhase.Preparing; }
        public void Prepared() { if(Phase==CinematicPhase.Preparing){Phase=CinematicPhase.Playing;elapsed=0;} }
        public void Error() { if(Phase==CinematicPhase.Preparing||Phase==CinematicPhase.Playing)Phase=CinematicPhase.Failed; }
        public void Retry() { if(Phase==CinematicPhase.Failed){Phase=CinematicPhase.Preparing;elapsed=0;} }
        public void EndFilm()
        {
            if(Phase!=CinematicPhase.Preparing&&Phase!=CinematicPhase.Playing&&Phase!=CinematicPhase.Failed)return;
            Phase=notice?CinematicPhase.Notice:CinematicPhase.Idle;elapsed=0;
        }
        public void Advance(double milliseconds,bool suspended,bool noticeReady)
        {
            if(double.IsNaN(milliseconds)||double.IsInfinity(milliseconds)||milliseconds<0)throw new ArgumentOutOfRangeException(nameof(milliseconds));
            if(suspended)return;
            if(Phase==CinematicPhase.Preparing){elapsed+=milliseconds;if(elapsed>=20000)Error();}
            else if(Phase==CinematicPhase.Notice&&noticeReady){elapsed+=milliseconds;if(elapsed>=4000)Stop();}
        }
        public void Stop() { Phase=CinematicPhase.Idle;elapsed=0; }
    }
}
