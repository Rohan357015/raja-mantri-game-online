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

## Deploy on Vercel

Deploy this as two Vercel projects from the same Git repository: one backend project and one frontend project.

### 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Add a database user and password.
3. Add your current IP for local testing, and allow Vercel by adding `0.0.0.0/0` in Network Access.
4. Copy the connection string. It should look like:
```bash
mongodb+srv://<user>:<password>@<cluster-url>/raja-mantri-game
```

### 2. Deploy the backend

1. Push this repository to GitHub.
2. In Vercel, choose **Add New > Project** and import the repository.
3. Set **Root Directory** to `backend`.
4. Keep the framework as **Other** or let Vercel auto-detect Express.
5. Add environment variables:
```bash
MONGODB_URI=<your MongoDB Atlas connection string>
CORS_ORIGINS=https://<your-frontend-project>.vercel.app
```
For your current frontend, use:
```bash
CORS_ORIGINS=https://raja-mantri-game-online-2rug.vercel.app
FRONTEND_URL=https://raja-mantri-game-online-2rug.vercel.app
```
6. Deploy the backend.
7. Open the backend URL. The `/` route should show `Server is running!`.

### 3. Deploy the frontend

1. Create another Vercel project from the same repository.
2. Set **Root Directory** to `frontend`.
3. Use these build settings:
```bash
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```
4. Add environment variables:
```bash
VITE_API_URL=https://<your-backend-project>.vercel.app/api
VITE_SOCKET_URL=https://<your-backend-project>.vercel.app
```
5. Deploy the frontend.

### 4. Final backend CORS update

After the frontend deployment finishes, copy the exact frontend production URL and update the backend `CORS_ORIGINS` value with it. Then redeploy the backend.

For multiple allowed frontend URLs, use a comma-separated list:
```bash
CORS_ORIGINS=https://<production-frontend>.vercel.app,https://<preview-frontend>.vercel.app,http://localhost:5173
```

### 5. Local Vercel test

Install the Vercel CLI if needed:
```bash
npm i -g vercel
```

Run the backend locally through Vercel:
```bash
cd backend
npm install
vercel dev
```

Run the frontend in another terminal:
```bash
cd frontend
npm install
npm run dev
```

Vercel WebSockets require Socket.IO to use direct WebSocket transport. The frontend already forces `transports: ["websocket"]` for production compatibility.
