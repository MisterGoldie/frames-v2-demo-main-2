"use client";

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { PlayerPiece, Square } from '../types';

interface GameBoardProps {
  board: Square[];
  onSquareClick: (index: number) => void;
  selectedPiece: PlayerPiece;
  isXNext: boolean;
  disabled?: boolean;
}

export const calculateWinner = (squares: Square[]): Square => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onSquareClick,
  selectedPiece,
  isXNext,
  disabled = false
}) => {
  const boardRef = useRef<HTMLDivElement>(null);

  const renderSquare = (index: number) => {
    const value = board[index];
    return (
      <button
        key={index}
        className="w-full h-full border-2 border-purple-400 rounded-lg flex items-center justify-center bg-purple-900/50 hover:bg-purple-800/50 transition-colors"
        onClick={() => !disabled && onSquareClick(index)}
        disabled={disabled || value !== null}
      >
        {value === 'X' ? (
          <Image
            src="/images/x.png"
            alt="X"
            width={60}
            height={60}
            className="object-contain"
          />
        ) : value ? (
          <Image
            src={`/images/${value}.png`}
            alt={value}
            width={60}
            height={60}
            className="object-contain"
          />
        ) : null}
      </button>
    );
  };

  return (
    <div
      ref={boardRef}
      className="grid grid-cols-3 gap-2 w-full max-w-md aspect-square p-4"
    >
      {board.map((_, index) => renderSquare(index))}
    </div>
  );
};
