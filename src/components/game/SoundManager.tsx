"use client";

import { useEffect, useRef } from 'react';
import useSound from 'use-sound';

// Create a global flag to track if audio has been initialized
let audioInitialized = false;

interface SoundManagerProps {
  isMuted: boolean;
  gameState: 'menu' | 'game';
  onSoundStateChange?: () => void;
}

export function SoundManager({ isMuted, gameState, onSoundStateChange }: SoundManagerProps) {
  const [playGameJingle, { stop: stopGameJingle }] = useSound('/sounds/jingle.mp3', { 
    volume: 0.3,
    soundEnabled: !isMuted,
    loop: true
  });

  const [playOpeningTheme, { stop: stopOpeningTheme }] = useSound('/sounds/openingtheme.mp3', { 
    volume: 0.3,
    soundEnabled: !isMuted,
    loop: true
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
    
    // Add delay for initial autoplay
    const timer = setTimeout(() => {
      // Check if audio has already been initialized to prevent double playback
      if (audioInitialized) {
        // Only handle state changes after initial load
        if (gameState === 'menu' && !isMuted) {
          stopGameJingle?.();
          stopCountdownSound?.();
          playOpeningTheme?.();
          isJinglePlaying.current = false;
        } else if (gameState === 'game' && !isMuted) {
          stopOpeningTheme?.();
          stopCountdownSound?.();
          playGameJingle?.();
          isJinglePlaying.current = true;
        } else {
          stopGameJingle?.();
          stopOpeningTheme?.();
          stopCountdownSound?.();
          isJinglePlaying.current = false;
        }
        return;
      }
      
      // First-time initialization
      audioInitialized = true;
      
      // Allow initial autoplay without interaction in menu state
      if ((!hasInteracted && gameState === 'menu') || hasInteracted) {
        if (gameState === 'menu' && !isMuted) {
          stopGameJingle?.();
          stopCountdownSound?.();
          playOpeningTheme?.();
          isJinglePlaying.current = false;
        } else if (gameState === 'game' && !isMuted) {
          stopOpeningTheme?.();
          stopCountdownSound?.();
          playGameJingle?.();
          isJinglePlaying.current = true;
        } else {
          stopGameJingle?.();
          stopOpeningTheme?.();
          stopCountdownSound?.();
          isJinglePlaying.current = false;
        }
      }
    }, 500); // Small delay for initial load

    return () => {
      clearTimeout(timer);
      if (isMuted || gameState === 'menu') {
        stopGameJingle?.();
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
