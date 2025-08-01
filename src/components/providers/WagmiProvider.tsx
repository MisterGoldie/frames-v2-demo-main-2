import { createConfig, http, WagmiProvider, Config } from "wagmi";
import { base, optimism } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { frameConnector } from "~/lib/connector";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config>(() => 
    createConfig({
      chains: [base, optimism],
      transports: {
        [base.id]: http(),
        [optimism.id]: http(),
      },
      connectors: [], // Start with no connectors
    })
  );

  useEffect(() => {
    const checkFrameContext = async () => {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        
        // Ensure SDK is ready
        await sdk.actions.ready();
        
        // Double-check provider is actually available
        if (sdk.wallet?.ethProvider) {
          // Test the provider with a simple call
          try {
            await sdk.wallet.ethProvider.request({ method: "eth_chainId" });
            
            // Only add connector if everything works
            const newConfig = createConfig({
              chains: [base, optimism],
              transports: {
                [base.id]: http(),
                [optimism.id]: http(),
              },
              connectors: [frameConnector()],
            });
            setConfig(newConfig);
          } catch (providerError) {
            console.log("Farcaster wallet provider not responding, wallet features disabled");
          }
        }
      } catch (error) {
        console.log("Not running in frame context, wallet features disabled");
      }
    };

    checkFrameContext();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
