import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ServiceWorkerRegistration } from "@/components/ui/pwa";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-dm-sans" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono" });

// Inlined to avoid "Cannot access appleWebApp.startupImage on the server" (Next.js metadata + imported object)
export const metadata: Metadata = {
  title: "REPLAYD — Log Every Game",
  description: "The diary for football fans. Log every game you watch, rate it as a spectacle, write reviews, build lists.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "REPLAYD",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-black font-sans text-white antialiased grain">
        <ServiceWorkerRegistration />
        <Nav />
        <main className="main-content pb-20 md:pb-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
