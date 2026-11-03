using System;
using System.IO;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Braxhorn.Arena.Domain
{
    // Original peer-link.js JSON envelope. Do not advertise wire:1 until the
    // optional binary effects codec is implemented; browsers retain JSON mode.
    public sealed class DuelPeerWire
    {
        long sent,received;
        readonly bool host;
        public DuelPeerWire(bool host){this.host=host;}
        public string Encode(JObject data,double now)
        {
            if(!(host?DuelWire.Snapshot(data):DuelWire.Input(data)))return null;
            var text=new JObject{["type"]=host?"state":"input",["seq"]=++sent,["sentAt"]=now,["data"]=data.DeepClone()}.ToString(Formatting.None);
            return Encoding.UTF8.GetByteCount(text)<=262144?text:null;
        }
        public JObject Decode(byte[] bytes,out double? ping,out double? pong)
        {
            ping=pong=null;if(bytes==null||bytes.Length==0||bytes.Length>262144)return null;
            try
            {
                using var reader=new JsonTextReader(new StringReader(new UTF8Encoding(false,true).GetString(bytes))){MaxDepth=32};var value=JObject.Load(reader);if(reader.Read())return null;
                var type=value["type"]?.Type==JTokenType.String?(string)value["type"]:null;
                if(type=="ping"||type=="pong")
                {var at=value["at"];if(at!=null&&(at.Type==JTokenType.Float||at.Type==JTokenType.Integer)&&double.TryParse((string)at,System.Globalization.NumberStyles.Float,System.Globalization.CultureInfo.InvariantCulture,out var n)&&!double.IsNaN(n)&&!double.IsInfinity(n)&&n>=0){if(type=="ping")ping=n;else pong=n;}return null;}
                if(type!=(host?"input":"state")||value["seq"]?.Type!=JTokenType.Integer||!long.TryParse((string)value["seq"],out var seq)||seq<=received||seq>9007199254740991||!(value["data"] is JObject data)||!(host?DuelWire.Input(data):DuelWire.Snapshot(data)))return null;
                received=seq;return data;
            }
            catch(JsonException){return null;}catch(DecoderFallbackException){return null;}
        }
        public static string Ping(double at,bool response=false)=>new JObject{["type"]=response?"pong":"ping",["at"]=at}.ToString(Formatting.None);
    }
}
