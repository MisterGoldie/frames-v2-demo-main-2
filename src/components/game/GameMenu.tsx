"use client";

// @ts-ignore-next-line
// eslint-disable-next-line @typescript-eslint/ban-ts-comment

import { Button } from "~/components/ui/Button";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface GameMenuProps {
  menuStep: 'piece' | 'difficulty';
  // @ts-ignore
  onSelectPiece: (piece: 'scarygary' | 'chili' | 'podplaylogo') => void;
  // @ts-ignore
  onSelectDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  // @ts-ignore
  onBack: () => void;
  // @ts-ignore
  playClick: () => void;
}

// @ts-ignore
export default function GameMenu({ menuStep, onSelectPiece, onSelectDifficulty, onBack, playClick }: GameMenuProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { 
      opacity: 0, 
      x: -30, 
      rotateY: -15,
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      rotateY: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 150,
        damping: 12
      }
    }
  };

  return (
    <motion.div 
      className="w-full flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: "spring" as const, 
        stiffness: 120, 
        damping: 15 
      }}
    >
      <motion.h1 
        className="text-3xl font-bold text-center text-white mb-12 text-shadow"
        key={menuStep}
        initial={{ y: -30, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 15 
        }}
      >
        {menuStep === 'piece' ? 'Select Piece' : 'Choose Difficulty'}
      </motion.h1>

      <AnimatePresence mode="wait">
        {menuStep === 'piece' && (
          <motion.div
            key="piece-selection"
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ 
              opacity: 0, 
              x: -50, 
              rotateY: -20,
              transition: { duration: 0.3 }
            }}
          >
            {['scarygary', 'chili', 'podplaylogo'].map((piece, index) => (
              <motion.div
                key={piece}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05, 
                  rotateZ: index % 2 === 0 ? 1 : -1,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                whileTap={{ 
                  scale: 0.95,
                  rotateZ: index % 2 === 0 ? -2 : 2,
                  transition: { duration: 0.1 }
                }}
              >
                <Button 
                  onClick={() => {
                    playClick();
                    setTimeout(() => {
                      onSelectPiece(piece as any);
                    }, 50);
                  }}
                  className="w-full mb-2 py-4 text-xl bg-purple-700 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {piece === 'scarygary' ? 'Scary Gary' : 
                   piece === 'chili' ? 'Chili' : 'Pod Logo'}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {menuStep === 'difficulty' && (
          <motion.div
            key="difficulty-selection"
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ 
              opacity: 0, 
              x: 50, 
              rotateY: 20,
              transition: { duration: 0.3 }
            }}
          >
            {[{name: 'easy', color: 'green'}, {name: 'medium', color: 'yellow'}, {name: 'hard', color: 'red'}].map((diff, index) => (
              <motion.div
                key={diff.name}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05, 
                  rotateZ: index % 2 === 0 ? -1 : 1,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                whileTap={{ 
                  scale: 0.95,
                  rotateZ: index % 2 === 0 ? 2 : -2,
                  transition: { duration: 0.1 }
                }}
              >
                <Button 
                  onClick={() => {
                    playClick();
                    setTimeout(() => {
                      onSelectDifficulty(diff.name as any);
                    }, 50);
                  }}
                  className={`w-full mb-2 py-4 text-xl bg-${diff.color}-600 shadow-lg hover:shadow-xl transition-shadow`}
                >
                  {diff.name.charAt(0).toUpperCase() + diff.name.slice(1)}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="flex justify-center w-full mt-4"
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          delay: 0.6, 
          type: "spring", 
          stiffness: 150, 
          damping: 12 
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button 
          onClick={() => {
            playClick();
            setTimeout(() => {
              onBack();
            }, 50);
          }}
          className="w-3/4 py-4 text-xl bg-purple-700 shadow-lg hover:shadow-xl transition-shadow"
        >
          Back
        </Button>
      </motion.div>
    </motion.div>
  );
}
