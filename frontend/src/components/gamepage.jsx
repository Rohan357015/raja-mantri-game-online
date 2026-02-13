import React, { useState, useEffect } from 'react';
import './styles/gamepage.css';
import { useAuthStore } from '../store/auth.store';
import { useNavigate } from 'react-router-dom';

export const StartGame = () => {
  const [gameState, setGameState] = useState({
    phase: 'waiting', // waiting, role-assignment, card-distribution, guessing, reveal, scoring, round-complete
    currentRound: 1,
    totalRounds: 5,
    players: [
      { id: 1, name: 'Player 1', role: null, points: 0, isHost: true },
      { id: 2, name: 'Player 2', role: null, points: 0, isHost: false },
      { id: 3, name: 'Player 3', role: null, points: 0, isHost: false },
      { id: 4, name: 'Player 4', role: null, points: 0, isHost: false }
    ],
    cards: [],
    sipahiGuess: null,
    roundResults: [],
    gameStarted: false
  });

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState(1); // Simulating current player

  const roles = ['raja', 'mantri', 'chor', 'sipahi'];
  const rolePoints = { raja: 1000, mantri: 3, chor: 2, sipahi: 1 };
  const roleColors = { raja: '#FFD700', mantri: '#C0C0C0', chor: '#FF6B6B', sipahi: '#4ECDC4' };

  // Start the game
  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      phase: 'role-assignment'
    }));
  };
  // authentication store
  const { room, roomCode, user, loading, getRoom, round, clearRoom, updateScores } = useAuthStore();
  const navigate = useNavigate();

  // ✅ Polling every 1 second
  useEffect(() => {
    if (!roomCode) return;

    const interval = setInterval(async () => {
      try {
        const latestRoom = await getRoom(roomCode); // fetch latest data from backend
        if (latestRoom && latestRoom.gameState) {
          setGameState(latestRoom.gameState); // overwrite with backend’s gameState
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000);

    return () => clearInterval(interval); // cleanup
  }, [roomCode, getRoom]);
  if (!room) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center game-container">
        <div className="container-fluid px-4 py-5 text-center">
          <h1 className="fw-bold mb-4 game-title">Room Not Found</h1>
          <p className="mb-4">Unable to load room details.</p>
          <button className="btn-game-warning" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }


  // Start a new round
  const startRound = () => {
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);

    setGameState(prev => {
      const newPlayers = prev.players.map((player, index) => ({
        ...player,
        role: shuffledRoles[index]
      }));

      const newCards = newPlayers.map(player => ({
        playerId: player.id,
        role: player.role,
        isRevealed: player.role === 'raja' || player.role === 'mantri'
      }));

      return {
        ...prev,
        players: newPlayers,
        cards: newCards,
        phase: 'card-distribution',
        sipahiGuess: null
      };
    });
  };

  // Make a guess (Sipahi only)
  const makeGuess = () => {
    if (!selectedPlayer) return;

    const sipahiPlayer = gameState.players.find(p => p.role === 'sipahi');
    const guessedPlayer = gameState.players.find(p => p.id === selectedPlayer);
    const isCorrect = guessedPlayer.role === 'chor';

    setGameState(prev => ({
      ...prev,
      sipahiGuess: {
        guessedPlayer: guessedPlayer.name,
        isCorrect: isCorrect,
        timestamp: new Date()
      },
      phase: 'reveal',
      cards: prev.cards.map(card => ({ ...card, isRevealed: true }))
    }));

    setSelectedPlayer(null);
  };

  // Calculate and apply scoring
  const calculateScore = () => {
    setGameState(prev => {
      const { sipahiGuess } = prev;
      const newPlayers = [...prev.players];
      const roundResults = [];

      // Calculate points for each player
      newPlayers.forEach(player => {
        const points = rolePoints[player.role];

        if (sipahiGuess.isCorrect) {
          // Sipahi gets their assigned points
          player.points += points;
        } else {
          // Sipahi and Chor swap points
          const sipahiPlayer = newPlayers.find(p => p.role === 'sipahi');
          const chorPlayer = newPlayers.find(p => p.role === 'chor');

          if (sipahiPlayer && chorPlayer) {
            const sipahiPoints = sipahiPlayer.points;
            const chorPoints = chorPlayer.points;

            sipahiPlayer.points = chorPoints;
            chorPlayer.points = sipahiPoints;
          }
        }

        roundResults.push({
          playerName: player.name,
          role: player.role,
          points: points,
          totalPoints: player.points
        });
      });

      return {
        ...prev,
        players: newPlayers,
        phase: 'scoring',
        roundResults: [...prev.roundResults, {
          round: prev.currentRound,
          results: roundResults
        }]
      };
    });
  };

  // Start next round
  const nextRound = () => {
    if (gameState.currentRound >= gameState.totalRounds) {
      setGameState(prev => ({
        ...prev,
        phase: 'game-finished'
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      phase: 'role-assignment',
      cards: [],
      sipahiGuess: null
    }));
  };

  // Reset game
  const resetGame = () => {
    // get latest players from room
    const playersFromRoom = room?.players || [];

    setGameState({
      phase: 'waiting',
      currentRound: 1,
      totalRounds: round || 5,
      players: playersFromRoom.map((p, index) => ({
        id: p.id || index + 1,
        name: p.name || `Player ${index + 1}`, // ✅ use actual name if exists
        role: null,
        points: 0,
        isHost: index === 0 // first player is host
      })),
      cards: [],
      sipahiGuess: null,
      roundResults: [],
      gameStarted: false
    });
    setSelectedPlayer(null);
  };


  const getRoleDisplayName = (role) => {
    const roleMap = {
      'raja': 'Raja (King)',
      'mantri': 'Mantri (Minister)',
      'chor': 'Chor (Thief)',
      'sipahi': 'Sipahi (Guard)'
    };
    return roleMap[role] || role;
  };

  const getCurrentPlayer = () => gameState.players.find(p => p.id === currentPlayerId);
  const isSipahi = getCurrentPlayer()?.role === 'sipahi';

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Raja Mantri Chor Sipahi</h1>
        <div className="room-info">
          <span>Round: {gameState.currentRound}/{gameState.totalRounds}</span>
          <span>Phase: {gameState.phase}</span>
        </div>
      </div>

      {!gameState.gameStarted && (
        <div className="phase-container">
          <h2>Welcome to Raja Mantri Chor Sipahi!</h2>
          <div className="game-rules">
            <h3>Game Rules:</h3>
            <ul>
              <li>4 players get different roles each round: Raja, Mantri, Chor, Sipahi</li>
              <li>Only Raja and Mantri cards are shown initially</li>
              <li>Sipahi must guess who is the Chor</li>
              <li>If Sipahi guesses correctly: Sipahi gets assigned points</li>
              <li>If Sipahi guesses wrong: Sipahi and Chor swap their total points</li>
              <li>Points: Raja=1000, Mantri=800, Chor=000, Sipahi=500</li>
            </ul>
          </div>
          <button className="btn-primary" onClick={startGame}>
            {room?.hostName === user?.name ? "Start Game" : "Waiting for Host to Start..."}
          </button>
        </div>
      )}

      {gameState.phase === 'role-assignment' && (
        <div className="phase-container">
          <h2>Role Assignment Phase</h2>
          <p>Roles are being assigned randomly...</p>
          <button className="btn-primary" onClick={startRound}>
            Start Round {gameState.currentRound}
          </button>
        </div>
      )}

      {gameState.phase === 'card-distribution' && (
        <div className="phase-container">
          <h2>Card Distribution Phase</h2>
          <p>Raja and Mantri cards are revealed. Sipahi, make your guess!</p>

          <div className="players-grid">
            {gameState.players.map((player, index) => {
              const card = gameState.cards.find(c => c.playerId === player.id);
              const role = card?.role;

              // 🔥 IMPORTANT LOGIC
              const isOwnCard = player.id === currentPlayerId;
              const isRevealed =
                role === "raja" ||
                role === "mantri" ||
                isOwnCard;

              const isCurrentPlayer = isOwnCard;

              return (
                <div
                  key={index}
                  className={`player-card ${isCurrentPlayer ? 'current-player' : ''}`}
                >
                  <div className="player-name">{player.name}</div>

                  <div
                    className={`role-card ${isRevealed ? 'revealed' : 'hidden'}`}
                    style={{
                      backgroundColor: isRevealed
                        ? roleColors[role]
                        : '#E0E0E0'
                    }}
                  >
                    {isRevealed ? (
                      <div>
                        <div className="role-name">
                          {getRoleDisplayName(role)}
                        </div>
                        <div className="role-points">
                          {rolePoints[role]} pts
                        </div>
                      </div>
                    ) : (
                      <div className="card-back">?</div>
                    )}
                  </div>

                  <div className="player-points">
                    Total: {player.points} pts
                  </div>
                </div>
              );
            })}
          </div>

          {isSipahi && (
            <div className="guessing-section">
              <h3>You are the Sipahi! Guess who is the Chor:</h3>
              <div className="guess-buttons">
                {gameState.players
                  .filter(p => p.id !== currentPlayerId)
                  .map((player, index) => (
                    <button
                      key={index}
                      className={`guess-btn ${selectedPlayer === player.id ? 'selected' : ''
                        }`}
                      onClick={() => setSelectedPlayer(player.id)}
                    >
                      {player.name}
                    </button>
                  ))}
              </div>

              <button
                className="btn-primary"
                onClick={makeGuess}
                disabled={!selectedPlayer}
              >
                Make Guess
              </button>
            </div>
          )}

          {!isSipahi && (
            <div className="waiting-section">
              <p>Waiting for Sipahi to make a guess...</p>
            </div>
          )}
        </div>
      )}


      {gameState.phase === 'reveal' && (
        <div className="phase-container">
          <h2>Reveal Phase</h2>
          <p>All cards are now revealed!</p>

          <div className="players-grid">
            {gameState.players.map((player, index) => {
              const card = gameState.cards.find(c => c.playerId === player.id);
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div key={index} className={`player-card ${isCurrentPlayer ? 'current-player' : ''}`}>
                  <div className="player-name">{player.name}</div>
                  <div
                    className="role-card revealed"
                    style={{ backgroundColor: roleColors[card?.role] }}
                  >
                    <div className="role-name">{getRoleDisplayName(card?.role)}</div>
                    <div className="role-points">{rolePoints[card?.role]} pts</div>
                  </div>
                  <div className="player-points">Total: {player.points} pts</div>
                </div>
              );
            })}
          </div>

          {gameState.sipahiGuess && (
            <div className="guess-result">
              <h3>Guess Result:</h3>
              <p>
                Sipahi guessed: <strong>{gameState.sipahiGuess.guessedPlayer}</strong>
              </p>
              <p className={gameState.sipahiGuess.isCorrect ? 'correct' : 'incorrect'}>
                {gameState.sipahiGuess.isCorrect ? 'Correct!' : 'Incorrect!'}
              </p>
            </div>
          )}

          <button className="btn-primary" onClick={calculateScore}>
            Calculate Score
          </button>
        </div>
      )}

      {gameState.phase === 'scoring' && (
        <div className="phase-container">
          <h2>Scoring Phase</h2>
          <p>Points have been calculated and applied!</p>

          <div className="players-grid">
            {gameState.players.map((player, index) => {
              const card = gameState.cards.find(c => c.playerId === player.id);
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div key={index} className={`player-card ${isCurrentPlayer ? 'current-player' : ''}`}>
                  <div className="player-name">{player.name}</div>
                  <div
                    className="role-card revealed"
                    style={{ backgroundColor: roleColors[card?.role] }}
                  >
                    <div className="role-name">{getRoleDisplayName(card?.role)}</div>
                    <div className="role-points">{rolePoints[card?.role]} pts</div>
                  </div>
                  <div className="player-points">Total: {player.points} pts</div>
                </div>
              );
            })}
          </div>

          {gameState.roundResults && gameState.roundResults.length > 0 && (
            <div className="round-results">
              <h3>Round {gameState.currentRound} Results:</h3>
              <div className="results-table">
                {gameState.roundResults[gameState.roundResults.length - 1].results.map((result, index) => (
                  <div key={index} className="result-row">
                    <span>{result.playerName}</span>
                    <span>{getRoleDisplayName(result.role)}</span>
                    <span>+{result.points} pts</span>
                    <span>Total: {result.totalPoints} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameState.currentRound < gameState.totalRounds ? (
            <button className="btn-primary" onClick={nextRound}>
              Next Round
            </button>
          ) : (
            <div className="game-finished">
              <h2>Game Finished!</h2>
              <p>All rounds completed. Check final scores above.</p>
              <button className="btn-secondary" onClick={resetGame}>
                Play Again
              </button>
            </div>
          )}
        </div>
      )}

      {gameState.phase === 'game-finished' && (
        <div className="phase-container">
          <h2>Game Finished!</h2>
          <div className="final-results">
            <h3>Final Scores:</h3>
            <div className="results-table">
              {gameState.players
                .sort((a, b) => b.points - a.points)
                .map((player, index) => (
                  <div key={index} className="result-row">
                    <span>#{index + 1} {player.name}</span>
                    <span>{player.points} points</span>
                  </div>
                ))}
            </div>
          </div>
          <button className="btn-secondary" onClick={resetGame}>
            Play Again
          </button>
        </div>
      )}

      <div className="game-footer">
        <button className="btn-secondary" onClick={resetGame}>
          Reset Game
        </button>
      </div>
    </div>
  );
};




