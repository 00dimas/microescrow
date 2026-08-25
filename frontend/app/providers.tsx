"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";

const config = createConfig({ chains: [sepolia], connectors: [injected()], transports: { [sepolia.id]: http() }, ssr: true });
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></WagmiProvider>;
}
