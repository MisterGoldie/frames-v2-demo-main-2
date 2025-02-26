export type PlayerPiece = 'scarygary' | 'chili' | 'podplaylogo';
export type Square = 'X' | PlayerPiece | null;
export type Board = Square[];
export type GameState = 'menu' | 'game';
export type MenuStep = 'game' | 'piece' | 'difficulty';
export type Difficulty = 'easy' | 'medium' | 'hard';
