export async function updateGameResult(fid: string, action: 'win' | 'loss' | 'tie', difficulty?: 'easy' | 'medium' | 'hard') {
  try {
    const response = await fetch('/api/firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fid, action, difficulty }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update game result');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating game result:', error);
    throw error;
  }
}
