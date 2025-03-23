export async function shouldSendNotification(type: 'win' | 'loss' | 'draw'): Promise<boolean> {
  try {
    // Base probability for each outcome type
    const probabilities = {
      win: 0.3,    // 30% chance to notify user for wins
      loss: 0.2,   // 20% chance to notify user for losses
      draw: 0.15   // 15% chance to notify user for draws
    };

    // Check if user has opted out of notifications
    try {
      const optOutStatus = localStorage.getItem('notification_opt_out');
      if (optOutStatus === 'true') {
        console.log('User has opted out of notifications');
        return false;
      }
    } catch (storageError) {
      console.warn('Could not check notification preferences:', storageError);
      // Continue with probability check if storage access fails
    }

    const random = Math.random();
    return random < probabilities[type];
  } catch (error) {
    console.error('Error in shouldSendNotification:', error);
    return false; // Default to not sending on error
  }
}