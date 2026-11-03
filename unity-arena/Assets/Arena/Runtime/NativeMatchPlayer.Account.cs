using System;
using System.Collections;
using System.Linq;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        // Existing published Arena backend; changing production origin is a
        // separate deployment choice. Passwords never enter local progress.
        public string serviceOrigin="https://braxhorn-p0-preview.wawerpatryk89.chatgpt.site";
        ArenaOnlineClient online;
        GameObject menuAccount,menuShop,accountConfirmation;
        InputField accountName,accountPassword,accountRepeat;
        Text accountMessage,accountHeading,accountSubmit,accountAvatar;
        Text shopName,shopPrice,shopMessage,shopAction;
        NativeMenuImage shopPortrait;
        bool registerAccount,femaleAvatar,accountBusy,confirmPurchase;
        int shopIndex,confirmedPrice;
        string confirmedOutfit;
        GameObject menuOwnerPrice,ownerPriceOpen;
        InputField ownerPriceValue;
        Text ownerPriceInfo,ownerPriceMessage,ownerPriceSave;
        string ownerPriceOutfit;
        int? ownerPriceConfirmation;
        void BuildAccountUi()
        {
            menuAccount=MenuPage("Account");menuShop=MenuPage("Outfit shop");
            MenuArt(menuAccount.transform,"account",new Rect(32,80,428,410),true);
            accountHeading=MenuHeading(menuAccount,"KONTO ARENY");
            Click(menuAccount.transform,"LOGOWANIE",new Rect(496,84,236,44),()=>AccountMode(false));Click(menuAccount.transform,"REJESTRACJA",new Rect(748,84,244,44),()=>AccountMode(true));
            accountName=AccountInput("Nick",new Rect(496,166,496,46),false,20);accountPassword=AccountInput("Hasło",new Rect(496,238,496,46),true,128);accountRepeat=AccountInput("Powtórz hasło",new Rect(496,310,496,46),true,128);
            accountConfirmation=accountRepeat.transform.parent.gameObject;
            accountAvatar=Click(menuAccount.transform,"AWATAR: MĘSKI",new Rect(496,372,496,40),()=>{if(accountBusy)return;femaleAvatar=!femaleAvatar;accountAvatar.text=femaleAvatar?"AWATAR: ŻEŃSKI":"AWATAR: MĘSKI";}).GetComponentInChildren<Text>();
            accountMessage=Label(menuAccount.transform,"Account status",new Rect(496,428,496,70),17);
            accountSubmit=Click(menuAccount.transform,"ZALOGUJ",new Rect(674,510,318,46),SubmitAccount).GetComponentInChildren<Text>();
            Click(menuAccount.transform,"WYLOGUJ",new Rect(244,510,190,46),()=>RunAccount(()=>online.Logout(),()=>{ResetAccountSelection();accountMessage.text="Wylogowano z konta.";}));
            MenuBack(menuAccount,menuModes);
            MenuHeading(menuShop,"STROJE ZAWODNIKÓW");
            MenuArt(menuShop.transform,"mode-shop",new Rect(32,90,310,370),true);
            shopPortrait=Picture(menuShop.transform,"Outfit portrait",new Rect(370,88,256,348));
            shopName=Label(menuShop.transform,"Outfit",new Rect(658,116,334,110),26);
            shopPrice=Label(menuShop.transform,"Price and balance",new Rect(658,246,334,108),23);
            shopMessage=Label(menuShop.transform,"Shop status",new Rect(370,440,622,58),18);
            Click(menuShop.transform,"◀",new Rect(658,368,88,50),()=>CycleShop(-1));Click(menuShop.transform,"▶",new Rect(904,368,88,50),()=>CycleShop(1));
            Click(menuShop.transform,"ODŚWIEŻ",new Rect(244,510,190,46),RefreshShop);
            Click(menuShop.transform,"PODSTAWOWY",new Rect(450,510,190,46),()=>{if(accountBusy)return;variantIndex=Array.IndexOf(Variants,(string)mediaCatalog.Outfits[shopIndex]["base"]);ShowMenuPage(menuRoster);});
            shopAction=Click(menuShop.transform,"ODŚWIEŻ SKLEP",new Rect(674,510,318,46),UseShopChoice).GetComponentInChildren<Text>();MenuBack(menuShop,menuRoster);
            ownerPriceOpen=Click(menuShop.transform,"ZARZĄDZAJ CENĄ",new Rect(714,24,278,44),OpenOwnerPrice);ownerPriceOpen.SetActive(false);
            menuOwnerPrice=MenuPage("Owner outfit price");MenuHeading(menuOwnerPrice,"CENA STROJU");
            ownerPriceInfo=Label(menuOwnerPrice.transform,"Price details",new Rect(200,112,624,108),25);
            ownerPriceValue=AccountInput("Nowa cena w żetonach (0–1 000 000)",new Rect(200,264,624,58),false,7,menuOwnerPrice.transform);ownerPriceValue.contentType=InputField.ContentType.IntegerNumber;
            ownerPriceValue.onValueChanged.AddListener(_=>{ownerPriceConfirmation=null;ownerPriceSave.text="ZAPISZ CENĘ";});
            ownerPriceMessage=Label(menuOwnerPrice.transform,"Price status",new Rect(200,356,624,108),22);
            ownerPriceSave=Click(menuOwnerPrice.transform,"ZAPISZ CENĘ",new Rect(674,510,318,46),SaveOwnerPrice).GetComponentInChildren<Text>();MenuBack(menuOwnerPrice,menuShop);
            Click(menuAccount.transform,"USTAWIENIA KONTA",new Rect(714,24,278,44),OpenAccountSettings);BuildAccountSettings();AccountMode(false);
        }
        InputField AccountInput(string title,Rect rect,bool secret,int limit,Transform parent=null)
        {
            var group=new GameObject(title+" field",typeof(RectTransform));Place(group,parent?parent:menuAccount.transform,new Rect(rect.x,rect.y-24,rect.width,rect.height+24));
            Label(group.transform,"Label",new Rect(0,0,rect.width,24),17).text=title;
            var obj=new GameObject(title,typeof(RectTransform),typeof(Image),typeof(InputField));Place(obj,group.transform,new Rect(0,24,rect.width,rect.height));obj.GetComponent<Image>().color=new Color(.07f,.12f,.08f,1);
            var field=obj.GetComponent<InputField>();field.textComponent=Label(obj.transform,"Value",new Rect(12,5,rect.width-24,rect.height-10),23);field.textComponent.alignment=TextAnchor.MiddleLeft;field.characterLimit=limit;
            field.contentType=secret?InputField.ContentType.Password:InputField.ContentType.Standard;field.lineType=InputField.LineType.SingleLine;return field;
        }
        void EnsureOnline()
        {if(online==null)online=new ArenaOnlineClient(serviceOrigin,AndroidArenaSessionStore.Create(serviceOrigin));}
        void RestoreAccountAtLaunch()
        {
            try{EnsureOnline();}catch(Exception){accountMessage.text="Nie udało się odczytać zapisanej sesji. Zaloguj się ponownie.";return;}
            if(online.HasRestoredSession)RunAccount(async()=>{await online.RefreshAccount();if(online.Authenticated)await online.RefreshShop();},()=>{ResetAccountSelection();accountMessage.text=online.Authenticated?"Zalogowano: "+online.Name:"Sesja wygasła. Zaloguj się ponownie.";});
            else if(online.SessionWarning!=null)accountMessage.text=online.SessionWarning;
        }
        void AccountMode(bool registering)
        {
            if(accountBusy)return;registerAccount=registering;accountConfirmation.SetActive(registering);accountAvatar.transform.parent.gameObject.SetActive(registering);
            accountPassword.SetTextWithoutNotify("");accountRepeat.SetTextWithoutNotify("");accountSubmit.text=registering?"UTWÓRZ KONTO":"ZALOGUJ";
            accountMessage.text=online?.Authenticated==true?"Zalogowano: "+online.Name:"Użyj swojego nicku i hasła do Areny.";
        }
        void OpenAccount()
        {
            ShowMenuPage(menuAccount);RunAccount(()=>online.RefreshAccount(),()=>{accountMessage.text=online.Authenticated?"Zalogowano: "+online.Name:"Grasz jako gość. Możesz się zalogować lub założyć konto.";ResetAccountSelection();});
        }
        void SubmitAccount()
        {
            if(accountBusy)return;
            var nick=accountName.text.Trim();var password=accountPassword.text;
            if(nick.Length<2||nick.Length>20){accountMessage.text="Nick musi mieć od 2 do 20 znaków.";return;}
            if(password.Length<8||password.Length>128){accountMessage.text="Hasło musi mieć od 8 do 128 znaków.";return;}
            if(registerAccount&&password!=accountRepeat.text){accountMessage.text="Hasła muszą być takie same.";return;}
            var create=registerAccount;var avatar=femaleAvatar?"female":"male";
            accountPassword.SetTextWithoutNotify("");accountRepeat.SetTextWithoutNotify("");
            RunAccount(()=>create?online.Register(nick,password,avatar):online.Login(nick,password),()=>{ResetAccountSelection();accountMessage.text="Zalogowano: "+online.Name;});
        }
        void RunAccount(Func<Task> action,Action success)
        {
            if(accountBusy)return;
            try{EnsureOnline();}catch(Exception){AccountError("Nieprawidłowy adres serwera kont.");return;}
            StartCoroutine(AccountRequest(action,success));
        }
        IEnumerator AccountRequest(Func<Task> action,Action success)
        {
            accountBusy=true;SetAccountBusy(true);AccountError("Łączenie z serwerem…");Task task=null;
            try{task=action();}catch(Exception e){AccountError(ServiceMessage(e));}
            if(task!=null)
            {
                while(!task.IsCompleted)yield return null;
                if(task.IsFaulted)AccountError(ServiceMessage(task.Exception?.GetBaseException()));
                else if(task.IsCanceled)AccountError("Żądanie zostało przerwane. Odśwież dane.");
                else try{success();if(online.SessionWarning!=null)AccountError(online.SessionWarning);}catch(Exception e){AccountError(ServiceMessage(e));}
            }
            accountBusy=false;SetAccountBusy(false);RefreshShopUi();RefreshMenuUi();
        }
        static string ServiceMessage(Exception e)=>e is ArenaServiceException?e.Message:"Nie udało się wykonać działania. Odśwież dane i spróbuj ponownie.";
        void AccountError(string message){accountMessage.text=message;shopMessage.text=message;if(menuCurrent==menuRecords)recordsServiceMessage=message;if(menuCurrent==menuLeaderboard)boardStatus.text=message;if(menuCurrent==menuAccountSettings)settingsMessage.text=message;if(menuCurrent==menuOwnerPrice)ownerPriceMessage.text=message;}
        void SetAccountBusy(bool busy)
        {
            foreach(var page in new[]{menuAccount,menuShop,menuLeaderboard,menuAccountSettings,menuOwnerPrice})foreach(var selectable in page.GetComponentsInChildren<Selectable>(true))selectable.interactable=!busy;
            if(!busy&&boardLevelLabel)boardLevelLabel.transform.parent.GetComponent<Button>().interactable=!historyView&&BoardModes[boardMode]!="multiplayer";
        }
        void ResetAccountSelection()
        {
            // Inventory is tied to the server session. A different account may
            // never inherit a previously selected paid outfit from local state.
            if(Variants[variantIndex].Contains("_")&&online?.Owns(Variants[variantIndex])!=true)variantIndex=Array.IndexOf(Variants,Base(Variants[variantIndex]));
            confirmPurchase=false;RetryServerResults();
            if(menuLeaderboard)ClearBoard();
        }
        void OpenShop()
        {
            if(accountBusy)return;
            var selected=Variants[variantIndex];var fighter=Base(selected);
            var found=mediaCatalog.Outfits.Select((o,i)=>new{id=(string)o["id"],fighter=(string)o["base"],i}).FirstOrDefault(o=>o.id==selected)??mediaCatalog.Outfits.Select((o,i)=>new{id=(string)o["id"],fighter=(string)o["base"],i}).FirstOrDefault(o=>o.fighter==fighter);
            shopIndex=found?.i??0;confirmPurchase=false;ShowMenuPage(menuShop);RefreshShopUi();RefreshShop();
        }
        void CycleShop(int direction)
        {if(accountBusy)return;shopIndex=(shopIndex+direction+mediaCatalog.Outfits.Count)%mediaCatalog.Outfits.Count;confirmPurchase=false;shopMessage.text="Wybierz strój, aby zobaczyć jego cenę.";RefreshShopUi();}
        void RefreshShop()
        {
            confirmPurchase=false;
            RunAccount(async()=>{await online.RefreshAccount();await online.RefreshShop();},()=>{ResetAccountSelection();shopMessage.text=online.Authenticated?"Kolekcja konta: "+online.Name:"Kolekcja gościa. Zaloguj się, aby korzystać ze swojego konta.";});
        }
        void RefreshShopUi()
        {
            if(mediaCatalog==null||!shopName)return;
            var item=mediaCatalog.Outfits[shopIndex];var id=(string)item["id"];var price=online?.Price(id);
            shopPortrait.Show(mediaCatalog.Interface["portrait-"+id]);shopName.text=Display((string)item["base"])+"\n"+item["label"];
            shopPrice.text=online?.HasInventory==true?"Saldo: "+online.Balance+" ŻETONÓW\n"+(online.Owns(id)?"W TWOJEJ KOLEKCJI":price.HasValue?"Cena: "+price+" ŻETONÓW":"CENA NIEDOSTĘPNA"):"Odśwież sklep, aby sprawdzić cenę i własność stroju.";
            shopAction.text=accountBusy?"ŁĄCZENIE…":online?.Owns(id)==true?"ZAŁÓŻ STRÓJ":confirmPurchase?"POTWIERDŹ: "+confirmedPrice+" ŻETONÓW":price.HasValue?"KUP STRÓJ":"ODŚWIEŻ SKLEP";
            shopAction.transform.parent.GetComponent<Button>().interactable=!accountBusy;
            if(ownerPriceOpen)ownerPriceOpen.SetActive(online?.Authenticated==true&&online.CanManagePrices);
        }
        void OpenOwnerPrice()
        {
            if(accountBusy||online?.Authenticated!=true||!online.CanManagePrices)return;
            ownerPriceOutfit=(string)mediaCatalog.Outfits[shopIndex]["id"];ownerPriceConfirmation=null;
            ownerPriceInfo.text=Display((string)mediaCatalog.Outfits[shopIndex]["base"])+" · "+mediaCatalog.Outfits[shopIndex]["label"]+"\nAktualna cena: "+online.Price(ownerPriceOutfit)+" żetonów";
            ownerPriceValue.SetTextWithoutNotify(online.Price(ownerPriceOutfit)?.ToString()??"");ownerPriceSave.text="ZAPISZ CENĘ";ownerPriceMessage.text="Zmiana dotyczy sklepu wszystkich graczy.";ShowMenuPage(menuOwnerPrice);
        }
        void SaveOwnerPrice()
        {
            if(accountBusy||online?.Authenticated!=true||!online.CanManagePrices)return;
            if(!int.TryParse(ownerPriceValue.text,out var price)||price<0||price>1000000){ownerPriceMessage.text="Podaj liczbę całkowitą od 0 do 1 000 000.";return;}
            if(ownerPriceConfirmation!=price){ownerPriceConfirmation=price;ownerPriceSave.text="POTWIERDŹ: "+price;ownerPriceMessage.text="Potwierdź nową cenę: "+price+" żetonów. Dotyczy kolejnych zakupów tego stroju.";return;}
            var id=ownerPriceOutfit;ownerPriceConfirmation=null;ownerPriceSave.text="ZAPISZ CENĘ";
            RunAccount(()=>online.SetPrice(id,price),()=>{ownerPriceMessage.text="Serwer potwierdził cenę: "+online.Price(id)+" żetonów.";ownerPriceInfo.text=id+"\nAktualna cena: "+online.Price(id)+" żetonów";});
        }
        void UseShopChoice()
        {
            if(accountBusy)return;var item=mediaCatalog.Outfits[shopIndex];var id=(string)item["id"];
            if(online?.Owns(id)==true){variantIndex=Array.IndexOf(Variants,id);ShowMenuPage(menuRoster);return;}
            var price=online?.Price(id);if(!price.HasValue){RefreshShop();return;}
            if(online.Balance<price.Value){shopMessage.text="Za mało żetonów na ten strój.";return;}
            if(!confirmPurchase||confirmedOutfit!=id||confirmedPrice!=price.Value)
            {confirmPurchase=true;confirmedOutfit=id;confirmedPrice=price.Value;shopMessage.text="Potwierdź zakup: "+item["label"]+" za "+price+" żetonów.";RefreshShopUi();return;}
            confirmPurchase=false;var expected=confirmedPrice;
            RunAccount(()=>online.Buy(id,expected),()=>{shopMessage.text="Zakup potwierdzony. Możesz założyć strój.";});
        }
        void ClearAccountSecrets(){accountPassword?.SetTextWithoutNotify("");accountRepeat?.SetTextWithoutNotify("");currentPassword?.SetTextWithoutNotify("");newPassword?.SetTextWithoutNotify("");repeatNewPassword?.SetTextWithoutNotify("");}
    }
}
