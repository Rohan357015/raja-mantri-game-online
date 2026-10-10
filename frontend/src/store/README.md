# Store Guide

The frontend uses Zustand stores.

- `auth.store.js`
  - Owns current user, room code, room details, lobby actions, and room cleanup.
  - Main actions: `createRoom`, `joinRoom`, `getRoom`, `startGame`, `clearRoom`.

- `game.store.js`
  - Owns live game state received from Socket.IO.
  - Main actions: `makeGuess`, `calculateScores`, `nextRound`, `playAgain`.

Rule of thumb: if the action changes lobby/room membership, use `auth.store.js`; if it changes gameplay state, use `game.store.js`.
