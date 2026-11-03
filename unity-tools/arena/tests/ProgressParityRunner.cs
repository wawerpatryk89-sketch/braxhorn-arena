using System;
using System.IO;
using System.Linq;
using Braxhorn.Arena;
using Braxhorn.Arena.Domain;
using Newtonsoft.Json.Linq;

static class ProgressParityRunner
{
    static int count;
    static void Check(bool pass,string message){count++;if(!pass)throw new Exception("Progress: "+message);}
    internal static void Run()
    {
        var p=new ArenaProgress(now:()=>123);Check(p.Name==""&&(int)p.Fighter("BRAX")["wins"]==0,"fresh guest");
        p.Win("BRAX");p.Survival("BRAX",5);p.Survival("BRAX",2);Check((int)p.Fighter("BRAX")["bestSurvival"]==5,"survival is monotonic");
        Check(!p.SetName("!"),"short names rejected");Check(p.SetName("  PaＴryk  Kowalski! "),"original NFKC name rules");Check(p.Name=="PaTryk Kowalski","normalization and trim");
        Check((int)p.Fighter("BRAX")["wins"]==1,"guest progress transfers to named profile");p.SetName("Drugi");Check((int)p.Fighter("BRAX")["wins"]==0,"profiles isolated");p.SetName("PaTryk Kowalski");
        Check(p.Complete("BRAX","evade5")&&!p.Complete("BRAX","evade5")&&!p.Complete("BRAX","invented"),"authored challenge completion idempotent");
        var clone=p.Fighter("BRAX");clone["wins"]=999;Check((int)p.Fighter("BRAX")["wins"]==1,"fighter snapshot detached");
        for(var i=0;i<8;i++)p.Record("survival","normal","r"+i,"BRAX",i,800-i,false);
        var top=p.Top("survival","normal");Check(top.Count==5&&(int)top[0]["score"]==7&&(int)top[4]["score"]==3,"top five score ordering");
        Check(!p.Record("survival","normal","r7","BRAX",7,1,false),"same run equal score not duplicated");Check(p.Record("survival","normal","r7","BRAX",9,900,false),"same run higher score replaces");
        Check(p.Top("survival","hard").Count==0,"difficulty boards separate");
        p.Record("arcade","normal","lost","BRAX",7,1,false);p.Record("arcade","normal","won","BRAX",1,100,true);Check((string)p.Top("arcade","normal")[0]["id"]=="won","completed campaign ranks first");
        p.Record("fight","normal","slow","BRAX",1,30,true,rounds:new[]{2,1});p.Record("fight","normal","fast","BRAX",1,20,true);Check((string)p.Top("fight","normal")[0]["id"]=="fast","elapsed tie-break");
        Check(!p.Record("invented","normal","bad","BRAX",1,1,true)&&!p.Record("fight","normal","bad","BOSS",1,1,true),"invalid board and non-playable character rejected");
        top[0]["score"]=0;Check((int)p.Top("survival","normal")[0]["score"]==9,"board snapshot detached");
        var restored=new ArenaProgress(p.Serialize());Check(JToken.DeepEquals(JObject.Parse(p.Serialize()),JObject.Parse(restored.Serialize())),"v2 save reload");
        var old=new ArenaProgress("{\"version\":1,\"fighters\":{\"BRAX\":{\"wins\":4,\"bestSurvival\":8,\"challenges\":[\"evade5\",\"evade5\",\"bad\"]}}}");Check((int)old.Fighter("BRAX")["wins"]==4&&((JArray)old.Fighter("BRAX")["challenges"]).Count==1,"v1 migration");
        var extra=new ArenaProgress("{\"version\":2,\"extension\":{\"keep\":true},\"profiles\":{\"GRACZ\":{\"BRAX\":{\"wins\":-3,\"custom\":7}}}}");Check((int)extra.Fighter("BRAX")["wins"]==0&&(int)extra.Fighter("BRAX")["custom"]==7&&(bool)JObject.Parse(extra.Serialize())["extension"]["keep"],"sanitize known values while retaining extension fields");
        var dir=Path.Combine(Path.GetTempPath(),"arena-progress-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(dir);
        try
        {
            var path=Path.Combine(dir,"progress.json");var store=new ProgressFileStore(path);store.Load();Check(store.Save(p),"initial file save");Check(new ProgressFileStore(path).Load().Name==p.Name,"file reload");
            p.Win("BRAX");Check(store.Save(p)&&File.Exists(path+".bak"),"previous generation backed up");
            File.WriteAllText(path,"{broken");store=new ProgressFileStore(path);var recovered=store.Load();Check(recovered.Name==p.Name&&store.Error!=null,"corrupt main recovered from backup");Check(store.Save(recovered)&&File.ReadAllText(path+".corrupt")=="{broken","recovery preserves corrupt evidence");
            File.Delete(path);store=new ProgressFileStore(path);Check(store.Load().Name==p.Name,"interrupted replacement recovers backup");
            File.WriteAllText(path,"{bad-main");File.WriteAllText(path+".bak","{bad-backup");store=new ProgressFileStore(path);store.Load();Check(!store.Save(p)&&File.ReadAllText(path)=="{bad-main"&&File.ReadAllText(path+".bak")=="{bad-backup","unrecoverable data never overwritten");
            File.WriteAllText(path,"{\"version\":3}");File.WriteAllText(path+".bak",p.Serialize());store=new ProgressFileStore(path);store.Load();Check(!store.Save(p)&&File.ReadAllText(path)=="{\"version\":3}","newer schema never replaced by old backup");
            var blocked=Path.Combine(dir,"is-directory");Directory.CreateDirectory(blocked);store=new ProgressFileStore(blocked);store.Load();Check(!store.Save(p)&&store.Error!=null,"write errors surfaced without throwing");
        }
        finally{Directory.Delete(dir,true);}
        var match=new ArenaMatch(MatchParityRunner.Config(),MatchParityRunner.Config(),()=>.5);match.Advance(3000);Check(match.ActiveMs==0,"countdown excluded from records");match.Advance(1000);Check(Math.Abs(match.ActiveMs-1000)<1e-6,"active time recorded");match.SetPaused(true);match.Advance(10000);Check(Math.Abs(match.ActiveMs-1000)<1e-6,"pause excluded from records");
        Console.WriteLine("PASS "+count+" progress checks: source schema, profiles, ranking, migration, file recovery, protected failures and active clock. Android storage remains untested.");
    }
}
