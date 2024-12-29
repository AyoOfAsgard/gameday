'use client'

import '@rainbow-me/rainbowkit/styles.css';
import { useEffect, useState } from 'react';
import { getDefaultConfig, RainbowKitProvider} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

let socket: Socket;

// Initialize socket connection once
const initSocket = () => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    socket = io(socketUrl, {
      path: '/api/socket',
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    console.log('Socket initialized with URL:', socketUrl);
  }
  return socket;
};

const config = getDefaultConfig({
  appName: 'Gameday',
  projectId: 'c7f075b8de01f37550265869748cc899',
  chains: [base],
  ssr: true,
});

const queryClient = new QueryClient();

const calculateWinner = (board: (string | null)[][]) => {
  const lines = [
    ...board,
    ...board[0].map((_, col) => board.map((row) => row[col])),
    [board[0][0], board[1][1], board[2][2]],
    [board[0][2], board[1][1], board[2][0]],
  ];

  for (const line of lines) {
    if (line.every(cell => cell === 'X')) return 'X';
    if (line.every(cell => cell === 'O')) return 'O';
  }

  if (board.flat().every(cell => cell !== null)) return 'Draw';
  return null;
};

const useSocket = (gameId: string) => {
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    const socket = initSocket();

    if (gameId) {
      socket.emit('join-game', gameId);

      socket.on('update-board', ({ boardState, currentTurn, winner }) => {
        setBoard(boardState);
        setCurrentPlayer(currentTurn);
        setWinner(winner);
      });
    }

    return () => {
      socket.off('update-board');
      socket.emit('leave-game', gameId);
    };
  }, [gameId]);

  const makeMove = (row: number, col: number) => {
    if (!board[row][col] && !winner) {
      const updatedBoard = board.map((r, i) =>
        i === row ? r.map((cell, j) => (j === col ? currentPlayer : cell)) : r
      );

      const nextTurn = currentPlayer === 'X' ? 'O' : 'X';

      const winner = calculateWinner(updatedBoard);
      setBoard(updatedBoard);
      setCurrentPlayer(nextTurn);
      setWinner(winner);

      initSocket().emit('make-move', {
        gameId,
        boardState: updatedBoard,
        currentTurn: nextTurn,
        winner,
      });
    }
  };

  return { board, currentPlayer, winner, makeMove };
};



export default function Home() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Gameday />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


const generateGameId = () => {
  return Math.random().toString(36).substring(2, 6);
};

const buttonStyle = {
  backgroundColor: '#FFA500', // Light Orange
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 500,
  transition: 'background-color 0.2s'
};

const inputStyle = {
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #E5E7EB',
  marginBottom: '10px',
  width: '200px',
  fontSize: '16px'
};

const Gameday = () => {
  const [gameId, setGameId] = useState('');
  const [joinId, setJoinId] = useState('');
  const { board, currentPlayer, winner, makeMove } = useSocket(gameId);

  const createGame = () => {
    const id = generateGameId();
    setGameId(id);
  };

  const joinGame = () => {
    setGameId(joinId);
  };

  const resetGame = () => {
    setGameId('');
    initSocket().emit('reset-game', { gameId });
  };

  const handleCellClick = (row: number, col: number) => {
    if (winner || board[row][col]) return; 
    makeMove(row, col);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <ConnectButton label="Sign in" />
      {!gameId && (
        <div>
          <button onClick={createGame} style={buttonStyle}>
            Create Game
          </button>
          <input
            type="text"
            placeholder="Enter Game ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            style={inputStyle}
          />
          <button onClick={joinGame} style={buttonStyle}>
            Join Game
          </button>
        </div>
      )}
      {gameId && (
        <div>
          <p>Game ID: {gameId}</p>
          {winner ? (
            <div>
              <h2>{winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}`}</h2>
              <button onClick={resetGame} style={buttonStyle}>
                Start New Game
              </button>
            </div>
          ) : (
            <div>
              <h2>Current Player: {currentPlayer}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '10px' }}>
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      style={{
                        width: '100px',
                        height: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #ccc',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        cursor: cell || winner ? 'not-allowed' : 'pointer',
                        backgroundColor: cell ? '#f9f9f9' : '#fff',
                      }}
                    >
                      {cell}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};