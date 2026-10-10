# Backend Source Guide

Use this folder as the server-side starting point.

- `index.js` - Server setup and live Socket.IO game flow.
- `controller/auth.controller.js` - Room creation, joining, lookup, and starting.
- `controller/game.controller.js` - Older REST game actions.
- `routes/auth.route.js` - REST routes for rooms.
- `routes/game.route.js` - REST routes for game actions.
- `model/room.model.js` - Room/lobby schema.
- `model/game.model.js` - Active game schema.
- `model/user.model.js` - Player/user schema.
- `lib/db.js` - MongoDB connection.

Most active gameplay behavior is currently in `index.js` because it is socket-driven.
