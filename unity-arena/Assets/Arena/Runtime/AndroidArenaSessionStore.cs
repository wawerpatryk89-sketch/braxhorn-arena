using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace Braxhorn.Arena
{
    public sealed class AndroidArenaSessionStore : IArenaSessionStore
    {
        readonly string origin;
        public AndroidArenaSessionStore(string serviceOrigin){origin=new Uri(serviceOrigin).AbsoluteUri;}
        public static IArenaSessionStore Create(string origin)
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            return new AndroidArenaSessionStore(origin);
#else
            return null;
#endif
        }
#if UNITY_ANDROID && !UNITY_EDITOR
        string Alias
        {
            get{using var hash=SHA256.Create();return "braxhorn.arena.session.v1."+BitConverter.ToString(hash.ComputeHash(Encoding.UTF8.GetBytes(origin))).Replace("-","").ToLowerInvariant();}
        }
        string PathName
        {
            get
            {
                using var unity=new AndroidJavaClass("com.unity3d.player.UnityPlayer");
                using var activity=unity.GetStatic<AndroidJavaObject>("currentActivity");
                using var directory=activity.Call<AndroidJavaObject>("getNoBackupFilesDir");
                return Path.Combine(directory.Call<string>("getAbsolutePath"),Alias+".sealed");
            }
        }
        static sbyte[] JavaBytes(byte[] value){var result=new sbyte[value.Length];Buffer.BlockCopy(value,0,result,0,value.Length);return result;}
        static byte[] Bytes(sbyte[] value){var result=new byte[value.Length];Buffer.BlockCopy(value,0,result,0,value.Length);return result;}
        static AndroidJavaObject KeyStore()
        {
            using var type=new AndroidJavaClass("java.security.KeyStore");
            var store=type.CallStatic<AndroidJavaObject>("getInstance","AndroidKeyStore");
            // Explicit signatures keep JNI from inferring java.lang.Object for
            // null LoadStoreParameter / char[] arguments on Android runtimes.
            try{store.Call(AndroidJNIHelper.GetMethodID(store.GetRawClass(),"load","(Ljava/security/KeyStore$LoadStoreParameter;)V"),(object)null);return store;}catch{store.Dispose();throw;}
        }
        AndroidJavaObject Key(bool create)
        {
            using var store=KeyStore();
            if(store.Call<bool>("containsAlias",Alias))return store.Call<AndroidJavaObject>(AndroidJNIHelper.GetMethodID(store.GetRawClass(),"getKey","(Ljava/lang/String;[C)Ljava/security/Key;"),Alias,null);
            if(!create)throw new IOException("Session key unavailable");
            using var type=new AndroidJavaClass("javax.crypto.KeyGenerator");
            using var generator=type.CallStatic<AndroidJavaObject>("getInstance","AES","AndroidKeyStore");
            using var builder=new AndroidJavaObject("android.security.keystore.KeyGenParameterSpec$Builder",Alias,3);
            using var mode=builder.Call<AndroidJavaObject>("setBlockModes",(object)new[]{"GCM"});
            using var padding=builder.Call<AndroidJavaObject>("setEncryptionPaddings",(object)new[]{"NoPadding"});
            using var size=builder.Call<AndroidJavaObject>("setKeySize",256);
            using var randomized=builder.Call<AndroidJavaObject>("setRandomizedEncryptionRequired",true);
            using var spec=builder.Call<AndroidJavaObject>("build");generator.Call("init",spec);
            return generator.Call<AndroidJavaObject>("generateKey");
        }
        AndroidJavaObject FileHandle()
        {
            using var file=new AndroidJavaObject("java.io.File",PathName);
            return new AndroidJavaObject("android.util.AtomicFile",file);
        }
        public string Load()
        {
            using var file=FileHandle();using var baseFile=file.Call<AndroidJavaObject>("getBaseFile");
            // AtomicFile may need to recover its own backup before a read.
            if(!baseFile.Call<bool>("exists")&&!File.Exists(PathName+".bak"))return null;
            if(baseFile.Call<long>("length")>4096||File.Exists(PathName+".bak")&&new FileInfo(PathName+".bak").Length>4096)throw new IOException("Invalid session envelope");
            var data=Bytes(file.Call<sbyte[]>("readFully"));
            if(data.Length<30||data.Length>4096||data[0]!=1||data[1]!=12)throw new IOException("Invalid session envelope");
            var iv=new byte[12];Buffer.BlockCopy(data,2,iv,0,12);var encrypted=new byte[data.Length-14];Buffer.BlockCopy(data,14,encrypted,0,encrypted.Length);
            using var key=Key(false);using var type=new AndroidJavaClass("javax.crypto.Cipher");
            using var cipher=type.CallStatic<AndroidJavaObject>("getInstance","AES/GCM/NoPadding");
            using var parameters=new AndroidJavaObject("javax.crypto.spec.GCMParameterSpec",128,JavaBytes(iv));
            cipher.Call("init",2,key,parameters);cipher.Call("updateAAD",JavaBytes(Encoding.UTF8.GetBytes(origin)));
            var plain=Bytes(cipher.Call<sbyte[]>("doFinal",JavaBytes(encrypted)));
            try{return new UTF8Encoding(false,true).GetString(plain);}finally{Array.Clear(plain,0,plain.Length);}
        }
        public void Save(string value)
        {
            if(value==null||value.Length>2048)throw new ArgumentException("Invalid session payload");
            using var key=Key(true);using var type=new AndroidJavaClass("javax.crypto.Cipher");
            using var cipher=type.CallStatic<AndroidJavaObject>("getInstance","AES/GCM/NoPadding");
            cipher.Call("init",1,key);cipher.Call("updateAAD",JavaBytes(Encoding.UTF8.GetBytes(origin)));
            var plain=JavaBytes(Encoding.UTF8.GetBytes(value));sbyte[] encrypted;
            try{encrypted=cipher.Call<sbyte[]>("doFinal",plain);}finally{Array.Clear(plain,0,plain.Length);}
            var iv=cipher.Call<sbyte[]>("getIV");if(iv.Length!=12)throw new IOException("Invalid session nonce");
            using var file=FileHandle();using var output=file.Call<AndroidJavaObject>("startWrite");
            try{output.Call("write",1);output.Call("write",iv.Length);output.Call("write",iv);output.Call("write",encrypted);file.Call("finishWrite",output);}
            catch{file.Call("failWrite",output);throw;}
        }
        public void Clear()
        {
            // Delete the key first: even a failed file deletion cannot restore
            // the logged-out session. Ciphertext is excluded from OS backups.
            try{using var store=KeyStore();store.Call("deleteEntry",Alias);}
            finally{using var file=FileHandle();file.Call("delete");}
        }
#else
        public string Load()=>null;
        public void Save(string value)=>throw new PlatformNotSupportedException("Secure session storage requires Android");
        public void Clear(){}
#endif
    }
}
