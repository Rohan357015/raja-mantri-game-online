// CLIENT SIDE: store/auth.store.js
import { axiosInstance } from "../lib/axios";
import { create } from "zustand";
import toast from "react-hot-toast";
import { socket } from "../lib/socket";

let socketInitialized = false; // Global flag outside Zustand

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  error: null,
  roomCode: null,
  room: null,
  round: null,

  initSocket: () => {
    // Use global flag to prevent multiple initializations
    if (socketInitialized) {
      console.log('Socket already initialized');
      return;
    }

    console.log('🔄 Initializing socket...');

    // Remove all existing listeners first
    socket.removeAllListeners();

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      
      // Rejoin room if user was in one
      const { roomCode } = get();
      if (roomCode) {
        console.log(`🔄 Rejoining room: ${roomCode}`);
        socket.emit("join-room", roomCode);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("room-updated", (data) => {
      console.log("📨 ROOM UPDATED EVENT RECEIVED:", data);
      console.log("👥 Players:", data.players);
      
      // Update the room state
      set((state) => ({
        ...state,
        room: data,
        round: data.round
      }));
      
      console.log("✅ Room state updated in store");
    });

    socket.on("game-started", (data) => {
      console.log("📨 GAME STARTED EVENT:", data);
      set({ room: data.room, round: data.room.round });
    });

    // Mark as initialized globally
    socketInitialized = true;

    // Connect the socket
    if (!socket.connected) {
      console.log('🔌 Connecting socket...');
      socket.connect();
    }
  },

  createRoom: async (roomData) => {
    set({ loading: true, error: null });
    try {
      console.log('🏗️ Creating room...');
      const response = await axiosInstance.post("/create-room", roomData);
      
      const roomInfo = response.data.room;
      console.log('✅ Room created:', roomInfo.roomCode);

      set({
        user: roomInfo.players[0],
        roomCode: roomInfo.roomCode,
        room: roomInfo,
        round: roomInfo.round,
        loading: false
      });
      
      // Join socket room
      console.log(`🔌 Joining socket room: ${roomInfo.roomCode}`);
      socket.emit("join-room", roomInfo.roomCode);

      toast.success("Room created!");
      return response.data;

    } catch (error) {
      console.error('❌ Create room error:', error);
      const errorMessage = error.response?.data?.message || "Failed to create room";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  joinRoom: async (roomData) => {
    set({ loading: true, error: null });
    try {
      console.log('🚪 Joining room:', roomData.roomCode);
      const response = await axiosInstance.post("/join-room", roomData);
      
      const roomInfo = response.data.room;
      console.log('✅ Joined room:', roomInfo.roomCode);
      console.log('👥 Total players:', roomInfo.players.length);

      const currentUser = roomInfo.players.find(p => p.name === roomData.name);

      set({
        user: currentUser,
        roomCode: roomInfo.roomCode,
        room: roomInfo,
        round: roomInfo.round,
        loading: false
      });
      
      // Join socket room
      console.log(`🔌 Joining socket room: ${roomInfo.roomCode}`);
      socket.emit("join-room", roomInfo.roomCode);

      toast.success("Joined room!");
      return response.data;

    } catch (error) {
      console.error('❌ Join room error:', error);
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
      
      set({
        room: response.data.room,
        loading: false
      });

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