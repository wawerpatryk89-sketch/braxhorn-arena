namespace Braxhorn.Arena.Domain
{
    // Consent is independent of transport and cannot be inferred from a room,
    // successful microphone permission or a peer's offer alone.
    public sealed class VoiceConsent
    {
        public string Choice {get;private set;}="pending";
        public string PeerChoice {get;private set;}="pending";
        public bool PermissionPending {get;private set;}
        public bool MicMuted {get;private set;}
        public bool SoundMuted {get;private set;}
        public bool Foreground {get;private set;}=true;
        public bool Decided=>Choice!="pending";
        public bool Both=>Choice=="yes"&&PeerChoice=="yes";
        public bool CanCapture=>Both&&Foreground&&!MicMuted;
        double deadline;
        public bool Request(double now)
        {if(Choice!="pending"||PermissionPending)return false;PermissionPending=true;deadline=now+25000;return true;}
        public bool Permission(bool allowed)
        {if(!PermissionPending||Choice!="pending")return false;PermissionPending=false;Choice=allowed?"yes":"no";if(PeerChoice=="no")Choice="no";return true;}
        public void Peer(string choice)
        {if(choice!="yes"&&choice!="no"&&choice!="pending")return;PeerChoice=choice;if(choice=="no"&&Choice=="yes")Stop();}
        public bool Tick(double now)
        {if(!PermissionPending||now<deadline)return false;Stop();return true;}
        public void Suspend(bool value){Foreground=!value;if(value&&Choice=="yes")MicMuted=true;}
        public void ToggleMic(){if(Choice=="yes")MicMuted=!MicMuted;}
        public void ToggleSound(){if(Choice=="yes")SoundMuted=!SoundMuted;}
        public void Stop(){Choice="no";PermissionPending=false;MicMuted=true;}
    }
}
