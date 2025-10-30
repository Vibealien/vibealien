import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SessionMonitor } from "@/components/session/SessionMonitor";
import { Toaster } from "react-hot-toast";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "VibeAlien - Code Beyond Earth 👽",
  description: "Build Solana programs with AI-powered intelligence and real-time collaboration",
  keywords: ["Solana", "Blockchain", "IDE", "AI", "Collaboration", "Web3", "Smart Contracts"],
  authors: [{ name: "VibeAlien Team" }],
  openGraph: {
    title: "VibeAlien - Code Beyond Earth",
    description: "Build Solana programs with AI-powered intelligence and real-time collaboration",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${orbitron.variable} ${inter.variable} antialiased bg-[#0C0C1E] text-white`}
      >
        <WalletProvider>
          <SessionMonitor />
          <Navbar />
          <main className="min-h-screen pt-16">
            {children}
          </main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1E1E3F',
                color: '#fff',
                border: '1px solid rgba(123, 47, 247, 0.3)',
              },
              success: {
                iconTheme: {
                  primary: '#00FFA3',
                  secondary: '#1E1E3F',
                },
              },
            }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
