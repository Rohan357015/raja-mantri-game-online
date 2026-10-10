import { create } from "zustand";
import { socket } from "../lib/socket";

const CHAT_STORAGE_PREFIX = "raja-mantri-chat";

let chatSocketInitialized = false;

const getStorageKey = (roomCode) => {
  return `${CHAT_STORAGE_PREFIX}:${roomCode?.toUpperCase()}`;
};

const readStoredMessages = (roomCode) => {
  if (!roomCode || typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem(getStorageKey(roomCode)) || "[]");
  } catch {
    return [];
  }
};

const writeStoredMessages = (roomCode, messages) => {
  if (!roomCode || typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(roomCode), JSON.stringify(messages));
};

export const useChatStore = create((set, get) => ({
  currentRoomCode: null,
  messages: [],

  initChatSocket: () => {
    if (chatSocketInitialized) return;

    socket.on("room-chat-message", (message) => {
      const roomCode = message?.roomCode?.toUpperCase();
      if (!roomCode || !message?.id) return;

      const storedMessages = readStoredMessages(roomCode);
      const alreadyStored = storedMessages.some((item) => item.id === message.id);
      const nextMessages = alreadyStored ? storedMessages : [...storedMessages, message];

      writeStoredMessages(roomCode, nextMessages);

      if (get().currentRoomCode === roomCode) {
        set({ messages: nextMessages });
      }
    });

    chatSocketInitialized = true;
  },

  loadMessages: (roomCode) => {
    const normalizedRoomCode = roomCode?.toUpperCase();
    set({
      currentRoomCode: normalizedRoomCode || null,
      messages: readStoredMessages(normalizedRoomCode)
    });
  },

  sendMessage: ({ roomCode, senderId, senderName, text }) => {
    const normalizedRoomCode = roomCode?.toUpperCase();
    const messageText = text?.trim();
    if (!normalizedRoomCode || !messageText) return;

    socket.emit("room-chat-message", {
      roomCode: normalizedRoomCode,
      senderId,
      senderName,
      text: messageText
    });
  },

  clearMessages: (roomCode) => {
    const normalizedRoomCode = roomCode?.toUpperCase();
    if (!normalizedRoomCode || typeof window === "undefined") return;

    localStorage.removeItem(getStorageKey(normalizedRoomCode));

    if (get().currentRoomCode === normalizedRoomCode) {
      set({ messages: [] });
    }
  }
}));
