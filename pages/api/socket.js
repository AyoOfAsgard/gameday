import { Server } from 'socket.io';

let io;

export default function handler(req, res) {
  if (!io) {
    io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('Player connected:', socket.id);

      socket.on('join-game', (gameId) => {
        socket.join(gameId);
        console.log(`Player ${socket.id} joined game ${gameId}`);
        console.log('Current rooms:', socket.rooms);
      });

      socket.on('set-bet', (data) => {
        console.log('Received bet update request:', data);
        console.log('Broadcasting to room:', data.gameId);
        io.to(data.gameId).emit('update-bet', data);
        console.log(`Bet update sent in game ${data.gameId}: $${data.betAmount}`);
      });

      socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}