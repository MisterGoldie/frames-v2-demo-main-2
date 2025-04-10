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
  const lastPlayAttemptRef = useRef<number>(0);
  
  // Create or get cached audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Function to create a fresh audio element
    const createAudio = () => {
      const audio = new Audio(url);
      audio.volume = options.volume || 0.5;
      audio.loop = options.loop || false;
      
      // Preload audio for faster playback
      audio.preload = 'auto';
      
      // Add event listeners for better error tracking
      audio.addEventListener('error', (e) => {
        console.error(`Audio error for ${url}:`, e);
        // Remove from cache if there's an error
        delete audioCache[url];
      });
      
      return audio;
    };
    
    // Use cached audio element if available and not in error state
    if (audioCache[url]) {
      const cachedAudio = audioCache[url];
      // Check if the cached audio is in a valid state
      if (cachedAudio.error) {
        console.warn(`Cached audio for ${url} has error, creating new instance`);
        audioCache[url] = createAudio();
      }
      audioRef.current = audioCache[url];
      return;
    }
    
    // Create new audio element
    audioCache[url] = createAudio();
    audioRef.current = audioCache[url];
    
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
  
  // Play function with enhanced reliability
  const play: PlayFunction = useCallback(() => {
    if (!audioRef.current || options.soundEnabled === false) return;
    
    // Get current timestamp for throttling
    const now = Date.now();
    lastPlayAttemptRef.current = now;
    
    try {
      // For non-looping sounds, create a new audio element for each play
      // This helps avoid issues with rapid successive plays
      if (!options.loop && url.includes('click.mp3')) {
        // For click sounds specifically, use a new Audio element each time
        // This avoids the issue where rapid clicks don't all play
        const clickAudio = new Audio(url);
        clickAudio.volume = options.volume || 0.5;
        clickAudio.play()
          .then(() => {
            // Auto-cleanup after playing
            clickAudio.addEventListener('ended', () => {
              // Remove references to allow garbage collection
              clickAudio.src = '';
            });
          })
          .catch(error => {
            console.warn('Click audio play error:', error);
          });
        return;
      }
      
      // For other sounds, use the standard approach
      // Reset audio to beginning if it's already played
      if (audioRef.current.currentTime > 0 && !options.loop) {
        audioRef.current.currentTime = 0;
      }
      
      const playPromise = audioRef.current.play();
      
      // Handle play promise (required for modern browsers)
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Only update state if this was the last play attempt
            if (lastPlayAttemptRef.current === now) {
              setIsPlaying(true);
            }
          })
          .catch(error => {
            console.warn('Audio play error:', error);
            // Auto-retry once on user interaction
            const handleInteraction = () => {
              if (audioRef.current) {
                audioRef.current.play()
                  .then(() => {
                    setIsPlaying(true);
                    document.removeEventListener('click', handleInteraction);
                  })
                  .catch(err => console.warn('Retry audio play error:', err));
              }
            };
            document.addEventListener('click', handleInteraction, { once: true });
          });
      }
    } catch (error) {
      console.warn('Error playing audio:', error);
    }
  }, [options.soundEnabled, options.loop, options.volume, url]);
  
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

  // Enhanced click sound with better reliability
  const [playClickRaw] = useSimpleSound('/sounds/click.mp3', { 
    volume: 1.0, 
    soundEnabled: !isMuted
  });
  
  // Create a more reliable version of playClick that works with rapid clicks
  const lastClickTime = useRef(0);
  const clickAudioPool = useRef<HTMLAudioElement[]>([]);
  
  // Initialize click audio pool
  useEffect(() => {
    // Create a pool of audio elements for click sounds
    // This allows multiple overlapping click sounds
    if (clickAudioPool.current.length === 0) {
      for (let i = 0; i < 5; i++) {
        const audio = new Audio('/sounds/click.mp3');
        audio.volume = 1.0;
        clickAudioPool.current.push(audio);
      }
    }
    
    return () => {
      // Clean up pool on unmount
      clickAudioPool.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      clickAudioPool.current = [];
    };
  }, []);
  
  const playClick = useCallback(() => {
    if (isMuted) return;
    
    const now = Date.now();
    // Reduced debounce time to 50ms to make more clicks audible
    // while still preventing audio distortion
    if (now - lastClickTime.current > 50) {
      lastClickTime.current = now;
      
      try {
        // Try to use audio pool first (most reliable method)
        if (clickAudioPool.current.length > 0) {
          // Find an audio element that's not playing
          const availableAudio = clickAudioPool.current.find(audio => 
            audio.paused || audio.ended || audio.currentTime === 0
          );
          
          if (availableAudio) {
            // Reset and play
            availableAudio.currentTime = 0;
            availableAudio.play().catch(err => {
              console.warn('Click pool audio error:', err);
              // Fallback to regular method
              setTimeout(() => playClickRaw(), 0);
            });
            return;
          }
        }
        
        // Fallback to regular method with minimal delay
        setTimeout(() => playClickRaw(), 0);
      } catch (error) {
        console.warn('Error in playClick:', error);
        // Last resort fallback
        const audio = new Audio('/sounds/click.mp3');
        audio.volume = 1.0;
        audio.play().catch(e => console.warn('Last resort click failed:', e));
      }
    }
  }, [isMuted, playClickRaw]);
  
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
  
  // Removed reference to non-existent gameover.mp3 file
  // If you want to add this sound, place the file in the public/sounds directory
  const playGameOver = () => {
    console.log('Game over sound would play here if the file existed');
  };

  const isJinglePlaying = useRef(false);

  // Track user interaction state for audio playback permission
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Listen for user interaction to enable audio
  useEffect(() => {
    const checkInteraction = () => {
      const hasInteracted = document.documentElement.classList.contains('user-interacted');
      if (hasInteracted && !hasUserInteracted) {
        console.log('User interaction detected, enabling audio');
        setHasUserInteracted(true);
      }
    };
    
    // Check immediately and set up interval to keep checking
    checkInteraction();
    const intervalId = setInterval(checkInteraction, 1000);
    
    return () => clearInterval(intervalId);
  }, [hasUserInteracted]);
  
  useEffect(() => {
    const hasInteracted = hasUserInteracted || document.documentElement.classList.contains('user-interacted');
    
    // Function to safely manage audio state transitions
    const manageAudioState = () => {
      try {
        // If no user interaction yet, don't try to play audio
        if (!hasInteracted) {
          console.log('Waiting for user interaction before playing audio');
          return;
        }
        
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
      
      manageAudioState();
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
