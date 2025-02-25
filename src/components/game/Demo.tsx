"use client";

import { useEffect, useState } from "react";
import { FrameContext } from "@farcaster/frame-sdk";
import sdk from "@farcaster/frame-sdk";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { preloadAssets } from "~/utils/optimizations";
import { AudioController, useGameSounds } from "./audio/AudioController";
import { GameBoard, calculateWinner } from "./board/GameBoard";
import { GameMenu } from "./menu/GameMenu";
import { Timer } from "./utils/Timer";
import { GameState, MenuStep, PlayerPiece, Difficulty, Board } from "./types";
import Leaderboard from '../Leaderboard';
import { shouldSendNotification } from "~/utils/notificationUtils";
import { checkFanTokenOwnership } from "~/utils/tokenUtils";

interface DemoProps {
  tokenBalance: number;
  frameContext?: FrameContext;
}

export default function Demo({ tokenBalance, frameContext }: DemoProps) {
  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [menuStep, setMenuStep] = useState<MenuStep>('game');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<PlayerPiece>('chili');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  
  // UI state
  const [isMuted, setIsMuted] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string>('');
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerStarted, setTimerStarted] = useState(false);
  
  // Session state
  const [gameSession, setGameSession] = useState(0);
  const [hasShownSessionNotification, setHasShownSessionNotification] = useState(false);
  const [hasSentThanksNotification, setHasSentThanksNotification] = useState(false);
  const [endedByTimer, setEndedByTimer] = useState(false);

  // Initialize sounds
  const sounds = useGameSounds(isMuted);

  // SDK initialization
  useEffect(() => {
    const loadFrameSDK = async () => {
      try {
        const context = await sdk.context;
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading Frame SDK:", error);
        setIsLoading(false);
      }
    };

    loadFrameSDK();
    preloadAssets();
  }, []);

  const handleSquareClick = async (index: number) => {
    if (board[index] || calculateWinner(board)) return;

    const newBoard = [...board];
    newBoard[index] = selectedPiece;
    setBoard(newBoard);
    setIsXNext(true);
    sounds.playClick();

    // AI move
    setTimeout(() => {
      const aiMove = getAIMove(newBoard, difficulty);
      if (aiMove !== -1) {
        const finalBoard = [...newBoard];
        finalBoard[aiMove] = 'X';
        setBoard(finalBoard);
        setIsXNext(false);
      }
    }, 500);
  };

  const getAIMove = (currentBoard: Board, difficulty: Difficulty): number => {
    // AI logic implementation here
    return -1; // Placeholder
  };

  const handleGameStart = () => {
    setGameState('game');
    setBoard(Array(9).fill(null));
    setIsXNext(false);
    setTimerStarted(true);
    setTimeLeft(15);
    sounds.playGameJingle();
  };

  const handleTimeUp = () => {
    setEndedByTimer(true);
    sounds.playGameOver();
    // Handle game over logic
  };

  const updateGameResult = async (action: 'win' | 'loss' | 'tie') => {
    if (!frameContext?.user?.fid) return;
    
    try {
      const response = await fetch('/api/updateGameResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: frameContext.user.fid.toString(),
          action,
          difficulty
        })
      });
      
      if (!response.ok) throw new Error('Failed to update game result');
      
    } catch (error) {
      console.error('Error updating game result:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-purple-900">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-purple-900 relative">
        <AudioController isMuted={isMuted} onMuteToggle={setIsMuted} />
        
        {gameState === 'menu' ? (
          <GameMenu
            menuStep={menuStep}
            onSelectPiece={setSelectedPiece}
            onSelectDifficulty={setDifficulty}
            onStartGame={handleGameStart}
            selectedPiece={selectedPiece}
            difficulty={difficulty}
            tokenBalance={tokenBalance}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Timer
              timeLeft={timeLeft}
              onTimeUp={handleTimeUp}
              isActive={timerStarted}
            />
            <GameBoard
              board={board}
              onSquareClick={handleSquareClick}
              selectedPiece={selectedPiece}
              isXNext={isXNext}
              disabled={isXNext || Boolean(calculateWinner(board))}
            />
          </div>
        )}

        {showLeaderboard && (
          <Leaderboard 
            isMuted={isMuted}
            playGameJingle={sounds.playGameJingle}
            currentUserFid={frameContext?.user?.fid?.toString()}
            pfpUrl={profileImage}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
