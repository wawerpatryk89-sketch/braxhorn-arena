using System.Threading;
using UnityEngine;
namespace Braxhorn.Arena
{
    // Original chapter gain, applied to the same decoded AAC samples. AudioSource
    // volume is limited to 1; the source game uses a Web Audio gain node above 1.
    public sealed class NativeAudioGain : MonoBehaviour
    {
        float gain=1;
        public float Gain {set=>Volatile.Write(ref gain,Mathf.Clamp(value,0,64));}
        void OnAudioFilterRead(float[] samples,int channels)
        {var factor=Volatile.Read(ref gain);for(var i=0;i<samples.Length;i++)samples[i]*=factor;}
    }
}
