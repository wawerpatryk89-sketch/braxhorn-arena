using System;
using System.Collections;
using System.Threading.Tasks;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        AdventureRun adventure;
        NativeAdventureWorld adventureWorld;
        int routeIndex;
        FighterDefinition pendingDefinition;
        CombatConfiguration pendingConfiguration;
        string pendingId,loadingOpponentId;
        bool adventureResult;
        GameObject incomingActor;
        FighterPosePlayer incomingPose;
        IEnumerator LoadFighter(string id,int side,int requestId,Action<CombatConfiguration> ready)
        {
            var request=Resources.LoadAsync<FighterDefinition>("Fighters/"+id+"/"+id);yield return request;
            if(disposed||requestId!=generation)yield break;
            var definition=request.asset as FighterDefinition;
            if(!definition||!definition.complete||!definition.configuration||!definition.prefab){Fail("Brak pełnych zasobów postaci: "+id);yield break;}
            var packed=definition.configuration.bytes;var character=definition.baseId;var parse=Task.Run(()=>CombatConfiguration.Read(character,packed));
            while(!parse.IsCompleted){if(disposed||requestId!=generation)yield break;yield return null;}
            if(disposed||requestId!=generation)yield break;
            if(parse.IsFaulted){Fail(parse.Exception?.GetBaseException().Message??"Błąd konfiguracji");yield break;}
            SpawnFighter(side,definition);ready(parse.Result);
        }
        void SpawnFighter(int side,FighterDefinition definition)
        {
            if(actors[side])Destroy(actors[side]);definitions[side]=definition;actors[side]=new GameObject("Native actor "+side);
            var rig=Instantiate(definition.prefab,actors[side].transform);poses[side]=rig.GetComponent<FighterPosePlayer>();poses[side].Initialize(definition);
            rig.AddComponent<NativeFighterAppearance>().Apply(definition,Modes[modeIndex]=="adventure",adventureColourShader);
        }
        void RenderFighter(int side,FighterPresentation f,double? clock=null,bool replayPose=false)
        {
            if(!actors[side]||!poses[side])return;
            RenderActor(actors[side],poses[side],f,side==0,clock,replayPose);
        }
        void RenderActor(GameObject actor,FighterPosePlayer pose,FighterPresentation f,bool player,double? clock=null,bool replayPose=false)
        {
            var c=f.Action;var depth=adventure!=null&&player?(float)adventure.Depth:1;
            pose.Sample(c.Id,f.Seconds,clock??match.SimulationMs/1000,replayPose||match.HoldingContact?0:(float)c.TransitionMs/1000);
            actor.transform.localScale=Vector3.one*(float)c.Scale*depth;
            var angle=(bool?)c.Source["faceCamera"]==true?0:(bool?)c.Source["opponentQuarter"]==true?2*((double?)c.Source["stageYaw"]??.95)*180/Math.PI:180;
            var rotation=f.Face<0?angle:0;
            if(adventure!=null&&player&&adventure.Phase==AdventurePhase.Entrance)rotation=(((double?)c.Source["stageYaw"]??Math.PI/2)-adventure.Yaw)*180/Math.PI;
            actor.transform.rotation=Quaternion.Euler(0,(float)rotation,0);
            var pixel=3.25/640;var world=pixel/match.Scale;
            actor.transform.position=new Vector3((float)((f.X-match.Width/2)*world+f.Face*(512-c.PivotAt(f.Frame))*pixel*c.Scale*depth),(float)(f.Height*world+(c.AnchorAt(f.Frame)-550)*pixel*c.Scale*depth),0);
        }
        IEnumerator LoadAdventure()
        {
            ResetReplay();CloseMenuOverlays();
            loading=true;error=null;adventureResult=false;var token=++generation;ReleaseControls();ClearAdventure();match=null;campaign=null;survival=null;
            selection.SetActive(false);controls.SetActive(false);resultPanel.SetActive(false);hud.text="WCZYTYWANIE TRASY…";arenaMedia.Clear();ClearActors();
            yield return null;yield return Resources.UnloadUnusedAssets();
            var player=Variants[variantIndex];var opponents=AdventureRun.ChooseOpponents(player,Variants,random.NextDouble);
            var configs=new CombatConfiguration[2];yield return LoadFighter(player,0,token,c=>configs[0]=c);
            if(token!=generation||configs[0]==null)yield break;
            yield return LoadFighter(opponents[0],1,token,c=>configs[1]=c);if(token!=generation||configs[1]==null)yield break;
            yield return fightAudio.Load(mediaCatalog);if(token!=generation)yield break;if(fightAudio.Error!=null){Fail(fightAudio.Error);yield break;}fightAudio.ResetMatch();
            try
            {
                adventure=new AdventureRun((JObject)mediaCatalog.Routes[routeIndex],player,configs[0],configs[1],opponents,(CpuLevel)difficulty,Math.Max(320,576.0*matchCamera.aspect),576,random.NextDouble);
                match=adventure.Match;adventure.InstallOpponent(opponents[0],configs[1]);
                var world=3.25f/640/(float)match.Scale;matchCamera.orthographic=true;matchCamera.orthographicSize=(float)match.Height*world/2;matchCamera.transform.position=new Vector3(0,(float)(match.Floor-match.Height/2)*world,-8);
                adventureWorld=new GameObject("Original adventure world").AddComponent<NativeAdventureWorld>();adventureWorld.Initialize(adventure.Route,matchCamera,arenaMediaShader,adventureCorpseShader,adventureSeamShader);
            }
            catch(Exception e){Debug.LogException(e);Fail(e.Message);yield break;}
            yield return adventureWorld.PrepareFirst();if(token!=generation)yield break;
            if(adventureWorld.Error!=null){Fail(adventureWorld.Error);yield break;}
            loading=false;if(applicationSuspended)Pause(true);Present();
        }
        IEnumerator PreloadAdventureOpponent(string id,int token)
        {
            loadingOpponentId=id;
            var request=Resources.LoadAsync<FighterDefinition>("Fighters/"+id+"/"+id);yield return request;
            if(token!=generation||disposed)yield break;
            var definition=request.asset as FighterDefinition;
            if(!definition||!definition.configuration||!definition.prefab||!definition.complete){error="Brak przeciwnika na trasie: "+id;Pause(true);status.text=error;loadingOpponentId=null;yield break;}
            var bytes=definition.configuration.bytes;var character=definition.baseId;var parse=Task.Run(()=>CombatConfiguration.Read(character,bytes));
            while(!parse.IsCompleted){if(token!=generation||disposed)yield break;yield return null;}
            if(token!=generation||disposed)yield break;
            if(parse.IsFaulted){error="Nie udało się przygotować przeciwnika: "+id;Pause(true);status.text=error;loadingOpponentId=null;yield break;}
            pendingDefinition=definition;pendingConfiguration=parse.Result;pendingId=id;loadingOpponentId=null;
            if(id==adventure.PreloadOpponentId)
            {
                adventure.PrepareIncoming(id,pendingConfiguration);
                if(incomingActor)Destroy(incomingActor);incomingActor=new GameObject("Incoming adventure opponent");
                var rig=Instantiate(definition.prefab,incomingActor.transform);incomingPose=rig.GetComponent<FighterPosePlayer>();incomingPose.Initialize(definition);rig.AddComponent<NativeFighterAppearance>().Apply(definition,true,adventureColourShader);incomingActor.SetActive(false);
            }
        }
        bool adventureWaitingForFilm;
        void UpdateAdventure()
        {
            if(error!=null){Pause(true);status.text=error;return;}
            adventureWorld.Present(adventure,fightAudio.Muted);
            if(adventureWorld.Error!=null){Pause(true);status.text=adventureWorld.Error;return;}
            if(Input.GetKeyDown(KeyCode.Escape))TogglePause();
            if(!adventureWorld.Ready(adventure.Camera,adventure.Span)){adventureWaitingForFilm=true;ReleaseControls();controls.SetActive(false);status.text="WCZYTYWANIE FILMU PLANSZY…";return;}
            if(adventureWaitingForFilm){adventureWaitingForFilm=false;status.text="";}
            var ready=adventure.PendingOpponentId;
            if(ready!=null&&pendingId==ready)
            {
                if(incomingActor){if(actors[1])Destroy(actors[1]);actors[1]=incomingActor;poses[1]=incomingPose;definitions[1]=pendingDefinition;incomingActor=null;incomingPose=null;}
                else SpawnFighter(1,pendingDefinition);
                adventure.InstallOpponent(ready,pendingConfiguration);blood?.ClearFighter(1);pendingDefinition=null;pendingConfiguration=null;pendingId=null;
            }
            var needed=adventure.PendingOpponentId??(adventure.Phase==AdventurePhase.Combat||adventure.Phase==AdventurePhase.Aftermath?adventure.PreloadOpponentId:null);
            if(needed!=null&&pendingId!=needed&&loadingOpponentId==null)StartCoroutine(PreloadAdventureOpponent(needed,generation));
            var playable=adventure.Phase==AdventurePhase.Explore||adventure.Phase==AdventurePhase.Combat||adventure.Phase==AdventurePhase.Aftermath;
            controls.SetActive(playable&&!adventureResult);
            if(playable){ReadInput();var keys=new[]{KeyCode.J,KeyCode.K,KeyCode.U,KeyCode.I,KeyCode.L,KeyCode.Space,KeyCode.O,KeyCode.P};for(var i=0;i<keys.Length;i++)if(Input.GetKeyDown(keys[i]))match.Press(0,(FightButton)i);}
            adventure.Step(Math.Min(100,Time.unscaledDeltaTime*1000));
            if(adventure.TryTakeCorpse(out var pose,out var camera)){RenderFighter(1,pose);adventureWorld.FreezeCorpse(actors[1],camera,match.Width,match.Height);}
            Present();adventureWorld.Present(adventure,fightAudio.Muted);
            if(incomingActor)
            {
                incomingActor.SetActive(adventure.IncomingVisible);
                if(adventure.IncomingVisible)
                {
                    RenderActor(incomingActor,incomingPose,adventure.IncomingPresentation,false);
                }
            }
            if(!adventureResult&&(adventure.Phase==AdventurePhase.Complete||adventure.Phase==AdventurePhase.Dead))
            {
                adventureResult=true;ReleaseControls();controls.SetActive(false);resultPanel.SetActive(true);fightAudio.Stop();
                result.text=(adventure.Phase==AdventurePhase.Complete?"ARENA OSIĄGNIĘTA":"KONIEC WYPRAWY")+"\n"+adventure.Defeated+"/6 RYWALI · "+adventure.Score+" PKT\nPRZEJŚCIE LOKALNE · POZA RANKINGIEM";
            }
        }
        void ClearAdventure()
        {
            if(adventureWorld){adventureWorld.Clear();Destroy(adventureWorld.gameObject);}adventureWorld=null;adventure=null;
            if(incomingActor)Destroy(incomingActor);incomingActor=null;incomingPose=null;
            pendingDefinition=null;pendingConfiguration=null;pendingId=loadingOpponentId=null;adventureResult=false;
        }
    }
}
