using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        GameObject menuLeaderboard;
        Text boardCategory,boardNote,boardStatus,boardOwn,boardLevelLabel;
        RectTransform boardContent;
        ScrollRect boardScroll;
        readonly List<Text> boardRows=new List<Text>();
        int boardMode,boardLevel=1;
        bool historyView;
        string[] BoardModes=>new[]{"multiplayer"}.Concat(recordModes).ToArray();
        void BuildLeaderboardUi()
        {
            menuLeaderboard=MenuPage("Server rankings and history");MenuHeading(menuLeaderboard,"RANKING I HISTORIA KONTA");
            Click(menuLeaderboard.transform,"◀",new Rect(32,82,62,44),()=>ChangeBoard(-1));Click(menuLeaderboard.transform,"▶",new Rect(930,82,62,44),()=>ChangeBoard(1));
            boardCategory=Label(menuLeaderboard.transform,"Category",new Rect(110,82,516,44),21);boardCategory.alignment=TextAnchor.MiddleCenter;
            boardLevelLabel=Click(menuLeaderboard.transform,"TRUDNOŚĆ",new Rect(650,82,262,44),()=>{if(accountBusy)return;boardLevel=(boardLevel+1)%3;ReadBoard();}).GetComponentInChildren<Text>();
            boardNote=Label(menuLeaderboard.transform,"Scope",new Rect(32,138,960,54),16);
            var viewport=new GameObject("Ranking scroll",typeof(RectTransform),typeof(Image),typeof(RectMask2D),typeof(ScrollRect));Place(viewport,menuLeaderboard.transform,new Rect(32,200,960,244));viewport.GetComponent<Image>().color=new Color(0,0,0,.3f);
            var content=new GameObject("Server result rows",typeof(RectTransform));Place(content,viewport.transform,new Rect(0,0,944,244));boardContent=(RectTransform)content.transform;
            boardScroll=viewport.GetComponent<ScrollRect>();boardScroll.viewport=(RectTransform)viewport.transform;boardScroll.content=boardContent;boardScroll.horizontal=false;boardScroll.vertical=true;boardScroll.movementType=ScrollRect.MovementType.Clamped;
            boardOwn=Label(menuLeaderboard.transform,"Own result",new Rect(32,452,960,26),15);boardOwn.color=MenuGreen;
            boardStatus=Label(menuLeaderboard.transform,"Read status",new Rect(32,480,960,26),14);
            MenuBack(menuLeaderboard,menuRecords);
            Click(menuLeaderboard.transform,"RANKING",new Rect(224,516,204,40),()=>{historyView=false;ReadBoard();});
            Click(menuLeaderboard.transform,"HISTORIA KONTA",new Rect(444,516,268,40),()=>{historyView=true;ReadBoard();});
            Click(menuLeaderboard.transform,"ODŚWIEŻ",new Rect(728,516,264,40),ReadBoard);
        }
        void OpenLeaderboard(){if(accountBusy)return;historyView=false;ShowMenuPage(menuLeaderboard);ReadBoard();}
        void ChangeBoard(int offset)
        {if(accountBusy)return;historyView=false;boardMode=(boardMode+offset+BoardModes.Length)%BoardModes.Length;ReadBoard();}
        void ClearBoard()
        {
            foreach(var row in boardRows)if(row)Destroy(row.gameObject);boardRows.Clear();boardOwn.text="";boardContent.sizeDelta=new Vector2(944,244);boardScroll.verticalNormalizedPosition=1;
        }
        void BoardLines(IEnumerable<string> lines)
        {
            var index=0;foreach(var value in lines){var row=Label(boardContent,"Result "+index,new Rect(14,index*70+6,910,62),18);row.text=value;boardRows.Add(row);index++;}
            if(index==0){var empty=Label(boardContent,"Empty",new Rect(14,22,910,60),22);empty.text="Brak wyników w tej kategorii.";boardRows.Add(empty);}
            boardContent.sizeDelta=new Vector2(944,Mathf.Max(244,index*70+12));boardScroll.verticalNormalizedPosition=1;
        }
        static bool ServerFlag(JToken value)=>value?.Type==JTokenType.Boolean?(bool)value:(long?)value==1;
        static string TimeText(long milliseconds)=>milliseconds/60000+":"+(milliseconds/1000%60).ToString("D2");
        string BoardLine(JToken row,string mode)
        {
            var result=mode=="multiplayer"?row["score"]+" PKT · "+row["matches"]+" WALK":mode=="survival"?row["score"]+" zwycięstw":mode=="arcade"?row["score"]+"/"+((long?)row["targetWins"]??7)+(ServerFlag(row["completed"])?" · ukończone":""):mode=="tournament"?row["score"]+" wygranych"+(ServerFlag(row["completed"])?" · mistrz":""):mode.StartsWith("challenge:")?"Wyzwanie ukończone":"Przewaga "+row["score"]+" rund";
            return row["rank"]+". "+row["name"]+(ServerFlag(row["own"])?" · TY":"")+"\n    "+result+(mode=="multiplayer"?"":" · "+Display((string)row["fighter"])+" · "+TimeText((long)row["elapsed"]));
        }
        string HistoryLine(JToken row)
        {
            var date=DateTimeOffset.FromUnixTimeMilliseconds((long)row["created"]).ToLocalTime().ToString("dd.MM.yyyy HH:mm");
            if((string)row["kind"]=="online")
            {
                var score=(JArray)row["score"];var host=(string)row["ownRole"]=="host";
                return date+" · "+row["name"]+" VS "+row["opponentName"]+"\n    "+score[host?0:1]+" : "+score[host?1:0]+" · "+((string)row["verification"]=="both_players_confirmed"?"Potwierdzone przez obu graczy":"Starszy wynik");
            }
            var mode=(string)row["mode"];var index=Array.IndexOf(Modes,mode);var title=index>=0?ModeNames[index]:mode.StartsWith("challenge:")?"WYZWANIE":"WALKA";
            return date+" · "+title+" · "+Display((string)row["fighter"])+"\n    Wynik: "+row["score"]+" · "+((string)row["verification"]=="verified"?"Zweryfikowany":"Prywatny postęp CPU");
        }
        void ReadBoard()
        {
            if(accountBusy)return;ClearBoard();var mode=BoardModes[boardMode];var level=new[]{"easy","normal","hard"}[boardLevel];var history=historyView;
            var title=mode=="multiplayer"?"MULTIPLAYER":mode.StartsWith("challenge:")?Braxhorn.Arena.Domain.ChallengeCatalog.Find(mode.Substring(10)).Title:ModeNames[Array.IndexOf(Modes,mode)];
            boardCategory.text=history?"HISTORIA TWOJEGO KONTA":title;boardLevelLabel.text=new[]{"ŁATWY","ŚREDNI","TRUDNY"}[boardLevel];
            boardNote.text=history?"Ostatnie 50 wyników konta. Historia jest prywatna.":mode=="multiplayer"?"Publiczny ranking wyników potwierdzonych przez obu graczy. 3 pkt za wygraną, 1 za remis.":"Wyniki CPU są prywatnym postępem. Publiczna rywalizacja jest w kategorii MULTIPLAYER.";
            JObject board=null;JArray rows=null;string owner=null;
            RunAccount(async()=>{await online.RefreshAccount();owner=online.PlayerId;if(history)rows=await online.ReadHistory(owner);else board=await online.ReadRankings(mode,level);},()=>
            {
                if(owner!=online.PlayerId)return;
                if(history)BoardLines(rows.Select(HistoryLine));
                else
                {
                    rows=(JArray)board["rows"];var shown=rows.ToList();var own=board["own"] as JObject;
                    if(own!=null&&(long)own["rank"]>100)shown.Add(own);
                    BoardLines(shown.Select(r=>BoardLine(r,mode)));if(own!=null)boardOwn.text=BoardLine(own,mode).Replace("\n    "," · ");
                }
                boardStatus.text="Odczytano z serwera · "+DateTime.Now.ToString("HH:mm:ss");
            });
        }
    }
}
