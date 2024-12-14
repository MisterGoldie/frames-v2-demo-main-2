export function shouldSendNotification(type: 'win' | 'loss' | 'draw'): boolean {
  // Base probability for each outcome type
  const probabilities = {
    win: 0.3,    // 30% chance for wins
    loss: 0.2,   // 20% chance for losses
    draw: 0.15   // 15% chance for draws
  };

  const random = Math.random();
  return random < probabilities[type];
} 