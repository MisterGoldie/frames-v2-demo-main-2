"use client";

import { useEffect, useCallback, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";

type Square = 'X' | 'O' | null;
type Board = Square[];

export default function Demo({ title }: { title?: string } = { title: "Tic-tac-toe Frame" }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  useEffect(() => {
    const load = async () => {
      await sdk.context;
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const handleMove = useCallback((index: number) => {
    if (board[index] || calculateWinner(board)) return;
    
    const newBoard = board.slice();
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  }, [board, isXNext]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  }, []);

  const winner = calculateWinner(board);
  const status = winner 
    ? `Winner: ${winner}`
    : board.every(square => square) 
    ? "Game is a draw!" 
    : `Next player: ${isXNext ? 'X' : 'O'}`;

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-[300px] mx-auto py-4 px-2">
      <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

      <div className="mb-4">
        <div className="text-center mb-2">{status}</div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {board.map((square, index) => (
            <button
              key={index}
              className="w-20 h-20 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl font-bold"
              onClick={() => handleMove(index)}
            >
              {square}
            </button>
          ))}
        </div>
        <Button onClick={resetGame}>Reset Game</Button>
      </div>
    </div>
  );
}

function calculateWinner(squares: Square[]): Square {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

