"use client";

import { Button } from "~/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

interface GameMenuProps {
  menuStep: 'piece' | 'difficulty';
  onSelectPiece: (piece: 'scarygary' | 'chili' | 'podplaylogo') => void;
  onSelectDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onBack: () => void;
  playClick: () => void;
}

export default function GameMenu({ menuStep, onSelectPiece, onSelectDifficulty, onBack, playClick }: GameMenuProps) {
  return (
    <motion.div 
      className="w-full flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1 
        className="text-3xl font-bold text-center text-white mb-12 text-shadow"
        key={menuStep} // This ensures animation triggers when menuStep changes
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {menuStep === 'piece' ? 'Select Piece' : 'Choose Difficulty'}
      </motion.h1>

      <AnimatePresence mode="wait">
        {menuStep === 'piece' && (
          <motion.div
            key="piece-selection"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Button 
                onClick={() => {
                  playClick();
                  onSelectPiece('scarygary');
                }}
                className="w-full mb-2 py-4 text-xl bg-purple-700 shadow-lg hover:shadow-xl transition-shadow"
              >
                Scary Gary
              </Button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Button 
                onClick={() => {
                  playClick();
                  onSelectPiece('chili');
                }}
                className="w-full mb-2 py-4 text-xl bg-purple-700 shadow-lg hover:shadow-xl transition-shadow"
              >
                Chili
              </Button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Button 
                onClick={() => {
                  playClick();
                  onSelectPiece('podplaylogo');
                }}
                className="w-full mb-2 py-4 text-xl bg-purple-700 shadow-lg hover:shadow-xl transition-shadow"
              >
                Pod Logo
              </Button>
            </motion.div>
          </motion.div>
        )}

        {menuStep === 'difficulty' && (
          <motion.div
            key="difficulty-selection"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Button 
                onClick={() => {
                  playClick();
                  onSelectDifficulty('easy');
                }}
                className="w-full mb-2 py-4 text-xl bg-green-600 shadow-lg hover:shadow-xl transition-shadow"
              >
                Easy
              </Button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Button 
                onClick={() => {
                  playClick();
                  onSelectDifficulty('medium');
                }}
                className="w-full mb-2 py-4 text-xl bg-yellow-600 shadow-lg hover:shadow-xl transition-shadow"
              >
                Medium
              </Button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Button 
                onClick={() => {
                  playClick();
                  onSelectDifficulty('hard');
                }}
                className="w-full mb-2 py-4 text-xl bg-red-600 shadow-lg hover:shadow-xl transition-shadow"
              >
                Hard
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="flex justify-center w-full mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <Button 
          onClick={() => {
            playClick();
            onBack();
          }}
          className="w-3/4 py-4 text-xl bg-purple-700 shadow-lg hover:shadow-xl transition-shadow"
        >
          Back
        </Button>
      </motion.div>
    </motion.div>
  );
}
