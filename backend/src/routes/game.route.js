import express from 'express';
import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Import game controller functions
import { assignRoles,  makeGuess, calculateScores } from '../controller/game.controller.js';

router.post('/:roomCode/assign-roles', assignRoles);
router.post('/:roomCode/make-guess', makeGuess);
router.post('/:roomCode/calculate-scores', calculateScores);

export default router;
