"use client";

import { useEffect, useRef } from 'react';
import useSound from 'use-sound';

// Create global flags to track audio initialization and state
let audioInitialized = false;
let menuAudioPlaying = false;
let gameAudioPlaying = false;

interface SoundManagerProps {
  isMuted: boolean;
  gameState: 'menu' | 'game';
  onSoundStateChange?: () => void;
}

export function SoundManager({ isMuted, gameState, onSoundStateChange }: SoundManagerProps) {
  const [playGameJingle, { stop: stopGameJingle }] = useSound('/sounds/jingle.mp3', { 
    volume: 0.3,
    soundEnabled: !isMuted,
    loop: true,
    interrupt: false // Prevent interrupting if already playing
  });

  const [playOpeningTheme, { stop: stopOpeningTheme }] = useSound('/sounds/openingtheme.mp3', { 
    volume: 0.3,
    soundEnabled: !isMuted,
    loop: true,
    interrupt: false // Prevent interrupting if already playing
  });

  const [playCountdownSound, { stop: stopCountdownSound }] = useSound('/sounds/countdown.mp3', { 
    soundEnabled: !isMuted,
    volume: 0.5,
    interrupt: true,
    playbackRate: 1.0,
    sprite: {
      countdown: [0, 5000]
    }
  });

  const [playClick] = useSound('/sounds/click.mp3', { volume: 1.0, soundEnabled: !isMuted });
  const [playWinning] = useSound('/sounds/winning.mp3', { volume: 0.5, soundEnabled: !isMuted });
  const [playLosing] = useSound('/sounds/losing.mp3', { volume: 0.5, soundEnabled: !isMuted });
  const [playDrawing] = useSound('/sounds/drawing.mp3', { volume: 0.5, soundEnabled: !isMuted });
  const [playGameOver] = useSound('/sounds/gameover.mp3', { volume: 0.5, soundEnabled: !isMuted });

  const isJinglePlaying = useRef(false);

  useEffect(() => {
    const hasInteracted = document.documentElement.classList.contains('user-interacted');
    
    // Function to safely manage audio state transitions
    const manageAudioState = () => {
      try {
        // Menu state audio management
        if (gameState === 'menu' && !isMuted) {
          // Only play opening theme if it's not already playing
          if (!menuAudioPlaying) {
            console.log('Starting menu audio');
            stopGameJingle?.();
            stopCountdownSound?.();
            playOpeningTheme?.();
            menuAudioPlaying = true;
            gameAudioPlaying = false;
            isJinglePlaying.current = false;
          }
        } 
        // Game state audio management
        else if (gameState === 'game' && !isMuted) {
          // Only play game jingle if it's not already playing
          if (!gameAudioPlaying) {
            console.log('Starting game audio');
            stopOpeningTheme?.();
            stopCountdownSound?.();
            playGameJingle?.();
            gameAudioPlaying = true;
            menuAudioPlaying = false;
            isJinglePlaying.current = true;
          }
        } 
        // Muted state - stop all audio
        else {
          console.log('Stopping all audio (muted or state change)');
          stopGameJingle?.();
          stopOpeningTheme?.();
          stopCountdownSound?.();
          menuAudioPlaying = false;
          gameAudioPlaying = false;
          isJinglePlaying.current = false;
        }
      } catch (error) {
        console.error('Error managing audio state:', error);
        // Reset flags on error to allow retry
        menuAudioPlaying = false;
        gameAudioPlaying = false;
      }
    };
    
    // Add delay for initial autoplay
    const timer = setTimeout(() => {
      // Mark as initialized on first run
      if (!audioInitialized) {
        console.log('Initializing audio system');
        audioInitialized = true;
      }
      
      // Only play audio if user has interacted or we're in menu state (which allows autoplay)
      if (hasInteracted || gameState === 'menu') {
        manageAudioState();
      }
    }, 500); // Small delay for initial load

    return () => {
      clearTimeout(timer);
      
      // Don't stop audio on unmount unless we're changing state or muting
      // This prevents audio restart when components remount
      if (isMuted) {
        console.log('Cleanup: stopping all audio (muted)');
        stopGameJingle?.();
        stopOpeningTheme?.();
        stopCountdownSound?.();
        menuAudioPlaying = false;
        gameAudioPlaying = false;
        isJinglePlaying.current = false;
      }
    };
  }, [isMuted, gameState, stopGameJingle, stopOpeningTheme, stopCountdownSound, playOpeningTheme, playGameJingle]);

  return {
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
}
