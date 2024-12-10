"use client";

import { useEffect, useCallback, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';

type PlayerPiece = 'scarygary' | 'chili' | 'podplaylogo';
type Square = 'X' | PlayerPiece | null;
type Board = Square[];
type GameState = 'menu' | 'game';
type MenuStep = 'game' | 'piece' | 'difficulty';
type Difficulty = 'easy' | 'medium' | 'hard';

export default function Demo() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [menuStep, setMenuStep] = useState<MenuStep>('game');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState<PlayerPiece>('chili');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
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

  const handleStartGame = useCallback((diff: Difficulty, piece: PlayerPiece) => {
    playClick();
    stopHalloweenMusic();
    setGameState('game');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setSelectedPiece(piece);
    setDifficulty(diff);
  }, [playClick, stopHalloweenMusic, isXNext]);

  const getComputerMove = useCallback((currentBoard: Board): number => {
    const availableSpots = currentBoard
      .map((spot, index) => spot === null ? index : null)
      .filter((spot): spot is number => spot !== null);

    if (difficulty === 'easy') {
      // Random move
      return availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }

    if (difficulty === 'hard') {
      // Try to win
      for (const spot of availableSpots) {
        const boardCopy = [...currentBoard];
        boardCopy[spot] = 'X';
        if (calculateWinner(boardCopy) === 'X') {
          return spot;
        }
      }

      // Block player from winning
      for (const spot of availableSpots) {
        const boardCopy = [...currentBoard];
        boardCopy[spot] = selectedPiece;
        if (calculateWinner(boardCopy) === selectedPiece) {
          return spot;
        }
      }
    }

    // Medium difficulty or fallback
    // Mix of random moves and blocking
    if (Math.random() > 0.5) {
      // Try blocking
      for (const spot of availableSpots) {
        const boardCopy = [...currentBoard];
        boardCopy[spot] = selectedPiece;
        if (calculateWinner(boardCopy) === selectedPiece) {
          return spot;
        }
      }
    }

    // Take center if available
    if (availableSpots.includes(4)) return 4;
    
    // Random move
    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
  }, [difficulty, selectedPiece]);

  const handleMove = useCallback((index: number) => {
    if (board[index] || calculateWinner(board) || !isXNext) return;
    
    const newBoard = board.slice();
    newBoard[index] = selectedPiece;
    setBoard(newBoard);
    setIsXNext(true);

    // Computer's turn
    setTimeout(() => {
      if (!calculateWinner(newBoard) && !newBoard.every(square => square !== null)) {
        const computerMove = getComputerMove(newBoard);
        newBoard[computerMove] = 'X';
        setBoard(newBoard);
        setIsXNext(false);
      }
    }, 500); // Half second delay for computer's move
  }, [board, selectedPiece, getComputerMove]);

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
    <div className="w-[300px] h-[600px] mx-auto flex items-center justify-center">
      {gameState === 'menu' ? (
        <div className="w-full h-[300px] bg-purple-600 rounded-lg p-6 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-center text-white mb-8">
            {menuStep === 'game' ? 'Select Game' :
             menuStep === 'piece' ? 'Select Piece' :
             'Choose Difficulty'}
          </h1>
          
          {menuStep === 'game' && (
            <Button 
              onClick={() => {
                playClick();
                setMenuStep('piece');
              }}
              onMouseEnter={() => playHover()}
              className="w-3/4 py-4 text-xl mb-4 bg-purple-700 hover:bg-purple-800"
            >
              Tic-Tac-Toe
            </Button>
          )}

          {menuStep === 'piece' && (
            <>
              <Button 
                onClick={() => {
                  playClick();
                  setSelectedPiece('scarygary');
                  setMenuStep('difficulty');
                }}
                className="w-full mb-2"
              >
                Scary Gary
              </Button>
              <Button 
                onClick={() => {
                  playClick();
                  setSelectedPiece('chili');
                  setMenuStep('difficulty');
                }}
                className="w-full mb-2"
              >
                Chili
              </Button>
              <Button 
                onClick={() => {
                  playClick();
                  setSelectedPiece('podplaylogo');
                  setMenuStep('difficulty');
                }}
                className="w-full mb-2"
              >
                Pod Logo
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

