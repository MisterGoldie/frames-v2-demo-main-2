"use client";

import { MenuStep, PlayerPiece, Difficulty } from '../types';
import { Button } from '~/components/ui/Button';
import Image from 'next/image';

interface GameMenuProps {
  menuStep: MenuStep;
  onSelectPiece: (piece: PlayerPiece) => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onStartGame: () => void;
  selectedPiece: PlayerPiece;
  difficulty: Difficulty;
  tokenBalance: number;
}

export const GameMenu: React.FC<GameMenuProps> = ({
  menuStep,
  onSelectPiece,
  onSelectDifficulty,
  onStartGame,
  selectedPiece,
  difficulty,
  tokenBalance
}) => {
  const renderGameTypeSelection = () => (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold text-white mb-4">Select Game Type</h2>
      <Button onClick={onStartGame}>
        Play vs AI
      </Button>
      <p className="text-purple-300 text-sm">
        PvP coming soon!
      </p>
    </div>
  );

  const renderPieceSelection = () => (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold text-white mb-4">Choose Your Piece</h2>
      <div className="grid grid-cols-3 gap-4">
        {['chili', 'scarygary', 'podplaylogo'].map((piece) => (
          <button
            key={piece}
            onClick={() => onSelectPiece(piece as PlayerPiece)}
            className={`p-4 rounded-lg transition-all transform hover:scale-105 
              ${selectedPiece === piece ? 'bg-purple-600 scale-105' : 'bg-purple-800'}`}
          >
            <Image
              src={`/images/${piece}.png`}
              alt={piece}
              width={60}
              height={60}
              className="object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );

  const renderDifficultySelection = () => (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold text-white mb-4">Select Difficulty</h2>
      <div className="flex flex-col gap-3">
        {['easy', 'medium', 'hard'].map((diff) => (
          <Button
            key={diff}
            onClick={() => onSelectDifficulty(diff as Difficulty)}
            className={difficulty === diff ? 'bg-[#7C65C1]' : 'bg-purple-700'}
          >
            {diff.charAt(0).toUpperCase() + diff.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-900 p-4">
      <div className="mb-8">
        <Image
          src="/images/logo.png"
          alt="Game Logo"
          width={200}
          height={200}
          className="object-contain"
        />
      </div>
      
      {menuStep === 'game' && renderGameTypeSelection()}
      {menuStep === 'piece' && renderPieceSelection()}
      {menuStep === 'difficulty' && renderDifficultySelection()}

      <div className="mt-8">
        <p className="text-purple-300">
          Token Balance: {tokenBalance}
        </p>
      </div>
    </div>
  );
};
