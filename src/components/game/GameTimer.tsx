"use client";

import { useEffect, useState } from 'react';

interface GameTimerProps {
  isActive: boolean;
  onTimeUp: () => void;
  isMuted: boolean;
  onPlayCountdown?: () => void;
  onStopCountdown?: () => void;
}

export function GameTimer({ 
  isActive, 
  onTimeUp,
  isMuted,
  onPlayCountdown,
  onStopCountdown
}: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onTimeUp();
            onStopCountdown?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, timeLeft, onTimeUp, onStopCountdown]);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(15);
      setStartTime(null);
    } else {
      setStartTime(Date.now());
    }
  }, [isActive]);

  return {
    timeLeft,
    setTimeLeft
  };
}
