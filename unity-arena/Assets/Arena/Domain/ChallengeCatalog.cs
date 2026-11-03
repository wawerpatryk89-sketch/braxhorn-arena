// Authored definitions extracted from pinned v271 arena-features.js; no JS runtime.
using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
namespace Braxhorn.Arena.Domain
{
    public sealed class ArenaChallenge
    {
        public string Id {get;}
        public string Title {get;}
        public string Description {get;}
        public string Event {get;}
        public int Goal {get;}
        public string Mode {get;}
        public string Difficulty {get;}
        public string Opponent {get;}
        public TrainingBehavior? Drill {get;}
        readonly string[] excluded;
        internal ArenaChallenge(JObject data)
        {
            Id=(string)data["id"];Title=(string)data["title"];Description=(string)data["description"];Event=(string)data["event"];Goal=(int)data["goal"];
            var drill=(string)data["drill"];Drill=drill==null?(TrainingBehavior?)null:(TrainingBehavior)Enum.Parse(typeof(TrainingBehavior),drill,true);
            Mode=(string)data["mode"]??(Drill.HasValue?"training":"fight");Difficulty=(string)data["difficulty"]??"normal";Opponent=(string)data["opponent"];
            excluded=(data["exclude"] as JArray)?.Values<string>().ToArray()??Array.Empty<string>();
        }
        public bool Allows(string fighter)=>!excluded.Contains(fighter);
    }
    public static class ChallengeCatalog
    {
        public static IReadOnlyList<ArenaChallenge> All {get;}=Array.AsReadOnly(JArray.Parse(@"[{""id"":""evade5"",""category"":""defense"",""title"":""Czysty unik"",""description"":""Uniknij 5 ataków w jednym ćwiczeniu."",""event"":""evade"",""goal"":5,""drill"":""repeat""},{""id"":""block8"",""category"":""defense"",""title"":""Żelazna garda"",""description"":""Zablokuj 8 trafień. Wybierz zawodnika z gardą — Nina korzysta z uników."",""event"":""block"",""goal"":8,""drill"":""repeat"",""exclude"":[""NINA""]},{""id"":""break3"",""category"":""defense"",""title"":""Wyrwij się"",""description"":""Zerwij 3 chwyty przyciskiem CHWYT w początkowym oknie."",""event"":""break"",""goal"":3,""drill"":""grab""},{""id"":""evade10"",""category"":""defense"",""title"":""Nieuchwytny"",""description"":""Uniknij 10 ataków podczas swobodnego sparingu."",""event"":""evade"",""goal"":10,""drill"":""spar""},{""id"":""block20"",""category"":""defense"",""title"":""Mur nie do przejścia"",""description"":""Zablokuj 20 trafień podczas sparingu. Nina nie ma gardy."",""event"":""block"",""goal"":20,""drill"":""spar"",""exclude"":[""NINA""]},{""id"":""break6"",""category"":""defense"",""title"":""Poza zasięgiem chwytu"",""description"":""Wydostań się z 6 chwytów w jednym ćwiczeniu."",""event"":""break"",""goal"":6,""drill"":""grab""},{""id"":""counter3"",""category"":""attack"",""title"":""Odpowiedź w tempo"",""description"":""Traf 3 razy podczas powrotu rywala po niecelnym ataku."",""event"":""counter"",""goal"":3,""drill"":""counter""},{""id"":""push3"",""category"":""attack"",""title"":""Przerwij napór"",""description"":""Uzyskaj 3 mocne odepchnięcia po trafionych seriach."",""event"":""push"",""goal"":3,""drill"":""bag""},{""id"":""hits12"",""category"":""attack"",""title"":""Dwanaście trafień"",""description"":""Zadaj 12 czystych trafień podczas sparingu."",""event"":""hit"",""goal"":12,""drill"":""spar""},{""id"":""kicks6"",""category"":""attack"",""title"":""Długi dystans"",""description"":""Traf rywala 6 razy kopnięciami podczas sparingu."",""event"":""kick"",""goal"":6,""drill"":""spar""},{""id"":""combohits5"",""category"":""attack"",""title"":""Pełna sekwencja"",""description"":""Zadaj 5 trafień z ataku COMBO. Poczekaj na pełne naładowanie energii."",""event"":""combohit"",""goal"":5,""drill"":""bag""},{""id"":""counter8"",""category"":""attack"",""title"":""Mistrz kontry"",""description"":""Ukarz 8 niecelnych ataków rywala podczas jego powrotu."",""event"":""counter"",""goal"":8,""drill"":""counter""},{""id"":""cleanwin"",""category"":""wins"",""title"":""Bez specjalnego"",""description"":""Wygraj walkę na średnim poziomie bez użycia COMBO."",""event"":""cleanwin"",""goal"":1},{""id"":""hardwin"",""category"":""wins"",""title"":""Próba mistrza"",""description"":""Wygraj walkę na trudnym poziomie."",""event"":""hardwin"",""goal"":1,""difficulty"":""hard""},{""id"":""healthywin"",""category"":""wins"",""title"":""Pełna kontrola"",""description"":""Wygraj walkę i zachowaj co najmniej 60 punktów zdrowia w ostatniej rundzie."",""event"":""healthywin"",""goal"":1},{""id"":""fastwin"",""category"":""wins"",""title"":""Błyskawiczna wygrana"",""description"":""Wygraj całą walkę w czasie najwyżej 90 sekund aktywnej walki."",""event"":""fastwin"",""goal"":1},{""id"":""cleanwinhard"",""category"":""wins"",""title"":""Siła podstaw"",""description"":""Wygraj na trudnym poziomie bez użycia COMBO."",""event"":""cleanwin"",""goal"":1,""difficulty"":""hard""},{""id"":""healthyhard"",""category"":""wins"",""title"":""Zimna krew"",""description"":""Wygraj na trudnym poziomie z co najmniej 60 punktami zdrowia w ostatniej rundzie."",""event"":""healthywin"",""goal"":1,""difficulty"":""hard""},{""id"":""survival3"",""category"":""survival"",""title"":""Pierwsza seria"",""description"":""Pokonaj 3 rywali w jednej serii Survival na średnim poziomie."",""event"":""survival"",""goal"":3,""mode"":""survival""},{""id"":""survival5"",""category"":""survival"",""title"":""Piątka bez przerwy"",""description"":""Pokonaj 5 rywali w jednej serii Survival na średnim poziomie."",""event"":""survival"",""goal"":5,""mode"":""survival""},{""id"":""survival10"",""category"":""survival"",""title"":""Dziesięciu pokonanych"",""description"":""Pokonaj 10 rywali w jednej serii Survival na średnim poziomie."",""event"":""survival"",""goal"":10,""mode"":""survival""},{""id"":""survivalhard3"",""category"":""survival"",""title"":""Stalowa seria"",""description"":""Pokonaj 3 rywali w jednej serii Survival na trudnym poziomie."",""event"":""survival"",""goal"":3,""mode"":""survival"",""difficulty"":""hard""},{""id"":""survivalhard5"",""category"":""survival"",""title"":""Ostatni na arenie"",""description"":""Pokonaj 5 rywali w jednej serii Survival na trudnym poziomie."",""event"":""survival"",""goal"":5,""mode"":""survival"",""difficulty"":""hard""},{""id"":""survivalhard10"",""category"":""survival"",""title"":""Legenda Survival"",""description"":""Pokonaj 10 rywali w jednej serii Survival na trudnym poziomie."",""event"":""survival"",""goal"":10,""mode"":""survival"",""difficulty"":""hard""},{""id"":""bossfinal"",""category"":""wins"",""title"":""Ostatnie starcie"",""description"":""Pokonaj bossa uzbrojonego w kij bejsbolowy."",""event"":""bosswin"",""goal"":1,""difficulty"":""hard"",""opponent"":""BOSS""}]").OfType<JObject>().Select(x=>new ArenaChallenge(x)).ToArray());
        public static ArenaChallenge Find(string id)=>All.FirstOrDefault(c=>c.Id==id);
    }
    public sealed class ChallengeRun
    {
        public ArenaChallenge Definition {get;}
        public string Fighter {get;}
        public int Count {get;private set;}
        public bool Done=>Count>=Definition.Goal;
        public ChallengeRun(ArenaChallenge definition,string fighter)
        {Definition=definition??throw new ArgumentNullException(nameof(definition));if(!definition.Allows(fighter))throw new ArgumentException("Fighter cannot enter this challenge");Fighter=fighter;}
        public bool Note(string kind)
        {if(Done||kind!=Definition.Event)return false;Count++;return Done;}
    }
}
