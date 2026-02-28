import { axiosInstance } from "../lib/axios";
import { create } from "zustand";
import toast from "react-hot-toast";
import { socket } from "../lib/socket";

let socketInitialized = false;

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  error: null,
  roomCode: null,
  room: null,
  round: null,

  initSocket: () => {
    if (socketInitialized) return;

    socket.removeAllListeners();

    socket.on("connect", () => {
      const { roomCode, user } = get();
      if (!roomCode || !user) return;

      socket.emit("join-room", {
        roomCode,
        playerId: user.user,
        playerName: user.name
      });
    });

    socket.on("disconnect", () => {});

    socket.on("room-updated", (data) => {
      set((state) => ({
        ...state,
        room: data,
        round: data.round
      }));
    });

    socket.on("game-started", (data) => {
      set({ room: data.room, round: data.room.round });
    });

    socketInitialized = true;

    if (!socket.connected) {
      socket.connect();
    }
  },

  createRoom: async (roomData) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post("/create-room", roomData);
      const roomInfo = response.data.room;
      const hostUser = roomInfo.players[0];

      set({
        user: hostUser,
        roomCode: roomInfo.roomCode,
        room: roomInfo,
        round: roomInfo.round,
        loading: false
      });

      socket.emit("join-room", {
        roomCode: roomInfo.roomCode,
        playerId: hostUser.user,
        playerName: hostUser.name
      });

      toast.success("Room created!");
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create room";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  joinRoom: async (roomData) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post("/join-room", roomData);
      const roomInfo = response.data.room;
      const currentUser = roomInfo.players.find((player) => player.name === roomData.name);

      set({
        user: currentUser,
        roomCode: roomInfo.roomCode,
        room: roomInfo,
        round: roomInfo.round,
        loading: false
      });

      socket.emit("join-room", {
        roomCode: roomInfo.roomCode,
        playerId: currentUser?.user,
        playerName: currentUser?.name
      });

      toast.success("Joined room!");
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to join room";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  getRoom: async (roomCode) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/room/${roomCode}`);

      set({
        room: response.data.room,
        roomCode: response.data.room.roomCode,
        round: response.data.room.round,
        loading: false
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to get room";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  startGame: async (roomCode, userId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post("/start-game", { roomCode, userId });
      const updatedRoom = response.data.room;

      set({
        room: updatedRoom,
        loading: false
      });

      socket.emit("create-game", updatedRoom);

      toast.success("Game started!");
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to start game";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  updateScores: async (roomCode, scores) => {
    try {
      const response = await axiosInstance.post(`/room/${roomCode}/update-scores`, { scores });
      set({ room: response.data.room });
      return response.data.room;
    } catch (error) {
      toast.error("Failed to update scores");
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  clearRoom: () => {
    const { roomCode } = get();
    if (roomCode) {
      socket.emit("leave-room", roomCode);
    }
    set({ room: null, roomCode: null, user: null });
  }
}));
