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
import { useAccount } from 'wagmi';

let socket: Socket;


const initSocket = () => {
  if (!socket) {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://gameday-nine.vercel.app'
      : 'http://localhost:3000';

    socket = io(socketUrl, {
      path: '/api/socket',
      withCredentials: true,
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true
    });
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


type Board = (string | null)[][];

const useSocket = (gameId: string) => {
  const [board, setBoard] = useState<Board>([
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ]);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O' | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0);

  useEffect(() => {
    const socket = initSocket();

    if (gameId) {
      socket.emit('join-game', gameId);
      
      socket.on('player-assigned', ({ symbol }) => {
        setPlayerSymbol(symbol);
        setIsMyTurn(symbol === 'X');
      });

      socket.on('update-board', ({ boardState, currentTurn, winner }) => {
        setBoard(boardState as Board);
        setCurrentPlayer(currentTurn);
        setIsMyTurn(currentTurn === playerSymbol);
        setWinner(winner);
      });

      socket.on('bet-set', ({ amount }) => {
        setBetAmount(amount);
      });
    }

    return () => {
      socket.off('update-board');
      socket.off('player-assigned');
      socket.off('bet-set');
      socket.emit('leave-game', gameId);
    };
  }, [gameId, playerSymbol]);

  const makeMove = (row: number, col: number) => {
    if (!board[row][col] && !winner && isMyTurn && playerSymbol) {
      const updatedBoard = board.map((r, i) =>
        i === row ? r.map((cell, j) => (j === col ? playerSymbol : cell)) : r
      );

      const nextTurn = playerSymbol === 'X' ? 'O' : 'X';
      const winner = calculateWinner(updatedBoard);

      setBoard(updatedBoard);
      setCurrentPlayer(nextTurn);
      setIsMyTurn(false);
      setWinner(winner);

      initSocket().emit('make-move', {
        gameId,
        boardState: updatedBoard,
        currentTurn: nextTurn,
        winner,
      });
    }
  };

  return { board, currentPlayer, winner, makeMove, isMyTurn, playerSymbol, betAmount };
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

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  padding: '40px 20px',
  background: 'linear-gradient(to bottom right, #1a1a1a, #2d2d2d)',
  color: '#ffffff'
};

const gameContainerStyle = {
  marginTop: '40px',
  padding: '30px',
  borderRadius: '16px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  width: '100%',
  maxWidth: '500px'
};

const buttonStyle = {
  backgroundColor: '#FFA500',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  margin: '10px',
  width: '200px'
};

const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  width: '200px',
  fontSize: '16px',
  margin: '20px 0',
  outline: 'none',
  transition: 'all 0.2s ease'
};

const boardStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 100px)',
  gap: '10px',
  margin: '30px auto',
  justifyContent: 'center'
};

const cellStyle = {
  width: '100px',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '8px',
  fontSize: '32px',
  fontWeight: 'bold',
  cursor: 'pointer',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'all 0.2s ease',
  color: '#ffffff'
};

const Gameday = () => {
  const { isConnected } = useAccount();
  const [gameId, setGameId] = useState('');
  const [joinId, setJoinId] = useState('');
  const [localBetAmount, setBetAmount] = useState<number>(0);
  const [isBetSet, setIsBetSet] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const { board, currentPlayer, winner, makeMove, isMyTurn, playerSymbol, betAmount: socketBetAmount } = useSocket(gameId);
  const [customAmount, setCustomAmount] = useState<string>('');

  const handleBetSelection = (amount: number) => {
    if (amount > 0) {
      setBetAmount(amount);
      setIsBetSet(true);
      initSocket().emit('set-bet', { gameId, betAmount: amount });
    }
  };

  const handleCustomBetSubmit = () => {
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount > 0) {
      handleBetSelection(amount);
    }
  };

  const createGame = () => {
    const id = generateGameId();
    setGameId(id);
    setIsCreator(true);
  };

  const joinGame = () => {
    setGameId(joinId);
    setIsCreator(false);
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
    <div style={containerStyle}>
      <div style={{ marginBottom: '30px' }}>
        <ConnectButton label="Sign in" />
      </div>

      <div style={gameContainerStyle}>
        {!isConnected ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '20px' }}>Please connect your wallet to play</h2>
          </div>
        ) : !gameId ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Tic Tac Toe</h1>
            <button onClick={createGame} style={buttonStyle}>
              Create Game
            </button>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <p style={{ marginBottom: '10px' }}>- OR -</p>
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
          </div>
        ) : !isBetSet && isCreator ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '20px' }}>Select Bet Amount</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
              {[0.01, 0.05, 0.1].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleBetSelection(amount)}
                  style={buttonStyle}
                >
                  {amount} ETH
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                placeholder="Custom amount (ETH)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                step="0.01"
                min="0.01"
                style={inputStyle}
              />
              <button 
                onClick={handleCustomBetSubmit}
                style={buttonStyle}
                disabled={!customAmount || parseFloat(customAmount) <= 0}
              >
                Set Custom Bet
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '18px' }}>Game ID: <span style={{ color: '#FFA500' }}>{gameId}</span></p>
              <p style={{ fontSize: '18px' }}>Playing as: <span style={{ color: '#FFA500' }}>{playerSymbol}</span></p>
              {socketBetAmount > 0 && (
                <p style={{ fontSize: '18px' }}>Bet Amount: <span style={{ color: '#FFA500' }}>{socketBetAmount} ETH</span></p>
              )}
            </div>

            {winner ? (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>
                  {winner === 'Draw' ? "A Draw!" : `Winner: ${winner}`}
                </h2>
                <button onClick={resetGame} style={buttonStyle}>
                  Start New Game
                </button>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Current Player: {currentPlayer}</h2>
                {!isMyTurn && (
                  <p style={{ color: '#FFA500', marginBottom: '20px' }}>
                    Waiting for other player&apos;s move...
                  </p>
                )}
                <div style={boardStyle}>
                  {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        style={{
                          ...cellStyle,
                          cursor: cell || winner || !isMyTurn ? 'not-allowed' : 'pointer',
                          backgroundColor: cell ? 'rgba(255, 165, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
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
    </div>
  );
};