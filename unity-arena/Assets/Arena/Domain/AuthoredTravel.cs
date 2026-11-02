using System;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public static class AuthoredTravel
    {
        public static double Distance(CombatAction action,double seconds)
        {
            var samples=action.Source["prefightRootSamples"] as JArray;if(samples==null||samples.Count<2)return 0;
            var duration=(double)action.Source["duration"];var cycles=Math.Floor(Math.Max(0,seconds)/duration);var t=Math.Max(0,seconds)%duration;
            var i=1;while(i<samples.Count-1&&(double)samples[i][0]<t)i++;
            var a=samples[i-1];var b=samples[i];var u=Math.Max(0,Math.Min(1,(t-(double)a[0])/Math.Max(1e-8,(double)b[0]-(double)a[0])));
            return cycles*(double)samples[samples.Count-1][1]+(double)a[1]+((double)b[1]-(double)a[1])*u;
        }
        public static double Time(CombatAction action,double distance)
        {
            var s=(JArray)action.Source["prefightRootSamples"];var stride=(double)s[s.Count-1][1];if(stride<=0)throw new ArgumentException("Missing authored stride");
            var cycles=Math.Floor(distance/stride);var remaining=distance-cycles*stride;var duration=(double)action.Source["duration"];
            if(remaining<1e-7)return cycles*duration;var i=1;while(i<s.Count-1&&(double)s[i][1]<remaining)i++;
            var a=s[i-1];var b=s[i];return cycles*duration+(double)a[0]+((double)b[0]-(double)a[0])*(remaining-(double)a[1])/Math.Max(1e-8,(double)b[1]-(double)a[1]);
        }
    }
}
