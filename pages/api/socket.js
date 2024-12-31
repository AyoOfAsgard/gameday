import { Server } from 'socket.io';

let io;

export default function handler(req, res) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  io = new Server(res.socket.server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://gameday-nine.vercel.app' 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('join-game', (gameId) => {
      const room = io.sockets.adapter.rooms.get(gameId);
      const numPlayers = room ? room.size : 0;

      if (numPlayers >= 2) {
        socket.emit('error', 'Game is full');
        return;
      }

      socket.join(gameId);
      const symbol = numPlayers === 0 ? 'X' : 'O';
      socket.emit('player-assigned', { symbol });
      console.log(`Player ${socket.id} joined game ${gameId} as ${symbol}`);
    });

    socket.on('make-move', ({ gameId, boardState, currentTurn, winner }) => {
      console.log(`Move made in game ${gameId}`);
      io.to(gameId).emit('update-board', { boardState, currentTurn, winner });
    });

    socket.on('leave-game', (gameId) => {
      socket.leave(gameId);
      console.log(`Player ${socket.id} left game ${gameId}`);
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
    });

    socket.on('set-bet', ({ gameId, betAmount }) => {
      console.log(`Bet set for game ${gameId}: ${betAmount} ETH`);
      io.to(gameId).emit('bet-set', { amount: betAmount });
    });
  });

  res.end();
}