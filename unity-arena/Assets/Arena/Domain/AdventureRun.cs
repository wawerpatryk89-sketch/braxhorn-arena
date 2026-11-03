using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    public enum AdventurePhase { Entrance, Explore, Combat, Aftermath, Complete, Dead }
    public sealed class AdventureRun
    {
        public ArenaMatch Match { get; }
        public JObject Route { get; }
        public string[] Opponents { get; }
        public AdventurePhase Phase { get; private set; }=AdventurePhase.Entrance;
        public double X { get; private set; }
        public double Camera { get; private set; }
        public double Span { get; }
        public double ElapsedMs { get; private set; }
        public int Defeated { get; private set; }
        public int Score { get; private set; }
        public bool Healed { get; private set; }
        public bool EnemyEntering { get; private set; }
        public bool OpponentVisible=>EnemyEntering||Phase==AdventurePhase.Combat||Phase==AdventurePhase.Aftermath;
        public double Depth { get; private set; }=1;
        public double Yaw { get; private set; }=Math.PI/2;
        public bool Masked=>Phase==AdventurePhase.Entrance&&entrance.Masked;
        public double EntryGround { get; private set; }
        public string PendingOpponentId=>!installed&&Defeated<Opponents.Length?Opponents[Defeated]:null;
        public string PreloadOpponentId=>Defeated+1<Opponents.Length?Opponents[Defeated+1]:null;
        public int Chapter=>Math.Max(0,Math.Min(chapters.Count-1,(int)Math.Floor(X/100)));
        public string IncomingId { get; private set; }
        public bool IncomingVisible { get; private set; }
        public double IncomingX { get; private set; }
        public double IncomingSeconds { get; private set; }
        public CombatAction IncomingAction=>incoming?["ENTRY_RUN"];
        public FighterPresentation IncomingPresentation
        {
            get{if(!IncomingVisible)throw new InvalidOperationException("Incoming opponent is not visible");var c=IncomingAction;var seconds=IncomingSeconds%(c.DurationMs/1000);return new FighterPresentation(c,seconds,(IncomingX-Camera)/Span*Match.Width,0,-1,c.FrameAt(seconds*1000));}
        }
        CombatConfiguration incoming;
        int incomingIndex;
        readonly JArray chapters;
        readonly CpuLevel level;
        readonly AdventureEntrance entrance;
        readonly double entryStart,nativeDuration,ease,walkDuration,length;
        double phaseMs,enemyClock,entryHp,settledMs,enemyMaxHp;
        bool installed,corpseReady;
        FighterPresentation corpsePose;
        double corpseCamera;
        readonly Queue<AdventureProgressEvent> progressEvents=new Queue<AdventureProgressEvent>();
        public bool TryDequeueProgress(out AdventureProgressEvent value)
        {if(progressEvents.Count==0){value=default;return false;}value=progressEvents.Dequeue();return true;}
        void ProgressEvent(string action,int next,string status)
        {progressEvents.Enqueue(new AdventureProgressEvent(action,Defeated,next,Score,status,Match.Player.Hp,Match.Opponent.Hp,ElapsedMs));}
        public AdventureRun(JObject route,string playerId,CombatConfiguration player,CombatConfiguration firstOpponent,string[] opponents,CpuLevel difficulty,double width,double height,Func<double> random)
        {
            Route=route??throw new ArgumentNullException(nameof(route));chapters=(JArray)route["chapters"];
            if(chapters==null||chapters.Count!=6||opponents==null||opponents.Length!=6||opponents[5]!="BOSS")throw new ArgumentException("A complete original six-chapter route is required");
            Opponents=(string[])opponents.Clone();level=difficulty;length=chapters.Count*100;Span=MediaGeometry.AdventureSpan(width,height);
            Match=new ArenaMatch(player,firstOpponent,random,width:width,height:height,groundRatio:.84);Match.EnableAdventure();
            if(!player.Has("ENTRY_RUN")||!player.Has("ADVENTURE_WALK"))throw new ArgumentException("Original adventure motion export is missing for "+playerId);
            var run=player["ENTRY_RUN"];entrance=new AdventureEntrance(run.Source,(JObject)route["entry"],width,height,Match.Scale*run.Scale);
            X=entrance.X0;Depth=entrance.Depth;Yaw=entrance.Sample(0).Yaw;EntryGround=entrance.Sample(0).Ground;
            var stop=(double?)run.Source["entryStopTime"]??0;var stride=AuthoredTravel.Distance(run,(double)run.Source["duration"]);
            var cycles=Math.Ceiling(Math.Max(0,entrance.Distance-AuthoredTravel.Distance(run,stop))/stride);
            var end=cycles*(double)run.Source["duration"]+stop;entryStart=AuthoredTravel.Time(run,AuthoredTravel.Distance(run,end)-entrance.Distance);
            nativeDuration=end-entryStart;ease=Math.Min(.24,nativeDuration);walkDuration=(nativeDuration+ease/2)*1000;
            Place();
        }
        public static string[] ChooseOpponents(string playerId,IEnumerable<string> variants,Func<double> random)
        {
            var roster=new[]{"BRAX","NYXA","VEXA","KROV","NINA","DANNY","BEAR","DEMON"};var player=playerId.Split('_')[0];
            var pool=roster.Where(x=>x!=player).Concat(variants.Where(x=>x.Contains("_")&&x.Split('_')[0]!=player)).Concat(new[]{"ZOMBIE","ZOMBIE"}).ToList();
            for(var i=pool.Count-1;i>0;i--){var r=random();if(r<0||r>=1||double.IsNaN(r))throw new ArgumentException("Invalid random source");var j=(int)Math.Floor(r*(i+1));(pool[i],pool[j])=(pool[j],pool[i]);}
            return pool.Take(5).Concat(new[]{"BOSS"}).ToArray();
        }
        void SetPhase(AdventurePhase phase){Phase=phase;phaseMs=0;}
        void Place()=>Match.PlaceAdventureFighter(0,(X-Camera)/Span*Match.Width,(.84-EntryGround)*Match.Height);
        public void InstallOpponent(string id,CombatConfiguration config)
        {
            if(id!=PendingOpponentId)throw new InvalidOperationException("Stale adventure opponent load");
            var hp=Defeated==5?100:level==CpuLevel.Easy?55:level==CpuLevel.Hard?85:70;
            var world=Math.Max(Camera+Span*1.18,(double)chapters[Defeated]["trigger"]+25);
            enemyClock=0;
            if(id==IncomingId&&IncomingVisible){world=IncomingX;enemyClock=IncomingSeconds*1000;EnemyEntering=true;}
            if(id==IncomingId){IncomingId=null;IncomingVisible=false;incoming=null;}
            Match.InstallAdventureOpponent(config,hp,(world-Camera)/Span*Match.Width);installed=true;enemyMaxHp=hp;
        }
        public void PrepareIncoming(string id,CombatConfiguration config)
        {
            if(id!=PreloadOpponentId||!config.Has("ENTRY_RUN"))throw new InvalidOperationException("Stale incoming opponent");
            incoming=config;incomingIndex=Defeated+1;IncomingId=id;IncomingVisible=false;IncomingSeconds=0;
        }
        void RevealIncoming()
        {
            if(incoming==null||IncomingVisible)return;
            IncomingX=Math.Max(Camera+Span*1.18,(double)chapters[incomingIndex]["trigger"]+25);IncomingSeconds=0;IncomingVisible=true;
        }
        void StepIncoming(double dt)
        {
            if(!IncomingVisible)return;
            var c=IncomingAction;var distance=AuthoredTravel.Distance(c,IncomingSeconds+dt/1000)-AuthoredTravel.Distance(c,IncomingSeconds);
            IncomingSeconds+=dt/1000;IncomingX=Math.Max((double)chapters[incomingIndex]["trigger"]+18,IncomingX-distance*640/3.25*Match.Scale*c.Scale/Match.Width*Span);
        }
        public void Step(double milliseconds)
        {
            if(double.IsNaN(milliseconds)||double.IsInfinity(milliseconds)||milliseconds<0)throw new ArgumentOutOfRangeException(nameof(milliseconds));
            if(Match.Paused||Phase==AdventurePhase.Complete||Phase==AdventurePhase.Dead)return;
            // Fixed route ticks keep gates, healing, camera and KO settlement
            // independent of host frame size just like the match simulation.
            accumulated+=milliseconds;while(accumulated+1e-7>=ArenaMatch.StepMs){accumulated-=ArenaMatch.StepMs;Tick(ArenaMatch.StepMs);if(Phase==AdventurePhase.Complete||Phase==AdventurePhase.Dead){accumulated=0;break;}}
        }
        double accumulated;
        void Tick(double dt)
        {
            phaseMs+=dt;ElapsedMs+=dt;
            StepIncoming(dt);
            if(Phase==AdventurePhase.Entrance){Entrance(dt);return;}
            EntryGround=.84;Depth=1;Yaw=Math.PI/2;
            var beforeWorld=X;var before=Match.Player.X;Match.Advance(dt);X+=(Match.Player.X-before)/Match.Width*Span;
            if(Phase==AdventurePhase.Combat||Phase==AdventurePhase.Aftermath)
            {
                var limit=Math.Min(length-Span,(double)chapters[Defeated]["trigger"]+22-Span*.38);
                FollowCamera(Math.Max(0,limit),dt);
                if(Match.Player.Hp<=0){ProgressEvent("result",Defeated,"dead");SetPhase(AdventurePhase.Dead);Match.SetPaused(true);return;}
                if(Match.Opponent.Hp<=enemyMaxHp*.20||Phase==AdventurePhase.Aftermath)RevealIncoming();
                if(Match.Opponent.Hp<=0&&Phase==AdventurePhase.Combat)SetPhase(AdventurePhase.Aftermath);
                if(Phase==AdventurePhase.Aftermath)
                {
                    var o=Match.Opponent;var stable=o.DownPhase=="KO_HOLD"&&o.Clock.Finished&&!Match.PairActive&&!Match.HoldingContact&&o.PushMs<=0;
                    settledMs=stable?settledMs+dt:0;
                    if(settledMs>=Math.Max(320,o.Action.TransitionMs+80)&&Match.Player.DownPhase==null&&!Match.Player.Action.Air&&Match.Player.ActionId!="JUMP"&&Match.Player.ActionId!="COMBO")FinishEncounter();
                }
                return;
            }
            var trigger=(double)chapters[Defeated]["trigger"];var maximum=Math.Max(beforeWorld,Math.Min(length-5,trigger+25));X=Clamp(X,8,maximum);FollowCamera(length-Span,dt);Place();
            var heal=Route["heal"] as JObject;
            if(heal!=null&&!Healed&&Defeated>=(int)heal["index"]&&X>=(double)heal["x"]){Healed=true;Match.HealAdventure(30);ProgressEvent("heal",Defeated,"explore");}
            if(installed&&X>=trigger-.001)EnemyEntering=true;
            if(EnemyEntering)
            {
                var run=Match.Opponent.Configuration["ENTRY_RUN"];var delta=AuthoredTravel.Distance(run,(enemyClock+dt)/1000)-AuthoredTravel.Distance(run,enemyClock/1000);enemyClock+=dt;
                var approaching=X>=trigger-32;
                if(approaching)Match.PlaceAdventureFighter(1,Match.Opponent.X-delta*640/3.25*Match.Scale*run.Scale);
                Match.SampleAdventurePose(1,approaching?"ENTRY_RUN":"IDLE",enemyClock/1000);
                if(Match.Opponent.X-Match.Player.X<=Match.Width*.35){EnemyEntering=false;entryHp=Match.Player.Hp;settledMs=0;Match.BeginAdventureEncounter(level);SetPhase(AdventurePhase.Combat);ProgressEvent("encounter",Defeated,"combat");}
            }
        }
        void Entrance(double dt)
        {
            Match.AdvanceAdventureClock(dt);var run=Match.Player.Configuration["ENTRY_RUN"];
            var elapsed=Math.Max(0,phaseMs-450);var seconds=Math.Min(elapsed,walkDuration)/1000;
            var brakeAt=nativeDuration-ease/2;var u=ease<=0?1:Clamp((seconds-brakeAt)/ease,0,1);
            var time=entryStart+(seconds<=brakeAt?seconds:brakeAt+ease*(u-u*u/2));
            var point=entrance.Sample(AuthoredTravel.Distance(run,time)-AuthoredTravel.Distance(run,entryStart));X=point.X;Depth=point.Depth;EntryGround=point.Ground;Place();
            var stopped=elapsed-walkDuration;
            if(stopped<0){Yaw=point.Yaw;Match.SampleAdventurePose(0,"ENTRY_RUN",time);}
            else{Yaw=entrance.Yaw+(Math.PI/2-entrance.Yaw)*Smooth(stopped/420);Match.SampleAdventurePose(0,"IDLE",stopped/1000);}
            if(stopped>=420){EntryGround=.84;Depth=1;Yaw=Math.PI/2;Match.ReleaseInputs();SetPhase(AdventurePhase.Explore);Place();}
        }
        void FollowCamera(double limit,double dt)
        {var target=Clamp(X-Span*.38,0,Math.Max(0,limit));var shift=(target-Camera)*(1-Math.Exp(-dt/120));Camera+=shift;Match.ShiftAdventureCamera(shift/Span*Match.Width);}
        void FinishEncounter()
        {
            if(Phase!=AdventurePhase.Aftermath||Match.Player.Hp<=0||Match.Opponent.Hp>0)return;
            corpsePose=Match.Presentation(1);corpseCamera=Camera;corpseReady=true;
            Score+=(Defeated==5?1000:200)+(Match.Player.Hp>=entryHp-.001?100:0);
            ProgressEvent("result",Defeated+1,"explore");
            Match.EndAdventureEncounter();Defeated++;installed=false;EnemyEntering=false;
            if(Defeated==6){Score+=500;SetPhase(AdventurePhase.Complete);Match.SetPaused(true);ProgressEvent("complete",Defeated,"complete");}else SetPhase(AdventurePhase.Explore);
        }
        public bool TryTakeCorpse(out FighterPresentation pose,out double camera)
        {pose=corpsePose;camera=corpseCamera;if(!corpseReady)return false;corpseReady=false;return true;}
        static double Clamp(double value,double min,double max)=>Math.Max(min,Math.Min(max,value));
        static double Smooth(double value){var u=Clamp(value,0,1);return u*u*(3-2*u);}
    }
}
