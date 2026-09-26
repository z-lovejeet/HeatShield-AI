import type { Metadata } from "next";
import {
  Space_Grotesk,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HeatShield AI — Urban Thermal Intelligence & Microclimate Simulation",
  description:
    "High-resolution urban heat island telemetry and predictive cooling intervention workbench.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${spaceGrotesk.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-[#060809] text-[#F4F6F7] min-h-[100dvh] flex flex-col antialiased selection:bg-emerald-500/25 selection:text-emerald-200">
        {/* Subtle Single-Tone Ambient Atmosphere (Fixed, GPU-safe) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div className="absolute -top-[28rem] left-1/2 -translate-x-1/2 w-[72rem] h-[42rem] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.055)_0%,rgba(6,8,9,0)_70%)]" />
        </div>

        <Header />
        <main className="relative z-10 flex-1">{children}</main>
      </body>
    </html>
  );
}
