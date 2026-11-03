using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        GameObject menuTournaments,menuTournamentForm;
        GameObject txListTools,txDetailTools,txClaimTools,txOwnerTools,txEntryTools;
        Text txHeading,txStatus,txPageLabel,txRegisterLabel,txFormHeading,txFormMessage,txFormSubmit;
        InputField txCode,txInvite;
        readonly List<Text> txRows=new List<Text>();
        readonly List<Button> txRowActions=new List<Button>();
        readonly List<GameObject> txRowManage=new List<GameObject>();
        readonly List<InputField> txFields=new List<InputField>();
        readonly List<Text> txFieldLabels=new List<Text>();
        JObject txData;
        string txCurrent,txTab="fights",txAction,txTarget;
        int txPage,txFighter,txGeneration;
        bool txBusy,txConfirm;
        double txRefreshAt;
        static string TxDate(JToken value)
        {try{return DateTimeOffset.FromUnixTimeMilliseconds((long)value).ToLocalTime().ToString("dd.MM HH:mm");}catch{return "—";}}
        static string TxState(string value)=>value switch{"registration"=>"ZAPISY","running"=>"W TRAKCIE","completed"=>"ZAKOŃCZONY","cancelled"=>"ODWOŁANY","scheduled"=>"ZAPLANOWANA","playing"=>"WALKA TRWA","review"=>"DECYZJA ORGANIZATORA","finished"=>"ZAKOŃCZONA","bye"=>"AWANS BEZ WALKI","waiting"=>"OCZEKIWANIE NA PARĘ",_=>value};
        void BuildTournamentUi()
        {
            Click(menuDuel.transform,"TURNIEJE ONLINE",new Rect(714,24,278,44),()=>OpenTournaments(null));
            menuTournaments=MenuPage("Online tournaments");txHeading=MenuHeading(menuTournaments,"TURNIEJE ONLINE");
            txListTools=TxGroup("Tournament codes",new Rect(32,78,960,64));
            txCode=AccountInput("Kod turnieju",new Rect(0,24,210,40),false,8,txListTools.transform);
            Click(txListTools.transform,"OTWÓRZ",new Rect(220,24,164,40),()=>OpenTournaments(txCode.text));
            txOwnerTools=Click(txListTools.transform,"UTWÓRZ TURNIEJ",new Rect(654,24,306,40),()=>TournamentForm("create"));
            txDetailTools=TxGroup("Tournament sections",new Rect(32,94,960,44));
            foreach(var pair in new[]{("WALKI","fights"),("UCZESTNICY","entries"),("HISTORIA","history")}.Select((x,i)=>(x,i)))
            {var key=pair.x.Item2;Click(txDetailTools.transform,pair.x.Item1,new Rect(pair.i*210,0,200,44),()=>{txTab=key;txPage=0;RenderTournaments();});}
            Click(txDetailTools.transform,"ORGANIZUJ",new Rect(654,0,306,44),()=>TournamentForm("manage"));
            for(var i=0;i<5;i++)
            {
                txRows.Add(Label(menuTournaments.transform,"Tournament row "+i,new Rect(32,154+i*58,716,54),18));
                var row=i;txRowActions.Add(Click(menuTournaments.transform,"OTWÓRZ",new Rect(770,158+i*58,222,46),()=>TournamentRow(row)).GetComponent<Button>());
                txRowManage.Add(Click(menuTournaments.transform,"ZMIEŃ",new Rect(894,158+i*58,98,46),()=>{var items=TournamentRows();var index=txPage*5+row;if(index<items.Length)TournamentForm(txTab=="entries"?"removeParticipant":"fight",(string)items[index]["id"]);}));
            }
            txClaimTools=TxGroup("Participant invitation",new Rect(32,426,960,64));
            txInvite=AccountInput("Osobisty kod uczestnika (16 znaków)",new Rect(0,24,440,40),false,20,txClaimTools.transform);
            Click(txClaimTools.transform,"PRZYPISZ MOJE MIEJSCE",new Rect(460,24,500,40),()=>TournamentChange("claim",new JObject{["inviteCode"]=txInvite.text}));
            txEntryTools=TxGroup("Registration",new Rect(32,444,960,44));
            txRegisterLabel=Click(txEntryTools.transform,"",new Rect(0,0,410,44),()=>{txFighter=(txFighter+1)%Roster.Length;RenderTournaments();}).GetComponentInChildren<Text>();
            Click(txEntryTools.transform,"ZAPISZ / WYCOFAJ",new Rect(426,0,330,44),()=>
            {if(txData?["ownEntry"]?.Type==JTokenType.String)TournamentForm("withdraw");else TournamentChange("register",new JObject{["fighter"]=Roster[txFighter]});});
            Click(txEntryTools.transform,"DODAJ",new Rect(772,0,188,44),()=>TournamentForm("addParticipant"));
            txStatus=Label(menuTournaments.transform,"Tournament status",new Rect(244,492,748,22),14);
            txPageLabel=Label(menuTournaments.transform,"Page",new Rect(450,520,240,30),16);
            Click(menuTournaments.transform,"‹ WRÓĆ",new Rect(32,518,170,40),()=>{txGeneration++;if(txCurrent!=null)OpenTournaments(null);else ShowMenuPage(menuDuel);});
            Click(menuTournaments.transform,"ODŚWIEŻ",new Rect(214,518,180,40),()=>RefreshTournaments());
            Click(menuTournaments.transform,"◀",new Rect(714,518,126,40),()=>{txPage=Math.Max(0,txPage-1);RenderTournaments();});
            Click(menuTournaments.transform,"▶",new Rect(866,518,126,40),()=>{txPage++;RenderTournaments();});
            menuTournamentForm=MenuPage("Tournament organizer action");txFormHeading=MenuHeading(menuTournamentForm,"TURNIEJ");
            for(var i=0;i<5;i++)
            {var field=AccountInput("Pole",new Rect(190,116+i*68,644,42),false,300,menuTournamentForm.transform);txFields.Add(field);txFieldLabels.Add(field.transform.parent.Find("Label").GetComponent<Text>());field.onValueChanged.AddListener(_=>{txConfirm=false;txFormSubmit.text="DALEJ";});}
            txFormMessage=Label(menuTournamentForm.transform,"Tournament action status",new Rect(32,448,960,54),17);
            Click(menuTournamentForm.transform,"ANULUJ",new Rect(32,518,240,40),()=>{if(!txBusy){txConfirm=false;ShowMenuPage(menuTournaments);}});
            txFormSubmit=Click(menuTournamentForm.transform,"DALEJ",new Rect(674,518,318,40),SubmitTournamentForm).GetComponentInChildren<Text>();
        }
        GameObject TxGroup(string name,Rect rect){var g=new GameObject(name,typeof(RectTransform));Place(g,menuTournaments.transform,rect);return g;}
        void OpenTournaments(string code)
        {
            if(txBusy||duel!=null||duelEntryBusy)return;
            code=string.IsNullOrWhiteSpace(code)?null:code.Trim().ToUpperInvariant();
            if(code!=null&&!System.Text.RegularExpressions.Regex.IsMatch(code,"^[A-F0-9]{8}$")){txStatus.text="Kod turnieju ma 8 znaków: 0–9, A–F.";return;}
            EnsureOnline();txGeneration++;txCurrent=code;txData=null;txPage=0;txTab="fights";txFighter=Math.Max(0,Array.IndexOf(Roster,Base(Variants[variantIndex])));ShowMenuPage(menuTournaments);RenderTournaments();RefreshTournaments(true);
        }
        void RefreshTournaments(bool account=false)
        {if(txBusy)return;StartCoroutine(TournamentRequest(async()=>{if(account)await online.RefreshAccount();return await online.ReadTournaments(txCurrent);},false));}
        IEnumerator TournamentRequest(Func<Task<JObject>> operation,bool mutation)
        {
            txBusy=true;var token=txGeneration;SetTournamentBusy(true);txStatus.text="Łączenie…";txFormMessage.text="Łączenie…";Task<JObject> task=null;
            try{task=operation();}catch(Exception e){txStatus.text=txFormMessage.text=e is ArgumentException?e.Message:ServiceMessage(e);}
            if(task!=null)
            {
                while(!task.IsCompleted)yield return null;
                if(disposed||token!=txGeneration){txBusy=false;SetTournamentBusy(false);yield break;}
                if(task.IsFaulted||task.IsCanceled){var e=task.Exception?.GetBaseException();txStatus.text=txFormMessage.text=e is ArgumentException?e.Message:ServiceMessage(e);}
                else
                {
                    txData=task.Result;
                    if(txData["deleted"]?.Type==JTokenType.Boolean){txCurrent=null;txData=null;}
                    else if(txData["tournament"] is JObject t)txCurrent=(string)t["code"];
                    txStatus.text=mutation?"Serwer potwierdził zmianę.":"Terminy w strefie telefonu. Wyniki potwierdzają gracze lub organizator.";
                    txConfirm=false;ShowMenuPage(menuTournaments);RenderTournaments();
                }
            }
            txBusy=false;SetTournamentBusy(false);txRefreshAt=NetworkNow+5000;
            if(txData==null&&txCurrent==null&&task?.Status==TaskStatus.RanToCompletion)RefreshTournaments();
        }
        void SetTournamentBusy(bool value)
        {foreach(var page in new[]{menuTournaments,menuTournamentForm})if(page)foreach(var s in page.GetComponentsInChildren<Selectable>(true))s.interactable=!value;}
        JToken[] TournamentRows()
        {return ((JArray)(txCurrent==null?txData?["tournaments"]:txData?[txTab]))?.ToArray()??Array.Empty<JToken>();}
        string TxName(JToken id)=>((JArray)txData["entries"]).FirstOrDefault(e=>(string)e["id"]==(string)id)?["name"]?.ToString()??"Czekamy na rywala";
        void RenderTournaments()
        {
            var detail=txCurrent!=null;txListTools.SetActive(!detail);txDetailTools.SetActive(detail);txClaimTools.SetActive(!detail);
            var owner=txData?["profile"]?["isOwner"]?.Value<bool>()==true;txOwnerTools.SetActive(owner);
            var registration=detail&&(string)txData?["tournament"]?["status"]=="registration";txEntryTools.SetActive(registration);
            txDetailTools.transform.GetChild(3).gameObject.SetActive(owner);txEntryTools.transform.GetChild(2).gameObject.SetActive(owner);
            txHeading.text=detail?((string)txData?["tournament"]?["name"]??txCurrent)+" · "+TxState((string)txData?["tournament"]?["status"]):"TURNIEJE ONLINE";
            txRegisterLabel.text="ZAWODNIK: "+Display(Roster[txFighter]);
            var items=TournamentRows();var perPage=detail?5:4;txPage=Math.Clamp(txPage,0,Math.Max(0,(items.Length-1)/perPage));
            txPageLabel.text=(txPage+1)+" / "+Math.Max(1,(items.Length+perPage-1)/perPage);
            for(var row=0;row<5;row++)
            {
                var index=txPage*perPage+row;var visible=row<perPage&&index<items.Length;txRows[row].gameObject.SetActive(visible);txRowActions[row].gameObject.SetActive(visible);txRowManage[row].SetActive(false);if(!visible)continue;var e=items[index];var label=txRowActions[row].GetComponentInChildren<Text>();
                Place(txRowActions[row].gameObject,menuTournaments.transform,new Rect(770,158+row*58,222,46));label.fontSize=16;
                if(!detail){txRows[row].text=e["name"]+" · "+TxState((string)e["status"])+"\n"+TxDate(e["startAt"])+" · "+e["count"]+" / "+e["capacity"]+" osób";label.text="OTWÓRZ";}
                else if(txTab=="entries"){txRows[row].text=e["name"]+" · "+e["fighter"]+((bool)e["own"]?" · TY":"")+((bool)e["pending"]?" · ZAPROSZONY":"");label.text=e["inviteCode"]?.Type==JTokenType.String?"KOPIUJ KOD":"USUŃ";txRowActions[row].gameObject.SetActive(owner&&registration);if(owner&&registration&&e["inviteCode"]?.Type==JTokenType.String){txRowManage[row].SetActive(true);txRowManage[row].GetComponentInChildren<Text>().text="USUŃ";Place(txRowActions[row].gameObject,menuTournaments.transform,new Rect(770,158+row*58,116,46));label.fontSize=12;}}
                else if(txTab=="history"){txRows[row].text=TxDate(e["created"])+" · "+e["action"]+"\n"+e["detail"];txRowActions[row].gameObject.SetActive(false);}
                else
                {
                    var mine=(string)txData["ownEntry"];var participant=mine!=null&&new[]{(string)e["a"],(string)e["b"]}.Contains(mine);
                    txRows[row].text="R"+((int)e["round"]+1)+" · "+TxName(e["a"])+" — "+TxName(e["b"])+"\n"+TxState((string)e["status"])+" · "+TxDate(e["scheduledAt"])+(e["score"]?.Type==JTokenType.String?" · "+e["score"]:"");
                    label.text=participant&&new[]{"scheduled","playing"}.Contains((string)e["status"])?"WEJDŹ DO WALKI":"ZARZĄDZAJ";txRowActions[row].gameObject.SetActive(label.text=="WEJDŹ DO WALKI"||owner);
                    if(owner&&participant&&new[]{"scheduled","playing"}.Contains((string)e["status"])){txRowManage[row].SetActive(true);txRowManage[row].GetComponentInChildren<Text>().text="ZMIEŃ";Place(txRowActions[row].gameObject,menuTournaments.transform,new Rect(770,158+row*58,116,46));label.fontSize=12;}
                }
            }
        }
        void TournamentRow(int row)
        {
            if(txBusy||txData==null)return;var items=TournamentRows();var index=txPage*(txCurrent==null?4:5)+row;if(index>=items.Length)return;var e=items[index];
            if(txCurrent==null){OpenTournaments((string)e["code"]);return;}
            if(txTab=="entries"){if(e["inviteCode"]?.Type==JTokenType.String){GUIUtility.systemCopyBuffer=(string)e["inviteCode"];txStatus.text="Skopiowano osobisty kod uczestnika.";}else TournamentForm("removeParticipant",(string)e["id"]);return;}
            if(txTab!="fights")return;
            var mine=(string)txData["ownEntry"];if(mine!=null&&new[]{(string)e["a"],(string)e["b"]}.Contains(mine)&&new[]{"scheduled","playing"}.Contains((string)e["status"]))StartCoroutine(EnterTournamentDuel((string)e["id"]));
            else TournamentForm("fight",(string)e["id"]);
        }
        void TournamentChange(string action,JObject body)
        {if(txBusy)return;StartCoroutine(TournamentRequest(()=>online.ChangeTournament(action,txCurrent,body),true));}
        IEnumerator EnterTournamentDuel(string fight)
        {
            if(duel!=null||duelEntryBusy||txBusy)yield break;txBusy=duelEntryBusy=true;SetTournamentBusy(true);var attempt=++duelEntry;
            DuelLease lease=null;async Task Enter(){lease=await online.EnterTournament(txCurrent,fight,Variants[variantIndex]);if(disposed||attempt!=duelEntry)await online.LeaveDuel(lease);}
            var task=Enter();while(!task.IsCompleted)yield return null;txBusy=duelEntryBusy=false;SetTournamentBusy(false);if(disposed||attempt!=duelEntry)yield break;
            if(task.IsFaulted||task.IsCanceled){txStatus.text=ServiceMessage(task.Exception?.GetBaseException());yield break;}
            RefreshDuelMenu();ShowMenuPage(menuDuel);ActivateDuel(lease);
        }
        void TournamentForm(string action,string target=null)
        {
            if(txBusy)return;txAction=action;txTarget=target;txConfirm=false;txFormSubmit.text="DALEJ";txFormMessage.text="";
            for(var i=0;i<5;i++){txFields[i].transform.parent.gameObject.SetActive(false);txFields[i].SetTextWithoutNotify("");}
            void Field(int i,string name,string value=""){txFields[i].transform.parent.gameObject.SetActive(true);txFieldLabels[i].text=name;txFields[i].SetTextWithoutNotify(value);}
            var tomorrow=DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd HH:mm");txFormHeading.text="TURNIEJ · "+action.ToUpperInvariant();
            if(action=="create"){Field(0,"Nazwa turnieju");Field(1,"Liczba miejsc (4–10)","8");Field(2,"Pierwsza walka: RRRR-MM-DD GG:MM · UTC",tomorrow);Field(3,"Odstęp w minutach: 0, 15, 30 albo 60","0");}
            else if(action=="manage"){Field(0,"Działanie: losuj, termin, odwołaj lub usuń","losuj");Field(1,"Nowy termin RRRR-MM-DD GG:MM · UTC",tomorrow);txFormMessage.text="Losowanie zamyka zapisy. Odwołanie i usunięcie wymagają potwierdzenia.";}
            else if(action=="fight"){Field(0,"Działanie: termin, powtórka albo wynik","termin");Field(1,"Termin RRRR-MM-DD GG:MM · UTC",tomorrow);Field(2,"Wynik organizatora: zwycięzca A lub B","A");Field(3,"Uzasadnienie (5–300 znaków)");var f=((JArray)txData["fights"]).First(x=>(string)x["id"]==target);txFormMessage.text="A: "+TxName(f["a"])+" · B: "+TxName(f["b"]);}
            else if(action=="addParticipant"){Field(0,"Pseudonim uczestnika (2–20 znaków)");Field(1,"Zawodnik: BRAX, NYXA, VEXA, KROV, NINA, DANNY, BEAR, DEMON",Roster[txFighter]);}
            else txFormMessage.text=action=="withdraw"?"Wycofać Twoje zgłoszenie?":"Usunąć to zgłoszenie przed losowaniem?";
            ShowMenuPage(menuTournamentForm);
        }
        static long TxTime(string text)
        {if(!DateTime.TryParseExact(text.Trim(),"yyyy-MM-dd HH:mm",CultureInfo.InvariantCulture,DateTimeStyles.AssumeUniversal|DateTimeStyles.AdjustToUniversal,out var time))throw new ArgumentException("Wpisz termin UTC jako RRRR-MM-DD GG:MM.");return new DateTimeOffset(time).ToUnixTimeMilliseconds();}
        void SubmitTournamentForm()
        {
            if(txBusy)return;
            try
            {
                var body=new JObject();var action=txAction;
                if(action=="create"){body["name"]=txFields[0].text.Trim();if(!int.TryParse(txFields[1].text,out var capacity)||capacity<4||capacity>10)throw new ArgumentException("Liczba miejsc: 4–10.");body["capacity"]=capacity;body["startAt"]=TxTime(txFields[2].text);if(!int.TryParse(txFields[3].text,out var interval)||!new[]{0,15,30,60}.Contains(interval))throw new ArgumentException("Odstęp: 0, 15, 30 albo 60 minut.");body["intervalMinutes"]=interval;body["timezone"]="UTC";}
                else if(action=="manage"){action=txFields[0].text.Trim().ToLowerInvariant() switch{"losuj"=>"draw","termin"=>"schedule","odwołaj"=>"cancel","usuń"=>"delete",_=>throw new ArgumentException("Wybierz: losuj, termin, odwołaj lub usuń.")};if(action=="schedule")body["startAt"]=TxTime(txFields[1].text);}
                else if(action=="fight")
                {
                    action=txFields[0].text.Trim().ToLowerInvariant() switch{"termin"=>"schedule","powtórka"=>"restart","wynik"=>"resolve",_=>throw new ArgumentException("Wybierz: termin, powtórka albo wynik.")};body["fight"]=txTarget;body["reason"]=txFields[3].text.Trim();
                    if(action!="resolve")body["startAt"]=TxTime(txFields[1].text);else{var side=txFields[2].text.Trim().ToLowerInvariant();if(side!="a"&&side!="b")throw new ArgumentException("Wybierz zwycięzcę A albo B.");body["winner"]=((JArray)txData["fights"]).First(f=>(string)f["id"]==txTarget)[side];}
                }
                else if(action=="addParticipant"){body["name"]=txFields[0].text.Trim();body["fighter"]=txFields[1].text.Trim().ToUpperInvariant();}
                else if(action=="removeParticipant")body["entry"]=txTarget;
                if(!txConfirm){txConfirm=true;txFormSubmit.text="POTWIERDŹ";txFormMessage.text="Potwierdź działanie: "+action+". Zmiana zostanie wysłana do serwera.";return;}
                txConfirm=false;TournamentChange(action,body);
            }
            catch(Exception e){txFormMessage.text=e is ArgumentException?e.Message:"Nieprawidłowe dane formularza.";}
        }
        void UpdateTournaments()
        {if(selection.activeSelf&&menuCurrent==menuTournaments&&!txBusy&&NetworkNow>=txRefreshAt&&online!=null)RefreshTournaments();}
    }
}
