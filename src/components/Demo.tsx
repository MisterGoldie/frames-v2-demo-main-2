"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';
import Image from 'next/image';

type PlayerPiece = 'scarygary' | 'chili' | 'podplaylogo';
type Square = 'X' | PlayerPiece | null;
type Board = Square[];
type GameState = 'menu' | 'game';
type MenuStep = 'game' | 'piece' | 'difficulty';
type Difficulty = 'easy' | 'medium' | 'hard';

const VolumeOnIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="32" 
    viewBox="0 -960 960 960" 
    width="32" 
    fill="currentColor"
    className="p-1"
  >
    <path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-708l-86 86H200v160h114l86 86v-332ZM300-481Z"/>
  </svg>
);

const VolumeOffIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="32" 
    viewBox="0 -960 960 960" 
    width="32" 
    fill="currentColor"
    className="p-1"
  >
    <path d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h160l42-42-154-154 56-56 624 624-56 56ZM560-749v133L480-696v-64L280-560H200v160h114l-154-154v-6h120l200-200q-14-5-27.5-10T560-749ZM840-481q0 55-17.5 105.5T778-284l-58-58q15-29 27.5-64t12.5-75q0-94-55-168T560-749v-82q124 28 202 125.5T840-481ZM633-429l-73-73q0-8 0-15.5t-2-15.5q-4-37-31-63t-63-30l-73-73q27-16 58-21.5t71-5.5q83 0 141.5 58.5T720-526q0 40-5.5 71T633-429Z"/>
  </svg>
);

export default function Demo() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [frameContext, setFrameContext] = useState<FrameContext>();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [menuStep, setMenuStep] = useState<MenuStep>('game');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState<PlayerPiece>('chili');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [playHover] = useSound('/sounds/hover.mp3', { volume: 0.5, soundEnabled: !isMuted });
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
    volume: 0.5, 
    soundEnabled: !isMuted 
  });

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
    // Prevent any moves if timer has run out
    if (timeLeft === 0 || board[index] || calculateWinner(board) || !isXNext) return;
    
    playClick();
    const newBoard = board.slice();
    newBoard[index] = selectedPiece;
    setBoard(newBoard);
    setIsXNext(false);

    // Check if player won
    if (calculateWinner(newBoard) === selectedPiece) {
      stopGameJingle();
      stopCountdownSound();
      playWinning();
      return;
    }

    // Computer's turn
    setTimeout(() => {
      // Double check timer hasn't run out during timeout
      if (timeLeft === 0) return;
      
      if (!calculateWinner(newBoard) && !newBoard.every(square => square !== null)) {
        const computerMove = getComputerMove(newBoard);
        newBoard[computerMove] = 'X';
        setBoard([...newBoard]);
        setIsXNext(true);

        // Check if computer won
        if (calculateWinner(newBoard) === 'X') {
          stopGameJingle();
          stopCountdownSound();
          playLosing();
        } 
        // Check for draw
        else if (newBoard.every(square => square !== null)) {
          stopGameJingle();
          stopCountdownSound();
          playDrawing();
        }
      }
    }, 500);
  }, [board, selectedPiece, getComputerMove, isXNext, timeLeft, playClick, playWinning, playLosing, playDrawing, stopGameJingle, stopCountdownSound]);

  const resetGame = useCallback(() => {
    stopGameJingle();
    stopCountdownSound();
    setGameState('menu');
    setMenuStep('game');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setTimerStarted(false);
    setTimeLeft(15);
  }, [stopGameJingle, stopCountdownSound]);

  const handlePlayAgain = useCallback(() => {
    playClick();
    stopCountdownSound();
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setTimeLeft(15);
    setTimerStarted(true);
    playGameJingle();
  }, [playClick, stopCountdownSound, playGameJingle]);

  useEffect(() => {
    if (gameState === 'menu') {
      playHalloweenMusic();
      return () => stopHalloweenMusic();
    }
  }, [gameState, playHalloweenMusic, stopHalloweenMusic]);

  useEffect(() => {
    if (timerStarted && gameState === 'game') {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 6 && prevTime > 1) {
            playCountdownSound();
          }
          if (prevTime <= 1) {
            clearInterval(timer);
            stopCountdownSound();
            stopGameJingle();
            playLosing();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        stopCountdownSound();
      };
    }
  }, [timerStarted, gameState, playCountdownSound, stopCountdownSound, playLosing, stopGameJingle]);

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

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-[300px] h-[600px] mx-auto flex items-center justify-center relative">
      <div 
        onClick={() => {
          setIsMuted(!isMuted);
          if (isMuted) {
            // Resume all sounds when unmuting
            playGameJingle();
          } else {
            // Stop all sounds when muting
            stopGameJingle();
            stopCountdownSound();
          }
        }} 
        className="absolute top-6 left-4 cursor-pointer text-white z-10 w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity"
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
        <div className="flex flex-col items-center">
          <div className="absolute top-4 right-4 text-white text-sm bg-purple-800 px-3 py-1 rounded-full">
            {timeLeft}s
          </div>
          
          <div className="text-center mb-4 text-white text-xl">
            {getGameStatus()}
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
