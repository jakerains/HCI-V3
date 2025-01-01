import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";

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
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-background">
        <ThemeProvider>
          <div className="min-h-screen">
            <Toaster />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
