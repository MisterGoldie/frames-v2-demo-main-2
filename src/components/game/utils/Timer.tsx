"use client";

import { useEffect, useState } from 'react';

interface TimerProps {
  timeLeft: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export const Timer: React.FC<TimerProps> = ({ timeLeft, onTimeUp, isActive }) => {
  const [time, setTime] = useState(timeLeft);

  useEffect(() => {
    setTime(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeUp]);

  return (
    <div className="fixed top-4 left-4 bg-purple-600 rounded-full p-2 text-white font-bold">
      {time}s
    </div>
  );
};
