import { Button } from "~/components/ui/Button";
import Image from 'next/image';
import { Context } from "@farcaster/miniapp-sdk";
import { motion } from 'framer-motion';

interface HomePageProps {
  tokenBalance: number;
  frameContext?: Context.MiniAppContext;
  onPlayClick: () => void;
}

export default function HomePage({ tokenBalance, frameContext, onPlayClick }: HomePageProps) {
  return (
    <motion.div 
      className="w-full h-full flex flex-col items-center pt-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="-mt-20 flex flex-col items-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {frameContext?.user?.username && (
          <div className="text-white text-xl mb-2 text-shadow text-center">
            Welcome, {frameContext.user.username}
          </div>
        )}
        
        <motion.h1 
          className="text-3xl font-bold text-center text-white mb-8 text-shadow"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          SELECT GAME
        </motion.h1>
      
      <motion.div 
        className="relative transform hover:scale-[1.02] transition-all duration-300 w-[300px]"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl blur-md -rotate-1"
          animate={{ rotate: [-1, 0, -1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        ></motion.div>
        <Button
          onClick={() => {
            // Play click sound first, our enhanced implementation will sync it properly
            onPlayClick();
            // Small delay before navigation to allow animation and sound to sync
            setTimeout(() => {
              onPlayClick();
            }, 50);
          }}
          className="relative w-full py-6 text-3xl font-black bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rounded-xl border-2 border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
            Tic-Tac-Maxi
          </span>
        </Button>
      </motion.div>
      </motion.div>
      
      {tokenBalance > 0 && (
        <motion.div 
          className="mt-20 flex items-center space-x-2 bg-gradient-to-r from-purple-900/90 to-purple-800/90 px-4 py-2 rounded-lg border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Image 
            src="/fantokenlogo.png"
            alt="Fan Token"
            width={24} 
            height={24}
            className="animate-pulse"
          />
          <button
            onClick={() => window.open('https://warpcast.com/~/channel/thepod', '_blank')}
            className="text-purple-100 text-sm font-medium hover:text-purple-200 transition-colors"
          >
            {tokenBalance.toFixed(2)} /thepod fan tokens owned
          </button>
        </motion.div>
      )}
      
      {/* Version text moved to Demo component */}
    </motion.div>
  );
}
