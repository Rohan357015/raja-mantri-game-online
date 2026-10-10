import { Router } from 'express';
import { createRoom, joinRoom, getRoom, startGame } from '../controller/auth.controller.js';


const router = Router();

router.post('/', (req, res) => {
  // Registration logic here
  res.send('home page');
});

// Create a new room with host name and round selection
router.post('/create-room', createRoom );

// Join an existing room with room code
router.post('/join-room', joinRoom);

// Get room details by room code
router.get('/room/:roomCode', getRoom);

// Start the game (only host can start)
router.post('/start-game', startGame );

export default router;
