export function calculatePODScore(
  wins: number, 
  ties: number, 
  losses: number, 
  totalGames: number, 
  tokenBalance: number
): number {
  // Base score calculation
  const baseScore = (wins * 2) + ties + (losses * 0.5);
  
  // Games bonus: +10 points for every 25 games played
  const gamesBonus = Math.floor(totalGames / 25) * 10;
  
  // Token bonus: +25 points PER /thepod fan token owned
  const tokenBonus = tokenBalance * 25;
  
  // Calculate total score
  const totalScore = baseScore + gamesBonus + tokenBonus;
  
  // Round to one decimal place
  return Math.round(totalScore * 10) / 10;
} 