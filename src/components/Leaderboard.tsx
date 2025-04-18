import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import sdk from '@farcaster/frame-sdk';

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
  pfp?: string;
};

type LeaderboardView = 'top' | 'personal';

type LeaderboardProps = {
  isMuted: boolean;
  playGameJingle: () => void;
  currentUserFid?: string;
  pfpUrl?: string;
};

const shareText = `Have you played POD Play v2? 🕹️\npodplayv2.vercel.app`;

export default function Leaderboard({ isMuted, playGameJingle, currentUserFid, pfpUrl }: LeaderboardProps) {
  const [view, setView] = useState<LeaderboardView>('top');
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserData, setCurrentUserData] = useState<LeaderboardEntry | null>(null);
  const isJinglePlaying = useRef(false);

  // Handle jingle playback
  useEffect(() => {
    if (!isMuted && !isJinglePlaying.current) {
      isJinglePlaying.current = true;
      playGameJingle();
    }
    return () => {
      isJinglePlaying.current = false;
    };
  }, [isMuted, playGameJingle]);

  const handleViewChange = (newView: LeaderboardView) => {
    setView(newView);
    // Remove jingle from here since it's handled by useEffect
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const url = currentUserFid 
          ? `/api/firebase?userFid=${currentUserFid}`
          : '/api/firebase';
          
        const response = await fetch(url);
        const data = await response.json();
        setLeaderboard(data.leaderboard);
        if (data.userData) {
          setCurrentUserData(data.userData);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentUserFid]);

  if (isLoading) {
    return <div>Loading leaderboard...</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {view === 'top' ? (
        <div className="flex flex-col gap-3">
          <div className="bg-gradient-to-b from-purple-900/90 to-purple-800/90 p-4 rounded-xl shadow-2xl w-full max-h-[500px] overflow-y-auto border border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-4 text-center text-shadow-glow bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-purple-100">
              Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.fid}
                  className="flex justify-between items-center bg-purple-800/40 p-3 rounded-lg hover:bg-purple-700/50 transition-all border border-purple-500/10 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 bg-purple-600/30 rounded-full border border-purple-400/20">
                      <span className="text-purple-200 text-sm font-bold">#{index + 1}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-semibold text-base">{entry.username}</span>
                      <span className="text-[10px] text-purple-300/80 font-mono">fid:{entry.fid}</span>
                    </div>
                  </div>
                  <div className="text-right bg-purple-900/30 px-3 py-1 rounded-lg border border-purple-500/10">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-green-400 font-bold text-base">{entry.wins}W</span>
                      <span className="text-yellow-400 font-bold text-sm">({entry.podScore?.toFixed(1)}PS)</span>
                    </div>
                    <div className="text-[10px] text-purple-300/80 font-medium">
                      E:{entry.easyWins || 0} M:{entry.mediumWins || 0} H:{entry.hardWins || 0}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center mt-3">
                <button
                  onClick={() => {
                    const shareText = 'Have you played POD Play v2? 🕹️';
                    const shareUrl = 'podplayv2.vercel.app';
                    sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`);
                  }}
                  className="w-[85%] py-2 text-lg bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600 rounded-lg"
                >
                  Share Game
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleViewChange('personal')}
            className="w-[85%] py-2 text-lg bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600 mx-auto rounded-lg"
          >
            View My Stats
          </button>
        </div>
      ) : (
        <div className="bg-purple-900/90 p-4 rounded-xl shadow-2xl w-full max-h-[500px] overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-4 text-center text-shadow">
            My Stats
          </h2>
          {currentUserData ? (
            <div className="space-y-4">
              <div className="bg-purple-800/70 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={pfpUrl} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full border-2 border-purple-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xl text-white">{currentUserData.username}</span>
                    <span className="text-base text-purple-300">
                      Win Rank #{leaderboard.findIndex(e => e.fid === currentUserFid) === -1 
                        ? leaderboard.length + 1 
                        : leaderboard.findIndex(e => e.fid === currentUserFid) + 1}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-purple-700/50 rounded-lg">
                    <div className="text-green-400 text-2xl font-bold">{currentUserData.wins}</div>
                    <div className="text-sm text-purple-300">Wins</div>
                  </div>
                  <div className="text-center p-3 bg-purple-700/50 rounded-lg">
                    <div className="text-red-400 text-2xl font-bold">{currentUserData.losses}</div>
                    <div className="text-sm text-purple-300">Losses</div>
                  </div>
                  <div className="text-center p-3 bg-purple-700/50 rounded-lg">
                    <div className="text-blue-400 text-2xl font-bold">{currentUserData.ties}</div>
                    <div className="text-sm text-purple-300">Ties</div>
                  </div>
                </div>

                <div className="bg-purple-700/30 p-3 rounded-lg">
                  <h3 className="text-white text-lg mb-3 text-center">Wins by Difficulty</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-green-300 text-xl font-bold">{currentUserData.easyWins}</div>
                      <div className="text-xs text-purple-300">Easy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-300 text-xl font-bold">{currentUserData.mediumWins}</div>
                      <div className="text-xs text-purple-300">Medium</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-300 text-xl font-bold">{currentUserData.hardWins}</div>
                      <div className="text-xs text-purple-300">Hard</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 p-3 bg-purple-700/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-yellow-400 text-3xl font-bold">
                      {currentUserData.podScore?.toFixed(1)}
                    </div>
                    <div className="text-sm text-purple-300">POD Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-300 text-3xl font-bold">
                      #{leaderboard
                        .slice()
                        .sort((a, b) => b.podScore - a.podScore)
                        .findIndex(e => e.fid === currentUserFid) === -1
                          ? leaderboard.length + 1
                          : leaderboard
                            .slice()
                            .sort((a, b) => b.podScore - a.podScore)
                            .findIndex(e => e.fid === currentUserFid) + 1}
                    </div>
                    <div className="text-sm text-purple-300">POD Rank</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 justify-center">
                <button
                  onClick={() => {
                    const shareText = 'Have you played POD Play v2? 🕹️';
                    const shareUrl = 'podplayv2.vercel.app';
                    sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`);
                  }}
                  className="w-[85%] py-2 text-lg bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600 mx-auto rounded-lg"
                >
                  Share Game
                </button>
                
                <button
                  onClick={() => handleViewChange('top')}
                  className="w-[85%] py-2 text-lg bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600 mx-auto rounded-lg"
                >
                  Back to Leaderboard
                </button>
              </div>
            </div>
          ) : (
            <div className="text-white text-center">No stats available</div>
          )}
        </div>
      )}
    </div>
  );
} 
////