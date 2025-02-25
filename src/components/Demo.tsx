"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';
import Image from 'next/image';
import Leaderboard from './Leaderboard';
import { shouldSendNotification } from "~/utils/notificationUtils";
import { preloadAssets } from "~/utils/optimizations";

import HomePage from './game/HomePage';
import GameMenu from './game/GameMenu';
import GameBoard from './game/GameBoard';
import AudioController from './game/AudioController';

type PlayerPiece = 'scarygary' | 'chili' | 'podplaylogo';
type Square = 'X' | PlayerPiece | null;
type Board = Square[];
type GameState = 'menu' | 'game';
type MenuStep = 'game' | 'piece' | 'difficulty';
type Difficulty = 'easy' | 'medium' | 'hard';


type DemoProps = {
  tokenBalance: number;
  frameContext?: FrameContext;
};

export default function Demo({ tokenBalance, frameContext }: DemoProps) {
  const [gameSession, setGameSession] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
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
  const [winner, setWinner] = useState(false);
  const [isDraw, setIsDraw] = useState(false);

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
    setWinner(false);
    setIsDraw(false);
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
      setWinner(true);
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
          setIsDraw(true);
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
    setWinner(false);
    setIsDraw(false);
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
    const currentWinner = calculateWinner(board);
    const currentIsDraw = !currentWinner && board.every((square) => square !== null);
    
    if (timerStarted && timeLeft > 0 && !currentWinner && !currentIsDraw) {
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

  const isPlayerTurn = isXNext;

  const getGameStatus = () => {
    const currentWinner = calculateWinner(board);
    const currentIsDraw = !currentWinner && board.every(square => square !== null);

    if (currentWinner) {
      return currentWinner === selectedPiece ? "You Won!" : "Maxi Won";
    }
    if (currentIsDraw) {
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
    <div className="w-[300px] h-[600px] mx-auto flex items-start justify-center relative pt-48">
      <AudioController isMuted={isMuted} onMuteToggle={setIsMuted} />

      {gameState === 'menu' && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          {pfpUrl && (
            <div className="relative">
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
        menuStep === 'game' ? (
          <HomePage
            tokenBalance={tokenBalance}
            frameContext={frameContext}
            onPlayClick={() => setMenuStep('piece')}
            playClick={playClick}
          />
        ) : (
          <GameMenu
            menuStep={menuStep}
            onSelectPiece={(piece) => {
              setSelectedPiece(piece);
              setMenuStep('difficulty');
            }}
            onSelectDifficulty={(diff) => handleStartGame(diff, selectedPiece)}
            onBack={() => setMenuStep(menuStep === 'difficulty' ? 'piece' : 'game')}
            playClick={playClick}
          />
        )
      ) : (
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
            <GameBoard
              timeLeft={timeLeft}
              getGameStatus={getGameStatus}
              boardRef={boardRef}
              board={board}
              handleMove={handleMove}
              handlePlayAgain={handlePlayAgain}
              resetGame={resetGame}
              winner={winner}
              isDraw={isDraw}
              endedByTimer={endedByTimer}
              handleViewLeaderboard={handleViewLeaderboard}
              handleGameBoardShare={handleGameBoardShare}
            />
          )}
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