"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

// Simple audio player using native Web Audio API instead of Howler.js

type PlayFunction = (options?: { id?: string }) => void;

interface SoundControls {
  stop: () => void;
  pause: () => void;
  isPlaying: () => boolean;
}

// Cache for audio elements to prevent reloading
const audioCache: Record<string, HTMLAudioElement> = {};

// Simple hook to play sounds using native Audio API
const useSimpleSound = (url: string, options: {
  volume?: number;
  loop?: boolean;
  soundEnabled?: boolean;
}): [PlayFunction, SoundControls] => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Create or get cached audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Use cached audio element if available
    if (audioCache[url]) {
      audioRef.current = audioCache[url];
      return;
    }
    
    // Create new audio element
    const audio = new Audio(url);
    audio.volume = options.volume || 0.5;
    audio.loop = options.loop || false;
    
    // Add to cache
    audioCache[url] = audio;
    audioRef.current = audio;
    
    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [url, options.volume, options.loop]);
  
  // Update audio properties when options change
  useEffect(() => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = options.volume || 0.5;
    audioRef.current.loop = options.loop || false;
    
    // Mute/unmute based on soundEnabled
    if (options.soundEnabled === false && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [options.volume, options.loop, options.soundEnabled, isPlaying]);
  
  // Play function
  const play: PlayFunction = useCallback(() => {
    if (!audioRef.current || options.soundEnabled === false) return;
    
    try {
      // Reset audio to beginning if it's already played
      if (audioRef.current.currentTime > 0) {
        audioRef.current.currentTime = 0;
      }
      
      const playPromise = audioRef.current.play();
      
      // Handle play promise (required for modern browsers)
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.warn('Audio play error:', error);
            // Auto-retry once on user interaction
            const handleInteraction = () => {
              audioRef.current?.play()
                .then(() => {
                  setIsPlaying(true);
                  document.removeEventListener('click', handleInteraction);
                })
                .catch(err => console.warn('Retry audio play error:', err));
            };
            document.addEventListener('click', handleInteraction, { once: true });
          });
      }
    } catch (error) {
      console.warn('Error playing audio:', error);
    }
  }, [options.soundEnabled]);
  
  // Stop function
  const stop = useCallback(() => {
    if (!audioRef.current) return;
    
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } catch (error) {
      console.warn('Error stopping audio:', error);
    }
  }, []);
  
  // Pause function
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    
    try {
      audioRef.current.pause();
      setIsPlaying(false);
    } catch (error) {
      console.warn('Error pausing audio:', error);
    }
  }, []);
  
  // Check if playing
  const checkIsPlaying = useCallback(() => {
    return isPlaying;
  }, [isPlaying]);
  
  return [play, { stop, pause, isPlaying: checkIsPlaying }];
};

// Tracking variables for background music state
let menuAudioPlaying = false;
let gameAudioPlaying = false;
let audioInitialized = false; // Track if audio system has been initialized

interface SoundManagerProps {
  isMuted: boolean;
  gameState: 'menu' | 'game';
  onSoundStateChange?: () => void;
}

export function SoundManager({ isMuted, gameState, onSoundStateChange }: SoundManagerProps) {
  // Log that we're using the native Audio API
  useEffect(() => {
    console.log('SoundManager: Using native Audio API for sound playback');
  }, []);
  
  // Use our simple sound hook instead of useSound/Howler
  const [playGameJingle, { stop: stopGameJingle }] = useSimpleSound('/sounds/jingle.mp3', { 
    volume: 0.3,
    soundEnabled: !isMuted,
    loop: true
  });

  const [playOpeningTheme, { stop: stopOpeningTheme }] = useSimpleSound('/sounds/openingtheme.mp3', { 
    volume: 0.3,
    soundEnabled: !isMuted,
    loop: true
  });

  const [playCountdownSound, { stop: stopCountdownSound }] = useSimpleSound('/sounds/countdown.mp3', { 
    soundEnabled: !isMuted,
    volume: 0.5
  });

  // Enhanced click sound with better animation sync
  const [playClickRaw] = useSimpleSound('/sounds/click.mp3', { 
    volume: 1.0, 
    soundEnabled: !isMuted
  });
  
  // Create a debounced version of playClick that syncs better with animations
  const lastClickTime = useRef(0);
  const playClick = useCallback(() => {
    const now = Date.now();
    // Prevent multiple clicks within 100ms to avoid sound issues
    if (now - lastClickTime.current > 100) {
      lastClickTime.current = now;
      // Small delay to match framer-motion animation timing
      setTimeout(() => {
        playClickRaw();
      }, 10);
    }
  }, [playClickRaw]);
  
  const [playWinning] = useSimpleSound('/sounds/winning.mp3', { 
    volume: 0.5, 
    soundEnabled: !isMuted
  });
  
  const [playLosing] = useSimpleSound('/sounds/losing.mp3', { 
    volume: 0.5, 
    soundEnabled: !isMuted
  });
  
  const [playDrawing] = useSimpleSound('/sounds/drawing.mp3', { 
    volume: 0.5, 
    soundEnabled: !isMuted
  });
  
  const [playGameOver] = useSimpleSound('/sounds/gameover.mp3', { 
    volume: 0.5, 
    soundEnabled: !isMuted
  });

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
            try {
              // Safe stops with error handling
              if (typeof stopGameJingle === 'function') stopGameJingle();
              if (typeof stopCountdownSound === 'function') stopCountdownSound();
              
              // Safe play with error handling
              if (typeof playOpeningTheme === 'function') {
                playOpeningTheme();
                console.log('Menu audio started successfully');
              } else {
                console.warn('playOpeningTheme is not a function');
              }
              
              menuAudioPlaying = true;
              gameAudioPlaying = false;
              isJinglePlaying.current = false;
            } catch (audioError) {
              console.error('Error starting menu audio:', audioError);
            }
          }
        } 
        // Game state audio management
        else if (gameState === 'game' && !isMuted) {
          // Only play game jingle if it's not already playing
          if (!gameAudioPlaying) {
            console.log('Starting game audio');
            try {
              // Safe stops with error handling
              if (typeof stopOpeningTheme === 'function') stopOpeningTheme();
              if (typeof stopCountdownSound === 'function') stopCountdownSound();
              
              // Safe play with error handling
              if (typeof playGameJingle === 'function') {
                playGameJingle();
                console.log('Game audio started successfully');
              } else {
                console.warn('playGameJingle is not a function');
              }
              
              gameAudioPlaying = true;
              menuAudioPlaying = false;
              isJinglePlaying.current = true;
            } catch (audioError) {
              console.error('Error starting game audio:', audioError);
            }
          }
        } 
        // Muted state - stop all audio
        else {
          console.log('Stopping all audio (muted or state change)');
          try {
            // Safe stops with error handling
            if (typeof stopGameJingle === 'function') stopGameJingle();
            if (typeof stopOpeningTheme === 'function') stopOpeningTheme();
            if (typeof stopCountdownSound === 'function') stopCountdownSound();
            
            menuAudioPlaying = false;
            gameAudioPlaying = false;
            isJinglePlaying.current = false;
          } catch (audioError) {
            console.error('Error stopping audio:', audioError);
          }
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
