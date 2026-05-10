import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getCurrentUser } from "@/lib/auth";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const bebas = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Veteranos · Football Match Organizer",
  description:
    "Organize your football matches, sign-ups, waitlists and balanced teams. Modern, dynamic, always up to date.",
  applicationName: "Veteranos",
  // iOS-specific tags — Next renders these as <meta apple-mobile-web-app-*>.
  appleWebApp: {
    capable: true,
    title: "Veteranos",
    statusBarStyle: "black-translucent",
  },
  // iOS uses <link rel="apple-touch-icon">. Next emits this from metadata.
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#07120a",
  width: "device-width",
  initialScale: 1,
  // Keeps the app's chrome consistent when launched in standalone mode.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header
          user={
            user
              ? {
                  email: user.email,
                  role: user.role,
                  playerName: user.player ? `${user.player.firstName} ${user.player.lastName}` : null,
                }
              : null
          }
        />
        <main className="flex-1 w-full">{children}</main>
        <footer className="mt-16 border-t border-border/60 py-8 text-center text-xs text-subtle">
          <span className="font-display tracking-widest text-pitch-400">VETERANOS</span> · Built with Next.js, Prisma & love for the game
        </footer>
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
