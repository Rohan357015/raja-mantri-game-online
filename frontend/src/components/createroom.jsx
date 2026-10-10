
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/createroom.css';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

const CreateRoom = () => {
  const navigate = useNavigate();
  const { createRoom } = useAuthStore();

  const [round, setRound] = useState('5');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    if (!name.trim() || !round) {
      toast.error('Please fill in all fields');
      return;
    }

    const rounds = Number(round);

    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 20) {
      toast.error('Rounds must be between 1 and 20');
      return;
    }

    try {
      setLoading(true);

      await createRoom({
        name: name.trim(),
        round: rounds,
      });

      navigate('/get-room');
    } catch (error) {
      // The store handles the error notification.
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    navigate('/join-room');
  };

  return (
    <main className="create-room-page">
      {/* Navbar */}
      <header className="cr-navbar">
        <button
          type="button"
          className="cr-brand"
          onClick={() => navigate('/')}
        >
          <span>👑</span>
          <span>Raja-Mantri</span>
        </button>

        <button
          type="button"
          className="cr-back-button"
          onClick={() => navigate('/')}
        >
          <span>←</span> Home
        </button>
      </header>

      {/* Main content */}
      <section className="cr-layout">
        {/* Left illustration panel */}
        <div className="cr-illustration">
          <div className="cr-cloud cr-cloud-one">☁️</div>
          <div className="cr-cloud cr-cloud-two">☁️</div>

          <div className="cr-sun" />

          <div className="cr-illustration-content">
            <span className="cr-eyebrow">
              ✨ YOUR ROYAL ADVENTURE
            </span>

            <h1>
              Create Your
              <span>Kingdom!</span>
            </h1>

            <p>
              Gather your friends, choose your game settings,
              and get ready for a royal mystery.
            </p>

            <div className="cr-scene">
              <div className="cr-castle">🏰</div>

              <div className="cr-character-row">
                <span className="cr-character cr-king">🤴</span>
                <span className="cr-character cr-minister">🧑‍⚖️</span>
                <span className="cr-character cr-thief">🥷</span>
                <span className="cr-character cr-guard">🛡️</span>
              </div>

              <div className="cr-ground" />
            </div>

            <div className="cr-fun-fact">
              <span>🎲</span>
              <p>
                Every round brings a new mystery.
                Can your friends solve it?
              </p>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="cr-form-card">
          <div className="cr-form-heading">
            <div className="cr-form-icon">🏰</div>

            <h2>Create a Room</h2>

            <p>Set up your game in a few easy steps.</p>
          </div>

          <form onSubmit={handleCreateRoom}>
            {/* Player name */}
            <div className="cr-field">
              <label htmlFor="player-name">
                Your Name <span>*</span>
              </label>

              <div className="cr-input-wrap">
                <span className="cr-input-icon">👤</span>

                <input
                  id="player-name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  autoComplete="name"
                  required
                />
              </div>

              <small>This name will be visible to other players.</small>
            </div>

            {/* Number of rounds */}
            <div className="cr-field">
              <label htmlFor="game-rounds">
                Number of Rounds <span>*</span>
              </label>

              <p className="cr-field-description">
                How long should your game last?
              </p>

              <div className="cr-round-options">
                {['3', '5', '10', '20'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`cr-round-option ${
                      round === value ? 'active' : ''
                    }`}
                    aria-pressed={round === value}
                    onClick={() => setRound(value)}
                  >
                    <span className="cr-round-number">{value}</span>
                    <span className="cr-round-label">
                      {value === '3' ? 'Quick' :
                        value === '5' ? 'Classic' :
                          value === '10' ? 'Long' : 'Marathon'}
                    </span>
                    {round === value && (
                      <span className="cr-round-check">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <label className="cr-custom-label" htmlFor="game-rounds">
                Or enter rounds (1–20)
              </label>

              <input
                id="game-rounds"
                className="cr-number-input"
                type="number"
                min="1"
                max="20"
                step="1"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                required
              />
            </div>

            {/* Room information */}
            <div className="cr-info-box">
              <span>💡</span>
              <p>
                Your room code will be generated by the game.
                Share it with friends so they can join.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="cr-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="cr-spinner" />
                  Creating Room...
                </>
              ) : (
                <>
                  <span>👑</span>
                  Create My Room
                  <span className="cr-submit-arrow">→</span>
                </>
              )}
            </button>

            <div className="cr-form-divider">
              <span />
              <p>or</p>
              <span />
            </div>

            <p className="cr-switch-text">
              Already have a room code?
            </p>

            <button
              type="button"
              className="cr-join-button"
              onClick={handleJoinRoom}
            >
              <span>🎮</span>
              Join an Existing Room
            </button>
          </form>

          <div className="cr-secure-note">
            <span>🔒</span>
            Ready to play with your friends
          </div>
        </div>
      </section>

      <footer className="cr-footer">
        <span>👑 Made for friends, fun, and a little mystery!</span>
      </footer>
    </main>
  );
};

export default CreateRoom;
