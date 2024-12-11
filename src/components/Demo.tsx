"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';
import Image from 'next/image';
import Snow from './Snow';

type PlayerPiece = 'scarygary' | 'chili' | 'podplaylogo';
type Square = 'X' | PlayerPiece | null;
type Board = Square[];
type GameState = 'menu' | 'game';
type MenuStep = 'game' | 'piece' | 'difficulty';
type Difficulty = 'easy' | 'medium' | 'hard';
type WinningLine = {
  start: number;
  end: number;
  progress: number;
};

const VolumeOnIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="24px" 
    viewBox="0 -960 960 960" 
    width="24px" 
    fill="#FFFFFF"
  >
    <path d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47Z"/>
  </svg>
);

const VolumeOffIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="24px" 
    viewBox="0 -960 960 960" 
    width="24px" 
    fill="#FFFFFF"
  >
    <path d="M792-56 56-792l56-56 736 736-56 56ZM560-514l-80-80v-246h240v160H560v166ZM400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-62l80 80v120q0 66-47 113t-113 47Z"/>
  </svg>
);

export default function Demo() {
  const [gameSession, setGameSession] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();  // Add ref for animation frame
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [frameContext, setFrameContext] = useState<FrameContext>();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [menuStep, setMenuStep] = useState<MenuStep>('game');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState<PlayerPiece>('chili');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.5, soundEnabled: !isMuted });
  const [playGameJingle, { stop: stopGameJingle }] = useSound('/sounds/jingle.mp3', { 
    volume: 0.3, 
    loop: true, 
    soundEnabled: !isMuted 
  });
  const [playWinning] = useSound('/sounds/winning.mp3', { volume: 0.5, soundEnabled: !isMuted });
  const [playLosing] = useSound('/sounds/losing.mp3', { volume: 0.5, soundEnabled: !isMuted });
  const [playDrawing] = useSound('/sounds/drawing.mp3', { volume: 0.5, soundEnabled: !isMuted });
  const [playHalloweenMusic, { stop: stopHalloweenMusic }] = useSound('/sounds/halloween.mp3', { 
    volume: 0.3, 
    loop: true, 
    soundEnabled: !isMuted 
  });
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerStarted, setTimerStarted] = useState(false);
  const [playCountdownSound, { stop: stopCountdownSound }] = useSound('/sounds/countdown.mp3', { 
    volume: 0, 
    soundEnabled: false,
    interrupt: true,
    playbackRate: 1.0,
    sprite: {
      countdown: [0, 5000]
    }
  });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isPlayingCountdown, setIsPlayingCountdown] = useState(false);
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // SDK initialization
  useEffect(() => {
    const loadFrameSDK = async () => {
      try {
        const context = await sdk.context;
        console.log("Frame context:", context); // Debug log
        setFrameContext(context);
        sdk.actions.ready();
      } catch (error) {
        console.error("Error loading Frame SDK:", error);
      }
    };

    if (!isSDKLoaded) {
      setIsSDKLoaded(true);
      loadFrameSDK();
    }
  }, [isSDKLoaded]);

  const handleStartGame = useCallback((diff: Difficulty, piece: PlayerPiece) => {
    playClick();
    stopHalloweenMusic();
    playGameJingle();
    setGameState('game');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setSelectedPiece(piece);
    setDifficulty(diff);
    setTimeLeft(15);
    setTimerStarted(true);
  }, [playClick, stopHalloweenMusic, playGameJingle]);

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
    if (timeLeft === 0 || board[index] || calculateWinner(board) || !isXNext) return;

    if (!timerStarted) {
      setTimerStarted(true);
    }

    const newBoard = [...board];
    newBoard[index] = selectedPiece;
    setBoard(newBoard);
    setIsXNext(false);
    playClick();

    if (calculateWinner(newBoard)) {
      stopGameJingle();
      stopCountdownSound();
      playWinning();
      return;
    }

    // Computer's turn in a separate effect to avoid timer interference
    setTimeout(() => {
      if (timeLeft === 0 || calculateWinner(newBoard)) return;
      
      const computerMove = getComputerMove(newBoard);
      if (computerMove !== -1) {
        const nextBoard = [...newBoard];
        nextBoard[computerMove] = 'X';
        setBoard(nextBoard);
        setIsXNext(true);

        if (calculateWinner(nextBoard)) {
          stopGameJingle();
          stopCountdownSound();
          playLosing();
        } else if (nextBoard.every(square => square !== null)) {
          stopGameJingle();
          stopCountdownSound();
          playDrawing();
        }
      }
    }, 500);
  }, [
    board,
    timeLeft,
    timerStarted,
    isXNext,
    selectedPiece,
    getComputerMove,
    playClick,
    playWinning,
    playLosing,
    playDrawing,
    stopGameJingle,
    stopCountdownSound
  ]);

  const resetGame = useCallback(() => {
    if (boardRef.current) {
      boardRef.current.style.transform = 'rotate(0deg)';  // Reset rotation
    }
    setGameState('menu');
    setMenuStep('game');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setTimeLeft(15);
    setTimerStarted(false);
    setStartTime(null);
    stopCountdownSound();
    stopGameJingle();
    playHalloweenMusic();
  }, [stopCountdownSound, stopGameJingle, playHalloweenMusic]);

  const handlePlayAgain = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (boardRef.current) {
      boardRef.current.style.transform = 'rotate(0deg)';
    }
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setTimeLeft(15);
    setTimerStarted(false);
    setStartTime(null);
    stopCountdownSound();
    playGameJingle();
    setGameSession(prev => prev + 1);
  }, [stopCountdownSound, playGameJingle]);

  useEffect(() => {
    if (gameState === 'menu') {
      playHalloweenMusic();
      return () => stopHalloweenMusic();
    }
  }, [gameState, playHalloweenMusic, stopHalloweenMusic]);

  useEffect(() => {
    if (timerStarted && gameState === 'game' && !calculateWinner(board)) {
      if (!startTime) {
        setStartTime(Date.now());
      }

      const timerInterval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - (startTime || currentTime)) / 1000);
        const newTimeLeft = Math.max(15 - elapsedSeconds, 0);

        if (newTimeLeft <= 5 && newTimeLeft > 0 && !isPlayingCountdown) {
          setIsPlayingCountdown(true);
          // playCountdownSound();  // Temporarily commented out
        }
        
        if (newTimeLeft <= 0) {
          clearInterval(timerInterval);
          stopCountdownSound();
          stopGameJingle();
          playLosing();
          setTimeLeft(0);
          setIsPlayingCountdown(false);
        } else {
          setTimeLeft(newTimeLeft);
        }
      }, 100);

      return () => {
        clearInterval(timerInterval);
        stopCountdownSound();
        setIsPlayingCountdown(false);
      };
    }
  }, [timerStarted, gameState, board, startTime, playCountdownSound, stopCountdownSound, playLosing, stopGameJingle, isPlayingCountdown]);

  const getGameStatus = () => {
    if (timeLeft === 0) {
      return "Time's up! Maxi wins!";
    }
    if (calculateWinner(board)) {
      return `Winner: ${calculateWinner(board) === 'X' ? 'Maxi' : 
        frameContext?.user?.username || selectedPiece}`;
    }
    if (board.every(square => square)) {
      return "Game is a draw!";
    }
    return `Next player: ${isXNext ? 'Maxi' : 
      frameContext?.user?.username || selectedPiece}`;
  };

  // Add rotation effect for hard mode
  useEffect(() => {
    if (difficulty === 'hard' && boardRef.current && gameState === 'game') {
      const baseSpeed = 0.3;  // Increased base speed from 0.05 to 0.1
      
      const animate = () => {
        if (boardRef.current) {
          const rotationSpeed = baseSpeed + (board.filter(Boolean).length * 0.1); // Increased increment from 0.02 to 0.05
          const currentRotation = parseFloat(boardRef.current.style.transform.replace(/[^\d.-]/g, '')) || 0;
          boardRef.current.style.transform = `rotate(${currentRotation + rotationSpeed}deg)`;
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      // Start animation only if board is not empty
      if (!board.every(square => square === null)) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (boardRef.current) {
          boardRef.current.style.transform = 'rotate(0deg)';
        }
      }

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (boardRef.current) {
          boardRef.current.style.transform = 'rotate(0deg)';
        }
      };
    }
  }, [difficulty, board, gameState, gameSession]);

  const getWinningLine = (squares: Square[]): WinningLine | null => {
    const lines = [
      [0, 1, 2], // horizontal
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6], // vertical
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8], // diagonal
      [2, 4, 6]
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return {
          start: a,
          end: c,
          progress: 0
        };
      }
    }
    return null;
  };

  useEffect(() => {
    const winner = calculateWinner(board);
    if (winner) {
      const line = getWinningLine(board);
      if (line) {
        setWinningLine(line);
        
        // Animate the line
        if (lineRef.current) {
          lineRef.current.style.animation = 'none';
          lineRef.current.offsetHeight; // Trigger reflow
          lineRef.current.style.animation = 'drawLine 1s forwards';
        }
      }
    }
  }, [board]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-[300px] h-[600px] mx-auto flex items-start justify-center relative pt-48">
      {gameState === 'menu' && <Snow />}
      <div 
        onClick={() => {
          setIsMuted(!isMuted);
          if (isMuted) {
            if (gameState === 'menu') {
              playHalloweenMusic();
            } else if (gameState === 'game' && !calculateWinner(board) && timeLeft > 0) {
              playGameJingle();
            }
          } else {
            stopGameJingle();
            stopHalloweenMusic();
            stopCountdownSound();
          }
        }} 
        className={`absolute top-16 left-4 cursor-pointer text-white z-10 w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity rounded-full hover:bg-purple-500 ${
          isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600'
        }`}
      >
        {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
      </div>

      {gameState === 'menu' ? (
        <div className="w-full flex flex-col items-center">
          {menuStep === 'game' && frameContext?.user?.username && (
            <div className="text-white text-xl mb-4">
              Welcome, {frameContext.user.username}! 
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-center text-white mb-12">
            {menuStep === 'game' ? 'Select Game' :
             menuStep === 'piece' ? 'Select Piece' :
             'Choose Difficulty'}
          </h1>
          
          {menuStep === 'game' && (
            <Button
              onClick={() => setMenuStep('piece')}
              className="w-full py-4 text-2xl bg-purple-600 hover:bg-purple-700"
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
            <div className="flex justify-center w-full mt-4">
              <Button 
                onClick={() => setMenuStep(menuStep === 'difficulty' ? 'piece' : 'game')}
                className="w-3/4"
              >
                Back
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center -mt-20">
          <div className={`absolute top-16 right-4 text-white text-sm ${
            timeLeft === 0 ? 'bg-red-600' : 'bg-purple-800'
          } px-3 py-1 rounded-full`}>
            {timeLeft}s
          </div>
          
          <div className="text-center mb-4 text-white text-xl">
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

          <div className="flex justify-between w-full gap-4 mt-4">
            <Button
              onClick={handlePlayAgain}
              className="w-1/2 py-4 text-xl bg-green-600 hover:bg-green-700"
            >
              Play Again
            </Button>
            <Button
              onClick={resetGame}
              className="w-1/2 py-4 text-xl bg-purple-700 hover:bg-purple-800"
            >
              Back to Menu
            </Button>
          </div>
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