import express from "express";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./lib/db.js";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import gameRoutes from "./routes/game.route.js";
import cors from "cors";
import Game from "./model/game.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST"]
  }
});

const BASE_ROLE_POINTS = {
  raja: 1000,
  mantri: 800,
  chor: 0,
  sipahi: 500
};

const ROLE_ORDER_LABELS = ["King", "Mantri", "Sipahi", "Chor"];
const ROOM_PLAYER_COUNT = 4;
const socketMeta = new Map();

const shuffleArray = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const resolvePlayerId = (player) => {
  if (player.user) return player.user.toString();
  if (player._id) return player._id.toString();
  return "";
};

const assignRoundRoles = (game) => {
  const roles = shuffleArray(["raja", "mantri", "chor", "sipahi"]);

  game.players.forEach((player, index) => {
    player.role = roles[index];
  });

  game.cards = game.players.map((player) => ({
    playerId: resolvePlayerId(player),
    role: player.role,
    isRevealed: player.role === "raja" || player.role === "sipahi"
  }));

  game.phase = "card-distribution";
  game.sipahiGuess = null;
};

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

const serializeGameForPlayer = (game, viewerPlayerId) => {
  const revealAll =
    game.phase === "reveal" ||
    game.phase === "scoring" ||
    game.phase === "round-complete" ||
    game.phase === "game-finished";

  const cardsByPlayer = new Map(
    (game.cards || []).map((card) => [card.playerId?.toString(), card])
  );

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

const emitGameState = async (roomCode) => {
  const normalizedRoomCode = roomCode.toUpperCase();
  const game = await Game.findOne({ roomCode: normalizedRoomCode });
  if (!game) return;

  const sockets = await io.in(normalizedRoomCode).fetchSockets();
  for (const roomSocket of sockets) {
    const metadata = socketMeta.get(roomSocket.id);
    const payload = serializeGameForPlayer(game, metadata?.playerId || null);
    roomSocket.emit("game-state-updated", payload);
  }
};

io.on("connection", (socket) => {
  socket.on("join-room", async (payload) => {
    const roomCode = typeof payload === "string" ? payload : payload?.roomCode;
    if (!roomCode) return;

    const upperRoomCode = roomCode.toUpperCase();
    socket.join(upperRoomCode);
    socketMeta.set(socket.id, {
      roomCode: upperRoomCode,
      playerId: payload?.playerId ? String(payload.playerId) : null,
      playerName: payload?.playerName || null
    });

    await emitGameState(upperRoomCode);
  });

  socket.on("leave-room", (roomCode) => {
    if (!roomCode) return;
    socket.leave(roomCode.toUpperCase());
    socketMeta.delete(socket.id);
  });

  socket.on("create-game", async (room) => {
    try {
      if (!room?.roomCode) return;
      const normalizedRoomCode = room.roomCode.toUpperCase();

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

      assignRoundRoles(newGame);
      await newGame.save();
      await emitGameState(normalizedRoomCode);
    } catch (error) {
      socket.emit("game-error", { message: "Unable to create game." });
      console.error(error);
    }
  });

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

  socket.on("make-guess", async ({ roomCode, guessedPlayerId, guessByPlayerId }) => {
    try {
      if (!roomCode || !guessedPlayerId || !guessByPlayerId) return;
      const normalizedRoomCode = roomCode.toUpperCase();
      const game = await Game.findOne({ roomCode: normalizedRoomCode });
      if (!game) return;

      if (game.phase !== "card-distribution" || game.sipahiGuess) {
        socket.emit("game-error", { message: "Guess already made for this round." });
        return;
      }

      const sipahiPlayer = game.players.find((player) => player.role === "sipahi");
      const sipahiPlayerId = sipahiPlayer ? resolvePlayerId(sipahiPlayer) : null;
      if (!sipahiPlayerId || String(guessByPlayerId) !== sipahiPlayerId) {
        socket.emit("game-error", { message: "Only Sipahi can make the guess." });
        return;
      }

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

      game.cards = game.cards.map((card) => ({
        ...card.toObject(),
        isRevealed: true
      }));

      game.phase = "reveal";
      await game.save();
      await emitGameState(normalizedRoomCode);
    } catch (error) {
      socket.emit("game-error", { message: "Unable to process guess." });
      console.error(error);
    }
  });

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

      const players = game.players;
      const isCorrect = game.sipahiGuess.isCorrect;

      players.forEach((player) => {
        player.points = (player.points || 0) + (BASE_ROLE_POINTS[player.role] || 0);
      });

      if (!isCorrect) {
        const sipahiPlayer = players.find((player) => player.role === "sipahi");
        const chorPlayer = players.find((player) => player.role === "chor");

        if (sipahiPlayer && chorPlayer) {
          const transfer = BASE_ROLE_POINTS.sipahi;
          sipahiPlayer.points -= transfer;
          chorPlayer.points += transfer;
        }
      }

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

      game.currentRound += 1;
      assignRoundRoles(game);
      await game.save();
      await emitGameState(normalizedRoomCode);
    } catch (error) {
      socket.emit("game-error", { message: "Unable to start next round." });
      console.error(error);
    }
  });

  socket.on("disconnect", () => {
    socketMeta.delete(socket.id);
  });
});

app.set("io", io);

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"), false);
    },
    credentials: true
  })
);

app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/game", gameRoutes);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  connectDB();
});
