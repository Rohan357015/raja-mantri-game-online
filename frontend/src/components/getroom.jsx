
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';
import './styles/getroom.css';

const playerEmojis = ['👑', '🤴', '🥷', '🛡️'];

const GetRoom = () => {
  const navigate = useNavigate();

  const {
    room,
    roomCode,
    user,
    loading,
    getRoom,
    startGame,
    clearRoom,
    initSocket,
  } = useAuthStore();

  const [refreshLoading, setRefreshLoading] = useState(false);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    if (roomCode && !room) {
      fetchRoomDetails();
    }
  }, [roomCode, room]);

  useEffect(() => {
    if (room?.status === 'playing') {
      navigate('/start-game');
    }
  }, [room?.status, navigate]);

  const fetchRoomDetails = async () => {
    if (!roomCode) return;

    setRefreshLoading(true);

    try {
      await getRoom(roomCode);
    } catch (error) {
      console.error('Error fetching room:', error);
      toast.error('Unable to refresh room details');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!roomCode || !user || !canStartGame || loading) return;

    try {
      await startGame(roomCode, user.user);
      navigate('/start-game');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleLeaveRoom = () => {
    clearRoom();
    navigate('/');
  };

  const handleCopyCode = async () => {
    const code = room?.roomCode || roomCode;

    if (!code) {
      toast.error('Room code is unavailable');
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      toast.success('Room code copied!');
    } catch {
      toast.error('Could not copy the room code');
    }
  };

  const handleRefresh = () => {
    if (!refreshLoading) {
      fetchRoomDetails();
    }
  };

  if (loading && !room) {
    return (
      <main className="lobby-loading">
        <div className="lobby-loading-card">
          <div className="lobby-loader">👑</div>
          <h2>Entering the Kingdom...</h2>
          <p>Getting your royal room ready!</p>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="lobby-error-page">
        <div className="lobby-error-card">
          <span>🏰</span>
          <h1>Room Not Found</h1>
          <p>
            We couldn't load your royal kingdom.
            Please try again or return home.
          </p>

          <button
            className="lobby-button lobby-button-primary"
            onClick={() => navigate('/')}
          >
            ← Go Home
          </button>

          {roomCode && (
            <button
              className="lobby-button lobby-button-outline"
              onClick={handleRefresh}
              disabled={refreshLoading}
            >
              {refreshLoading ? 'Refreshing...' : 'Try Again'}
            </button>
          )}
        </div>
      </main>
    );
  }

  const players = room.players || [];
  const maxPlayers = Number(room.maxPlayers) || 4;
  const isHost = Boolean(user?.isHost);
  const isWaiting = room.status === 'waiting';

  const canStartGame =
    isHost && players.length >= 4 && isWaiting;

  const remainingSlots = Math.max(
    0,
    maxPlayers - players.length
  );

  return (
    <main className="lobby-page">
      {/* Navbar */}
      <header className="lobby-navbar">
        <button
          className="lobby-brand"
          onClick={() => navigate('/')}
          aria-label="Go to homepage"
        >
          <span className="lobby-brand-crown">👑</span>
          <span>Raja-Mantri-Chor-Sipahi</span>
        </button>

        <button
          className="lobby-home-button"
          onClick={() => navigate('/')}
        >
          <span>←</span>
          Home
        </button>
      </header>

      {/* Main lobby layout */}
      <section className="lobby-layout">
        {/* Left illustrated panel */}
        <aside className="lobby-illustration">
          <div className="lobby-cloud lobby-cloud-one">☁️</div>
          <div className="lobby-cloud lobby-cloud-two">☁️</div>

          <div className="lobby-castle">🏰</div>

          <div className="lobby-wooden-sign">
            <span>✨</span>
            <h1>
              {isWaiting ? 'Waiting for Players!' : 'Game in Progress!'}
            </h1>
            <p>
              {isWaiting
                ? 'Gather your friends and let the royal game begin!'
                : 'Your royal adventure is underway!'}
            </p>
          </div>

          <div className="lobby-scene-characters">
            <span className="lobby-scene-king">🤴</span>
            <span className="lobby-scene-minister">🧑‍⚖️</span>
            <span className="lobby-scene-thief">🥷</span>
            <span className="lobby-scene-guard">🛡️</span>
          </div>

          <div className="lobby-hill" />
          <div className="lobby-path" />

          <div className="lobby-scene-caption">
            👑 Every player has a secret role!
          </div>
        </aside>

        {/* Room details panel */}
        <section className="lobby-main-card">
          <div className="lobby-heading">
            <span className="lobby-heading-icon">👑</span>

            <div>
              <h1>Room Details</h1>
              <p>Here's your royal gathering!</p>
            </div>
          </div>

          {/* Room code and status */}
          <div className="lobby-top-grid">
            <div className="lobby-code-card">
              <span className="lobby-card-label">ROOM CODE</span>

              <div className="lobby-code-row">
                <strong>{room.roomCode || roomCode}</strong>

                <button
                  className="lobby-copy-button"
                  onClick={handleCopyCode}
                  aria-label="Copy room code"
                  title="Copy room code"
                >
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="8" y="8" width="12" height="12" rx="2" />
                    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="lobby-status-card">
              <span className="lobby-card-label">STATUS</span>

              <span
                className={`lobby-status-badge ${
                  isWaiting ? 'status-waiting' : 'status-playing'
                }`}
              >
                <span className="lobby-status-dot" />
                {room.status}
              </span>
            </div>
          </div>

          {/* Room statistics */}
          <div className="lobby-stats-grid">
            <div className="lobby-stat-card">
              <span className="lobby-stat-icon">👤</span>
              <div>
                <span>Host</span>
                <strong>{room.hostName || 'Host'}</strong>
              </div>
            </div>

            <div className="lobby-stat-card">
              <span className="lobby-stat-icon">🔄</span>
              <div>
                <span>Rounds</span>
                <strong>{room.round}</strong>
              </div>
            </div>

            <div className="lobby-stat-card">
              <span className="lobby-stat-icon">👥</span>
              <div>
                <span>Players</span>
                <strong>{players.length} / {maxPlayers}</strong>
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="lobby-players-heading">
            <h2>
              <span>👥</span>
              Players ({players.length}/{maxPlayers})
            </h2>

            <span className="lobby-waiting-label">
              <span className="lobby-status-dot" />
              {players.length >= 4
                ? 'Ready to play!'
                : 'Waiting for players...'}
            </span>
          </div>

          <div className="lobby-player-grid">
            {players.map((player, index) => (
              <article
                className="lobby-player-card"
                key={player.user || player._id || player.id || index}
              >
                <div className="lobby-avatar">
                  {player.avatar || playerEmojis[index % playerEmojis.length]}
                </div>

                <strong className="lobby-player-name">
                  {player.name}
                </strong>

                {player.isHost && (
                  <span className="lobby-host-badge">
                    👑 Host
                  </span>
                )}

                <span className="lobby-player-time">
                  {player.joinedAt &&
                  !Number.isNaN(new Date(player.joinedAt).getTime())
                    ? `Joined ${new Date(player.joinedAt).toLocaleTimeString(
                        [],
                        { hour: '2-digit', minute: '2-digit' }
                      )}`
                    : player.isHost
                      ? 'Room creator'
                      : 'Player joined'}
                </span>
              </article>
            ))}

            {Array.from(
              { length: remainingSlots },
              (_, index) => (
                <div
                  className="lobby-empty-slot"
                  key={`empty-${index}`}
                >
                  <span>👤</span>
                  <p>Waiting for player...</p>
                </div>
              )
            )}
          </div>

          {/* Actions */}
          <div className="lobby-actions">
            {isHost && (
              <button
                className="lobby-button lobby-button-start"
                onClick={handleStartGame}
                disabled={!canStartGame || loading}
                title={
                  players.length < 4
                    ? 'At least 4 players are required'
                    : 'Start the game'
                }
              >
                <span>▶</span>
                {loading ? 'Starting...' : 'Start Game'}
              </button>
            )}

            <button
              className="lobby-button lobby-button-outline"
              onClick={handleRefresh}
              disabled={refreshLoading}
            >
              <span className={refreshLoading ? 'lobby-refreshing' : ''}>
                ↻
              </span>
              {refreshLoading ? 'Refreshing...' : 'Refresh'}
            </button>

            <button
              className="lobby-button lobby-button-leave"
              onClick={handleLeaveRoom}
            >
              <span>🚪</span>
              Leave Room
            </button>
          </div>

          {!isHost && isWaiting && (
            <p className="lobby-host-message">
              🌟 Waiting for the host to start the game.
            </p>
          )}

          {!isHost && players.length < 4 && (
            <p className="lobby-host-message">
              💡 Share the room code to invite more friends.
            </p>
          )}

          {/* Share reminder */}
          <div className="lobby-share-note">
            <span>💡</span>
            <p>
              Share this room code with your friends so
              they can join your royal adventure!
            </p>
            <button onClick={handleCopyCode}>
              Copy Code
            </button>
          </div>
        </section>
      </section>

      <footer className="lobby-footer">
        👑 Made for friends, fun, and a little mystery!
      </footer>
    </main>
  );
};

export default GetRoom;
