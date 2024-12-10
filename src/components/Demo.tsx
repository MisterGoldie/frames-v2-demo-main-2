"use client";

import { useEffect, useCallback, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';

type Square = 'X' | 'O' | null;
type Board = Square[];
type GameState = 'menu' | 'game';
type MenuStep = 'game' | 'piece' | 'difficulty';

export default function Demo({ title }: { title?: string } = { title: "Tic-tac-toe Frame" }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [menuStep, setMenuStep] = useState<MenuStep>('game');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState<'X' | 'O'>('X');
  const [playHover] = useSound('/sounds/hover.mp3', { volume: 0.5, soundEnabled: !isMuted });
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.5, soundEnabled: !isMuted });
  const [playHalloweenMusic, { stop: stopHalloweenMusic }] = useSound('/sounds/halloween.mp3', { 
    volume: 0.3, 
    loop: true, 
    soundEnabled: !isMuted 
  });

  // SDK initialization
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

  const handleStartGame = useCallback((difficulty: string, piece: string) => {
    playClick();
    stopHalloweenMusic();
    setGameState('game');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setSelectedPiece(piece === 'X' ? 'X' : 'O');
  }, [playClick, stopHalloweenMusic]);

  // Game logic remains the same
  const handleMove = useCallback((index: number) => {
    if (board[index] || calculateWinner(board)) return;
    
    const newBoard = board.slice();
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  }, [board, isXNext]);

  const resetGame = useCallback(() => {
    setGameState('menu');
    setMenuStep('game');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  }, []);

  useEffect(() => {
    if (gameState === 'menu') {
      playHalloweenMusic();
      return () => stopHalloweenMusic();
    }
  }, [gameState, playHalloweenMusic, stopHalloweenMusic]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-[300px] mx-auto py-4 px-2">
      {gameState === 'menu' ? (
        <div className="w-full bg-purple-600 rounded-lg p-4">
          <h1 className="text-2xl font-bold text-center text-white mb-4">
            {title}
          </h1>
          
          {menuStep === 'game' && (
            <Button 
              onClick={() => {
                playClick();
                setMenuStep('piece');
              }}
              onMouseEnter={() => playHover()}
              className="w-full mb-2"
            >
              Tic-Tac-Toe
            </Button>
          )}

          {menuStep === 'piece' && (
            <>
              <Button 
                onClick={() => {
                  setSelectedPiece('X');
                  setMenuStep('difficulty');
                }}
                className="w-full mb-2"
              >
                X
              </Button>
              <Button 
                onClick={() => {
                  setSelectedPiece('O');
                  setMenuStep('difficulty');
                }}
                className="w-full mb-2"
              >
                O
              </Button>
            </>
          )}

          {menuStep === 'difficulty' && (
            <>
              <Button 
                onClick={() => handleStartGame('easy', selectedPiece)}
                className="w-full mb-2"
              >
                Easy
              </Button>
              <Button 
                onClick={() => handleStartGame('medium', selectedPiece)}
                className="w-full mb-2"
              >
                Medium
              </Button>
              <Button 
                onClick={() => handleStartGame('hard', selectedPiece)}
                className="w-full mb-2"
              >
                Hard
              </Button>
            </>
          )}

          {menuStep !== 'game' && (
            <div className="flex justify-between mt-4">
              <Button onClick={() => setMenuStep(menuStep === 'difficulty' ? 'piece' : 'game')}>
                Back
              </Button>
              <Button onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Game board UI remains the same
        <div className="mb-4">
          <div className="text-center mb-2">
            {calculateWinner(board) 
              ? `Winner: ${calculateWinner(board)}`
              : board.every(square => square) 
              ? "Game is a draw!" 
              : `Next player: ${isXNext ? 'X' : 'O'}`}
          </div>
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
          <Button onClick={resetGame}>Back to Menu</Button>
        </div>
      )}
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

