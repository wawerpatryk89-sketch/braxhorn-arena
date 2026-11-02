using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Braxhorn.Arena
{
    [Serializable] public sealed class ArenaMediaEntry
    {
        public string id,name,poster,video,audio,fit,surfaceType;
        public float ground,aspect,brightness,contrast;
        public bool customEffects;
        public JObject surface;
    }
    public sealed class ArenaMediaCatalog
    {
        public readonly ArenaMediaEntry[] Arenas;
        public readonly Dictionary<string,string> Sounds;
        public readonly JArray Routes;
        public ArenaMediaCatalog(string json)
        {
            var data=JObject.Parse(json);
            if((int?)data["schema"]!=1||(int?)data["sourceSiteVersion"]!=271)throw new FormatException("Unsupported Arena media catalog");
            Arenas=data["arenas"].ToObject<ArenaMediaEntry[]>();
            Sounds=data["sounds"].ToDictionary(s=>(string)s["id"],s=>(string)s["file"]);
            Routes=(JArray)data["routes"];
            if(Arenas.Length!=21||Routes.Count!=5)throw new FormatException("Incomplete original Arena catalog");
        }
        public static ArenaMediaCatalog Load()
        {
            var asset=Resources.Load<TextAsset>("ArenaMediaCatalog");
            if(!asset)throw new InvalidOperationException("Missing verified native media export. Run export-media.py before building.");
            return new ArenaMediaCatalog(asset.text);
        }
        public static string Url(string file)
        {
            if(string.IsNullOrEmpty(file)||file.Contains("..")||file.Contains("/")||file.Contains("\\"))throw new ArgumentException("Invalid local media file");
            var root=Application.streamingAssetsPath;
            // Android returns jar:file://...!/assets; never pass it to File.ReadAllBytes.
            return root.Contains("://")?root+"/ArenaMedia/"+file:new Uri(System.IO.Path.Combine(root,"ArenaMedia",file)).AbsoluteUri;
        }
    }
}
