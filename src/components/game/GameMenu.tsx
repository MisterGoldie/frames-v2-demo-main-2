"use client";

import { Button } from "~/components/ui/Button";

interface GameMenuProps {
  menuStep: 'piece' | 'difficulty';
  onSelectPiece: (piece: 'scarygary' | 'chili' | 'podplaylogo') => void;
  onSelectDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onBack: () => void;
  playClick: () => void;
}

export default function GameMenu({ menuStep, onSelectPiece, onSelectDifficulty, onBack, playClick }: GameMenuProps) {
  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="text-3xl font-bold text-center text-white mb-12 text-shadow">
        {menuStep === 'piece' ? 'Select Piece' : 'Choose Difficulty'}
      </h1>

      {menuStep === 'piece' && (
        <>
          <Button 
            onClick={() => {
              playClick();
              onSelectPiece('scarygary');
            }}
            className="w-full mb-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            Scary Gary
          </Button>
          <Button 
            onClick={() => {
              playClick();
              onSelectPiece('chili');
            }}
            className="w-full mb-2"
          >
            Chili
          </Button>
          <Button 
            onClick={() => {
              playClick();
              onSelectPiece('podplaylogo');
            }}
            className="w-full mb-2"
          >
            Pod Logo
          </Button>
        </>
      )}

      {menuStep === 'difficulty' && (
        <>
          <Button 
            onClick={() => onSelectDifficulty('easy')}
            className="w-full mb-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            Easy
          </Button>
          <Button 
            onClick={() => onSelectDifficulty('medium')}
            className="w-full mb-2"
          >
            Medium
          </Button>
          <Button 
            onClick={() => onSelectDifficulty('hard')}
            className="w-full mb-2"
          >
            Hard
          </Button>
        </>
      )}

      <div className="flex justify-center w-full mt-4">
        <Button 
          onClick={() => {
            playClick();
            onBack();
          }}
          className="w-3/4"
        >
          Back
        </Button>
      </div>
    </div>
  );
}
