import { Router } from 'express';
import { assignRoles, makeGuess, calculateScores } from '../controller/game.controller.js';

const router = Router();

router.post('/:roomCode/assign-roles', assignRoles);
router.post('/:roomCode/make-guess', makeGuess);
router.post('/:roomCode/calculate-scores', calculateScores);

export default router;
