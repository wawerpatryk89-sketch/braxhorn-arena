using System;
using System.Collections.Generic;
using System.Linq;

namespace Braxhorn.Arena.Domain
{
    public enum BoutOutcome { Win, Loss, Draw }

    public sealed class CampaignBout
    {
        public string A;
        public string B;
        public string Winner;
        public bool Simulated;
    }

    public sealed class CampaignResult
    {
        public string Opponent;
        public BoutOutcome Outcome;
    }

    // Port of championship.js rules from the published v271 source. Rendering
    // and online tournament authority are separate from this offline campaign.
    public sealed class CampaignRun
    {
        readonly Func<double> random;
        readonly string[] opponents;
        CampaignBout current;
        public string Mode { get; }
        public string Player { get; }
        public bool Finished { get; private set; }
        public bool Eliminated { get; private set; }
        public string Champion { get; private set; }
        public int Index { get; private set; }
        public List<CampaignResult> History { get; } = new List<CampaignResult>();
        public List<List<CampaignBout>> Rounds { get; } = new List<List<CampaignBout>>();

        public CampaignRun(string mode, string player, IEnumerable<string> names, Func<double> random)
        {
            if (mode != "arcade" && mode != "tournament") throw new ArgumentException("Unknown campaign", nameof(mode));
            this.random = random ?? throw new ArgumentNullException(nameof(random));
            Mode = mode;
            Player = player;
            var roster = names.ToArray();
            if (roster.Distinct().Count() != roster.Length || !roster.Contains(player)) throw new ArgumentException("Roster must contain the player exactly once.");
            if (mode == "tournament" && roster.Length != 6 && roster.Length != 8) throw new ArgumentException("The authored bracket requires six or eight fighters.");
            for (var i = roster.Length - 1; i > 0; i--)
            {
                var j = (int)Math.Floor(NextRandom() * (i + 1));
                (roster[i], roster[j]) = (roster[j], roster[i]);
            }
            if (mode == "tournament" && roster.Length == 8)
            {
                var playerHalf = (Array.IndexOf(roster, player) / 2) % 2;
                var slot = Array.FindIndex(roster, name => name != player && (Array.IndexOf(roster, name) / 2) % 2 != playerHalf);
                roster[slot] = "BOSS";
            }
            if (mode == "arcade") opponents = roster.Where(n => n != player).ToArray();
            else if (roster.Length == 8)
                Rounds.Add(Enumerable.Range(0, 4).Select(i => new CampaignBout { A = roster[i * 2], B = roster[i * 2 + 1] }).ToList());
            else Rounds.Add(new List<CampaignBout> {
                new CampaignBout { A = roster[0], B = roster[1] },
                new CampaignBout { A = roster[2], B = roster[3] },
                new CampaignBout { A = roster[4], Winner = roster[4] },
                new CampaignBout { A = roster[5], Winner = roster[5] }
            });
        }

        double NextRandom()
        {
            var result = random();
            if (double.IsNaN(result) || result < 0 || result >= 1) throw new InvalidOperationException("Random source must return [0, 1).");
            return result;
        }

        public string Next()
        {
            if (Finished) return null;
            if (Mode == "arcade") return opponents[Index];
            while (true)
            {
                var round = Rounds[Rounds.Count - 1];
                foreach (var bout in round)
                {
                    if (bout.Winner != null || ((bout.A == Player || bout.B == Player) && !Eliminated)) continue;
                    bout.Winner = bout.A == "BOSS" || bout.B == "BOSS" ? "BOSS" : NextRandom() < .5 ? bout.A : bout.B;
                    bout.Simulated = true;
                }
                current = round.FirstOrDefault(b => b.Winner == null);
                if (current != null) return current.A == Player ? current.B : current.A;
                if (round.Count == 1) { Finished = true; Champion = round[0].Winner; return null; }
                var winners = round.Select(b => b.Winner).ToArray();
                Rounds.Add(winners.Length == 4 ? new List<CampaignBout> {
                    new CampaignBout { A = winners[0], B = winners[2] },
                    new CampaignBout { A = winners[1], B = winners[3] }
                } : new List<CampaignBout> { new CampaignBout { A = winners[0], B = winners[1] } });
            }
        }

        public void Result(BoutOutcome outcome)
        {
            if (Finished || outcome == BoutOutcome.Draw) return;
            var opponent = Next();
            History.Add(new CampaignResult { Opponent = opponent, Outcome = outcome });
            if (Mode == "arcade")
            {
                if (outcome == BoutOutcome.Loss) { Finished = Eliminated = true; return; }
                Index++;
                if (Index == opponents.Length) { Finished = true; Champion = Player; }
            }
            else
            {
                current.Winner = outcome == BoutOutcome.Win ? Player : opponent;
                Eliminated = outcome == BoutOutcome.Loss;
                Next();
            }
        }
    }

    public sealed class SurvivalRun
    {
        public static readonly string[] Roster = { "BRAX", "NYXA", "VEXA", "KROV", "NINA", "DANNY", "BEAR", "DEMON" };
        readonly Func<double> random;
        string previous;
        string opponent;
        public string Player { get; }
        public int Limit { get; }
        public int Score { get; private set; }
        public double Hp { get; private set; } = 100;
        public bool Finished { get; private set; }
        public bool ResultApplied { get; private set; }
        public string Champion { get; private set; }
        public List<CampaignResult> History { get; } = new List<CampaignResult>();

        public SurvivalRun(string player, Func<double> random, int limit = 10)
        {
            if (!Roster.Contains(player)) throw new ArgumentException("Unknown fighter", nameof(player));
            Player = previous = player;
            this.random = random ?? throw new ArgumentNullException(nameof(random));
            Limit = limit >= 1 ? limit : 10;
            opponent = Limit == 1 ? "BOSS" : NextOpponent();
        }

        string NextOpponent()
        {
            var choices = Roster.Where(n => n != Player && n != previous).ToArray();
            var value = random();
            if (double.IsNaN(value) || value < 0 || value >= 1) throw new InvalidOperationException("Random source must return [0, 1).");
            return previous = choices[(int)Math.Floor(value * choices.Length)];
        }

        public string Next() => Finished ? null : opponent;

        public void Result(BoutOutcome outcome, double hp)
        {
            if (Finished || ResultApplied) return;
            ResultApplied = true;
            History.Add(new CampaignResult { Opponent = opponent, Outcome = outcome });
            if (double.IsNaN(hp) || hp == 0) hp = 1;
            if (outcome == BoutOutcome.Win)
            {
                Score++;
                if (opponent == "BOSS") { Finished = true; Champion = Player; }
                Hp = Math.Min(100, Math.Max(1, hp) + 20);
            }
            else if (outcome == BoutOutcome.Draw) Hp = Math.Max(1, hp);
            else Finished = true;
        }

        public bool Advance()
        {
            if (Finished) return false;
            if (!ResultApplied) return true;
            ResultApplied = false;
            opponent = Score == Limit - 1 ? "BOSS" : NextOpponent();
            return true;
        }
    }
}
