"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import Image from 'next/image';
import Leaderboard from './Leaderboard';
import { shouldSendNotification } from "~/utils/notificationUtils";
import { preloadAssets } from "~/utils/optimizations";

import HomePage from './game/HomePage';
import GameMenu from './game/GameMenu';
import GameBoard from './game/GameBoard';
import AudioController from './game/AudioController';
import { NotificationManager } from './game/NotificationManager';
import { GameLogic } from './game/GameLogic';
import { GameTimer } from './game/GameTimer';
import { SoundManager } from './game/SoundManager';
import { updateGameResult } from '~/services/api';
import { PlayerPiece, Square, Board, GameState, MenuStep, Difficulty } from '~/types/game';
import useSound from 'use-sound';


type DemoProps = {
  tokenBalance: number;
  frameContext?: FrameContext;
};

export default function Demo({ tokenBalance, frameContext }: DemoProps) {
  const calculateWinner = useCallback((squares: Square[]): Square => {
    return GameLogic.calculateWinner(squares);
  }, []);

  const [gameSession, setGameSession] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [menuStep, setMenuStep] = useState<MenuStep>('game');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<PlayerPiece>('chili');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const { 
    playClick,
    playWinning,
    playLosing,
    playDrawing,
    playCountdownSound,
    stopCountdownSound,
    stopGameJingle,
    stopOpeningTheme,
    playGameJingle,
    playOpeningTheme
  } = SoundManager({ 
    isMuted, 
    gameState,
    onSoundStateChange: () => {
      isJinglePlaying.current = !isMuted && gameState === 'game';
    }
  });

  // Add user interaction flag
  useEffect(() => {
    const handleInteraction = () => {
      document.documentElement.classList.add('user-interacted');
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);
  const [timerStarted, setTimerStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isPlayingCountdown, setIsPlayingCountdown] = useState(false);
  const isJinglePlaying = useRef(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [endedByTimer, setEndedByTimer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasShownSessionNotification, setHasShownSessionNotification] = useState(false);
  const [hasSentThanksNotification, setHasSentThanksNotification] = useState(false);
  const [winner, setWinner] = useState(false);
  const [isDraw, setIsDraw] = useState(false);

  // Initialize timer state
  const { timeLeft, setTimeLeft } = GameTimer({
    isActive: timerStarted && !calculateWinner(board) && !board.every(square => square !== null),
    isMuted,
    onPlayCountdown: playCountdownSound,
    onStopCountdown: stopCountdownSound,
    onTimeUp: async () => {
      setEndedByTimer(true);
      stopCountdownSound();
      stopGameJingle();
      if (!isMuted) {
        playLosing();
      }
      if (frameContext?.user?.fid) {
        await updateGameResult(frameContext.user.fid.toString(), 'loss', difficulty);
        await sendGameNotification('loss');
      }
    }
  });

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
    stopOpeningTheme();
    
    // Clear previous game results
    setBoard(Array(9).fill(null));
    setIsXNext(true);
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
  }, [playClick, stopOpeningTheme]);

  const getComputerMove = useCallback((currentBoard: Board): number => {
    return GameLogic.getComputerMove(currentBoard, difficulty, selectedPiece);
  }, [difficulty, selectedPiece]);

  const handleMove = useCallback(async (index: number) => {
    if (board[index] || calculateWinner(board) || !isXNext || (typeof timeLeft === 'number' && timeLeft <= 0)) return;

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
      setWinner(true); // Set winner state
      setTimeLeft(0); // Stop the timer
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
      if ((typeof timeLeft === 'number' && timeLeft <= 0) || calculateWinner(newBoard)) return;
      
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
          setWinner(true); // Set winner state
          if (frameContext?.user?.fid) {
            await updateGameResult(frameContext.user.fid.toString(), 'loss', difficulty);
            await sendGameNotification('loss');
          }
        } else if (nextBoard.every(square => square !== null)) {
          stopGameJingle();
          stopCountdownSound();
          setIsDraw(true); // Already setting draw state
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
    setTimerStarted(false);
    stopCountdownSound();
    stopGameJingle();
  }, [stopCountdownSound, stopGameJingle]);

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
    setTimerStarted(false);
    stopCountdownSound();
    stopGameJingle(); // Stop current jingle
    playGameJingle(); // Start fresh jingle
    setGameSession(prev => prev + 1);
  }, [stopCountdownSound, stopGameJingle, playGameJingle]);



  // Timer state is initialized at the top of the component

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

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted) {
        stopGameJingle();
        stopOpeningTheme();
        stopCountdownSound();
        isJinglePlaying.current = false;
      }
      return newMuted;
    });
  }, [stopGameJingle, stopOpeningTheme, stopCountdownSound]);
  // Get pfpUrl directly from frameContext
  const pfpUrl = frameContext?.user?.pfpUrl;

  const handleViewLeaderboard = () => {
    setShowLeaderboard(true);
    playClick();
    if (!isMuted) {
      stopGameJingle();
      isJinglePlaying.current = false;
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
    if (frameContext?.user?.fid) {
      await NotificationManager.sendGameNotification(type, frameContext.user.fid.toString());
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
    await NotificationManager.sendThanksNotification(frameContext.user.fid.toString());
    setHasSentThanksNotification(true);
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
      {/* Main container - fixed dimensions for Frame */}
      <div className="w-[424px] h-[695px] mx-auto relative bg-[#1A0B2E] overflow-hidden">
        {/* Game Board Background with X's and O's */}
        {gameState !== 'game' && (
          <div className="absolute inset-0 opacity-20 flex items-center justify-center">
            <div className="w-[400px] h-[400px] relative">
              {/* Grid Lines */}
              <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400/50 via-purple-400 to-purple-400/50"></div>
              <div className="absolute right-1/3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400/50 via-purple-400 to-purple-400/50"></div>
              <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400/50 via-purple-400 to-purple-400/50"></div>
              <div className="absolute bottom-1/3 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400/50 via-purple-400 to-purple-400/50"></div>
              
              {/* Background X's and O's */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array(9).fill(null).map((_, i) => (
                  <div key={i} className="flex items-center justify-center text-purple-400/30 text-6xl font-bold">
                    {i % 2 === 0 ? 'X' : 'O'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <AudioController 
          isMuted={isMuted} 
          onMuteToggle={toggleMute} 
        />
        {gameState === 'game' && !showLeaderboard && (
          <div className="absolute top-4 right-4 text-white text-sm">
            {timeLeft}s
          </div>
        )}

        {/* Content Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center w-full max-w-[400px] h-full px-4 pt-16">
            {gameState === 'menu' && profileImage && (
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full blur-md"></div>
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="relative w-24 h-24 rounded-full object-cover border-2 border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                />
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
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[400px] h-[400px] relative flex flex-col items-center justify-center">
                  {showLeaderboard ? (
                    <div className="flex flex-col items-center w-full gap-4">
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
                    <div className="flex flex-col items-center justify-center gap-8">
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
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

