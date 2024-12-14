"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';
import Image from 'next/image';
import Snow from './Snow';
import Leaderboard from './Leaderboard';

type PlayerPiece = 'scarygary' | 'chili' | 'podplaylogo';
type Square = 'X' | PlayerPiece | null;
type Board = Square[];
type GameState = 'menu' | 'game';
type MenuStep = 'game' | 'piece' | 'difficulty';
type Difficulty = 'easy' | 'medium' | 'hard';

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

type DemoProps = {
  tokenBalance: number;
  frameContext?: FrameContext;
};

export default function Demo({ tokenBalance, frameContext }: DemoProps) {
  const [gameSession, setGameSession] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();  // Add ref for animation frame
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [menuStep, setMenuStep] = useState<MenuStep>('game');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(false);
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
  const isJinglePlaying = useRef(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [endedByTimer, setEndedByTimer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // SDK initialization
  useEffect(() => {
    const loadFrameSDK = async () => {
      try {
        const context = await sdk.context;
        console.log("Frame context:", context); // Debug log
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

  // Fetch profile image when context changes
  useEffect(() => {
    const getProfileImage = async () => {
      if (frameContext?.user?.pfpUrl) {
        setProfileImage(frameContext.user.pfpUrl);
      }
    };
    getProfileImage();
  }, [frameContext]);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        // Wait for SDK to load
        await sdk.context;

        // Wait for token balance to be set (non-zero or explicitly 0)
        while (tokenBalance === undefined) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Load wreath first and wait extra time to ensure it's ready
        await new Promise<void>((resolve) => {
          const wreathImg = new HTMLImageElement();
          wreathImg.src = '/wreath.png';
          wreathImg.onload = () => {
            // Add 1 second buffer after wreath loads
            setTimeout(resolve, 1000);
          };
          wreathImg.onerror = () => resolve();
        });

        // Then load remaining images
        const imagesToLoad = [
          frameContext?.user?.pfpUrl,
          '/fantokenlogo.png',
          '/maxi.png',
          '/scarygary.png',
          '/chili.png',
          '/podplaylogo.png'
        ].filter(Boolean);

        await Promise.all(
          imagesToLoad.map(
            (src) =>
              new Promise<void>((resolve) => {
                const img = new HTMLImageElement();
                img.src = src as string;
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
          )
        );

        // Add a minimum loading time of 2.5 seconds
        await new Promise(resolve => setTimeout(resolve, 2500));
      } finally {
        setIsLoading(false);
      }
    };

    loadAssets();
  }, [frameContext, tokenBalance]);

  const handleStartGame = useCallback((diff: Difficulty, piece: PlayerPiece) => {
    // Reset all game states
    playClick();
    stopHalloweenMusic();
    if (!isMuted && !isJinglePlaying.current) {
      isJinglePlaying.current = true;
      playGameJingle();
    }
    
    // Clear previous game results
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setTimeLeft(15);
    setTimerStarted(false);
    setEndedByTimer(false);
    setShowLeaderboard(false);
    setGameSession(prev => prev + 1);
    
    // Set new game settings
    setGameState('game');
    setSelectedPiece(piece);
    setDifficulty(diff);
    
    // Reset board rotation if any
    if (boardRef.current) {
      boardRef.current.style.transform = 'rotate(0deg)';
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [playClick, stopHalloweenMusic, playGameJingle, isMuted]);

  const getComputerMove = useCallback((currentBoard: Board): number => {
    const availableSpots = currentBoard
      .map((spot, index) => spot === null ? index : null)
      .filter((spot): spot is number => spot !== null);

    if (difficulty === 'easy') {
      // Easy Mode - 30% strategic, 70% random
      if (Math.random() < 0.3) {
        // Try to win
        for (const spot of availableSpots) {
          const boardCopy = [...currentBoard];
          boardCopy[spot] = 'X';
          if (calculateWinner(boardCopy) === 'X') {
            return spot;
          }
        }
        
        // Block obvious wins
        for (const spot of availableSpots) {
          const boardCopy = [...currentBoard];
          boardCopy[spot] = selectedPiece;
          if (calculateWinner(boardCopy) === selectedPiece) {
            return spot;
          }
        }
      }

      // Take center if available (30% chance)
      if (availableSpots.includes(4) && Math.random() < 0.3) return 4;
      
      // Otherwise random move
      return availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }

    if (difficulty === 'medium') {
      // Medium Mode - 70% strategic, 30% random
      if (Math.random() < 0.7) {
        // Try to win first
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
        
        // Take center if available
        if (availableSpots.includes(4)) return 4;
        
        // Take corners if available
        const corners = [0, 2, 6, 8].filter(corner => availableSpots.includes(corner));
        if (corners.length > 0) {
          return corners[Math.floor(Math.random() * corners.length)];
        }
      }
      
      // Random move for remaining cases
      return availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }

    // Hard Mode (unchanged)
    // Try to win first
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

    // Take center if available
    if (availableSpots.includes(4)) return 4;
    
    // Take corners if available
    const corners = [0, 2, 6, 8].filter(corner => availableSpots.includes(corner));
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }
    
    // Random move as last resort
    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
  }, [difficulty, selectedPiece]);

  const handleMove = useCallback(async (index: number) => {
    if (board[index] || calculateWinner(board) || !isXNext) return;

    const newBoard = [...board];
    newBoard[index] = selectedPiece;
    setBoard(newBoard);
    setIsXNext(false);
    playClick();

    // Start timer on first move
    if (!timerStarted) {
      setTimerStarted(true);
      setStartTime(Date.now());
    }

    if (calculateWinner(newBoard)) {
      stopGameJingle();
      stopCountdownSound();
      setTimerStarted(false); // Stop timer on win
      playWinning();
      if (frameContext?.user?.fid) {
        await updateGameResult(frameContext.user.fid.toString(), 'win', difficulty);
        await sendGameNotification('win');
      }
      return;
    }

    // Computer's turn in a separate effect to avoid timer interference
    setTimeout(async () => {
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
          if (frameContext?.user?.fid) {
            await updateGameResult(frameContext.user.fid.toString(), 'loss', difficulty);
            await sendGameNotification('loss');
          }
        } else if (nextBoard.every(square => square !== null)) {
          stopGameJingle();
          stopCountdownSound();
          playDrawing();
          if (frameContext?.user?.fid) {
            await updateGameResult(frameContext.user.fid.toString(), 'tie');
            await sendGameNotification('draw');
          }
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
    stopCountdownSound,
    frameContext,
    difficulty
  ]);

  const resetGame = useCallback(() => {
    setShowLeaderboard(false);
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
    setShowLeaderboard(false);
    setEndedByTimer(false);  // Reset timer end state
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
    if (isMuted) {
      stopGameJingle();
      stopHalloweenMusic();
      isJinglePlaying.current = false;
      return;
    }

    if (gameState === 'menu') {
      stopGameJingle();
      isJinglePlaying.current = false;
      playHalloweenMusic();
    } else if (gameState === 'game' && !calculateWinner(board) && timeLeft > 0 && !isJinglePlaying.current) {
      stopHalloweenMusic();
      isJinglePlaying.current = true;
      playGameJingle();
    }

    return () => {
      if (gameState !== 'game') {
        isJinglePlaying.current = false;
      }
    };
  }, [
    isMuted,
    gameState,
    calculateWinner,
    board,
    timeLeft,
    stopGameJingle,
    stopHalloweenMusic,
    playGameJingle,
    playHalloweenMusic
  ]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (timerStarted && timeLeft > 0 && !winner && !isDraw) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setEndedByTimer(true);
            stopCountdownSound();
            if (!isMuted) {
              playGameOver();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerStarted, timeLeft, stopCountdownSound, playGameOver, isMuted, board, calculateWinner, isXNext]);

  const isDraw = board.every(square => square !== null);
  const isPlayerTurn = isXNext;
  const winner = calculateWinner(board);

  const getGameStatus = () => {
    if (winner) {
      return winner === selectedPiece ? "You Won!" : "Maxi Won";
    }
    if (isDraw) {
      return "It's a Draw!";
    }
    if (endedByTimer) {
      return "Time's Up!";
    }
    return isPlayerTurn ? "Your Turn" : "Maxi's Turn";
  };

  // Add rotation effect for hard modes
  useEffect(() => {
    if (difficulty === 'hard' && boardRef.current && gameState === 'game') {
      const baseSpeed = 0.3;  // Increase base speed from 0.05 to 0.1
      
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

  useEffect(() => {
    const currentBoard = boardRef.current;
    if (!currentBoard) return;

    const resizeObserver = new ResizeObserver(() => {
      // Resize logic here
    });

    resizeObserver.observe(currentBoard);
    return () => resizeObserver.disconnect();
  }, []);

  const toggleMute = () => setIsMuted(prev => !prev);
  // Get pfpUrl directly from frameContext
  const pfpUrl = frameContext?.user?.pfpUrl;

  const handleViewLeaderboard = () => {
    setShowLeaderboard(true);
    playClick();
    if (!isMuted) {
      stopGameJingle();
      isJinglePlaying.current = false;
      playGameJingle();
    }
  };

  const handleBackFromLeaderboard = () => {
    setShowLeaderboard(false);
    playClick();
    stopGameJingle();
    isJinglePlaying.current = false;
    resetGame();
  };

  const sendGameNotification = async (type: 'win' | 'loss' | 'draw') => {
    if (!frameContext?.user?.fid) {
      console.log('No FID available, cannot send notification');
      return;
    }

    const winMessages = [
      "Congratulations! You've defeated Maxi!",
      "Victory! You're unstoppable! 🏆",
      "Game Over - You Win! 🕹️",
      "Maxi's been POD played! 😎",
      "Good win against Maxi! 🌟",
      "You're the POD Play Master! 👑"
    ];

    const lossMessages = [
      "Maxi beat you. Try again?",
      "Almost had it! One more try?",
      "Maxi got lucky. Rematch? 👀",
      "Don't give up! Play again?"
    ];

    const drawMessages = [
      "It's a draw! Good game! 👏",
      "Neck and neck! What a match!",
      "Perfect balance! Try again?",
      "Neither wins - both legends!"
    ];

    const messages = {
      win: winMessages[Math.floor(Math.random() * winMessages.length)],
      loss: lossMessages[Math.floor(Math.random() * lossMessages.length)],
      draw: drawMessages[Math.floor(Math.random() * drawMessages.length)]
    };

    console.log('Attempting to send notification:', {
      type,
      fid: frameContext.user.fid,
      message: messages[type]
    });

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: frameContext.user.fid.toString(),
          title: 'POD Play Game Result',
          body: messages[type],
          targetUrl: process.env.NEXT_PUBLIC_URL
        })
      });

      const data = await response.json();
      console.log('Notification API response:', data);

    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const handleGameBoardShare = () => {
    playClick();
    const appUrl = 'https://podplayv2.vercel.app/';
    
    navigator.clipboard.writeText(appUrl).then(() => {
      const shareButton = document.querySelector('[data-gameboard-share]');
      if (shareButton) {
        const originalText = shareButton.textContent;
        shareButton.textContent = '✓ URL Copied!';
        setTimeout(() => {
          shareButton.textContent = originalText;
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  useEffect(() => {
    if (gameState === 'game' && !board.some(square => square !== null)) {
      // Get random initial position for CPU
      const availableSpots = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      const randomIndex = Math.floor(Math.random() * availableSpots.length);
      const cpuMove = availableSpots[randomIndex];
      
      setTimeout(() => {
        const newBoard = [...board];
        newBoard[cpuMove] = 'X';
        setBoard(newBoard);
        setIsXNext(true);
        
        // Remove timer start from here - it will start on player's first move instead
      }, 500);
    }
  }, [gameState, board]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-purple-900">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-white text-xl">Loading POD Play...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col items-center justify-between p-4 relative">
      <Snow />
      
      <button
        onClick={toggleMute}
        className="absolute top-4 left-4 z-10 bg-red-500 rounded-full p-2"
      >
        {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
      </button>

      {gameState === 'menu' && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          {pfpUrl && (
            <div className="relative">
              <div className="absolute inset-0 w-[132px] h-[132px] -m-3 -translate-x-[5.5px]">
                <Image 
                  src="/wreath.png"
                  alt="Wreath border"
                  width={132}
                  height={132}
                  className="object-contain"
                />
              </div>
              <img 
                src={pfpUrl} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      {gameState === 'menu' ? (
        <div className="w-full flex flex-col items-center">
          {menuStep === 'game' && frameContext?.user?.username && (
            <div className="text-white text-xl mb-4 text-shadow">
              Welcome, {frameContext.user.username}
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-center text-white mb-12 text-shadow">
            {menuStep === 'game' ? 'Select Game' :
             menuStep === 'piece' ? 'Select Piece' :
             'Choose Difficulty'}
          </h1>
          
          {menuStep === 'game' && (
            <>
              <Button
                onClick={() => {
                  playClick();
                  setMenuStep('piece');
                }}
                className="w-full py-4 text-2xl bg-purple-600 box-shadow"
              >
                Tic-Tac-Maxi
              </Button>
              {tokenBalance > 0 && (
                <div className="mt-12 bg-purple-600 text-white px-3 py-1 rounded-full text-sm inline-flex items-center shadow-lg">
                  <Image 
                    src="/fantokenlogo.png"
                    alt="Fan Token"
                    width={24} 
                    height={24}
                  />
                  {tokenBalance.toFixed(2)} /thepod fan tokens owned
                </div>
              )}
              <div className="absolute bottom-4 text-white/50 text-sm">
                version 1.1
              </div>
            </>
          )}

          {menuStep === 'piece' && (
            <>
              <Button 
                onClick={() => {
                  playClick();
                  setSelectedPiece('scarygary');
                  setMenuStep('difficulty');
                }}
                className="w-full mb-2 shadow-lg hover:shadow-xl transition-shadow"
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
                className="w-full mb-2 shadow-lg hover:shadow-xl transition-shadow"
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
          {showLeaderboard ? (
            <div className="flex flex-col items-center w-full gap-4 mt-8">
              <Leaderboard 
                isMuted={isMuted}
                playGameJingle={playGameJingle}
              />
              <div className="flex flex-col w-full gap-2">
                <Button
                  onClick={handleGameBoardShare}
                  data-gameboard-share
                  className="w-1/2 py-4 text-xl bg-purple-700 hover:bg-purple-600 transition-colors"
                >
                  Share Game
                </Button>
                <Button
                  onClick={handleBackFromLeaderboard}
                  className="w-3/4 py-3 text-xl bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600 mx-auto"
                >
                  Back to Menu
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className={`absolute top-16 right-4 text-white text-sm ${
                timeLeft === 0 ? 'bg-red-600' : 'bg-purple-800'
              } px-3 py-1 rounded-full box-shadow`}>
                {timeLeft}s
              </div>
              <div className="text-center mb-4 text-white text-xl text-shadow">
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

              <div className="flex flex-col w-full gap-4">
                <div className="flex justify-between w-full gap-4">
                  <Button
                    onClick={handlePlayAgain}
                    className="w-1/2 py-4 text-xl bg-green-600 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Play Again
                  </Button>
                  <Button
                    onClick={resetGame}
                    className="w-1/2 py-4 text-xl bg-purple-700 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Back to Menu
                  </Button>
                </div>
                
                {(winner || isDraw || endedByTimer) && (
                  <div className="flex flex-col w-full gap-4 mt-4 mb-8">
                    <div className="flex justify-between w-full gap-4">
                      <Button
                        onClick={handleViewLeaderboard}
                        className="w-1/2 py-4 text-xl bg-purple-700"
                      >
                        Leaderboard
                      </Button>
                      <Button
                        onClick={handleGameBoardShare}
                        data-gameboard-share
                        className="w-1/2 py-4 text-xl bg-purple-700 hover:bg-purple-600 transition-colors"
                      >
                        Share Game
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="text-white/50 text-sm absolute bottom-4">
        version 1.1
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

async function updateGameResult(fid: string, action: 'win' | 'loss' | 'tie', difficulty?: 'easy' | 'medium' | 'hard') {
  try {
    const response = await fetch('/api/firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fid, action, difficulty }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update game result');
    }
  } catch (error) {
    console.error('Error updating game result:', error);
  }
}

function playGameOver() {
  throw new Error("Function not implemented.");
}
function checkFanTokenOwnership(arg0: string) {
  throw new Error("Function not implemented.");
}