import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
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
  appleWebApp: { capable: true, title: "Veteranos", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#07120a",
  width: "device-width",
  initialScale: 1,
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
      </body>
    </html>
  );
}
