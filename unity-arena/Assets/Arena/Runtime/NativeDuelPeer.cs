using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;
using UnityEngine;
using Unity.WebRTC;

namespace Braxhorn.Arena
{
    // HTTPS owns room authorization and result confirmation. This optional
    // unordered data channel accelerates already-authorized game state/input.
    public sealed class NativeDuelPeer : MonoBehaviour
    {
        RTCPeerConnection connection;
        RTCDataChannel channel;
        DuelPeerWire wire;
        JObject description,pendingSignal;
        readonly JArray candidates=new JArray();
        readonly HashSet<string> added=new HashSet<string>();
        bool host,closed,busy;
        int restarts;
        double lastData=double.NegativeInfinity,lastPing=double.NegativeInfinity,awaitingPing=-1,restartAt=double.PositiveInfinity;
        string remoteSdp;
        Action<JObject> receive;
        Action changed;
        public bool Open=>!closed&&channel?.ReadyState==RTCDataChannelState.Open;
        public bool Alive=>Open&&Now-lastData<750;
        public bool Connected=>!closed&&connection?.ConnectionState==RTCPeerConnectionState.Connected;
        public bool Failed=>closed;
        public double? RoundTripMs {get;private set;}
        static double Now=>Time.realtimeSinceStartupAsDouble*1000;
        public JObject Signal=>description==null?null:new JObject{["type"]=description["type"],["sdp"]=description["sdp"],["candidates"]=candidates.DeepClone()};
        public bool Initialize(bool isHost,ArenaIceServer[] servers,Action<JObject> onPacket,Action onSignal,AudioStreamTrack audio=null,Action<AudioStreamTrack> onAudio=null)
        {
            host=isHost;receive=onPacket;changed=onSignal;wire=new DuelPeerWire(host);
            try
            {
                var config=new RTCConfiguration{iceServers=servers.Select(s=>new RTCIceServer{urls=s.Urls,username=s.Username,credential=s.Credential}).ToArray()};
                connection=new RTCPeerConnection(ref config);
                if(audio!=null)
                {
                    connection.AddTrack(audio);
                    connection.OnTrack=e=>{if(closed)return;if(e.Track is AudioStreamTrack remote)onAudio?.Invoke(remote);else e.Track?.Dispose();};
                }
                connection.OnIceCandidate=c=>{using(c){if(closed||c==null||candidates.Count>=24)return;candidates.Add(new JObject{["candidate"]=c.Candidate,["sdpMid"]=c.SdpMid,["sdpMLineIndex"]=c.SdpMLineIndex});changed?.Invoke();}};
                connection.OnDataChannel=c=>{if(audio==null)Bind(c);else{c.Close();c.Dispose();}};
                connection.OnConnectionStateChange=state=>{if(closed)return;if(state==RTCPeerConnectionState.Connected){restarts=0;restartAt=double.PositiveInfinity;}else if(host&&(state==RTCPeerConnectionState.Failed||state==RTCPeerConnectionState.Disconnected))restartAt=Now+(state==RTCPeerConnectionState.Failed?0:3000);};
                if(host){if(audio==null)Bind(connection.CreateDataChannel("arena",new RTCDataChannelInit{ordered=false,maxRetransmits=0}));StartCoroutine(Publish(true));}
                return true;
            }
            catch(Exception){Close();return false;}
        }
        void Bind(RTCDataChannel value)
        {
            if(closed||channel!=null){value.Close();value.Dispose();return;}channel=value;
            channel.OnMessage=bytes=>
            {
                if(closed)return;var packet=wire.Decode(bytes,out var ping,out var pong);
                if(ping.HasValue&&Open&&channel.BufferedAmount==0)TrySend(DuelPeerWire.Ping(ping.Value,true));
                if(pong.HasValue&&pong.Value==awaitingPing){RoundTripMs=Math.Max(0,Now-awaitingPing);awaitingPing=-1;}
                if(packet!=null){lastData=Now;receive?.Invoke(packet);}
            };
        }
        bool TrySend(string text)
        {if(text==null||!Open||channel.BufferedAmount>0)return false;try{channel.Send(text);return true;}catch(Exception){return false;}}
        public bool Send(JObject packet)
        {
            if(!Open||channel.BufferedAmount>0)return false;if(!TrySend(wire.Encode(packet,Now)))return false;
            if(Now-lastPing>=1000){lastPing=awaitingPing=Now;TrySend(DuelPeerWire.Ping(awaitingPing));}return true;
        }
        public void Accept(JObject signal)
        {if(closed||signal==null||!DuelWire.Signal(signal)||(string)signal["type"]!=(host?"answer":"offer"))return;pendingSignal=(JObject)signal.DeepClone();}
        void Update()
        {
            if(closed||busy)return;
            if(pendingSignal!=null){var value=pendingSignal;pendingSignal=null;StartCoroutine(AcceptRemote(value));}
            else if(host&&Now>=restartAt&&restarts<3){restarts++;restartAt=Now+8000;try{connection.RestartIce();StartCoroutine(Publish(true));}catch(Exception){Close();}}
        }
        T StartOperation<T>(Func<T> start) where T:AsyncOperationBase
        {try{return start();}catch(Exception){Close();return null;}}
        IEnumerator Wait(AsyncOperationBase operation)
        {var deadline=Now+10000;while(!closed&&!operation.IsDone&&Now<deadline)yield return null;if(!closed&&(!operation.IsDone||operation.IsError))Close();}
        IEnumerator Publish(bool offer)
        {
            busy=true;var create=StartOperation(()=>offer?connection.CreateOffer():connection.CreateAnswer());if(create==null)yield break;
            yield return Wait(create);if(closed)yield break;var value=create.Desc;candidates.Clear();
            var apply=StartOperation(()=>connection.SetLocalDescription(ref value));if(apply==null)yield break;yield return Wait(apply);if(closed)yield break;
            description=new JObject{["type"]=offer?"offer":"answer",["sdp"]=connection.LocalDescription.sdp};
            if(!DuelWire.Signal(Signal)){Close();yield break;}busy=false;changed?.Invoke();
        }
        IEnumerator AcceptRemote(JObject signal)
        {
            busy=true;var sdp=(string)signal["sdp"];
            if(remoteSdp!=sdp)
            {
                var value=new RTCSessionDescription{type=host?RTCSdpType.Answer:RTCSdpType.Offer,sdp=sdp};var apply=StartOperation(()=>connection.SetRemoteDescription(ref value));if(apply==null)yield break;yield return Wait(apply);if(closed)yield break;
                remoteSdp=sdp;added.Clear();if(!host){yield return Publish(false);if(closed)yield break;busy=true;}
            }
            if(signal["candidates"] is JArray list)foreach(var c in list)
            {
                var key=c.ToString(Newtonsoft.Json.Formatting.None);if(added.Contains(key))continue;
                if((double?)c["sdpMLineIndex"]>int.MaxValue)continue;
                try{using var candidate=new RTCIceCandidate(new RTCIceCandidateInit{candidate=(string)c["candidate"],sdpMid=(string)c["sdpMid"],sdpMLineIndex=(int?)c["sdpMLineIndex"]});if(connection.AddIceCandidate(candidate))added.Add(key);}catch(Exception){/* Repeat ICE candidates may succeed on the next room sync. */}
            }
            busy=false;
        }
        public void Close()
        {
            if(closed)return;closed=true;StopAllCoroutines();receive=null;changed=null;description=pendingSignal=null;candidates.Clear();added.Clear();
            if(channel!=null){channel.OnMessage=null;try{channel.Close();}catch(Exception){}try{channel.Dispose();}catch(Exception){}channel=null;}
            if(connection!=null){connection.OnIceCandidate=null;connection.OnDataChannel=null;connection.OnConnectionStateChange=null;connection.OnTrack=null;try{connection.Close();}catch(Exception){}try{connection.Dispose();}catch(Exception){}connection=null;}
        }
        void OnDestroy()=>Close();
    }
}
