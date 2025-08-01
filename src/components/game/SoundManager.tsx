"use client";

import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';

type PlayFunction = (options?: { id?: string }) => void;

interface SoundControls {
  stop: () => void;
  pause: () => void;
  isPlaying: () => boolean;
}

// Audio cache to prevent multiple loads of the same file
const audioCache: Record<string, HTMLAudioElement> = {};

// Custom hook for simple sound management
const useSimpleSound = (url: string, options: {
  volume?: number;
  loop?: boolean;
  soundEnabled?: boolean;
}): [PlayFunction, SoundControls] => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  
  useEffect(() => {
    if (!audioCache[url]) {
      audioCache[url] = new Audio(url);
      audioCache[url].preload = 'auto';
    }
    audioRef.current = audioCache[url];
    
    const audio = audioRef.current;
    if (audio) {
      audio.volume = options.volume ?? 0.5;
      audio.loop = options.loop ?? false;
      
      const handleEnded = () => {
        isPlayingRef.current = false;
      };
      
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [url, options.volume, options.loop]);
  
  const play: PlayFunction = useCallback((playOptions) => {
    if (!options.soundEnabled) return;
    
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise) {
          playPromise
            .then(() => {
              isPlayingRef.current = true;
            })
            .catch(error => {
              console.warn(`Audio play failed for ${url}:`, error);
              isPlayingRef.current = false;
            });
        }
      } catch (error) {
        console.warn(`Audio play error for ${url}:`, error);
      }
    }
  }, [options.soundEnabled, url]);
  
  const controls: SoundControls = {
    stop: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        isPlayingRef.current = false;
      }
    },
    pause: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        isPlayingRef.current = false;
      }
    },
    isPlaying: () => isPlayingRef.current
  };
  
  return [play, controls];
};

// Global audio state
let menuAudioPlaying = false;
let gameAudioPlaying = false;
let audioInitialized = false;

interface SoundManagerProps {
  isMuted: boolean;
  gameState: 'menu' | 'game';
  onSoundStateChange?: () => void;
}

// Context for singleton pattern
const SoundManagerContext = createContext<any>(null);

// Provider component
export function SoundManagerProvider({ children }: { children: React.ReactNode }) {
  const soundManager = SoundManager({ 
    isMuted: false, 
    gameState: 'menu' 
  });
  
  return (
    <SoundManagerContext.Provider value={soundManager}>
      {children}
    </SoundManagerContext.Provider>
  );
}

// Hook to use the sound manager
export function useSoundManager() {
  const context = useContext(SoundManagerContext);
  if (!context) {
    throw new Error('useSoundManager must be used within a SoundManagerProvider');
  }
  return context;
}

// Singleton instance tracking
let soundManagerInstance: any = null;
let instanceCount = 0;

export function SoundManager({ isMuted, gameState, onSoundStateChange }: SoundManagerProps) {
  const instanceId = useRef(++instanceCount);
  const isJinglePlaying = useRef(false);
  
  // Prevent multiple instances
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

  // Sound hooks
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

  const [playClickRaw] = useSimpleSound('/sounds/click.mp3', { 
    volume: 1.0, 
    soundEnabled: !isMuted
  });
  
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
  
  // Enhanced click sound with audio pool
  const lastClickTime = useRef(0);
  const clickAudioPool = useRef<HTMLAudioElement[]>([]);
  
  // Initialize click audio pool
  useEffect(() => {
    if (clickAudioPool.current.length === 0) {
      for (let i = 0; i < 5; i++) {
        const audio = new Audio('/sounds/click.mp3');
        audio.volume = 1.0;
        clickAudioPool.current.push(audio);
      }
    }
    
    return () => {
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
    if (now - lastClickTime.current > 50) {
      lastClickTime.current = now;
      
      try {
        if (clickAudioPool.current.length > 0) {
          const availableAudio = clickAudioPool.current.find(audio => 
            audio.paused || audio.ended || audio.currentTime === 0
          );
          
          if (availableAudio) {
            availableAudio.currentTime = 0;
            availableAudio.play().catch(err => {
              console.warn('Click pool audio error:', err);
              setTimeout(() => playClickRaw(), 0);
            });
            return;
          }
        }
        
        setTimeout(() => playClickRaw(), 0);
      } catch (error) {
        console.warn('Error in playClick:', error);
        const audio = new Audio('/sounds/click.mp3');
        audio.volume = 1.0;
        audio.play().catch(e => console.warn('Last resort click failed:', e));
      }
    }
  }, [isMuted, playClickRaw]);
  
  const playGameOver = useCallback(() => {
    console.log('Game over sound would play here if the file existed');
  }, []);

  // Track user interaction state for audio playback permission
  const [hasUserInteracted, setHasUserInteracted] = useState(true);
  
  // Force user interaction flag to true and set up event listeners
  useEffect(() => {
    console.log('Setting up forced audio interaction');
    
    document.documentElement.classList.add('user-interacted');
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('AudioContext resumed successfully');
        }).catch(err => {
          console.warn('Could not resume AudioContext:', err);
        });
      }
    } catch (e) {
      console.warn('AudioContext not supported:', e);
    }
    
    const unlockAudio = () => {
      const silentSound = new Audio();
      silentSound.play().then(() => {
        console.log('Silent sound played successfully');
      }).catch(e => {
        console.warn('Silent sound failed:', e);
      });
    };
    
    unlockAudio();
    
    const handleInteraction = () => {
      document.documentElement.classList.add('user-interacted');
      setHasUserInteracted(true);
      unlockAudio();
    };
    
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);
  
  // Audio state management
  useEffect(() => {
    const manageAudioState = () => {
      try {
        if (gameState === 'menu' && !isMuted) {
          if (!menuAudioPlaying) {
            console.log('Starting menu audio');
            try {
              stopGameJingle();
              stopCountdownSound();
              
              playOpeningTheme();
              console.log('Menu audio started successfully');
              
              menuAudioPlaying = true;
              gameAudioPlaying = false;
              isJinglePlaying.current = false;
            } catch (audioError) {
              console.error('Error starting menu audio:', audioError);
            }
          }
        } 
        else if (gameState === 'game' && !isMuted) {
          if (!gameAudioPlaying) {
            console.log('Starting game audio');
            try {
              stopOpeningTheme();
              stopCountdownSound();
              
              playGameJingle();
              console.log('Game audio started successfully');
              
              gameAudioPlaying = true;
              menuAudioPlaying = false;
              isJinglePlaying.current = true;
            } catch (audioError) {
              console.error('Error starting game audio:', audioError);
            }
          }
        } 
        else {
          console.log('Stopping all audio (muted or state change)');
          try {
            stopGameJingle();
            stopOpeningTheme();
            stopCountdownSound();
            
            menuAudioPlaying = false;
            gameAudioPlaying = false;
            isJinglePlaying.current = false;
          } catch (audioError) {
            console.error('Error stopping audio:', audioError);
          }
        }
      } catch (error) {
        console.error('Error managing audio state:', error);
        menuAudioPlaying = false;
        gameAudioPlaying = false;
      }
    };
    
    console.log('Attempting immediate audio playback');
    manageAudioState();
    
    const timers: NodeJS.Timeout[] = [];
    
    timers.push(setTimeout(() => {
      console.log('First retry for audio playback');
      if (!audioInitialized) {
        console.log('Initializing audio system');
        audioInitialized = true;
      }
      manageAudioState();
    }, 500));
    
    timers.push(setTimeout(() => {
      console.log('Second retry for audio playback');
      manageAudioState();
    }, 1500));
    
    timers.push(setTimeout(() => {
      console.log('Final retry for audio playback');
      manageAudioState();
    }, 3000));

    return () => {
      timers.forEach(t => clearTimeout(t));
      
      if (isMuted) {
        console.log('Cleanup: stopping all audio (muted)');
        stopGameJingle();
        stopOpeningTheme();
        stopCountdownSound();
        menuAudioPlaying = false;
        gameAudioPlaying = false;
        isJinglePlaying.current = false;
      }
    };
  }, [isMuted, gameState, stopGameJingle, stopOpeningTheme, stopCountdownSound, playOpeningTheme, playGameJingle]);

  // Return sound controls
  const soundControls = {
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
  
  soundManagerInstance = soundControls;
  return soundControls;
}
