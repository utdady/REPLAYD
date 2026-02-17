import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/nav";
import { BottomNav } from "@/components/layout/bottom-nav";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-dm-sans" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono" });

export const metadata: Metadata = {
  title: "REPLAYD — Log Every Match",
  description: "The diary for football fans. Log every match you watch, rate it as a spectacle, write reviews, build lists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-black font-sans text-white antialiased grain">
        <Nav />
        <main className="pb-20 md:pb-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
