export type GameState = {
  board: (string | null)[];
  gameState: 'menu' | 'game' | 'leaderboard';
  difficulty: 'easy' | 'medium' | 'hard' | null;
  isXNext: boolean;
  score: number;
  timeLeft: number;
};

type GameAction = 
  | { type: 'MAKE_MOVE'; position: number; value: string }
  | { type: 'SET_DIFFICULTY'; difficulty: GameState['difficulty'] }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_TIMER'; time: number }
  | { type: 'SET_GAME_STATE'; state: GameState['gameState'] };

export const initialState: GameState = {
  board: Array(9).fill(null),
  gameState: 'menu',
  difficulty: null,
  isXNext: true,
  score: 0,
  timeLeft: 15
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MAKE_MOVE':
      const newBoard = [...state.board];
      newBoard[action.position] = action.value;
      return {
        ...state,
        board: newBoard,
        isXNext: !state.isXNext
      };
    
    case 'SET_DIFFICULTY':
      return {
        ...state,
        difficulty: action.difficulty
      };
    
    case 'RESET_GAME':
      return {
        ...initialState,
        score: state.score
      };
    
    case 'UPDATE_TIMER':
      return {
        ...state,
        timeLeft: action.time
      };
    
    case 'SET_GAME_STATE':
      return {
        ...state,
        gameState: action.state
      };
    
    default:
      return state;
  }
} 