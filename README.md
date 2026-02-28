# Raja Mantri Chor Sipahi Game

Online multiplayer Raja-Mantri game built with React, Node.js, Socket.IO, and MongoDB.

## Local setup

1. Backend:
```bash
cd backend
npm install
cp .env.example .env
```

2. Frontend:
```bash
cd frontend
npm install
cp .env.example .env
```

3. Run:
```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

## Deploy on Render

This repo includes `render.yaml` for Blueprint deploy.

1. Push code to GitHub.
2. In Render, create a new Blueprint and select this repo.
3. Render will create:
   - `raja-mantri-backend` (Web Service)
   - `raja-mantri-frontend` (Static Site)
4. Set backend env vars:
   - `MONGODB_URI` = your MongoDB Atlas URI
   - `CORS_ORIGINS` = `https://<frontend-service>.onrender.com`
5. Set frontend env vars:
   - `VITE_API_URL` = `https://<backend-service>.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://<backend-service>.onrender.com`
6. Redeploy frontend after env vars are set.

## Security note

If your database password was committed earlier, rotate it in MongoDB Atlas and use the new value in Render env vars.
