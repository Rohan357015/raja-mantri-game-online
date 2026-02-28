import Game from '../model/game.model.js';
import User from '../model/user.model.js';


export const assignRoles = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const game = await Game.findOne({
      roomCode: roomCode.toUpperCase(),
    });

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    //  ROLES LIST
    const roles = ["raja", "mantri", "chor", "sipahi"];

    //  RANDOM SHUFFLE
    const shuffledRoles = roles.sort(() => Math.random() - 0.5);

    //  ASSIGN ROLES TO PLAYERS
    const updatedPlayers = game.players.map((player, index) => ({
      ...player.toObject(),
      role: shuffledRoles[index],
    }));

    // 🔥 CREATE CARDS
    const cards = updatedPlayers.map((player) => ({
      playerId: player._id.toString(),
      role: player.role,
      isRevealed:
        player.role === "raja" || player.role === "mantri",
    }));

    // 🔥 UPDATE GAME STATE
    game.players = updatedPlayers;
    game.cards = cards;
    game.phase = "card-distribution";
    game.sipahiGuess = null;

    await game.save();

    const updatedGame = await Game.findOne({
      roomCode: roomCode.toUpperCase()
    });

    io.to(roomCode.toUpperCase()).emit("game-state-updated", updatedGame);


    res.json({
      message: "Roles assigned successfully",
      game,
    });
  } catch (error) {
    console.error("Assign roles error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const makeGuess = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { guessedPlayerId } = req.body;

    const game = await Game.findOne({
      roomCode: roomCode.toUpperCase(),
    });

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // 🔥 Find chor player from backend state
    const chorPlayer = game.players.find(
      (p) => p.role === "chor"
    );

    if (!chorPlayer) {
      return res.status(400).json({ message: "Chor not assigned yet" });
    }

    // 🔥 Check guess
    const isCorrect =
      chorPlayer._id.toString() === guessedPlayerId;

    // 🔥 Save guess result
    game.sipahiGuess = {
      guessedPlayer: guessedPlayerId,
      isCorrect,
      timestamp: new Date(),
    };

    // 🔥 Reveal all cards after guess
    game.cards = game.cards.map((card) => ({
      ...card.toObject(),
      isRevealed: true,
    }));

    // 🔥 Move game to reveal phase
    game.phase = "reveal";

    await game.save();

    res.json({
      message: "Guess processed",
      game,
    });
  } catch (error) {
    console.error("Make guess error:", error);
    res.status(500).json({ message: error.message });
  }
};


export const calculateScores = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const game = await Game.findOne({
      roomCode: roomCode.toUpperCase(),
    });

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (!game.sipahiGuess) {
      return res.status(400).json({ message: "Guess not made yet" });
    }

    // 🔥 ROLE POINTS (RULES → NOT DB DATA)
    const rolePoints = {
      raja: 1000,
      mantri: 800,
      chor: 0,
      sipahi: 500,
    };

    const players = game.players;
    const isCorrect = game.sipahiGuess.isCorrect;

    // ================= ADD BASE POINTS =================
    players.forEach((player) => {
      player.points += rolePoints[player.role] || 0;
    });

    // ================= WRONG GUESS → SWAP TOTAL POINTS =================
    if (!isCorrect) {
      const sipahiPlayer = players.find((p) => p.role === "sipahi");
      const chorPlayer = players.find((p) => p.role === "chor");

      if (sipahiPlayer && chorPlayer) {
        const tempPoints = sipahiPlayer.points;
        sipahiPlayer.points = chorPlayer.points;
        chorPlayer.points = tempPoints;
      }
    }

    // ================= SAVE ROUND RESULT =================
    const roundResult = players.map((player) => ({
      playerName: player.name,
      role: player.role,
      points: rolePoints[player.role] || 0,
      totalPoints: player.points,
    }));

    game.roundResults.push({
      round: game.currentRound,
      results: roundResult,
    });

    // 🔥 MOVE TO SCORING PHASE
    game.phase = "scoring";

    await game.save();

    res.json({
      message: "Scores calculated successfully",
      game,
    });
  } catch (error) {
    console.error("Calculate score error:", error);
    res.status(500).json({ message: error.message });
  }
};
