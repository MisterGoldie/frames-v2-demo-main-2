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
    <div className="relative h-[695px] w-[424px]">
      <div className="absolute top-8 left-0 right-0 text-center text-white text-xl text-shadow">
        {getGameStatus()}
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[300px] h-[300px]">
        {/* Fixed position grid lines */}
        <div className="absolute left-[33%] top-0 w-[2px] h-full bg-white shadow-glow" />
        <div className="absolute left-[66%] top-0 w-[2px] h-full bg-white shadow-glow" />
        <div className="absolute left-0 top-[33%] w-full h-[2px] bg-white shadow-glow" />
        <div className="absolute left-0 top-[66%] w-full h-[2px] bg-white shadow-glow" />
        
        {/* Game grid */}
        <div 
          ref={boardRef}
          className="grid grid-cols-3 w-full h-full"
          style={{ transition: 'transform 0.1s linear' }}
        >
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
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[320px]">
        {(winner || isDraw || endedByTimer) && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="flex gap-3">
              <Button
                onClick={handlePlayAgain}
                className="flex-1 h-[42px] text-lg bg-green-600 shadow-lg hover:shadow-xl transition-all hover:bg-green-500 rounded-lg"
              >
                Play Again
              </Button>
              <Button
                onClick={resetGame}
                className="flex-1 h-[42px] text-lg bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600 rounded-lg"
              >
                Menu
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleViewLeaderboard}
                className="flex-1 h-[42px] text-lg bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600 rounded-lg"
              >
                Leaderboard
              </Button>
              <Button
                onClick={handleGameBoardShare}
                className="flex-1 h-[42px] text-lg bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600 rounded-lg"
              >
                Share
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
