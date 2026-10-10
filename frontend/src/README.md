# Frontend Source Guide

Use this folder as the client-side starting point.

- `App.jsx` - Defines page routes.
- `main.jsx` - Mounts React and wraps the app with router/toast providers.
- `components/` - Page-level UI components.
- `components/styles/` - CSS files for page components.
- `store/auth.store.js` - Room, user, lobby, and start-game state/actions.
- `store/game.store.js` - Live gameplay socket state/actions.
- `lib/axios.js` - REST API client.
- `lib/socket.js` - Socket.IO client.

When looking for a feature, start from the route in `App.jsx`, then open the matching component and store.
