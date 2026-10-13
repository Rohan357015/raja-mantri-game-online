import express from "express";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./lib/db.js";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import gameRoutes from "./routes/game.route.js";
import cors from "cors";
import Game from "./model/game.model.js";

// Load environment variables from .env before reading process.env values.
dotenv.config();

// Express handles REST APIs. The HTTP server is shared with Socket.IO.
const app = express();
const server = http.createServer(app);

const normalizeOrigin = (origin) => origin?.trim().replace(/\/+$/, "");

// Only allow known frontend origins. CORS_ORIGINS may be comma-separated.
const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "https://raja-mantri-game-online-2rug.vercel.app",
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS || "").split(",")
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
);

const isAllowedOrigin = (origin) => !origin || allowedOrigins.has(normalizeOrigin(origin));

const corsOriginHandler = (origin, callback) => {
  if (isAllowedOrigin(origin)) return callback(null, true);

  console.warn(`Blocked CORS origin: ${origin}`);
  return callback(new Error("CORS origin not allowed"), false);
};

// Socket.IO server for realtime room/game updates.
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Fixed score values for each role in a round.
const BASE_ROLE_POINTS = {
  raja: 1000,
  mantri: 800,
  chor: 0,
  sipahi: 500
};

// Final title labels are assigned according to total score rank.
const ROLE_ORDER_LABELS = ["King", "Mantri", "Sipahi", "Chor"];

// Raja Mantri Chor Sipahi needs exactly four players.
const ROOM_PLAYER_COUNT = 4;

// Chat messages are broadcast only; they are not stored in MongoDB.
const CHAT_MESSAGE_MAX_LENGTH = 500;

// In-memory map of socket.id -> player metadata.
// This helps send each player a personalized game state.
const socketMeta = new Map();

// Fisher-Yates shuffle used for assigning roles randomly each round.
const shuffleArray = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Game players may store their id as `user` or `_id`; normalize both to string.
const resolvePlayerId = (player) => {
  if (player.user) return player.user.toString();
  if (player._id) return player._id.toString();
  return "";
};

// Assign fresh roles, rebuild cards, and reset the guess for a new round.
const assignRoundRoles = (game) => {
  const roles = shuffleArray(["raja", "mantri", "chor", "sipahi"]);

  // Store the assigned role on each player in the game document.
  game.players.forEach((player, index) => {
    player.role = roles[index];
  });

  // Build card data shown to the frontend.
  // Raja and Sipahi are visible immediately; Mantri and Chor stay hidden.
  game.cards = game.players.map((player) => ({
    playerId: resolvePlayerId(player),
    role: player.role,
    isRevealed: player.role === "raja" || player.role === "sipahi"
  }));

  game.phase = "card-distribution";
  game.sipahiGuess = null;
};

// Build final leaderboard titles after all rounds are finished.
const buildFinalRanks = (players) => {
  return [...players]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .map((player, index) => ({
      playerId: resolvePlayerId(player),
      playerName: player.name,
      points: player.points || 0,
      title: ROLE_ORDER_LABELS[index] || `Rank ${index + 1}`
    }));
};

// Create the game payload for one specific viewer.
// This prevents hidden roles from being visible to players who should not see them yet.
const serializeGameForPlayer = (game, viewerPlayerId) => {
  // Once reveal/scoring/final phases begin, every role can be shown.
  const revealAll =
    game.phase === "reveal" ||
    game.phase === "scoring" ||
    game.phase === "round-complete" ||
    game.phase === "game-finished";

  // Fast lookup: playerId -> card.
  const cardsByPlayer = new Map(
    (game.cards || []).map((card) => [card.playerId?.toString(), card])
  );

  // Build player list with role visibility based on the current viewer.
  const players = game.players.map((player) => {
    const playerId = resolvePlayerId(player);
    const card = cardsByPlayer.get(playerId);
    const role = card?.role || player.role || null;
    const isOwnCard = viewerPlayerId && viewerPlayerId === playerId;
    const roleVisible = revealAll || role === "raja" || role === "sipahi" || isOwnCard;

    return {
      _id: playerId,
      name: player.name,
      points: player.points || 0,
      role: roleVisible ? role : null,
      roleVisible,
      isOwnCard
    };
  });

  // Build card list for the UI, hiding role values until they are visible.
  const cards = players.map((player) => {
    const card = cardsByPlayer.get(player._id);
    const role = card?.role || null;
    const isRevealed = player.roleVisible;
    const isGuessable = !revealAll && role !== "raja" && role !== "sipahi";

    return {
      playerId: player._id,
      playerName: player.name,
      role: isRevealed ? role : null,
      actualRole: role,
      isRevealed,
      isGuessable
    };
  });

  // Only the Sipahi gets permission to guess during card-distribution.
  const sipahiPlayer = game.players.find((player) => player.role === "sipahi");
  const sipahiPlayerId = sipahiPlayer ? resolvePlayerId(sipahiPlayer) : null;
  const canCurrentPlayerGuess =
    game.phase === "card-distribution" &&
    !game.sipahiGuess &&
    viewerPlayerId &&
    viewerPlayerId === sipahiPlayerId;

  return {
    _id: game._id,
    roomCode: game.roomCode,
    phase: game.phase,
    currentRound: game.currentRound,
    totalRounds: game.totalRounds,
    players,
    cards,
    sipahiGuess: game.sipahiGuess || null,
    roundResults: game.roundResults || [],
    canCurrentPlayerGuess: Boolean(canCurrentPlayerGuess),
    sipahiPlayerId,
    finalRanks: game.phase === "game-finished" ? buildFinalRanks(game.players) : []
  };
};

// Send the latest game state to every socket in the room.
// Each socket receives a personalized payload based on its player id.
const emitGameState = async (roomCode) => {
  const normalizedRoomCode = roomCode.toUpperCase();
  const game = await Game.findOne({ roomCode: normalizedRoomCode });
  if (!game) return;

  // fetchSockets lets the server inspect all connected clients in this room.
  const sockets = await io.in(normalizedRoomCode).fetchSockets();
  for (const roomSocket of sockets) {
    const metadata = socketMeta.get(roomSocket.id);
    const payload = serializeGameForPlayer(game, metadata?.playerId || null);
    roomSocket.emit("game-state-updated", payload);
  }
};

// Register all realtime socket behavior for each connected browser.
io.on("connection", (socket) => {
  // A client joins a Socket.IO room so it can receive updates for one game room.
  socket.on("join-room", async (payload) => {
    const roomCode = typeof payload === "string" ? payload : payload?.roomCode;
    if (!roomCode) return;

    const upperRoomCode = roomCode.toUpperCase();
    socket.join(upperRoomCode);

    // Save this socket's player information for personalized card visibility.
    socketMeta.set(socket.id, {
      roomCode: upperRoomCode,
      playerId: payload?.playerId ? String(payload.playerId) : null,
      playerName: payload?.playerName || null
    });

    await emitGameState(upperRoomCode);
  });

  // Leave the Socket.IO room and forget this socket's player metadata.
  socket.on("leave-room", (roomCode) => {
    if (!roomCode) return;
    socket.leave(roomCode.toUpperCase());
    socketMeta.delete(socket.id);
  });

  // Broadcast a chat message to everyone in the same Socket.IO room.
  // The client stores received chat messages in localStorage.
  socket.on("room-chat-message", (payload) => {
    const roomCode = payload?.roomCode?.toUpperCase();
    const text = payload?.text?.trim();

    if (!roomCode || !text) return;

    const chatMessage = {
      id: `${Date.now()}-${socket.id}`,
      roomCode,
      senderId: payload?.senderId ? String(payload.senderId) : socket.id,
      senderName: payload?.senderName?.trim() || "Player",
      text: text.slice(0, CHAT_MESSAGE_MAX_LENGTH),
      createdAt: new Date().toISOString()
    };

    io.to(roomCode).emit("room-chat-message", chatMessage);
  });

  // Create the Game document after the lobby room has been started.
  socket.on("create-game", async (room) => {
    try {
      if (!room?.roomCode) return;
      const normalizedRoomCode = room.roomCode.toUpperCase();

      // If the game already exists, just send the current state back.
      const existingGame = await Game.findOne({ roomCode: normalizedRoomCode });
      if (existingGame) {
        await emitGameState(normalizedRoomCode);
        return;
      }

      if (!room.players || room.players.length !== ROOM_PLAYER_COUNT) {
        socket.emit("game-error", {
          message: "Exactly 4 players are required to start Raja Mantri game."
        });
        return;
      }

      // Create a fresh game from the room's player list.
      const newGame = new Game({
        roomCode: normalizedRoomCode,
        players: room.players.map((player) => ({
          user: player.user,
          name: player.name,
          points: 0,
          role: null
        })),
        phase: "card-distribution",
        currentRound: 1,
        totalRounds: room.round,
        gameStarted: true,
        startedAt: new Date()
      });

      // First round starts immediately after game creation.
      assignRoundRoles(newGame);
      await newGame.save();
      await emitGameState(normalizedRoomCode);
    } catch (error) {
      socket.emit("game-error", { message: "Unable to create game." });
      console.error(error);
    }
  });

  // Reassign roles for the current round. This is available as a socket action.
  socket.on("assign-roles", async (roomCode) => {
    try {
      if (!roomCode) return;
      const normalizedRoomCode = roomCode.toUpperCase();
      const game = await Game.findOne({ roomCode: normalizedRoomCode });
      if (!game) return;

      assignRoundRoles(game);
      await game.save();
      await emitGameState(normalizedRoomCode);
    } catch (error) {
      socket.emit("game-error", { message: "Unable to assign roles." });
      console.error(error);
    }
  });

  // Sipahi guesses which hidden card belongs to Chor.
  socket.on("make-guess", async ({ roomCode, guessedPlayerId, guessByPlayerId }) => {
    try {
      if (!roomCode || !guessedPlayerId || !guessByPlayerId) return;
      const normalizedRoomCode = roomCode.toUpperCase();
      const game = await Game.findOne({ roomCode: normalizedRoomCode });
      if (!game) return;

      // Only one guess is allowed while the round is in card-distribution.
      if (game.phase !== "card-distribution" || game.sipahiGuess) {
        socket.emit("game-error", { message: "Guess already made for this round." });
        return;
      }

      // Confirm the player making the guess is actually Sipahi.
      const sipahiPlayer = game.players.find((player) => player.role === "sipahi");
      const sipahiPlayerId = sipahiPlayer ? resolvePlayerId(sipahiPlayer) : null;
      if (!sipahiPlayerId || String(guessByPlayerId) !== sipahiPlayerId) {
        socket.emit("game-error", { message: "Only Sipahi can make the guess." });
        return;
      }

      // Find Chor and compare with the guessed player id.
      const chorPlayer = game.players.find((player) => player.role === "chor");
      if (!chorPlayer) {
        socket.emit("game-error", { message: "Chor is not assigned." });
        return;
      }

      const isCorrect = resolvePlayerId(chorPlayer) === String(guessedPlayerId);
      game.sipahiGuess = {
        guessedPlayer: String(guessedPlayerId),
        isCorrect,
        timestamp: new Date()
      };

      // Reveal every card after Sipahi makes the guess.
      game.cards = game.cards.map((card) => ({
        ...card.toObject(),
        isRevealed: true
      }));

      // Move the UI into the reveal phase.
      game.phase = "reveal";
      await game.save();
      await emitGameState(normalizedRoomCode);
    } catch (error) {
      socket.emit("game-error", { message: "Unable to process guess." });
      console.error(error);
    }
  });

  // Host calculates and stores points after the guess is revealed.
  socket.on("calculate-scores", async (roomCode) => {
    try {
      if (!roomCode) return;
      const normalizedRoomCode = roomCode.toUpperCase();
      const game = await Game.findOne({ roomCode: normalizedRoomCode });
      if (!game) return;

      if (!game.sipahiGuess) {
        socket.emit("game-error", { message: "Sipahi guess is not complete yet." });
        return;
      }

      // Add base role points to each player's total.
      const players = game.players;
      const isCorrect = game.sipahiGuess.isCorrect;

      players.forEach((player) => {
        player.points = (player.points || 0) + (BASE_ROLE_POINTS[player.role] || 0);
      });

      // If Sipahi guessed wrong, transfer Sipahi points to Chor.
      if (!isCorrect) {
        const sipahiPlayer = players.find((player) => player.role === "sipahi");
        const chorPlayer = players.find((player) => player.role === "chor");

        if (sipahiPlayer && chorPlayer) {
          const transfer = BASE_ROLE_POINTS.sipahi;
          sipahiPlayer.points -= transfer;
          chorPlayer.points += transfer;
        }
      }

      // Save this round's score summary for the frontend.
      const roundResult = players.map((player) => ({
        playerName: player.name,
        role: player.role,
        points: BASE_ROLE_POINTS[player.role] || 0,
        totalPoints: player.points
      }));

      game.roundResults.push({
        round: game.currentRound,
        results: roundResult
      });

      // Finish the whole game after the final round; otherwise wait for next round.
      if (game.currentRound >= game.totalRounds) {
        game.phase = "game-finished";
      } else {
        game.phase = "round-complete";
      }

      await game.save();
      await emitGameState(normalizedRoomCode);
    } catch (error) {
      socket.emit("game-error", { message: "Unable to calculate score." });
      console.error(error);
    }
  });

  // Host starts the next round after scores for the current round are complete.
  socket.on("next-round", async ({ roomCode }) => {
    try {
      const normalizedRoomCode = roomCode?.toUpperCase();
      if (!normalizedRoomCode) return;
      const game = await Game.findOne({ roomCode: normalizedRoomCode });
      if (!game) return;

      if (game.phase !== "round-complete") {
        socket.emit("game-error", { message: "Current round is not complete yet." });
        return;
      }

      // Move round counter forward and assign a new set of roles.
      game.currentRound += 1;
      assignRoundRoles(game);
      await game.save();
      await emitGameState(normalizedRoomCode);
    } catch (error) {
      socket.emit("game-error", { message: "Unable to start next round." });
      console.error(error);
    }
  });

  // Host starts another full game in the same room after the previous game ends.
  socket.on("play-again", async ({ roomCode }) => {
    try {
      const normalizedRoomCode = roomCode?.toUpperCase();
      if (!normalizedRoomCode) return;
      const game = await Game.findOne({ roomCode: normalizedRoomCode });
      if (!game) return;

      if (game.phase !== "game-finished") {
        socket.emit("game-error", { message: "Game is not finished yet." });
        return;
      }

      // Reset player totals and game history while keeping the same room and players.
      game.players.forEach((player) => {
        player.points = 0;
        player.role = null;
      });
      game.currentRound = 1;
      game.roundResults = [];
      game.sipahiGuess = null;
      game.gameStarted = true;
      game.startedAt = new Date();

      // Start the first round of the new game immediately.
      assignRoundRoles(game);
      await game.save();
      await emitGameState(normalizedRoomCode);
    } catch (error) {
      socket.emit("game-error", { message: "Unable to start another game." });
      console.error(error);
    }
  });

  // Clean up metadata when the browser disconnects.
  socket.on("disconnect", () => {
    socketMeta.delete(socket.id);
  });
});

// Make Socket.IO accessible inside REST controllers through req.app.get("io").
app.set("io", io);

// Start the MongoDB connection during cold start. Mongoose will reuse this
// connection between requests while the Vercel Function instance is warm.
connectDB().catch(() => {
  // The connection error is logged in connectDB; route handlers will fail if
  // MongoDB remains unavailable.
});

// Express CORS middleware for REST API requests.
app.use(
  cors({
    origin: corsOriginHandler,
    credentials: true
  })
);

// Parse JSON request bodies for REST API routes.
app.use(express.json());

// REST routes for room/lobby actions and older game API endpoints.
app.use("/api", authRoutes);
app.use("/api/game", gameRoutes);

// Simple health check route.
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start the HTTP + Socket.IO server locally. On Vercel, the exported server is
// hosted as a Function and Vercel owns the listener.
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default server;
