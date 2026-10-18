import limits from './ranking-times.json';
export function minimumMatchTime(mode:string,fighter:string,rounds:number[],roundsPlayed:number,difficulty:string='normal'){
 if(!limits.modes.includes(mode))return Infinity;
 const fighterPolicy=limits.fighters[fighter as keyof typeof limits.fighters];
 const p=fighterPolicy?.levels[difficulty as keyof typeof fighterPolicy.levels];
 if(!p)return Infinity;
 // A survival defeat can happen immediately because health carries across opponents.
 if(mode==='survival')return rounds[0]>0?p.roundMinimumMs:0;
 const draws=Math.max(0,roundsPlayed-rounds[0]-rounds[1]);
 return Math.max(p.matchMinimumMs,draws*60000);
}
