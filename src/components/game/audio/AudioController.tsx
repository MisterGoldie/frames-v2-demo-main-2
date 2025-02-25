"use client";

import { useState, useRef } from 'react';
import useSound from 'use-sound';

export interface AudioControllerProps {
  isMuted: boolean;
  onMuteToggle: (muted: boolean) => void;
}

export const useGameSounds = (isMuted: boolean) => {
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
  const [playCountdownSound, { stop: stopCountdownSound }] = useSound('/sounds/countdown.mp3', { 
    volume: 0.5,
    soundEnabled: !isMuted,
    interrupt: true,
    playbackRate: 1.0,
    sprite: {
      countdown: [0, 5000]
    }
  });
  const [playGameOver] = useSound('/sounds/gameover.mp3', { volume: 0.5, soundEnabled: !isMuted });

  return {
    playClick,
    playGameJingle,
    stopGameJingle,
    playWinning,
    playLosing,
    playDrawing,
    playHalloweenMusic,
    stopHalloweenMusic,
    playCountdownSound,
    stopCountdownSound,
    playGameOver
  };
};

const VolumeOnIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="24px" 
    viewBox="0 -960 960 960" 
    width="24px" 
    fill="#FFFFFF"
  >
    <path d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47Z"/>
  </svg>
);

const VolumeOffIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="24px" 
    viewBox="0 -960 960 960" 
    width="24px" 
    fill="#FFFFFF"
  >
    <path d="M792-56 56-792l56-56 736 736-56 56ZM560-514l-80-80v-246h240v160H560v166ZM400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-62l80 80v120q0 66-47 113t-113 47Z"/>
  </svg>
);

export const AudioController: React.FC<AudioControllerProps> = ({ isMuted, onMuteToggle }) => {
  return (
    <button
      onClick={() => onMuteToggle(!isMuted)}
      className="fixed top-4 right-4 z-50 p-2 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors"
    >
      {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
    </button>
  );
};
