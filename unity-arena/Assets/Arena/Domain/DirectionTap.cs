using System;
namespace Braxhorn.Arena.Domain
{
    // v271 directionPress: a released second press within 300 ms starts sprint/retreat.
    public sealed class DirectionTap
    {
        int direction;
        double time;
        bool released;
        public bool SprintHeld {get;private set;}
        public bool Press(int value,double milliseconds,int face)
        {
            if(Math.Abs(value)!=1||Math.Abs(face)!=1||double.IsNaN(milliseconds)||double.IsInfinity(milliseconds))throw new ArgumentOutOfRangeException(nameof(value));
            var twice=direction==value&&released&&milliseconds>=time&&milliseconds-time<300;
            direction=value;time=milliseconds;released=false;SprintHeld=twice&&value==face;
            if(twice&&value==-face){direction=0;return true;}return false;
        }
        public void Release(int value){if(value==direction){released=true;SprintHeld=false;}}
        public void Reset(){direction=0;time=0;released=false;SprintHeld=false;}
    }
}
