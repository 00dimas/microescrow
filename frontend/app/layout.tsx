import "./styles.css";
import { Providers } from "./providers";

export const metadata = { title: "MicroEscrow", description: "Escrow milestone di Sepolia" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><Providers>{children}</Providers></body></html>;
}
