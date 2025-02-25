"use client";

import { Button } from "~/components/ui/Button";
import Image from 'next/image';
import { FrameContext } from "@farcaster/frame-sdk";

interface HomePageProps {
  tokenBalance: number;
  frameContext?: FrameContext;
  onPlayClick: () => void;
  playClick: () => void;
}

export default function HomePage({ tokenBalance, frameContext, onPlayClick, playClick }: HomePageProps) {
  return (
    <div className="w-full flex flex-col items-center">
      {frameContext?.user?.username && (
        <div className="text-white text-xl mb-4 text-shadow">
          Welcome, {frameContext.user.username}
        </div>
      )}
      
      <h1 className="text-3xl font-bold text-center text-white mb-12 text-shadow">
        Select Game
      </h1>
      
      <Button
        onClick={() => {
          playClick();
          onPlayClick();
        }}
        className="w-full py-4 text-2xl bg-purple-600 box-shadow"
      >
        Tic-Tac-Maxi
      </Button>
      
      {tokenBalance > 0 && (
        <div className="mt-12 bg-purple-600 text-white px-3 py-1 rounded-full text-sm inline-flex items-center shadow-lg">
          <Image 
            src="/fantokenlogo.png"
            alt="Fan Token"
            width={24} 
            height={24}
          />
          {tokenBalance.toFixed(2)} /thepod fan tokens owned
        </div>
      )}
      
      <div className="absolute bottom-4 text-white/50 text-sm">
        version 1.3
      </div>
    </div>
  );
}
