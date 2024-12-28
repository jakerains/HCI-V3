import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Naval Helm Interface",
  description: "Voice-controlled naval helm interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-950 text-gray-50">
        <Providers>
          <main className="container mx-auto py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
