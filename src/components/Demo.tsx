"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';
import Image from 'next/image';
import Leaderboard from './Leaderboard';
import { shouldSendNotification } from "~/utils/notificationUtils";
import { preloadAssets } from "~/utils/optimizations";

type PlayerPiece = 'scarygary' | 'chili' | 'podplaylogo';
type Square = 'X' | PlayerPiece | null;
type Board = Square[];
type GameState = 'menu' | 'piece' | 'difficulty' | 'game';
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
  const [hasShownSessionNotification, setHasShownSessionNotification] = useState(false);
  const [hasSentThanksNotification, setHasSentThanksNotification] = useState(false);
  const [playGameOver] = useSound('/sounds/gameover.mp3', { volume: 0.5, soundEnabled: !isMuted });

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
        // Preload all game assets
        await preloadAssets();
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading assets:', error);
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

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
    if (board[index] || calculateWinner(board) || !isXNext || timeLeft === 0) return;

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
      setTimerStarted(false);
      playWinning();
      if (frameContext?.user?.fid) {
        await updateGameResult(frameContext.user.fid.toString(), 'win', difficulty);
        await Promise.all([
          shouldSendNotification('win') && sendGameNotification('win'),
          sendThanksNotification()
        ]);
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
    difficulty,
    hasSentThanksNotification
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
    // First declare winner and isDraw
    const winner = calculateWinner(board);
    const isDraw = !winner && board.every((square) => square !== null);
    
    let timer: NodeJS.Timeout;
    
    if (timerStarted && timeLeft > 0 && !winner && !isDraw) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setEndedByTimer(true);
            stopCountdownSound();
            stopGameJingle();
            if (!isMuted) {
              playLosing();
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
  }, [timerStarted, timeLeft, stopCountdownSound, playLosing, stopGameJingle, isMuted, board, calculateWinner]);

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
      
      // Add rate limit handling
      if (data.error === "Rate limited") {
        console.log('Notification rate limited - user is playing too frequently');
        // Optionally show a message to the user
        return;
      }

      console.log('Notification API response:', data);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const handleGameBoardShare = () => {
    playClick();
    const shareText = 'Have you played POD Play v2? 🕹️';
    const shareUrl = 'podplayv2.vercel.app';
    sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`);
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

  const sendThanksNotification = async () => {
    if (!frameContext?.user?.fid || hasSentThanksNotification) {
      return;
    }

    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: frameContext.user.fid.toString(),
          title: 'POD Play Game Result',
          body: 'Thanks for playing POD Play! 🎮',
          targetUrl: process.env.NEXT_PUBLIC_URL
        })
      });
      
      setHasSentThanksNotification(true);
    } catch (error) {
      console.error('Failed to send thanks notification:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-purple-900">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-white text-xl">Loading POD Play...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A0B2E] w-full min-h-screen flex items-center justify-center">
      <div className="w-[424px] h-[695px] mx-auto flex items-start justify-center relative pt-48 overflow-hidden">
        {/* Game Board Background with X's and O's - Show on all pages except game board */}
        {gameState !== 'game' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[424px] h-[424px]">
              {/* Grid Lines */}
              <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400/10 via-purple-400/20 to-purple-400/10"></div>
              <div className="absolute right-1/3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400/10 via-purple-400/20 to-purple-400/10"></div>
              <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400/10 via-purple-400/20 to-purple-400/10"></div>
              <div className="absolute bottom-1/3 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400/10 via-purple-400/20 to-purple-400/10"></div>
              
              {/* X's and O's */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array(9).fill(null).map((_, i) => (
                  <div key={i} className="flex items-center justify-center text-purple-400/20 text-6xl font-bold">
                    {i % 2 === 0 ? 'X' : 'O'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      {/* Only show audio button on game and leaderboard pages */}
      {(gameState === 'game' || showLeaderboard) && (
        <div className="absolute top-16 left-4">
          <button 
            onClick={toggleMute}
            className={`p-2 rounded-full shadow-lg transition-colors ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
          </button>
        </div>
      )}

      {/* Main Menu */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center px-6">


          {/* Game Content */}
          <div className="relative flex flex-col items-center mt-24 mb-16">

            {/* Player Avatar */}
            {pfpUrl && (
              <div className="relative mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full blur-lg opacity-75"></div>
                <div className="relative flex items-center justify-center w-20 h-20 border-4 border-purple-500 rounded-full overflow-hidden">
                  <img 
                    src={pfpUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
                </div>
              </div>
            )}
            
            {/* Welcome Text with Game Style */}
            <div className="text-white text-xl font-bold mb-1 text-shadow-lg">
              Welcome, {frameContext?.user?.username || 'goldie'}
            </div>
            
            {/* Game Title with Neon Effect */}
            <div className="relative text-3xl font-black text-center mb-8 uppercase tracking-wider">
              <span className="absolute inset-0 text-purple-400 blur-[2px]">Select Game</span>
              <span className="relative text-white">Select Game</span>
            </div>
            
            {/* Game Button with Arcade Style */}
            <div className="relative w-full transform hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl blur-md -rotate-1"></div>
              <Button
                onClick={() => setGameState('piece')}
                className="relative w-full py-4 text-2xl font-black bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rounded-xl border-2 border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-300"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
                  Tic-Tac-Maxi
                </span>
              </Button>
            </div>

            {/* Token Display with Game Stats Style */}
            {tokenBalance > 0 && (
              <div className="mt-16 flex items-center space-x-2 bg-gradient-to-r from-purple-900/90 to-purple-800/90 px-4 py-2 rounded-lg border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                <Image 
                  src="/fantokenlogo.png"
                  alt="Fan Token"
                  width={20} 
                  height={20}
                  className="animate-pulse"
                />
                <span className="text-purple-100 text-sm font-medium">
                  {tokenBalance.toFixed(2)} /thepod fan tokens owned
                </span>
              </div>
            )}

            {/* Version with Pixel Style */}
            <div className="mt-6 font-mono text-purple-400/40 text-xs tracking-wider">
              v1.4
            </div>
          </div>
        </div>
      )}

      {/* Piece Selection */}
      {gameState === 'piece' && (
        <div className="w-full flex flex-col items-center justify-center gap-4">
          <h1 className="text-3xl font-bold text-center text-white mb-8">
            Select Piece
          </h1>
          
          <Button 
            onClick={() => {
              setSelectedPiece('scarygary');
              setGameState('difficulty');
            }}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg"
          >
            Scary Gary
          </Button>
          <Button 
            onClick={() => {
              setSelectedPiece('chili');
              setGameState('difficulty');
            }}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg"
          >
            Chili
          </Button>
          <Button 
            onClick={() => {
              setSelectedPiece('podplaylogo');
              setGameState('difficulty');
            }}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg"
          >
            Pod Logo
          </Button>

          <Button 
            onClick={() => setGameState('menu')}
            className="w-3/4 mt-4 bg-purple-700 hover:bg-purple-800 transition-colors shadow-lg"
          >
            Back
          </Button>
        </div>
      )}

      {/* Difficulty Selection */}
      {gameState === 'difficulty' && (
        <div className="w-full flex flex-col items-center justify-center gap-4">
          <h1 className="text-3xl font-bold text-center text-white mb-8">
            Select Difficulty
          </h1>
          
          <Button 
            onClick={() => handleStartGame('easy', selectedPiece)}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg"
          >
            Easy
          </Button>
          <Button 
            onClick={() => handleStartGame('medium', selectedPiece)}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg"
          >
            Medium
          </Button>
          <Button 
            onClick={() => handleStartGame('hard', selectedPiece)}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg"
          >
            Hard
          </Button>

          <Button 
            onClick={() => setGameState('piece')}
            className="w-3/4 mt-4 bg-purple-700 hover:bg-purple-800 transition-colors shadow-lg"
          >
            Back
          </Button>
        </div>
      )}

      {gameState === 'game' && (
        <div className="flex flex-col items-center -mt-20">
          {showLeaderboard ? (
            <div className="flex flex-col items-center w-full gap-4 mt-8">
              <Leaderboard 
                isMuted={isMuted}
                playGameJingle={playGameJingle}
                currentUserFid={frameContext?.user?.fid?.toString()}
                pfpUrl={frameContext?.user?.pfpUrl}
              />
              <div className="flex flex-col w-full gap-2">
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