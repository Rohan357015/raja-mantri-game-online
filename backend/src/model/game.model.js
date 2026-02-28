import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  name: String,
  role: {
    type: String,
    enum: ["raja", "mantri", "chor", "sipahi"],
    default: null,
  },
  points: {
    type: Number,
    default: 0,
  },
});

const cardSchema = new mongoose.Schema({
  playerId: String, // frontend player id
  role: String,
  isRevealed: {
    type: Boolean,
    default: false,
  },
});

const guessSchema = new mongoose.Schema({
  guessedPlayer: String,
  isCorrect: Boolean,
  timestamp: Date,
});

const roundResultSchema = new mongoose.Schema({
  round: Number,
  results: [
    {
      playerName: String,
      role: String,
      points: Number,
      totalPoints: Number,
    },
  ],
});

const gameSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },

    phase: {
      type: String,
      enum: [
        "waiting",
        "role-assignment",
        "card-distribution",
        "guessing",
        "reveal",
        "scoring",
        "round-complete",
        "game-finished",
      ],
      default: "waiting",
    },

    currentRound: {
      type: Number,
      default: 1,
    },

    totalRounds: {
      type: Number,
      default: 5,
    },

    players: [playerSchema],

    cards: [cardSchema],

    sipahiGuess: guessSchema,

    roundResults: [roundResultSchema],

    gameStarted: {
      type: Boolean,
      default: false,
    },

    startedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Game", gameSchema);
