using System;
using System.IO;
using System.Text;
using Braxhorn.Arena.Domain;

namespace Braxhorn.Arena
{
    // Disk adapter independent of Unity, so recovery can be tested without Editor.
    public sealed class ProgressFileStore
    {
        readonly string path;
        bool blocked,recovered;
        public string Error {get;private set;}
        public ProgressFileStore(string path){this.path=path??throw new ArgumentNullException(nameof(path));}
        static ArenaProgress Read(string source)
        {var json=File.ReadAllText(source);if(string.IsNullOrWhiteSpace(json))throw new FormatException("Empty progress file");return new ArenaProgress(json);}
        public ArenaProgress Load()
        {
            blocked=false;recovered=false;Error=null;
            if(!File.Exists(path)&&!File.Exists(path+".bak"))return new ArenaProgress();
            try{return Read(path);}
            catch(NotSupportedException){blocked=true;Error="Zapis pochodzi z innej wersji gry. Zachowano go bez zmian.";return new ArenaProgress();}
            catch(Exception e) when(e is IOException||e is UnauthorizedAccessException||e is Newtonsoft.Json.JsonException||e is FormatException||e is InvalidCastException||e is ArgumentException)
            {
                try{var saved=Read(path+".bak");recovered=true;Error="Odzyskano kopię zapisu.";return saved;}
                catch(NotSupportedException){blocked=true;Error="Kopia zapisu pochodzi z innej wersji gry. Zachowano pliki bez zmian.";return new ArenaProgress();}
                catch(Exception backup) when(backup is IOException||backup is UnauthorizedAccessException||backup is Newtonsoft.Json.JsonException||backup is FormatException||backup is InvalidCastException||backup is ArgumentException)
                {blocked=true;Error="Nie można odczytać zapisu. Oryginalne pliki zachowano; nowe wyniki pozostaną tylko w pamięci.";return new ArenaProgress();}
            }
        }
        public bool Save(ArenaProgress progress)
        {
            if(blocked)return false;
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path)));
                using(var stream=new FileStream(path+".tmp",FileMode.Create,FileAccess.Write,FileShare.None))
                {var bytes=new UTF8Encoding(false).GetBytes(progress.Serialize());stream.Write(bytes,0,bytes.Length);stream.Flush(true);}
                if(File.Exists(path))
                {
                    // Never replace a healthy backup with the corrupt main file.
                    if(recovered)File.Copy(path,path+".corrupt",true);else File.Copy(path,path+".bak",true);
                    File.Delete(path);
                }
                File.Move(path+".tmp",path);recovered=false;Error=null;return true;
            }
            catch(Exception e) when(e is IOException||e is UnauthorizedAccessException)
            {Error="Nie udało się zapisać wyników na urządzeniu. Wyniki są nadal w pamięci.";return false;}
        }
    }
}
