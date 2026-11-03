using UnityEngine;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    public sealed partial class NativeMatchPlayer
    {
        GameObject menuAccountSettings;
        InputField currentPassword,newPassword,repeatNewPassword;
        Text settingsMessage,settingsIdentity;
        void BuildAccountSettings()
        {
            menuAccountSettings=MenuPage("Account settings");MenuHeading(menuAccountSettings,"USTAWIENIA KONTA");
            settingsIdentity=Label(menuAccountSettings.transform,"Identity",new Rect(32,78,960,42),22);
            currentPassword=AccountInput("Obecne hasło",new Rect(480,174,512,46),true,128,menuAccountSettings.transform);
            newPassword=AccountInput("Nowe hasło",new Rect(480,256,512,46),true,128,menuAccountSettings.transform);
            repeatNewPassword=AccountInput("Powtórz nowe hasło",new Rect(480,338,512,46),true,128,menuAccountSettings.transform);
            var male=Click(menuAccountSettings.transform,"",new Rect(32,140,198,250),()=>SaveAvatarPreset("male"));
            MenuArt(male.transform,"avatar-male",new Rect(8,8,182,182));Label(male.transform,"Choose",new Rect(8,202,182,40),17).text="AWATAR MĘSKI";
            var female=Click(menuAccountSettings.transform,"",new Rect(246,140,198,250),()=>SaveAvatarPreset("female"));
            MenuArt(female.transform,"avatar-female",new Rect(8,8,182,182));Label(female.transform,"Choose",new Rect(8,202,182,40),17).text="AWATAR ŻEŃSKI";
            settingsMessage=Label(menuAccountSettings.transform,"Status",new Rect(32,420,960,76),18);
            MenuBack(menuAccountSettings,menuAccount);Click(menuAccountSettings.transform,"ZAPISZ NOWE HASŁO",new Rect(674,510,318,46),SaveAccountPassword);
        }
        void OpenAccountSettings()
        {
            if(accountBusy)return;ClearAccountSecrets();ShowMenuPage(menuAccountSettings);
            RunAccount(()=>online.RefreshAccount(),()=>{RefreshAccountSettings();settingsMessage.text=online.Authenticated?"Dotknij wybranego awatara lub ustaw nowe hasło. Nick konta pozostaje stały.":"Zaloguj się, aby zmienić ustawienia konta.";});
        }
        void RefreshAccountSettings()
        {
            if(!settingsIdentity)return;
            var authenticated=online?.Authenticated==true;
            settingsIdentity.text=authenticated?"KONTO: "+online.Name:"GOŚĆ — ZALOGUJ SIĘ";
            currentPassword.transform.parent.gameObject.SetActive(authenticated&&online.HasPassword);
        }
        void SaveAvatarPreset(string preset)
        {
            if(accountBusy)return;if(online?.Authenticated!=true){settingsMessage.text="Zaloguj się, aby zmienić awatar.";return;}
            RunAccount(()=>online.SetAvatar(preset),()=>{RefreshAccountSettings();settingsMessage.text="Serwer potwierdził zmianę awatara.";});
        }
        void SaveAccountPassword()
        {
            if(accountBusy)return;if(online?.Authenticated!=true){settingsMessage.text="Zaloguj się, aby zmienić hasło.";return;}
            var current=currentPassword.text;var password=newPassword.text;
            if(password.Length<8||password.Length>128){settingsMessage.text="Nowe hasło musi mieć od 8 do 128 znaków.";return;}
            if(password!=repeatNewPassword.text){settingsMessage.text="Nowe hasła muszą być takie same.";return;}
            if(online.HasPassword&&string.IsNullOrEmpty(current)){settingsMessage.text="Wpisz obecne hasło.";return;}
            ClearAccountSecrets();
            RunAccount(()=>online.ChangePassword(current,password),()=>{RefreshAccountSettings();settingsMessage.text="Serwer potwierdził zmianę hasła. Pozostałe sesje konta zostały wylogowane.";});
        }
    }
}
