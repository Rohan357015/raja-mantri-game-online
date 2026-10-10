# Project Structure

This project is split into two apps:

- `backend/` - Express, Socket.IO, MongoDB, and game room state.
- `frontend/` - React, Vite, Zustand stores, and game screens.

## Backend

- `backend/src/index.js` - Main server entry point. Sets up Express, Socket.IO, REST routes, and the live game socket events.
- `backend/src/controller/` - REST API handlers for rooms and game actions.
- `backend/src/routes/` - REST route definitions. These files should stay thin and point to controllers.
- `backend/src/model/` - Mongoose schemas for users, rooms, and games.
- `backend/src/lib/` - Shared backend helpers such as the database connection.

Important game flow:

1. Rooms are created/joined through `auth.controller.js`.
2. The host starts the room through `/api/start-game`.
3. `frontend/src/store/auth.store.js` emits `create-game`.
4. Socket game events run in `backend/src/index.js`.
5. Updated game state is emitted with `game-state-updated`.

## Frontend

- `frontend/src/App.jsx` - App routes.
- `frontend/src/main.jsx` - React app bootstrap and providers.
- `frontend/src/components/` - Screen components used by routes.
- `frontend/src/components/styles/` - Component CSS files.
- `frontend/src/store/` - Zustand stores for room/auth state and live game state.
- `frontend/src/lib/` - Axios and Socket.IO client setup.

Important frontend flow:

1. `createroom.jsx` and `joinroom.jsx` save room/user state in `auth.store.js`.
2. `getroom.jsx` shows the lobby and lets the host start the game.
3. `gamepage.jsx` shows cards, guesses, scores, the leaderboard, leave/home controls, and play-again.
4. `game.store.js` sends game socket events and receives `game-state-updated`.

## Naming Note

The current folder names `controller` and `model` are kept to avoid breaking imports. In many larger Node projects these are named `controllers` and `models`; if you rename them later, update all imports in one focused commit.
