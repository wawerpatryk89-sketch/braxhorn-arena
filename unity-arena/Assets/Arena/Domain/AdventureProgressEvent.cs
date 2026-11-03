namespace Braxhorn.Arena.Domain
{
    public readonly struct AdventureProgressEvent
    {
        public readonly string Action,Status;
        public readonly int Index,Next,Score;
        public readonly double Hp,EnemyHp,ElapsedMs;
        public AdventureProgressEvent(string action,int index,int next,int score,string status,double hp,double enemyHp,double elapsed)
        {Action=action;Index=index;Next=next;Score=score;Status=status;Hp=hp;EnemyHp=enemyHp;ElapsedMs=elapsed;}
    }
}
