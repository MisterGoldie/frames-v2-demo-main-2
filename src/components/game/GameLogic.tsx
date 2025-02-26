"use client";

import { Square, PlayerPiece, Difficulty } from '~/types/game';

export class GameLogic {
  static calculateWinner(squares: Square[]): Square {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }

  static getComputerMove(currentBoard: Square[], difficulty: Difficulty, selectedPiece: PlayerPiece): number {
    const availableSpots = currentBoard
      .map((spot, index) => spot === null ? index : null)
      .filter((spot): spot is number => spot !== null);

    if (difficulty === 'easy') {
      return this.getEasyMove(currentBoard, availableSpots, selectedPiece);
    }

    if (difficulty === 'medium') {
      return this.getMediumMove(currentBoard, availableSpots, selectedPiece);
    }

    return this.getHardMove(currentBoard, availableSpots, selectedPiece);
  }

  private static getEasyMove(board: Square[], availableSpots: number[], selectedPiece: PlayerPiece): number {
    // Easy Mode - 30% strategic, 70% random
    if (Math.random() < 0.3) {
      const strategicMove = this.getStrategicMove(board, availableSpots, selectedPiece);
      if (strategicMove !== -1) return strategicMove;
    }

    // Take center if available (30% chance)
    if (availableSpots.includes(4) && Math.random() < 0.3) return 4;
    
    // Otherwise random move
    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
  }

  private static getMediumMove(board: Square[], availableSpots: number[], selectedPiece: PlayerPiece): number {
    // Medium Mode - 70% strategic, 30% random
    if (Math.random() < 0.7) {
      const strategicMove = this.getStrategicMove(board, availableSpots, selectedPiece);
      if (strategicMove !== -1) return strategicMove;
      
      // Take center if available
      if (availableSpots.includes(4)) return 4;
      
      // Take corners if available
      const corners = [0, 2, 6, 8].filter(corner => availableSpots.includes(corner));
      if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)];
      }
    }
    
    // Random move for remaining cases
    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
  }

  private static getHardMove(board: Square[], availableSpots: number[], selectedPiece: PlayerPiece): number {
    const strategicMove = this.getStrategicMove(board, availableSpots, selectedPiece);
    if (strategicMove !== -1) return strategicMove;

    // Take center if available
    if (availableSpots.includes(4)) return 4;
    
    // Take corners if available
    const corners = [0, 2, 6, 8].filter(corner => availableSpots.includes(corner));
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }
    
    // Random move as last resort
    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
  }

  private static getStrategicMove(board: Square[], availableSpots: number[], selectedPiece: PlayerPiece): number {
    // Try to win first
    for (const spot of availableSpots) {
      const boardCopy = [...board];
      boardCopy[spot] = 'X';
      if (this.calculateWinner(boardCopy) === 'X') {
        return spot;
      }
    }

    // Block player from winning
    for (const spot of availableSpots) {
      const boardCopy = [...board];
      boardCopy[spot] = selectedPiece;
      if (this.calculateWinner(boardCopy) === selectedPiece) {
        return spot;
      }
    }

    return -1;
  }
}
