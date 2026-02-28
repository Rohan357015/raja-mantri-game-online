import { create } from "zustand";
import toast from "react-hot-toast";
import { socket } from "../lib/socket";

let gameSocketInitialized = false;

export const useGameStore = create((set, get) => ({
  game: null,
  loading: false,

  initGameSocket: () => {
    if (gameSocketInitialized) return;

    socket.on("game-state-updated", (gameData) => {
      set({ game: gameData, loading: false });
    });

    socket.on("game-error", (error) => {
      if (error?.message) toast.error(error.message);
      set({ loading: false });
    });

    gameSocketInitialized = true;
  },

  assignRoles: async (roomCode) => {
    try {
      set({ loading: true });
      socket.emit("assign-roles", roomCode);
    } catch {
      toast.error("Failed to assign roles");
      set({ loading: false });
    }
  },

  makeGuess: async (roomCode, guessedPlayerId, guessByPlayerId) => {
    try {
      set({ loading: true });
      socket.emit("make-guess", { roomCode, guessedPlayerId, guessByPlayerId });
    } catch {
      toast.error("Guess failed");
      set({ loading: false });
    }
  },

  calculateScores: async (roomCode) => {
    try {
      set({ loading: true });
      socket.emit("calculate-scores", roomCode);
    } catch {
      toast.error("Score calculation failed");
      set({ loading: false });
    }
  },

  nextRound: async (roomCode) => {
    try {
      set({ loading: true });
      socket.emit("next-round", { roomCode });
    } catch {
      toast.error("Unable to start next round");
      set({ loading: false });
    }
  },

  getCurrentPlayerRole: (userId) => {
    const game = get().game;
    if (!game || !userId) return null;
    return game.players.find((player) => player._id === userId)?.role || null;
  },

  getLeaderboard: () => {
    const game = get().game;
    if (!game) return [];

    return [...(game.players || [])]
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));
  }
}));
