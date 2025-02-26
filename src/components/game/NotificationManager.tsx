"use client";

import { FrameContext } from "@farcaster/frame-sdk";

interface NotificationManagerProps {
  fid?: number;
  gameResult?: 'win' | 'loss' | 'draw';
  difficulty?: 'easy' | 'medium' | 'hard';
}

export class NotificationManager {
  private static winMessages = [
    "Congratulations! You've defeated Maxi!",
    "Victory! You're unstoppable! 🏆",
    "Game Over - You Win! 🕹️",
    "Maxi's been POD played! 😎",
    "Good win against Maxi! 🌟",
    "You're the POD Play Master! 👑"
  ];

  private static lossMessages = [
    "Maxi beat you. Try again?",
    "Almost had it! One more try?",
    "Maxi got lucky. Rematch? 👀",
    "Don't give up! Play again?"
  ];

  private static drawMessages = [
    "It's a draw! Good game! 👏",
    "Neck and neck! What a match!",
    "Perfect balance! Try again?",
    "Neither wins - both legends!"
  ];

  private static getRandomMessage(type: 'win' | 'loss' | 'draw'): string {
    const messages = {
      win: this.winMessages,
      loss: this.lossMessages,
      draw: this.drawMessages
    };
    const messageArray = messages[type];
    return messageArray[Math.floor(Math.random() * messageArray.length)];
  }

  static async sendGameNotification(type: 'win' | 'loss' | 'draw', fid: string) {
    if (!fid) {
      console.log('No FID available, cannot send notification');
      return;
    }

    const message = this.getRandomMessage(type);

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: fid,
          title: 'POD Play Game Result',
          body: message,
          targetUrl: process.env.NEXT_PUBLIC_URL
        })
      });

      const data = await response.json();
      
      if (data.error === "Rate limited") {
        console.log('Notification rate limited - user is playing too frequently');
        return;
      }

      console.log('Notification API response:', data);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  static async sendThanksNotification(fid: string) {
    if (!fid) {
      return;
    }

    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: fid,
          title: 'POD Play Game Result',
          body: 'Thanks for playing POD Play! 🎮',
          targetUrl: process.env.NEXT_PUBLIC_URL
        })
      });
    } catch (error) {
      console.error('Failed to send thanks notification:', error);
    }
  }
}
