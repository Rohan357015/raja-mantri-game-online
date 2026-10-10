
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/homepage.css';
import { useAuthStore } from '../store/auth.store';

const characters = [
  {
    name: 'Raja',
    emoji: '👑',
    description: 'The King',
    color: 'raja-card',
  },
  {
    name: 'Mantri',
    emoji: '🤴',
    description: 'The Minister',
    color: 'mantri-card',
  },
  {
    name: 'Chor',
    emoji: '🥷',
    description: 'The Thief',
    color: 'chor-card',
  },
  {
    name: 'Sipahi',
    emoji: '🛡️',
    description: 'The Guard',
    color: 'sipahi-card',
  },
];

const Homepage = () => {
  const navigate = useNavigate();
  const { roomCode, clearRoom } = useAuthStore();
  const [showGuide, setShowGuide] = useState(false);

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleJoinRoom = () => {
    navigate('/join-room');
  };

  const handleViewRoom = () => {
    navigate('/get-room');
  };

  const handleLeaveRoom = () => {
    const confirmed = window.confirm(
      'Are you sure you want to leave your current room?'
    );

    if (confirmed) {
      clearRoom();
    }
  };

  return (
    <main className="home-page">
      {/* Decorative background */}
      <div className="home-sky" aria-hidden="true">
        <span className="home-cloud cloud-one">☁️</span>
        <span className="home-cloud cloud-two">☁️</span>
        <span className="home-sparkle sparkle-one">✦</span>
        <span className="home-sparkle sparkle-two">✧</span>
      </div>

      {/* Navigation */}
      <header className="home-navbar">
        <button
          className="home-brand"
          onClick={() => navigate('/')}
          aria-label="Go to homepage"
        >
          <span className="brand-crown">👑</span>
          <span>Raja-Mantri</span>
        </button>

        <button
          className="guide-button"
          onClick={() => setShowGuide(true)}
        >
          <span>❔</span> How to Play
        </button>
      </header>

      {/* Main content */}
      <section className="home-hero">
        <div className="hero-copy">
          <span className="hero-badge">
            ✨ THE ROYAL GAME NIGHT
          </span>

          <h1>
            Raja Mantri
            <span className="title-second-line">
              Chor Sipahi!
            </span>
          </h1>

          <p className="hero-description">
            Gather your friends, discover your secret role,
            and find out who is the cleverest player in the kingdom!
          </p>

          <div className="hero-actions">
            {roomCode ? (
              <>
                <button
                  className="game-button primary-button"
                  onClick={handleViewRoom}
                >
                  <span>🏰</span>
                  View My Room
                  <span className="button-arrow">→</span>
                </button>

                <p className="room-indicator">
                  <span className="online-dot" />
                  Room code: <strong>{roomCode}</strong>
                </p>

                <button
                  className="game-button leave-button"
                  onClick={handleLeaveRoom}
                >
                  🚪 Leave Room
                </button>
              </>
            ) : (
              <>
                <button
                  className="game-button primary-button"
                  onClick={handleCreateRoom}
                >
                  <span>👑</span>
                  Create Room
                  <span className="button-arrow">→</span>
                </button>

                <button
                  className="game-button secondary-button"
                  onClick={handleJoinRoom}
                >
                  <span>🎮</span>
                  Join a Room
                </button>
              </>
            )}
          </div>

          <div className="hero-features">
            <span>👥 Play with Friends</span>
            <span>💬 Live Discussion</span>
            <span>📱 Mobile Friendly</span>
          </div>
        </div>

        {/* Character cards */}
        <div className="characters-section">
          <div className="castle-decoration castle-left">
            🏰
          </div>

          <div className="characters-heading">
            <span>MEET THE ROYAL SQUAD</span>
            <p>Four roles. One exciting mystery!</p>
          </div>

          <div className="character-grid">
            {characters.map((character) => (
              <article
                className={`character-card ${character.color}`}
                key={character.name}
              >
                <span className="character-sparkle">
                  ✨
                </span>

                <div className="character-art">
                  {character.emoji}
                </div>

                <div className="character-info">
                  <h2>{character.name}</h2>
                  <p>{character.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="character-caption">
            <span>⭐</span>
            Your role is secret. Your mission is legendary!
            <span>⭐</span>
          </div>
        </div>
      </section>

      {/* Bottom information */}
      <footer className="home-footer">
        <div className="footer-item">
          <span className="footer-icon">🎯</span>
          <div>
            <strong>Think Smart</strong>
            <p>Find the real Chor</p>
          </div>
        </div>

        <div className="footer-item">
          <span className="footer-icon">💬</span>
          <div>
            <strong>Discuss & Guess</strong>
            <p>Talk during discussion</p>
          </div>
        </div>

        <div className="footer-item">
          <span className="footer-icon">🏆</span>
          <div>
            <strong>Win Together</strong>
            <p>Collect royal points</p>
          </div>
        </div>
      </footer>

      {/* Dummy How to Play modal */}
      {showGuide && (
        <div
          className="guide-overlay"
          onClick={() => setShowGuide(false)}
        >
          <section
            className="guide-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="guide-close"
              onClick={() => setShowGuide(false)}
              aria-label="Close instructions"
            >
              ✕
            </button>

            <span className="guide-crown">👑</span>

            <h2 id="guide-title">How to Play</h2>
            <p className="guide-intro">
              Four secret roles, one royal mystery!
            </p>

            <div className="guide-role">
              <span>👑</span>
              <div>
                <strong>Raja</strong>
                <p>Earn the highest royal score.</p>
              </div>
            </div>

            <div className="guide-role">
              <span>🤴</span>
              <div>
                <strong>Mantri</strong>
                <p>Identify the Raja and earn points.</p>
              </div>
            </div>

            <div className="guide-role">
              <span>🥷</span>
              <div>
                <strong>Chor</strong>
                <p>Stay hidden and avoid being caught.</p>
              </div>
            </div>

            <div className="guide-role">
              <span>🛡️</span>
              <div>
                <strong>Sipahi</strong>
                <p>Guess who the Chor is.</p>
              </div>
            </div>

            <div className="guide-tip">
              💡 Discuss with your friends before the Sipahi
              makes a guess!
            </div>

            <button
              className="game-button primary-button guide-done"
              onClick={() => setShowGuide(false)}
            >
              Let's Play! 🎮
            </button>
          </section>
        </div>
      )}
    </main>
  );
};

export default Homepage;
