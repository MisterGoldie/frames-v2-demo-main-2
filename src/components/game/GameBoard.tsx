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
      <div className="text-center mb-4 text-white text-xl text-shadow">
        {getGameStatus()}
      </div>
      
      <div 
        ref={boardRef}
        className="grid grid-cols-3 relative w-[300px] h-[300px]"
        style={{ transition: 'transform 0.1s linear' }}
      >
        {/* Grid lines */}
        <div className="absolute left-[33%] top-0 w-[2px] h-full bg-white shadow-glow" />
        <div className="absolute left-[66%] top-0 w-[2px] h-full bg-white shadow-glow" />
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

      <div className="mt-8 w-full px-4">
        {(winner || isDraw || endedByTimer) && (
          <div className="grid grid-cols-2 gap-2 animate-fade-in">
            <Button
              onClick={handlePlayAgain}
              className="h-[42px] text-lg bg-green-600 shadow-lg hover:shadow-xl transition-all hover:bg-green-500"
            >
              Play Again
            </Button>
            <Button
              onClick={resetGame}
              className="h-[42px] text-lg bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600"
            >
              Back to Menu
            </Button>
            <Button
              onClick={handleViewLeaderboard}
              className="h-[42px] text-lg bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600"
            >
              Leaderboard
            </Button>
            <Button
              onClick={handleGameBoardShare}
              className="h-[42px] text-lg bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600"
            >
              Share Game
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
