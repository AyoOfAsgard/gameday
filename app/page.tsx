'use client'

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ConnectButton } from '@rainbow-me/rainbowkit';

const config = getDefaultConfig({
  appName: 'Gameday',
  projectId: 'c7f075b8de01f37550265869748cc899',
  chains: [base],
  ssr: true,
});

const queryClient = new QueryClient();

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

const Gameday = () => {
  return <ConnectButton label="Sign in"/>;
};
