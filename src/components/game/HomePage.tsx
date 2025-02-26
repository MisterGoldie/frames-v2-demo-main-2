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
    <div className="w-full h-full flex flex-col items-center pt-24">
      <div className="-mt-20 flex flex-col items-center">
        {frameContext?.user?.username && (
          <div className="text-white text-xl mb-2 text-shadow text-center">
            Welcome, {frameContext.user.username}
          </div>
        )}
        
        <h1 className="text-3xl font-bold text-center text-white mb-8 text-shadow">
          SELECT GAME
        </h1>
      
      <div className="relative transform hover:scale-[1.02] transition-all duration-300 w-[300px]">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl blur-md -rotate-1"></div>
        <Button
          onClick={() => {
            playClick();
            onPlayClick();
          }}
          className="relative w-full py-6 text-3xl font-black bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rounded-xl border-2 border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
            Tic-Tac-Maxi
          </span>
        </Button>
      </div>
      </div>
      
      {tokenBalance > 0 && (
        <div className="mt-20 flex items-center space-x-2 bg-gradient-to-r from-purple-900/90 to-purple-800/90 px-4 py-2 rounded-lg border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
          <Image 
            src="/fantokenlogo.png"
            alt="Fan Token"
            width={24} 
            height={24}
            className="animate-pulse"
          />
          <span className="text-purple-100 text-sm font-medium">
            {tokenBalance.toFixed(2)} /thepod fan tokens owned
          </span>
        </div>
      )}
      
      <div className="mt-auto text-white/50 text-sm pb-4">
        version 1.4
      </div>
    </div>
  );
}
