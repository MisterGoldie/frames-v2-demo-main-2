import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

type LeaderboardEntry = {
  fid: string;
  username: string;
  wins: number;
  losses: number;
  ties: number;
  easyWins: number;
  mediumWins: number;
  hardWins: number;
  podScore: number;
};

type LeaderboardProps = {
  isMuted: boolean;
  playGameJingle: () => void;
};

export default function Leaderboard({ isMuted, playGameJingle }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isJinglePlaying = useRef(false);

  useEffect(() => {
    if (!isMuted && !isJinglePlaying.current) {
      isJinglePlaying.current = true;
      playGameJingle();
    }
  }, [isMuted, playGameJingle]);

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
    <div className="bg-purple-900/90 p-6 rounded-xl shadow-2xl w-full max-h-[400px] overflow-y-auto">
      <h2 className="text-3xl font-bold text-white mb-6 text-center text-shadow">
        Leaderboard
      </h2>
      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <div 
            key={entry.fid}
            className="flex justify-between items-center bg-purple-800/70 p-3 rounded-lg hover:bg-purple-800/90 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-purple-300 text-xl font-bold w-8">#{index + 1}</span>
              <div className="flex flex-col">
                <span className="text-white font-semibold text-lg">{entry.username}</span>
                <span className="text-xs text-purple-300/80">fid:{entry.fid}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-3 mb-1">
                <span className="text-green-400 font-bold text-lg">{entry.wins}W</span>
                <span className="text-yellow-400 font-bold">({entry.podScore?.toFixed(1)}PS)</span>
              </div>
              <div className="text-xs text-purple-300/80 font-medium flex flex-col gap-1">
                <div>Easy: {entry.easyWins || 0}</div>
                <div>Medium: {entry.mediumWins || 0}</div>
                <div>Hard: {entry.hardWins || 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
////