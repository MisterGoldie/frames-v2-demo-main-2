"use client";

import { Button } from "~/components/ui/Button";
import Image from 'next/image';
import { RefObject } from 'react';

interface GameBoardProps {
  timeLeft: number;
  getGameStatus: () => string;
  boardRef: RefObject<HTMLDivElement>;
  board: Array<'X' | 'scarygary' | 'chili' | 'podplaylogo' | null>;
  handleMove: (index: number) => void;
  handlePlayAgain: () => void;
  resetGame: () => void;
  winner: boolean;
  isDraw: boolean;
  endedByTimer: boolean;
  handleViewLeaderboard: () => void;
  handleGameBoardShare: () => void;
}

export default function GameBoard({
  timeLeft,
  getGameStatus,
  boardRef,
  board,
  handleMove,
  handlePlayAgain,
  resetGame,
  winner,
  isDraw,
  endedByTimer,
  handleViewLeaderboard,
  handleGameBoardShare
}: GameBoardProps) {
  return (
    <>
      <div className={`absolute top-16 right-4 text-white text-sm ${
        timeLeft === 0 ? 'bg-red-600' : 'bg-purple-800'
      } px-3 py-1 rounded-full box-shadow`}>
        {timeLeft}s
      </div>
      
      <div className="text-center mb-4 text-white text-xl text-shadow">
        {getGameStatus()}
      </div>
      
      <div 
        ref={boardRef}
        className="grid grid-cols-3 relative w-[300px] h-[300px] before:content-[''] before:absolute before:left-[33%] before:top-0 before:w-[2px] before:h-full before:bg-white before:shadow-glow after:content-[''] after:absolute after:left-[66%] after:top-0 after:w-[2px] after:h-full after:bg-white after:shadow-glow mb-4"
        style={{ transition: 'transform 0.1s linear' }}
      >
        <div className="absolute left-0 top-[33%] w-full h-[2px] bg-white shadow-glow" />
        <div className="absolute left-0 top-[66%] w-full h-[2px] bg-white shadow-glow" />
        
        {board.map((square, index) => (
          <button
            key={index}
            className="h-[100px] flex items-center justify-center text-2xl font-bold bg-transparent"
            onClick={() => handleMove(index)}
          >
            {square === 'X' ? (
              <Image 
                src="/maxi.png" 
                alt="Maxi" 
                width={64}
                height={64}
                className="object-contain"
              />
            ) : square ? (
              <Image 
                src={`/${square}.png`} 
                alt={square} 
                width={64}
                height={64}
                className="object-contain"
              />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex flex-col w-full gap-4">
        <div className="flex justify-between w-full gap-4">
          <Button
            onClick={handlePlayAgain}
            className="w-1/2 py-4 text-xl bg-green-600 shadow-lg hover:shadow-xl transition-shadow"
          >
            Play Again
          </Button>
          <Button
            onClick={resetGame}
            className="w-1/2 py-4 text-xl bg-purple-700 shadow-lg hover:shadow-xl transition-shadow"
          >
            Back to Menu
          </Button>
        </div>
        
        {(winner || isDraw || endedByTimer) && (
          <div className="flex flex-col w-full gap-4 mt-4 mb-8">
            <div className="flex justify-between w-full gap-4">
              <Button
                onClick={handleViewLeaderboard}
                className="w-1/2 py-4 text-xl bg-purple-700"
              >
                Leaderboard
              </Button>
              <Button
                onClick={handleGameBoardShare}
                className="w-1/2 py-4 text-xl bg-purple-700 hover:bg-purple-600 transition-colors"
              >
                Share Game
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
