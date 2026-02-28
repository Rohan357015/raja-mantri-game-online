import React, { useEffect } from "react";
import { useGameStore } from "../store/game.store";
import { useAuthStore } from "../store/auth.store";
import "./styles/gamepage.css";

const ROLE_META = {
  raja: { label: "Raja", icon: "👑" },
  mantri: { label: "Mantri", icon: "🪶" },
  chor: { label: "Chor", icon: "🗡️" },
  sipahi: { label: "Sipahi", icon: "🛡️" }
};

const GamePlay = () => {
  const { roomCode, room, user, initSocket } = useAuthStore();
  const {
    game,
    loading,
    initGameSocket,
    makeGuess,
    calculateScores,
    nextRound,
    getLeaderboard
  } = useGameStore();

  const currentPlayerId = user?.user;
  const isHost = Boolean(user?.isHost);
  const leaderboard = getLeaderboard();
  const latestRoundResult =
    game?.roundResults?.length > 0
      ? game.roundResults[game.roundResults.length - 1]
      : null;

  useEffect(() => {
    initSocket();
    initGameSocket();
  }, [initSocket, initGameSocket]);

  const handleGuessByTap = async (targetPlayerId) => {
    if (!roomCode || !currentPlayerId || loading) return;
    await makeGuess(roomCode, targetPlayerId, currentPlayerId);
  };

  const handleScoreCalculation = async () => {
    if (!roomCode || loading) return;
    await calculateScores(roomCode);
  };

  const handleNextRound = async () => {
    if (!roomCode || loading) return;
    await nextRound(roomCode);
  };

  const renderCard = (card) => {
    const roleKey = card.role || card.actualRole;
    const roleInfo = ROLE_META[roleKey] || { label: "Hidden", icon: "🎴" };
    const isCurrentPlayer = card.playerId === currentPlayerId;
    const clickable =
      game?.canCurrentPlayerGuess &&
      card.isGuessable &&
      !game?.sipahiGuess &&
      game?.phase === "card-distribution";

    return (
      <button
        key={card.playerId}
        type="button"
        className={`player-card-wrapper ${clickable ? "guessable" : ""} ${isCurrentPlayer ? "current-player" : ""}`}
        onClick={() => clickable && handleGuessByTap(card.playerId)}
        disabled={!clickable || loading}
      >
        <div className="player-name-row">
          <span className="player-name">{card.playerName}</span>
          {isCurrentPlayer && <span className="you-badge">You</span>}
        </div>
        <div className={`flip-card ${card.isRevealed ? "revealed" : "hidden"}`}>
          <div className="flip-card-inner">
            <div className="flip-card-front">
              <span className="card-back-icon">🎴</span>
              <span className="card-back-text">Hidden Role</span>
            </div>
            <div className={`flip-card-back role-${roleKey || "hidden"}`}>
              <span className="role-icon">{roleInfo.icon}</span>
              <span className="role-label">{card.role ? roleInfo.label : "Hidden"}</span>
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Raja Mantri Chor Sipahi</h1>
        <div className="room-info">
          <span>Room: {roomCode}</span>
          <span>
            Round: {game?.currentRound || 1}/{game?.totalRounds || room?.round || 0}
          </span>
          <span>Phase: {game?.phase || "loading"}</span>
        </div>
      </div>

      <div className="phase-container">
        <h2>Cards</h2>
        <p>Raja and Sipahi are visible to all players. Tap a hidden card to guess if you are Sipahi.</p>
        <div className="cards-grid">{(game?.cards || []).map(renderCard)}</div>
      </div>

      {game?.phase === "card-distribution" && (
        <div className="phase-container">
          {game?.canCurrentPlayerGuess ? (
            <>
              <h2>Sipahi Turn</h2>
              <p>Tap one hidden card to guess Chor.</p>
            </>
          ) : (
            <>
              <h2>Waiting</h2>
              <p>Waiting for Sipahi to make a guess.</p>
            </>
          )}
        </div>
      )}

      {game?.phase === "reveal" && (
        <div className="phase-container">
          <h2>Reveal Complete</h2>
          <p>
            Guess Result:{" "}
            <strong className={game?.sipahiGuess?.isCorrect ? "correct" : "incorrect"}>
              {game?.sipahiGuess?.isCorrect ? "Correct" : "Wrong"}
            </strong>
          </p>
          {isHost ? (
            <button className="btn-primary" onClick={handleScoreCalculation} disabled={loading}>
              {loading ? "Calculating..." : "Calculate Round Score"}
            </button>
          ) : (
            <p>Host will calculate this round score.</p>
          )}
        </div>
      )}

      {(game?.phase === "round-complete" || game?.phase === "game-finished") && (
        <div className="phase-container">
          <h2>Leaderboard</h2>
          <div className="results-table">
            {leaderboard.map((player) => (
              <div key={player._id} className="result-row">
                <span>#{player.rank}</span>
                <span>{player.name}</span>
                <span>{player.points} pts</span>
                <span>{game?.phase === "game-finished" ? game?.finalRanks?.[player.rank - 1]?.title || "-" : "-"}</span>
              </div>
            ))}
          </div>

          {latestRoundResult && (
            <div className="round-results">
              <h3>Round {latestRoundResult.round} Summary</h3>
              <div className="results-table">
                {latestRoundResult.results.map((item) => (
                  <div key={`${item.playerName}-${item.role}`} className="result-row">
                    <span>{item.playerName}</span>
                    <span>{ROLE_META[item.role]?.label || item.role}</span>
                    <span>+{item.points}</span>
                    <span>Total: {item.totalPoints}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {game?.phase === "round-complete" && isHost && (
            <button className="btn-secondary" onClick={handleNextRound} disabled={loading}>
              {loading ? "Shuffling..." : "Start Next Round"}
            </button>
          )}
        </div>
      )}

      {game?.phase === "game-finished" && (
        <div className="game-finished">
          <h2>Game Finished</h2>
          <p>
            Winner: <strong>{game?.finalRanks?.[0]?.playerName}</strong> ({game?.finalRanks?.[0]?.title})
          </p>
        </div>
      )}
    </div>
  );
};

export default GamePlay;
