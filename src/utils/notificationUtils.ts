export function shouldSendNotification(type: 'win' | 'loss' | 'draw'): boolean {
  // Base probability for each outcome type
  const probabilities = {
    win: 0.4,    // 40% chance to notify user for wins
    loss: 0.3,   // 30% chance to notify user for losses
    draw: 0.2   // 20% chance to notify user for draws
  };

  const random = Math.random();
  return random < probabilities[type];
} 