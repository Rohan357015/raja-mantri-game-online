
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/joinroom.css';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

const JoinRoom = () => {
  const navigate = useNavigate();
  const { joinRoom, loading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    roomCode: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'roomCode'
          ? value.toUpperCase().replace(/\s/g, '')
          : value,
    }));
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.roomCode.trim()) {
      toast.error('Please enter your name and room code');
      return;
    }

    try {
      await joinRoom({
        name: formData.name.trim(),
        roomCode: formData.roomCode.trim(),
      });

      navigate('/get-room');
    } catch (error) {
      // Error notification is handled by the store.
    }
  };

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  return (
    <main className="join-room-page">
      {/* Navbar */}
      <header className="jr-navbar">
        <button
          type="button"
          className="jr-brand"
          onClick={() => navigate('/')}
        >
          <span>👑</span>
          <span>Raja-Mantri</span>
        </button>

        <button
          type="button"
          className="jr-back-button"
          onClick={() => navigate('/')}
        >
          <span>←</span> Home
        </button>
      </header>

      {/* Main content */}
      <section className="jr-layout">
        {/* Left illustration */}
        <div className="jr-illustration">
          <div className="jr-cloud jr-cloud-one">☁️</div>
          <div className="jr-cloud jr-cloud-two">☁️</div>
          <div className="jr-sun" />

          <div className="jr-illustration-content">
            <span className="jr-eyebrow">
              ✨ YOUR FRIENDS ARE WAITING
            </span>

            <h1>
              Join the
              <span>Adventure!</span>
            </h1>

            <p>
              Enter your secret room code, meet your friends,
              and uncover the mystery of Raja-Mantri-Chor-Sipahi.
            </p>

            <div className="jr-scene">
              <div className="jr-castle">🏰</div>

              <div className="jr-signboard">
                <span>🎮</span>
                <strong>Friends' Kingdom</strong>
                <small>Fun begins here!</small>
              </div>

              <div className="jr-character-row">
                <span className="jr-character jr-minister">🤴</span>
                <span className="jr-character jr-king">👑</span>
                <span className="jr-character jr-thief">🥷</span>
                <span className="jr-character jr-guard">🛡️</span>
              </div>

              <div className="jr-ground" />
            </div>

            <div className="jr-fun-fact">
              <span>💡</span>
              <p>
                Ask your friend who created the room for
                the correct room code.
              </p>
            </div>
          </div>
        </div>

        {/* Join form */}
        <div className="jr-form-card">
          <div className="jr-form-heading">
            <div className="jr-form-icon">🎮</div>

            <h2>Join a Room</h2>

            <p>Enter your details to join your friends.</p>
          </div>

          <form onSubmit={handleJoinRoom}>
            {/* Player name */}
            <div className="jr-field">
              <label htmlFor="jr-player-name">
                Your Name <span>*</span>
              </label>

              <div className="jr-input-wrap">
                <span className="jr-input-icon">👤</span>

                <input
                  id="jr-player-name"
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  maxLength={24}
                  autoComplete="name"
                  required
                />
              </div>

              <small>This name will be visible to other players.</small>
            </div>

            {/* Room code */}
            <div className="jr-field">
              <label htmlFor="jr-room-code">
                Room Code <span>*</span>
              </label>

              <div className="jr-input-wrap">
                <span className="jr-input-icon">🔑</span>

                <input
                  id="jr-room-code"
                  type="text"
                  name="roomCode"
                  placeholder="Enter your room code"
                  value={formData.roomCode}
                  onChange={handleInputChange}
                  maxLength={12}
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </div>

              <small>
                Room codes are not case-sensitive in this form.
              </small>
            </div>

            {/* Info */}
            <div className="jr-info-box">
              <span>💡</span>
              <p>
                Make sure the room code matches the one
                shared by your host.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="jr-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="jr-spinner" />
                  Joining Room...
                </>
              ) : (
                <>
                  <span>🎮</span>
                  Join My Friends
                  <span className="jr-submit-arrow">→</span>
                </>
              )}
            </button>

            <div className="jr-form-divider">
              <span />
              <p>or</p>
              <span />
            </div>

            <p className="jr-switch-text">
              Don't have a room yet?
            </p>

            <button
              type="button"
              className="jr-create-button"
              onClick={handleCreateRoom}
            >
              <span>👑</span>
              Create a New Room
            </button>
          </form>

          <div className="jr-secure-note">
            <span>🤝</span>
            More friends, more fun!
          </div>
        </div>
      </section>

      <footer className="jr-footer">
        👑 Made for friends, fun, and a little mystery!
      </footer>
    </main>
  );
};

export default JoinRoom;
