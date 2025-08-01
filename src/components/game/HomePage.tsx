import { Button } from "~/components/ui/Button";
import Image from 'next/image';
import { Context } from "@farcaster/miniapp-sdk";
import { motion } from 'framer-motion';

interface HomePageProps {
  tokenBalance: number;
  frameContext?: Context.MiniAppContext;
  onPlayClick: () => void;
}

// Replace the current animations with more engaging ones
export default function HomePage({ tokenBalance, frameContext, onPlayClick }: HomePageProps) {
  return (
    <motion.div 
      className="w-full h-full flex flex-col items-center pt-24"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        duration: 0.8 
      }}
    >
      <motion.div 
        className="-mt-20 flex flex-col items-center"
        initial={{ y: -50, opacity: 0, rotateX: -15 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ 
          delay: 0.3, 
          type: "spring", 
          stiffness: 120, 
          damping: 12 
        }}
      >
        {frameContext?.user?.username && (
          <motion.div 
            className="text-white text-xl mb-2 text-shadow text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          >
            Welcome, {frameContext.user.username}
          </motion.div>
        )}
        
        <motion.h1 
          className="text-3xl font-bold text-center text-white mb-8 text-shadow"
          initial={{ scale: 0.5, opacity: 0, rotateY: -20 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ 
            delay: 0.4, 
            type: "spring", 
            stiffness: 150, 
            damping: 10 
          }}
        >
          SELECT GAME
        </motion.h1>
      
        <motion.div 
          className="relative transform hover:scale-[1.02] transition-all duration-300 w-[300px]"
          initial={{ scale: 0.3, opacity: 0, rotateZ: -10 }}
          animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
          transition={{ 
            delay: 0.6, 
            type: "spring", 
            stiffness: 200, 
            damping: 15 
          }}
          whileHover={{ 
            scale: 1.05, 
            rotateZ: 1,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
          whileTap={{ 
            scale: 0.95, 
            rotateZ: -1,
            transition: { duration: 0.1 }
          }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl blur-md -rotate-1"
            animate={{ 
              rotate: [-2, 2, -2],
              scale: [1, 1.02, 1]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut",
              repeatType: "reverse"
            }}
          />
          <Button
            onClick={() => {
              onPlayClick();
              setTimeout(() => {
                onPlayClick();
              }, 50);
            }}
            className="relative w-full py-6 text-3xl font-black bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rounded-xl border-2 border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
          >
            <motion.span 
              className="bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              Tic-Tac-Toe
            </motion.span>
          </Button>
        </motion.div>
      </motion.div>
      
      {tokenBalance > 0 && (
        <motion.div 
          className="mt-20 flex items-center space-x-2 bg-gradient-to-r from-purple-900/90 to-purple-800/90 px-4 py-2 rounded-lg border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
          initial={{ y: 30, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ 
            delay: 0.8, 
            type: "spring", 
            stiffness: 120, 
            damping: 15 
          }}
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
