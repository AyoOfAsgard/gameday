import { Server } from 'socket.io';

let io;

export default function handler(req, res) {
  if (!io) {
    io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: ["https://gameday-nine.vercel.app", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["my-custom-header"],
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      upgrade: true,
      cookie: {
        name: "io",
        path: "/",
        httpOnly: true,
        sameSite: "lax"
      }
    });

    io.on('connection', (socket) => {
      console.log('Player connected:', socket.id);

      socket.on('join-game', (gameId) => {
        socket.join(gameId);
        console.log(`Player ${socket.id} joined game ${gameId}`);
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
    });

    res.socket.server.io = io;
  }

  res.end();
}