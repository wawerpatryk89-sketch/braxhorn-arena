import limits from './ranking-times.json';
export function minimumMatchTime(mode:string,fighter:string,rounds:number[],roundsPlayed:number){
 const policy=limits.modes[mode as keyof typeof limits.modes];if(!policy)return Infinity;
 const own=limits.fighters[fighter as keyof typeof limits.fighters]?.roundMinimumMs??policy.roundMinimumMs;
 // Survival carries player health: a defeat may occur immediately, but a win
 // must still remove the fresh opponent's 100 HP. Drawn rounds last 60 seconds.
 const defeated=mode==='survival'?0:policy.roundMinimumMs;
 return rounds[0]*own+rounds[1]*defeated+Math.max(0,roundsPlayed-rounds[0]-rounds[1])*60000;
}
