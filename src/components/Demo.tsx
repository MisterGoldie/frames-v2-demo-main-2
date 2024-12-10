"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import sdk, { type FrameContext } from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
  useChainId,
} from "wagmi";

import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { base } from "wagmi/chains";
import { BaseError, UserRejectedRequestError } from "viem";

type Square = 'X' | 'O' | null;
type Board = Square[];

export default function Demo({ title }: { title?: string } = { title: "Tic-tac-toe Frame" }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  
  // Wallet states from your original component
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  useEffect(() => {
    const load = async () => {
      await sdk.context;
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const handleMove = useCallback((index: number) => {
    if (board[index] || calculateWinner(board)) return;
    
    const newBoard = board.slice();
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  }, [board, isXNext]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  }, []);

  const winner = calculateWinner(board);
  const status = winner 
    ? `Winner: ${winner}`
    : board.every(square => square) 
    ? "Game is a draw!" 
    : `Next player: ${isXNext ? 'X' : 'O'}`;

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-[300px] mx-auto py-4 px-2">
      <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

      <div className="mb-4">
        <div className="text-center mb-2">{status}</div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {board.map((square, index) => (
            <button
              key={index}
              className="w-20 h-20 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl font-bold"
              onClick={() => handleMove(index)}
            >
              {square}
            </button>
          ))}
        </div>
        <Button onClick={resetGame}>Reset Game</Button>
      </div>

      <div>
        <h2 className="font-2xl font-bold">Wallet</h2>
        {address && (
          <div className="my-2 text-xs">
            Address: <pre className="inline">{truncateAddress(address)}</pre>
          </div>
        )}

        {chainId && (
          <div className="my-2 text-xs">
            Chain ID: <pre className="inline">{chainId}</pre>
          </div>
        )}

        <div className="mb-4">
          <Button
            onClick={() =>
              isConnected
                ? disconnect()
                : connect({ connector: config.connectors[0] })
            }
          >
            {isConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>

        {isConnected && (
          <>
            <div className="mb-4">
              <SignMessage />
            </div>
            <div className="mb-4">
              <SendEth />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper function to calculate winner
function calculateWinner(squares: Square[]): Square {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// Add the SignMessage component definition
function SignMessage() {
  const { isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const {
    signMessage,
    data: signature,
    error: signError,
    isError: isSignError,
    isPending: isSignPending,
  } = useSignMessage();

  const handleSignMessage = useCallback(async () => {
    if (!isConnected) {
      await connectAsync({
        chainId: base.id,
        connector: config.connectors[0],
      });
    }

    signMessage({ message: "Hello from Tic-tac-toe Frame!" });
  }, [connectAsync, isConnected, signMessage]);

  return (
    <>
      <Button
        onClick={handleSignMessage}
        disabled={isSignPending}
        isLoading={isSignPending}
      >
        Sign Message
      </Button>
      {isSignError && renderError(signError)}
      {signature && (
        <div className="mt-2 text-xs">
          <div>Signature: {signature}</div>
        </div>
      )}
    </>
  );
}

// Add the SendEth component definition
function SendEth() {
  const { isConnected, chainId } = useAccount();
  const {
    sendTransaction,
    data,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: data,
    });

  const toAddr = useMemo(() => {
    // Protocol guild address
    return chainId === base.id
      ? "0x32e3C7fD24e175701A35c224f2238d18439C7dBC"
      : "0xB3d8d7887693a9852734b4D25e9C0Bb35Ba8a830";
  }, [chainId]);

  const handleSend = useCallback(() => {
    sendTransaction({
      to: toAddr,
      value: 1n,
    });
  }, [toAddr, sendTransaction]);

  return (
    <>
      <Button
        onClick={handleSend}
        disabled={!isConnected || isSendTxPending}
        isLoading={isSendTxPending}
      >
        Send Transaction (eth)
      </Button>
      {isSendTxError && renderError(sendTxError)}
      {data && (
        <div className="mt-2 text-xs">
          <div>Hash: {truncateAddress(data)}</div>
          <div>
            Status:{" "}
            {isConfirming
              ? "Confirming..."
              : isConfirmed
              ? "Confirmed!"
              : "Pending"}
          </div>
        </div>
      )}
    </>
  );
}

// Add the renderError helper function
const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );
    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }
  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};

