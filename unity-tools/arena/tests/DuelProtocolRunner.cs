using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Braxhorn.Arena;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

static class DuelProtocolRunner
{
    static int checks;
    static void Check(bool value,string message){checks++;if(!value)throw new Exception("Duel: "+message);}
    static async Task Reject(Func<Task> action,string message)
    {try{await action();}catch(ArgumentException){Check(true,message);return;}catch(ArenaServiceException){Check(true,message);return;}throw new Exception("Accepted invalid duel: "+message);}
    sealed class Handler:HttpMessageHandler
    {
        internal readonly List<JObject> Calls=new List<JObject>();
        internal JObject Room=new JObject{["code"]="ABCDEF01",["status"]="waiting",["hostFighter"]="BRAX",["hostOutfit"]="BRAX",["hostName"]="Host",["guestFighter"]="BRAX",["guestOutfit"]="BRAX",["guestName"]="Guest",["arena"]="snow",["seq"]=0,["now"]=10000,["peerSeen"]=10000,["peerReady"]=true,["cosmeticsReady"]=true,["scheduledAt"]=0,["resultStatus"]=""};
        internal TaskCompletionSource<bool> Gate;
        internal string Failure,Result="pending";
        internal bool WrongScore;
        internal JObject Ice=new JObject{["iceServers"]=new JArray(new JObject{["urls"]=new JArray("turns:relay.example:443?transport=tcp"),["username"]="ephemeral-user",["credential"]="ephemeral-secret"})};
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken cancellation)
        {
            if(request.RequestUri.AbsolutePath=="/api/rtc")
            {var auth=JObject.Parse(await request.Content.ReadAsStringAsync());Check((string)auth["code"]=="ABCDEF01"&&(string)auth["token"]=="ephemeral-capability"&&auth.Count==2,"ICE request scoped to room capability");return Reply(Ice);}
            Check(request.RequestUri.AbsolutePath=="/api/duel","uses existing endpoint");
            var body=JObject.Parse(await request.Content.ReadAsStringAsync());Calls.Add(body);var action=(string)body["action"];
            if(action==Failure)return Reply(new JObject{["error"]="Unavailable"},503);
            if(action=="create"||action=="join")return Reply(new JObject{["code"]="ABCDEF01",["token"]="ephemeral-capability",["role"]=action=="create"?"host":"guest"});
            Check((string)body["token"]=="ephemeral-capability"&&(string)body["code"]=="ABCDEF01","writes carry only this room capability");
            if(action=="sync"){if(Gate!=null)await Gate.Task;return Reply(Room);}
            if(action=="leave")return Reply(new JObject{["closed"]=true});
            if(action=="review")return Reply(new JObject{["resultStatus"]="disputed"});
            return Reply(new JObject{["resultStatus"]=Result,["score"]=WrongScore?new JArray(0,2):body["score"]});
        }
        static HttpResponseMessage Reply(JObject data,int code=200)=>new HttpResponseMessage((HttpStatusCode)code){Content=new StringContent(data.ToString())};
    }
    static void Wire()
    {
        var input=new DuelInputQueue();Check(DuelWire.Input(input.Packet()),"idle input valid");
        input.Set(new FightInput(1,grab:true),true);Check(input.Press("punch"),"attack queued");var packet=input.Packet();
        Check(JToken.DeepEquals(packet,input.Packet()),"retry retains exact input/event sequence");input.Acknowledge(99);Check(input.Pending==1,"future acknowledgement cannot eat unsent events");
        var host=new DuelHostInput();var config=MatchParityRunner.Config();var match=new ArenaMatch(config,config,()=>.5,training:true);match.Advance(3000);match.Player.X=500;match.Opponent.X=520;
        Check(host.Receive(packet),"fresh input accepted");host.Apply(match);Check(match.PairActive&&host.Acknowledged==1,"guest paired input reaches authoritative side once");
        match.Advance(700);var hp=match.Player.Hp;Check(!host.Receive(packet),"duplicate input ignored");host.Apply(match);match.Advance(700);Check(match.Player.Hp==hp,"retry cannot duplicate damage");
        input.Acknowledge(1);Check(input.Pending==0,"ack removes only applied events");
        input.Clear();input.Set(new FightInput(-1),true);host.Receive(input.Packet());host.DropPending();Check(host.Receive(input.Packet()),"reconnection restores held state without replaying acknowledged strikes");
        var clean=new ArenaMatch(config,config,()=>.5);clean.Advance(3000);host.Apply(clean);Check(clean.Opponent.Input.Direction==-1,"restored movement reaches guest side");
        input.Set(default,false);Check(!input.Press("punch")&&input.Pending==0,"background cannot queue attacks");host.Receive(input.Packet());Check(!host.Visible,"host sees background pause");
        input.Set(default,true);for(var i=0;i<64;i++)input.Press("punch");Check(!input.Press("kick")&&input.Pending==64,"bounded retry queue");
        var invalid=input.Packet();invalid["held"]["jump"]=true;Check(!DuelWire.Input(invalid),"unknown hold rejected");
        invalid=input.Packet();invalid["events"][0]["id"]=1.5;Check(!DuelWire.Input(invalid),"fractional event id rejected");
        invalid=input.Packet();invalid["voice"]=false;Check(!DuelWire.Input(invalid),"malformed voice cannot throw or pass");
        var state=clean.NetworkSnapshot(1,1,3,100);Check(DuelWire.Snapshot(state)&&DuelWire.Renderable(state,new[]{config,config}),"native snapshot fits original wire and loaded animations");
        var view=new DuelRemoteView(config,config,clean.Width,clean.Height);Check(view.Receive(state,100),"read-only guest accepts snapshot");Check(!view.Receive(state,200),"out-of-order snapshot ignored");
        var pose=view.Pose(1,120);Check(Math.Abs(pose.X-clean.Opponent.X)<1e-8&&pose.Face==clean.Opponent.Face,"side and logical position preserved");
        hp=clean.Player.Hp;var time=clean.RemainingSeconds;for(var i=0;i<500;i++)view.Pose(0,200+i);Check(clean.Player.Hp==hp&&clean.RemainingSeconds==time,"rendering cannot change authority or clock");
        var newer=(JObject)state.DeepClone();newer["snapshotId"]=2;newer["state"]["simTime"]=(double)state["state"]["simTime"]-1;Check(!view.Receive(newer,200),"time regression rejected");
        newer=(JObject)state.DeepClone();newer["snapshotId"]=2;newer["actors"][0]["a"]="UNKNOWN_POSE";Check(DuelWire.Snapshot(newer)&&!view.Receive(newer,200),"storage validation is not sufficient for rendering");
        newer=(JObject)state.DeepClone();newer["snapshotId"]=2;newer["actors"][0]["strikeMotion"]=new JObject{["weight"]=-1,["clock"]=0,["run"]=true};Check(!view.Receive(newer,200),"invalid optional animation values rejected");
        newer=(JObject)state.DeepClone();newer["state"]["wins"]=new JArray(2,2);Check(!DuelWire.Snapshot(newer),"impossible scores rejected");
        newer=(JObject)state.DeepClone();newer["actors"][0]["frame"]=9999.9999999;Check(DuelWire.Snapshot(newer),"original exclusive 10000 boundary retained");newer["actors"][0]["frame"]=10000;Check(!DuelWire.Snapshot(newer),"10000 is invalid");
        Check(!DuelWire.Input(null)&&!DuelWire.Snapshot(new JArray()),"nonobjects rejected without exceptions");
    }
    static void Effects()
    {
        var source=new BloodEffects(()=>.5);for(var i=0;i<4;i++)source.Hit(0,12,"head",new Point2(300,300),1,1024,576,450);
        var p=source.NetworkSnapshot(1024,576);var target=new BloodEffects(()=>.5);
        Check(target.RestoreNetwork(p,512,288),"original blood packet restored");Check(target.Particles.Count==source.Particles.Count&&target.WoundLevel(0)==2,"blood marks/count retained");
        Check(target.Particles[0].X==source.Particles[0].X/2&&target.Particles[0].VelocityY==source.Particles[0].VelocityY/2&&target.Particles[0].Radius==source.Particles[0].Radius/2,"particle position/velocity/radius scale to receiving viewport");
        var count=target.Particles.Count;p["particles"][0]["x"]=1e300;Check(!target.RestoreNetwork(p,512,288)&&target.Particles.Count==count,"unsafe finite effects rejected atomically");
        p=source.NetworkSnapshot(1024,576);p["size"]["height"]=0;Check(!target.RestoreNetwork(p,512,288),"zero size cannot divide particles");
    }
    static void Peer()
    {
        var sender=new DuelPeerWire(false);var receiver=new DuelPeerWire(true);var input=new DuelInputQueue();input.Press("kick");
        var text=sender.Encode(input.Packet(),100);Check(JObject.Parse(text)["wire"]==null,"binary wire not advertised without codec");
        var bytes=System.Text.Encoding.UTF8.GetBytes(text);var data=receiver.Decode(bytes,out var ping,out var pong);Check(data!=null&&ping==null&&pong==null,"original JSON envelope decodes");
        Check(receiver.Decode(bytes,out _,out _)==null,"direct duplicate ignored before gameplay");
        Check(new DuelPeerWire(false).Decode(bytes,out _,out _)==null,"wrong peer direction rejected");
        var malformed=JObject.Parse(text);malformed["seq"]=2;malformed["data"]["held"]["cheat"]=true;Check(receiver.Decode(System.Text.Encoding.UTF8.GetBytes(malformed.ToString()),out _,out _)==null,"malformed direct payload cannot reach controller");
        var pingText=DuelPeerWire.Ping(123);receiver.Decode(System.Text.Encoding.UTF8.GetBytes(pingText),out ping,out pong);Check(ping==123&&pong==null,"ping echoed separately from inputs");
        receiver.Decode(System.Text.Encoding.UTF8.GetBytes(DuelPeerWire.Ping(123,true)),out ping,out pong);Check(ping==null&&pong==123,"pong correlates without treating it as gameplay freshness");
        Check(receiver.Decode(new byte[]{255,254},out _,out _)==null,"invalid UTF8 rejected");Check(receiver.Decode(new byte[262145],out _,out _)==null,"oversize message rejected");
        Check(receiver.Decode(System.Text.Encoding.UTF8.GetBytes(text+"{}"),out _,out _)==null,"trailing JSON rejected");
        var cfg=MatchParityRunner.Config();var state=new ArenaMatch(cfg,cfg,()=>.5).NetworkSnapshot(1,0,0,0);
        var encoded=new DuelPeerWire(true).Encode(state,0);Check(new DuelPeerWire(false).Decode(System.Text.Encoding.UTF8.GetBytes(encoded),out _,out _)!=null,"host state is readable by guest");
    }
    static void Actual(string root)
    {
        foreach(var folder in Directory.GetDirectories(root))
        {
            var file=Path.Combine(folder,"config.bytes");if(!File.Exists(file))continue;var info=JObject.Parse(File.ReadAllText(Path.Combine(folder,"fighter.json")));
            var cfg=CombatConfiguration.Read((string)info["base"],File.ReadAllBytes(file));var match=new ArenaMatch(cfg,cfg,()=>.5,training:true);match.Advance(3000);
            Check(cfg.Actions.Keys.GroupBy(id=>id.ToUpperInvariant()).All(group=>group.Count()==1),"every authored network alias is unique");
            var view=new DuelRemoteView(cfg,cfg,1024,576);long id=0;
            foreach(var button in new[]{FightButton.Punch,FightButton.Heavy,FightButton.Kick,FightButton.Combo})
            {
                match.Press(0,button);
                for(var i=0;i<160;i++)
                {match.Advance(100);var p=match.NetworkSnapshot(++id,0,0,id*100);if(!view.Receive(p,id*100))throw new Exception("Rejected actual pose "+Path.GetFileName(folder)+" "+p["actors"][0]["a"]);view.Pose(0,id*100+20);view.Pose(1,id*100+20);}
                Check(true,Path.GetFileName(folder)+" authored poses fit wire bounds");
            }
        }
    }
    static void Reference(string root)
    {
        using var file=File.OpenRead(Path.Combine(root,"duel-wire-reference.json.gz"));using var gzip=new GZipStream(file,CompressionMode.Decompress);using var reader=new StreamReader(gzip);var reference=JObject.Parse(reader.ReadToEnd());
        Check((string)reference["source"]=="f355fe6ac6af41518fde420382512d49bd27d51a","frozen published validator source");
        foreach(var row in reference["cases"]){var accepted=(string)row["type"]=="input"?DuelWire.Input(row["payload"]):DuelWire.Snapshot(row["payload"]);Check(accepted==(bool)row["valid"],"source validator: "+(string)row["label"]);}
    }
    internal static void Run(string assets=null,string references=null){checks=0;Wire();Effects();Peer();if(references!=null)Reference(references);if(assets!=null)Actual(assets);Protocol().GetAwaiter().GetResult();Console.WriteLine("PASS "+checks+" duel checks: original room contract, deduplicated input, host authority, remote pose/effect validation, stale responses, disconnection, RTC envelope and explicit score confirmation. No live room created; transport/device latency untested.");}
    static async Task Protocol()
    {
        var h=new Handler();using var c=new ArenaOnlineClient("https://arena.invalid",h);
        var lease=await c.CreateDuel("BRAX","BRAX","snow");Check(lease.Role=="host"&&lease.Code=="ABCDEF01","host lease confirmed");
        await Reject(()=>c.JoinDuel("INVALID","BRAX","BRAX"),"bad room rejected before request");await Reject(()=>c.CreateDuel("BRAX","NYXA","snow"),"mismatched outfit rejected");await Reject(()=>c.CreateDuel("BRAX","BRAX_WHITE","snow"),"unowned paid outfit not granted");
        await Reject(()=>c.SyncDuel(null,false,1,"BRAX"),"null lease is argument error");
        var session=new ArenaDuelSession(c,lease,0);await session.Poll(100);Check(!session.Playing&&!session.Connected(100),"waiting room cannot start simulation");
        h.Room["status"]="playing";await session.Poll(200);Check(session.Connected(200)&&!session.Connected(2701),"2500ms peer freshness gate");Check(session.Expired(20201),"20s disconnection ends match without win");
        session.Terminal(2,1);await session.Poll(210);Check(!h.Calls.Any(b=>(string)b["action"]=="result"),"terminal state never auto-confirms score");
        await session.Confirm();Check(session.ConfirmedByMe&&session.ResultStatus=="pending","first confirmation waits for second participant");var count=h.Calls.Count;await session.Confirm();Check(h.Calls.Count==count,"confirmed local report cannot double-submit");
        h.Room["resultStatus"]="confirmed";await session.Poll(300);Check(session.ResultStatus=="confirmed","only server confirms both players");
        h.Failure="sync";await session.Poll(400);Check(!session.Connected(400)&&!session.Closed,"temporary failure pauses without fabricating a winner");h.Failure=null;
        await session.Leave();Check(session.Closed,"leaving deactivates immediately");count=h.Calls.Count;await session.Poll(500);Check(h.Calls.Count==count,"closed session cannot keep polling");
        var guest=await c.JoinDuel(" abcdef01 ","BRAX","BRAX");Check(guest.Role=="guest"&&guest.Code=="ABCDEF01","room code normalized once");
        h.Room["peerReady"]="true";await Reject(()=>c.SyncDuel(guest,false,1,"BRAX"),"boolean strings cannot indicate readiness");h.Room["peerReady"]=true;
        h.Room["guestOutfit"]="NYXA";await Reject(()=>c.SyncDuel(guest,false,2,"BRAX"),"server outfit mismatch rejected");h.Room["guestOutfit"]="BRAX";
        h.Room["resultStatus"]="";var late=new ArenaDuelSession(c,guest,0);h.Gate=new TaskCompletionSource<bool>();var poll=late.Poll(10);var leave=late.Leave();h.Gate.SetResult(true);await Task.WhenAll(poll,leave);h.Gate=null;Check(late.Room==null&&late.Closed,"late response cannot revive departed room");
        var disputed=new ArenaDuelSession(c,guest,0);await disputed.Poll(100);await disputed.Dispute();Check(disputed.ResultStatus=="disputed","review follows explicit action");
        h.Result="confirmed";h.WrongScore=true;await Reject(()=>c.ConfirmDuel(guest,2,1),"mismatched confirmation receipt rejected");
        var ice=await c.ReadIce(guest);Check(ice.Length==1&&ice[0].Urls[0].StartsWith("turns:")&&ice[0].Username=="ephemeral-user","original TURN response retained in memory");
        h.Ice["iceServers"][0]["urls"]=new JArray("https://unrelated.example");await Reject(()=>c.ReadIce(guest),"non-ICE URL rejected");
    }
}
