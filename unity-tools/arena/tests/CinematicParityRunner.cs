using System;
using Braxhorn.Arena.Domain;

static class CinematicParityRunner
{
    static int checks;
    static void Expect(bool value,string name){checks++;if(!value)throw new Exception("Cinematic: "+name);}
    public static void Run()
    {
        checks=0;var sequence=new CinematicSequence();
        Expect(!sequence.Active,"initial state");
        sequence.Begin(true);sequence.Advance(60000,true,false);
        Expect(sequence.Phase==CinematicPhase.Preparing,"background does not time out decoder");
        sequence.Advance(19999,false,false);Expect(sequence.Phase==CinematicPhase.Preparing,"preparation before deadline");
        sequence.Advance(1,false,false);Expect(sequence.Phase==CinematicPhase.Failed,"preparation exposes retry at 20 seconds");
        sequence.Prepared();Expect(sequence.Phase==CinematicPhase.Failed,"late preparation cannot restart failed decoder");
        sequence.Retry();sequence.Prepared();Expect(sequence.Phase==CinematicPhase.Playing,"retry reaches playback");
        sequence.EndFilm();Expect(sequence.Phase==CinematicPhase.Notice,"start skip/end still displays copyright");
        sequence.EndFilm();Expect(sequence.Phase==CinematicPhase.Notice,"double skip cannot bypass notice");
        sequence.Advance(60000,false,false);Expect(sequence.Active,"wait for copyright pixels");
        sequence.Advance(2000,false,true);sequence.Advance(60000,true,true);Expect(sequence.Active,"copyright timer paused in background");
        sequence.Advance(1999,false,true);Expect(sequence.Active,"copyright gets four foreground seconds");
        sequence.Advance(1,false,true);Expect(!sequence.Active,"copyright completes");
        sequence.EndFilm();sequence.Prepared();sequence.Error();Expect(!sequence.Active,"late decoder events do not reopen completed sequence");
        foreach(var phase in new[]{CinematicPhase.Preparing,CinematicPhase.Playing,CinematicPhase.Failed})
        {
            sequence.Begin(false);if(phase==CinematicPhase.Playing)sequence.Prepared();else if(phase==CinematicPhase.Failed)sequence.Error();
            sequence.EndFilm();Expect(!sequence.Active,"skip always leaves fighter/victory film from "+phase);
        }
        sequence.Begin(true);sequence.EndFilm();sequence.Stop();sequence.Advance(4000,false,true);Expect(!sequence.Active,"cancel never reopens a notice");
        sequence.Begin(true);sequence.EndFilm();sequence.Advance(3999,false,true);sequence.Begin(true);sequence.Prepared();sequence.EndFilm();sequence.Advance(1,false,true);
        Expect(sequence.Phase==CinematicPhase.Notice,"a new sequence resets remaining notice duration");
        foreach(var invalid in new[]{-1.0,double.NaN,double.PositiveInfinity})
        {bool threw=false;try{sequence.Advance(invalid,false,true);}catch(ArgumentOutOfRangeException){threw=true;}Expect(threw,"invalid elapsed time rejected");}
        Console.WriteLine("PASS "+checks+" cinematic flow checks (start/skip/retry/background/copyright/cancellation); decoder rendering still requires Unity/device validation.");
    }
}
