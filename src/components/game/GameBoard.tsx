"use client";

import { Button } from "~/components/ui/Button";
import Image from 'next/image';
import { RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <motion.div 
      className="flex flex-col items-center justify-start h-[400px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="text-center mb-4 text-white text-xl text-shadow"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {getGameStatus()}
      </motion.div>
      
      <motion.div 
        ref={boardRef}
        className="grid grid-cols-3 relative w-[300px] h-[300px] mb-8"
        style={{ transition: '' }} /* Remove transition to prevent conflict with manual rotation */
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Grid lines */}
        <motion.div 
          className="absolute left-[33%] top-0 w-[2px] h-full bg-white shadow-glow" 
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        />
        <motion.div 
          className="absolute left-[66%] top-0 w-[2px] h-full bg-white shadow-glow" 
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        />
        <motion.div 
          className="absolute left-0 top-[33%] w-full h-[2px] bg-white shadow-glow" 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        />
        <motion.div 
          className="absolute left-0 top-[66%] w-full h-[2px] bg-white shadow-glow" 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        />

          {board.map((square, index) => (
            <motion.button
              key={index}
              className="h-[100px] flex items-center justify-center text-2xl font-bold bg-transparent"
              onClick={() => handleMove(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {square === 'X' ? (
                  <motion.div
                    key="maxi"
                    initial={{ scale: 0, rotate: -10, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <Image 
                      src="/maxi.png" 
                      alt="Maxi" 
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </motion.div>
                ) : square ? (
                  <motion.div
                    key={square}
                    initial={{ scale: 0, rotate: 10, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <Image 
                      src={`/${square}.png`} 
                      alt={square} 
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.button>
          ))}
      </motion.div>

      <motion.div 
        className="w-full px-4 absolute" 
        style={{ bottom: '-80px' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <AnimatePresence>
          {(winner || isDraw || endedByTimer) && (
          <motion.div 
            className="grid grid-cols-2 gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
          >
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
          </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
