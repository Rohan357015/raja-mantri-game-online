import User from '../model/user.model.js';
import Room from '../model/room.model.js';

// 🔥 RoomCode Generator
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ================= CREATE ROOM =================
export const createRoom = async (req, res) => {
  const { name, round } = req.body;

  try {
    if (!name || !round) {
      return res.status(400).json({ message: 'Name and round are required' });
    }

    if (round < 1 || round > 10) {
      return res.status(400).json({ message: 'Round must be between 1 and 10' });
    }

    // 🔥 Generate roomCode
    const roomCode = generateRoomCode();

    // Create host user
    const hostUser = new User({
      name,
      isInRoom: true,
      roomCode
    });
    await hostUser.save();

    // Create room
    const room = new Room({
      roomCode, // ✅ REQUIRED FIELD FIXED
      host: hostUser._id,
      hostName: name,
      round,
      players: [{
        user: hostUser._id,
        name,
        isHost: true,
        joinedAt: new Date()
      }]
    });

    await room.save();

    console.log(`✅ Room created: ${room.roomCode}`);

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        roomCode: room.roomCode,
        hostName: room.hostName,
        round: room.round,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating room:', error);
    res.status(500).json({
      message: 'Error creating room',
      error: error.message
    });
  }
};

// ================= JOIN ROOM =================
export const joinRoom = async (req, res) => {
  const { roomCode, name } = req.body;

  try {
    if (!roomCode || !name) {
      return res.status(400).json({ message: 'Room code and name are required' });
    }

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ message: 'Room is full' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ message: 'Room is not accepting new players' });
    }

    const nameExists = room.players.some(
      player => player.name.toLowerCase() === name.toLowerCase()
    );

    if (nameExists) {
      return res.status(400).json({ message: 'Name already taken in this room' });
    }

    const newUser = new User({
      name,
      roomCode,
      isInRoom: true
    });
    await newUser.save();

    room.players.push({
      user: newUser._id,
      name,
      isHost: false,
      joinedAt: new Date()
    });

    await room.save();

    console.log(`✅ ${name} joined room ${room.roomCode}`);
    console.log(`👥 Total players: ${room.players.length}`);

    // Send response first
    res.status(200).json({
      message: 'Successfully joined room',
      room: {
        roomCode: room.roomCode,
        hostName: room.hostName,
        round: room.round,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status
      }
    });

    // 🔥 Emit realtime update
    const io = req.app.get("io");
    if (io) {
      const roomData = {
        roomCode: room.roomCode,
        hostName: room.hostName,
        round: room.round,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        createdAt: room.createdAt
      };

      console.log(`📢 Emitting room-updated to ${roomCode.toUpperCase()}`);
      io.to(roomCode.toUpperCase()).emit('room-updated', roomData);
    }

  } catch (error) {
    console.error('❌ Error joining room:', error);
    res.status(500).json({ message: 'Error joining room' });
  }
};

// ================= GET ROOM =================
export const getRoom = async (req, res) => {
  const { roomCode } = req.params;

  try {
    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() })
      .populate('players.user', 'name');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json({
      room: {
        roomCode: room.roomCode,
        hostName: room.hostName,
        round: room.round,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        createdAt: room.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error getting room:', error);
    res.status(500).json({ message: 'Error getting room details' });
  }
};

// ================= START GAME =================
export const startGame = async (req, res) => {
  const { roomCode, userId } = req.body;

  try {
    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isHost = room.players.some(
      player => player.user.toString() === userId && player.isHost
    );

    if (!isHost) {
      return res.status(403).json({ message: 'Only the host can start the game' });
    }

    if (room.players.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 players to start the game' });
    }

    room.status = 'playing';
    room.startedAt = new Date();
    await room.save();

    console.log(`🎮 Game started in room: ${roomCode.toUpperCase()}`);

    res.status(200).json({
      message: 'Game started successfully',
      room: {
        roomCode: room.roomCode,
        hostName: room.hostName,
        round: room.round,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        startedAt: room.startedAt
      }
    });

    const io = req.app.get("io");
    if (io) {
      io.to(roomCode.toUpperCase()).emit('game-started', {
        room: {
          roomCode: room.roomCode,
          hostName: room.hostName,
          round: room.round,
          players: room.players,
          maxPlayers: room.maxPlayers,
          status: room.status,
          startedAt: room.startedAt
        }
      });
    }

  } catch (error) {
    console.error('❌ Error starting game:', error);
    res.status(500).json({ message: 'Error starting game' });
  }
};
