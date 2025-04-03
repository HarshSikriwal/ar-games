import { create } from "zustand";

interface GameState {
  score: number;
  isPlaying: boolean;
  incrementScore: () => void;
  startGame: () => void;
  endGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  isPlaying: false,
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  startGame: () => set({ isPlaying: true, score: 0 }),
  endGame: () => set({ isPlaying: false }),
}));
