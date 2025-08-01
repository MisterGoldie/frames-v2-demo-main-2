"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { sdk, Context } from "@farcaster/miniapp-sdk";
import { Button } from "~/components/ui/Button";
import Image from 'next/image';
import Leaderboard from './Leaderboard';
import { shouldSendNotification } from "~/utils/notificationUtils";
import { preloadAssets } from "~/utils/optimizations";
import { motion, AnimatePresence } from "framer-motion";

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


type DemoProps = {
  tokenBalance: number;
  frameContext?: Context.MiniAppContext;
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
  // Safely wrap sound functions to prevent errors
  const soundFunctions = SoundManager({ 
    isMuted, 
    gameState,
    onSoundStateChange: () => {
      isJinglePlaying.current = !isMuted && gameState === 'game';
    }
  });
  
  // Safe wrappers for sound functions to prevent "Cannot read property '0'" errors
  const safeSoundHandler = (fn: Function | undefined) => {
    return (...args: any[]) => {
      try {
        if (typeof fn === 'function') {
          fn(...args);
        }
      } catch (error) {
        console.error('Error in sound handler:', error);
      }
    };
  };
  
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
  } = {
    playClick: safeSoundHandler(soundFunctions.playClick),
    playWinning: safeSoundHandler(soundFunctions.playWinning),
    playLosing: safeSoundHandler(soundFunctions.playLosing),
    playDrawing: safeSoundHandler(soundFunctions.playDrawing),
    playCountdownSound: safeSoundHandler(soundFunctions.playCountdownSound),
    stopCountdownSound: safeSoundHandler(soundFunctions.stopCountdownSound),
    stopGameJingle: safeSoundHandler(soundFunctions.stopGameJingle),
    stopOpeningTheme: safeSoundHandler(soundFunctions.stopOpeningTheme),
    playGameJingle: safeSoundHandler(soundFunctions.playGameJingle),
    playOpeningTheme: safeSoundHandler(soundFunctions.playOpeningTheme)
  };

  // Add user interaction flag - only once per session
  useEffect(() => {
    // Skip if already set up
    if (document.documentElement.hasAttribute('data-interaction-listeners')) {
      console.log('Interaction listeners already set up, skipping');
      return;
    }
    
    // Mark that we've set up the listeners
    document.documentElement.setAttribute('data-interaction-listeners', 'true');
    console.log('Setting up interaction listeners');
    
    const handleInteraction = () => {
      document.documentElement.classList.add('user-interacted');
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      // Only remove if this component is being fully unmounted
      // This prevents audio issues when components are re-rendered
      if (document.documentElement.hasAttribute('data-interaction-listeners')) {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        document.documentElement.removeAttribute('data-interaction-listeners');
      }
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
        // Play timeout sound with direct Audio API for better mobile compatibility
        try {
          // First try direct Audio approach for most reliable playback on mobile
          const timeoutAudio = new Audio('/sounds/losing.mp3');
          timeoutAudio.volume = 0.5;
          console.log('Playing timeout sound directly');
          timeoutAudio.play().catch(e => {
            console.warn('Direct timeout audio failed, falling back:', e);
            // Fallback to regular method
            playLosing();
          });
        } catch (directAudioError) {
          console.error('Error with direct timeout audio:', directAudioError);
          // Fallback to regular method
          playLosing();
        }
      }
      try {
        if (frameContext?.user?.fid) {
          await updateGameResult(frameContext.user.fid.toString(), 'loss', difficulty)
            .catch(err => console.error('Error updating timeout loss result:', err));
          
          await NotificationManager.sendGameNotification('loss', frameContext.user.fid.toString())
            .catch(err => console.error('Error sending timeout loss notification:', err));
        }
      } catch (error) {
        console.error('Error in timeout loss handling:', error);
      }
    }
  });

  // SDK initialization - only once
  useEffect(() => {
    // Skip if already loaded to prevent duplicate initialization
    if (isSDKLoaded) {
      return;
    }
    
    const loadFrameSDK = async () => {
      try {
        console.log('Initializing Frame SDK in Demo component');
        // Initialize SDK
        sdk.actions.ready();
        
        try {
          const context = await sdk.context;
          console.log("Frame context loaded in Demo:", context); // Debug log
        } catch (contextError) {
          console.warn("Frame context unavailable in Demo, continuing without it:", contextError);
        }
      } catch (error) {
        console.error("Fatal error loading Frame SDK:", error);
      }
    };

    setIsSDKLoaded(true);
    loadFrameSDK();
  }, [isSDKLoaded]);

  // Fetch profile image when context changes
  useEffect(() => {
    const getProfileImage = async () => {
      try {
        if (frameContext?.user?.pfpUrl) {
          setProfileImage(frameContext.user.pfpUrl);
        } else {
          // Set a default profile image if none is available
          console.log('No profile image available');
        }
      } catch (error) {
        console.error('Error setting profile image:', error);
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
    try {
      playClick();
      stopOpeningTheme();
    } catch (audioError) {
      console.error('Error handling audio in start game:', audioError);
    }
    
    // Use a small timeout to allow for smooth animation transition
    setTimeout(() => {
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
    }, 300); // Small delay to allow for exit animations
  }, [playClick, stopOpeningTheme]);

  const getComputerMove = useCallback((currentBoard: Board): number => {
    return GameLogic.getComputerMove(currentBoard, difficulty, selectedPiece);
  }, [difficulty, selectedPiece]);

  const handleMove = useCallback(async (index: number) => {
    if (board[index] || calculateWinner(board) || !isXNext || (typeof timeLeft === 'number' && timeLeft <= 0)) return;

    // Play click sound FIRST before any state updates for immediate feedback
    // Create a new Audio element directly for the most reliable playback
    try {
      // Direct audio approach for most immediate feedback
      const clickAudio = new Audio('/sounds/click.mp3');
      clickAudio.volume = 1.0;
      clickAudio.play().catch(e => {
        console.warn('Direct click audio failed, falling back:', e);
        // Fallback to regular click method
        playClick();
      });
    } catch (audioError) {
      console.error('Error playing click sound in handleMove:', audioError);
      // Last resort fallback
      playClick();
    }
    
    // Update game state AFTER playing sound
    const newBoard = [...board];
    newBoard[index] = selectedPiece;
    setBoard(newBoard);
    setIsXNext(false);

    // Start timer on first move
    if (!timerStarted) {
      setTimerStarted(true);
      setStartTime(Date.now());
    }

    if (calculateWinner(newBoard)) {
      try {
        // Stop background sounds first
        stopGameJingle();
        stopCountdownSound();
        setTimerStarted(false);
        setWinner(true); // Set winner state
        setTimeLeft(0); // Stop the timer
        
        // Play winning sound with direct Audio API for better mobile compatibility
        try {
          // First try direct Audio approach for most reliable playback on mobile
          const winAudio = new Audio('/sounds/winning.mp3');
          winAudio.volume = 0.5;
          console.log('Playing winning sound directly');
          winAudio.play().catch(e => {
            console.warn('Direct winning audio failed, falling back:', e);
            // Fallback to regular method
            playWinning();
          });
        } catch (directAudioError) {
          console.error('Error with direct winning audio:', directAudioError);
          // Fallback to regular method
          playWinning();
        }
      } catch (audioError) {
        console.error('Error handling audio for winner:', audioError);
      }
      try {
        if (frameContext?.user?.fid) {
          await updateGameResult(frameContext.user.fid.toString(), 'win', difficulty).catch(err => {
            console.error('Error updating game result:', err);
          });
          
          try {
            const shouldSend = await shouldSendNotification('win');
            if (shouldSend) {
              await NotificationManager.sendGameNotification('win', frameContext.user.fid.toString())
                .catch(err => console.error('Error sending win notification:', err));
            }
            
            await sendThanksNotification().catch(err => {
              console.error('Error sending thanks notification:', err);
            });
          } catch (notifError) {
            console.error('Error in notification flow:', notifError);
          }
        }
      } catch (error) {
        console.error('Error in win handling:', error);
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
          try {
            // Stop background sounds first
            stopGameJingle();
            stopCountdownSound();
            setWinner(true); // Set winner state
            
            // Play losing sound with direct Audio API for better mobile compatibility
            try {
              // First try direct Audio approach for most reliable playback on mobile
              const loseAudio = new Audio('/sounds/losing.mp3');
              loseAudio.volume = 0.5;
              console.log('Playing losing sound directly');
              loseAudio.play().catch(e => {
                console.warn('Direct losing audio failed, falling back:', e);
                // Fallback to regular method
                playLosing();
              });
            } catch (directAudioError) {
              console.error('Error with direct losing audio:', directAudioError);
              // Fallback to regular method
              playLosing();
            }
          } catch (audioError) {
            console.error('Error handling audio for computer win:', audioError);
          }
          try {
            if (frameContext?.user?.fid) {
              await updateGameResult(frameContext.user.fid.toString(), 'loss', difficulty)
                .catch(err => console.error('Error updating loss result:', err));
              
              await NotificationManager.sendGameNotification('loss', frameContext.user.fid.toString())
                .catch(err => console.error('Error sending loss notification:', err));
            }
          } catch (error) {
            console.error('Error in loss handling:', error);
          }
        } else if (nextBoard.every(square => square !== null)) {
          try {
            // Stop background sounds first
            stopGameJingle();
            stopCountdownSound();
            setIsDraw(true); // Already setting draw state
            
            // Play draw sound with direct Audio API for better mobile compatibility
            try {
              // First try direct Audio approach for most reliable playback on mobile
              const drawAudio = new Audio('/sounds/drawing.mp3');
              drawAudio.volume = 0.5;
              console.log('Playing draw sound directly');
              drawAudio.play().catch(e => {
                console.warn('Direct draw audio failed, falling back:', e);
                // Fallback to regular method
                playDrawing();
              });
            } catch (directAudioError) {
              console.error('Error with direct draw audio:', directAudioError);
              // Fallback to regular method
              playDrawing();
            }
          } catch (audioError) {
            console.error('Error handling audio for draw:', audioError);
          }
          try {
            if (frameContext?.user?.fid) {
              await updateGameResult(frameContext.user.fid.toString(), 'tie')
                .catch(err => console.error('Error updating tie result:', err));
              
              await NotificationManager.sendGameNotification('draw', frameContext.user.fid.toString())
                .catch(err => console.error('Error sending draw notification:', err));
            }
          } catch (error) {
            console.error('Error in draw handling:', error);
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
    // Play click sound first for immediate feedback
    try {
      playClick();
    } catch (audioError) {
      console.error('Error playing click in resetGame:', audioError);
    }
    
    // Safely stop sounds immediately
    try {
      stopCountdownSound();
      stopGameJingle();
      playOpeningTheme(); // Start opening theme for menu
    } catch (audioError) {
      console.error('Error handling audio in resetGame:', audioError);
    }

    // First update visual states that don't affect layout
    setShowLeaderboard(false);
    if (boardRef.current) {
      boardRef.current.style.transform = 'rotate(0deg)';
    }
    
    // Delay the state changes that trigger component transitions
    // This allows exit animations to complete
    setTimeout(() => {
      setGameState('menu');
      setMenuStep('game');
      setBoard(Array(9).fill(null));
      setIsXNext(true);
      setTimerStarted(false);
      setWinner(false);
      setIsDraw(false);
      setEndedByTimer(false);
      setGameSession(prev => prev + 1);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }, 300); // Small delay to allow for exit animations
  }, [stopCountdownSound, stopGameJingle, playClick, playOpeningTheme]);

  const handlePlayAgain = useCallback(() => {
    // Play click sound first for immediate feedback
    try {
      playClick();
    } catch (audioError) {
      console.error('Error playing click in handlePlayAgain:', audioError);
    }
    
    // Safely manage audio with error handling - do this immediately
    try {
      stopCountdownSound();
      stopGameJingle(); // Stop current jingle
    } catch (audioError) {
      console.error('Error stopping sounds in handlePlayAgain:', audioError);
    }
    
    // First update visual states that don't affect layout
    setShowLeaderboard(false);
    
    // Use a small delay to allow for smooth exit animations
    setTimeout(() => {
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
      setGameSession(prev => prev + 1); // Increment game session
      
      // Start a new game jingle with a small delay to ensure proper cleanup
      setTimeout(() => {
        try {
          playGameJingle(); // Start fresh jingle
        } catch (delayedAudioError) {
          console.error('Error playing game jingle after delay:', delayedAudioError);
        }
      }, 50);
    }, 300); // Small delay for exit animations
  }, [stopCountdownSound, stopGameJingle, playGameJingle, playClick]);



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
    const shareUrl = 'https://podplayv2.vercel.app';
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

            <AnimatePresence mode="wait">
              {gameState === 'menu' ? (
                menuStep === 'game' ? (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HomePage
                      tokenBalance={tokenBalance}
                      frameContext={frameContext}
                      onPlayClick={() => setMenuStep('piece')}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`menu-${menuStep}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
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
                  </motion.div>
                )
              ) : (
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  key="game-container"
                >
                  <motion.div 
                    className="w-[400px] h-[400px] relative flex flex-col items-center justify-center"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnimatePresence mode="wait">
                      {showLeaderboard ? (
                        <motion.div 
                          key="leaderboard"
                          className="flex flex-col items-center w-full gap-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Leaderboard 
                            isMuted={isMuted}
                            playGameJingle={playGameJingle}
                            currentUserFid={frameContext?.user?.fid?.toString()}
                            pfpUrl={frameContext?.user?.pfpUrl}
                          />
                          <motion.div 
                            className="flex flex-col w-full gap-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                          >
                            <Button
                              onClick={handleBackFromLeaderboard}
                              className="w-3/4 py-3 text-xl bg-purple-700 shadow-lg hover:shadow-xl transition-all hover:bg-purple-600 mx-auto"
                            >
                              Back to Menu
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="gameboard"
                          className="flex flex-col items-center justify-center gap-8"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Version text at bottom - only shown on homepage */}
          {gameState === 'menu' && menuStep === 'game' && (
            <div className="absolute bottom-10 w-full flex justify-center">
              <div className="text-xs text-white/50 text-shadow">
                version 1.7
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

