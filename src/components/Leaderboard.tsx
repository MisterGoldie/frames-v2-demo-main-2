import { useEffect, useState } from 'react';
import Image from 'next/image';

type LeaderboardEntry = {
  fid: string;
  username: string;
  pfp: string;
  wins: number;
  losses: number;
  ties: number;
  easyWins: number;
  mediumWins: number;
  hardWins: number;
  podScore: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/firebase');
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (isLoading) return <div>Loading leaderboard...</div>;

  return (
    <div className="bg-purple-900/80 p-4 rounded-lg shadow-lg max-w-sm w-full -mt-12">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Leaderboard</h2>
      <div className="space-y-2">
        {leaderboard.map((entry, index) => (
          <div 
            key={entry.fid}
            className="flex justify-between items-center bg-purple-800/50 p-2 rounded"
          >
            <div className="flex items-center gap-2">
              <span className="text-purple-300 w-6">#{index + 1}</span>
              <div className="flex flex-col">
                <span className="text-white font-medium">{entry.username}</span>
                <span className="text-xs text-purple-300">fid:{entry.fid}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-green-400 font-bold">{entry.wins} W</span>
                <span className="text-yellow-400 font-bold">({entry.podScore.toFixed(1)} PS)</span>
              </div>
              <div className="text-xs text-purple-300">
                {entry.easyWins}/{entry.mediumWins}/{entry.hardWins}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
//