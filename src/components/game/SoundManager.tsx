"use client";

import { useEffect, useRef, useCallback } from 'react';

type PlayFunction = (options?: { id?: string }) => void;

interface SoundControls {
  stop: () => void;
  pause: () => void;
  isPlaying: () => boolean;
}

// Simple audio instances - no caching complications
let menuAudio: HTMLAudioElement | null = null;
let gameAudio: HTMLAudioElement | null = null;
let clickAudio: HTMLAudioElement | null = null;

// Simple state tracking
let isMenuPlaying = false;
let isGamePlaying = false;

interface SoundManagerProps {
  isMuted: boolean;
  gameState: 'menu' | 'game';
  onSoundStateChange?: () => void;
}

// Singleton instance counter
let instanceCount = 0;

// Add at the top of the file
let globalSoundManagerInstance: any = null;

export function SoundManager({ isMuted, gameState }: SoundManagerProps) {
  // Return existing instance if already created
  if (globalSoundManagerInstance) {
    console.log('SoundManager: Returning existing instance');
    return globalSoundManagerInstance;
  }
  
  const instanceId = useRef(++instanceCount);
  
  console.log(`SoundManager: Creating singleton instance #${instanceId.current}`);
  
  // Block duplicate instances
  useEffect(() => {
    if (instanceId.current > 1) {
      console.warn(`SoundManager: Blocking duplicate instance #${instanceId.current}`);
      return;
    }
    console.log(`SoundManager: Creating singleton instance #${instanceId.current}`);
  }, []);
  
  // Return empty functions for duplicate instances
  if (instanceId.current > 1) {
    return {
      playClick: () => {},
      playWinning: () => {},
      playLosing: () => {},
      playDrawing: () => {},
      playGameOver: () => {},
      playCountdownSound: () => {},
      stopCountdownSound: () => {},
      stopGameJingle: () => {},
      stopOpeningTheme: () => {},
      playGameJingle: () => {},
      playOpeningTheme: () => {}
    };
  }

  // Initialize audio instances once
  useEffect(() => {
    if (!menuAudio) {
      menuAudio = new Audio('/sounds/openingtheme.mp3');
      menuAudio.loop = true;
      menuAudio.volume = 0.3;
    }
    
    if (!gameAudio) {
      gameAudio = new Audio('/sounds/jingle.mp3');
      gameAudio.loop = true;
      gameAudio.volume = 0.3;
    }
    
    if (!clickAudio) {
      clickAudio = new Audio('/sounds/click.mp3');
      clickAudio.volume = 1.0;
    }
  }, []);

  // Handle audio state changes
  useEffect(() => {
    console.log(`Audio state change: gameState=${gameState}, isMuted=${isMuted}`);
    
    if (isMuted) {
      // Stop all audio immediately when muted
      console.log('MUTING: Stopping all audio');
      
      if (menuAudio && !menuAudio.paused) {
        menuAudio.pause();
        menuAudio.currentTime = 0;
      }
      
      if (gameAudio && !gameAudio.paused) {
        gameAudio.pause();
        gameAudio.currentTime = 0;
      }
      
      isMenuPlaying = false;
      isGamePlaying = false;
      return;
    }
    
    // Play appropriate audio when not muted
    if (gameState === 'menu' && !isMenuPlaying) {
      console.log('Starting menu audio');
      
      // Stop game audio first
      if (gameAudio && !gameAudio.paused) {
        gameAudio.pause();
        gameAudio.currentTime = 0;
      }
      isGamePlaying = false;
      
      // Start menu audio
      if (menuAudio) {
        menuAudio.currentTime = 0;
        menuAudio.play().then(() => {
          console.log('Menu audio started successfully');
          isMenuPlaying = true;
        }).catch(err => {
          console.warn('Menu audio failed:', err);
        });
      }
    } 
    else if (gameState === 'game' && !isGamePlaying) {
      console.log('Starting game audio');
      
      // Stop menu audio first
      if (menuAudio && !menuAudio.paused) {
        menuAudio.pause();
        menuAudio.currentTime = 0;
      }
      isMenuPlaying = false;
      
      // Start game audio
      if (gameAudio) {
        gameAudio.currentTime = 0;
        gameAudio.play().then(() => {
          console.log('Game audio started successfully');
          isGamePlaying = true;
        }).catch(err => {
          console.warn('Game audio failed:', err);
        });
      }
    }
  }, [isMuted, gameState]);

  // Audio control functions
  const playClick = useCallback(() => {
    if (isMuted || !clickAudio) return;
    
    try {
      clickAudio.currentTime = 0;
      clickAudio.play().catch(err => console.warn('Click sound failed:', err));
    } catch (error) {
      console.warn('Click sound error:', error);
    }
  }, [isMuted]);

  const playWinning = useCallback(() => {
    if (isMuted) return;
    const audio = new Audio('/sounds/winning.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.warn('Winning sound failed:', err));
  }, [isMuted]);

  const playLosing = useCallback(() => {
    if (isMuted) return;
    const audio = new Audio('/sounds/losing.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.warn('Losing sound failed:', err));
  }, [isMuted]);

  const playDrawing = useCallback(() => {
    if (isMuted) return;
    const audio = new Audio('/sounds/drawing.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.warn('Drawing sound failed:', err));
  }, [isMuted]);

  const playCountdownSound = useCallback(() => {
    if (isMuted) return;
    const audio = new Audio('/sounds/countdown.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.warn('Countdown sound failed:', err));
  }, [isMuted]);

  const stopCountdownSound = useCallback(() => {
    // Countdown sounds are short, no need to stop
  }, []);

  const stopGameJingle = useCallback(() => {
    if (gameAudio && !gameAudio.paused) {
      gameAudio.pause();
      gameAudio.currentTime = 0;
    }
    isGamePlaying = false;
  }, []);

  const stopOpeningTheme = useCallback(() => {
    if (menuAudio && !menuAudio.paused) {
      menuAudio.pause();
      menuAudio.currentTime = 0;
    }
    isMenuPlaying = false;
  }, []);

  const playGameJingle = useCallback(() => {
    if (isMuted || !gameAudio) return;
    gameAudio.currentTime = 0;
    gameAudio.play().then(() => {
      isGamePlaying = true;
    }).catch(err => console.warn('Game jingle failed:', err));
  }, [isMuted]);

  const playOpeningTheme = useCallback(() => {
    if (isMuted || !menuAudio) return;
    menuAudio.currentTime = 0;
    menuAudio.play().then(() => {
      isMenuPlaying = true;
    }).catch(err => console.warn('Opening theme failed:', err));
  }, [isMuted]);

  const playGameOver = useCallback(() => {
    console.log('Game over sound would play here if the file existed');
  }, []);

  const soundFunctions = {
    playClick,
    playWinning,
    playLosing,
    playDrawing,
    playGameOver,
    playCountdownSound,
    stopCountdownSound,
    stopGameJingle,
    stopOpeningTheme,
    playGameJingle,
    playOpeningTheme
  };
  
  // Store the instance globally
  globalSoundManagerInstance = soundFunctions;
  
  return soundFunctions;
}
