"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import sdk from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';

type PlayerPiece = 'scarygary' | 'chili' | 'podplaylogo';
type Square = 'X' | PlayerPiece | null;
type Board = Square[];
type GameState = 'menu' | 'game';
type MenuStep = 'game' | 'piece' | 'difficulty';
type Difficulty = 'easy' | 'medium' | 'hard';
type BoardRef = THREE.Group | null;

interface Board3DProps {
  board: Square[];
  onMove: (index: number) => void;
  selectedPiece: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isXNext: boolean;
}

function Board3D({ board, onMove, selectedPiece, difficulty, isXNext }: Board3DProps) {
  const boardRef = useRef<BoardRef>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerStarted, setTimerStarted] = useState(false);
  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  // Spinning animation for hard mode
  useFrame((state) => {
    if (boardRef.current && difficulty === 'hard') {
      const rotationSpeed = 0.01 + (board.filter(Boolean).length * 0.002);
      boardRef.current.rotation.y += rotationSpeed;
    }
  });

  // Timer logic
  useEffect(() => {
    if (timerStarted && !winner && !isDraw) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            // Handle time's up
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timerStarted, winner, isDraw]);

  const handleCellClick = (index: number) => {
    if (!timerStarted) {
      setTimerStarted(true);
    }
    onMove(index);
  };

  return (
    <group ref={boardRef} scale={[1.1, 1.1, 1]}>
      {/* Grid lines */}
      <Line points={[-1.6, -0.53, 0, 1.6, -0.53, 0]} color="#ffffff" lineWidth={7} />
      <Line points={[-1.6, 0.53, 0, 1.6, 0.53, 0]} color="#ffffff" lineWidth={7} />
      <Line points={[-0.53, -1.6, 0, -0.53, 1.6, 0]} color="#ffffff" lineWidth={7} />
      <Line points={[0.53, -1.6, 0, 0.53, 1.6, 0]} color="#ffffff" lineWidth={7} />

      {/* Board cells */}
      {board.map((value, index) => (
        <mesh key={index} position={[index % 3 - 1, Math.floor(index / 3) - 1, 0]}>
          <boxGeometry args={[0.9, 0.9, 0.1]} />
          <meshStandardMaterial color={value === 'X' ? '#ffd700' : value ? '#ff0000' : '#ffffff'} />
        </mesh>
      ))}
    </group>
  );
}

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
  }, [playClick, stopHalloweenMusic]);

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
    setIsXNext(false);

    // Computer's turn
    setTimeout(() => {
      if (!calculateWinner(newBoard) && !newBoard.every(square => square !== null)) {
        const computerMove = getComputerMove(newBoard);
        newBoard[computerMove] = 'X';
        setBoard([...newBoard]);
        setIsXNext(true);
      }
    }, 500);
  }, [board, selectedPiece, getComputerMove, isXNext]);

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
              Tic-Tac-Maxi
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
        <div className="flex flex-col items-center">
          <div className="text-center mb-4 text-white text-xl">
            {calculateWinner(board) 
              ? `Winner: ${calculateWinner(board) === 'X' ? 'Maxi' : selectedPiece}`
              : board.every(square => square) 
              ? "Game is a draw!" 
              : `Next player: ${isXNext ? 'Maxi' : selectedPiece}`}
          </div>
          
          <div className="grid grid-cols-3 relative w-[300px] h-[300px] before:content-[''] before:absolute before:left-[33%] before:top-0 before:w-[2px] before:h-full before:bg-white before:shadow-glow after:content-[''] after:absolute after:left-[66%] after:top-0 after:w-[2px] after:h-full after:bg-white after:shadow-glow mb-4">
            <div className="absolute left-0 top-[33%] w-full h-[2px] bg-white shadow-glow" />
            <div className="absolute left-0 top-[66%] w-full h-[2px] bg-white shadow-glow" />
            
            {board.map((square, index) => (
              <button
                key={index}
                className="h-[100px] flex items-center justify-center text-2xl font-bold bg-transparent"
                onClick={() => handleMove(index)}
              >
                {square === 'X' ? (
                  <img 
                    src="/maxi.png" 
                    alt="Maxi" 
                    className="w-16 h-16 object-contain"
                  />
                ) : square ? (
                  <img 
                    src={`/${square}.png`} 
                    alt={square} 
                    className="w-16 h-16 object-contain"
                  />
                ) : null}
              </button>
            ))}
          </div>

          <Button
            onClick={resetGame}
            className="w-3/4 py-4 text-xl bg-purple-700 hover:bg-purple-800"
          >
            Back to Menu
          </Button>
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

