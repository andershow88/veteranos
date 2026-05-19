import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { NotificationPrompt } from "@/components/pwa/notification-prompt";
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
  // Without this Chrome on Android won't recognize the page as installable
  // and beforeinstallprompt never fires.
  manifest: "/manifest.webmanifest",
  // iOS-specific tags — Next renders these as <meta apple-mobile-web-app-*>.
  appleWebApp: {
    capable: true,
    title: "Veteranos",
    statusBarStyle: "black-translucent",
  },
  // iOS uses <link rel="apple-touch-icon">. Next emits this from metadata.
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0c1616",
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
    <html lang="en" className={`${inter.variable} ${bebas.variable} h-full antialiased dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var r=document.documentElement,t=localStorage.getItem('theme'),d=t?t==='dark':true;r.classList.toggle('dark',d);var c=localStorage.getItem('club-theme');if(c){var o=JSON.parse(c);if(o.slug&&o.slug!=='none'){var h=o.primary.replace('#',''),pr=parseInt(h.slice(0,2),16),pg=parseInt(h.slice(2,4),16),pb=parseInt(h.slice(4,6),16);function mx(cr,cg,cb,w){return'#'+[cr+(255-cr)*w,cg+(255-cg)*w,cb+(255-cb)*w].map(function(v){return Math.round(v).toString(16).padStart(2,'0')}).join('')}function dk(cr,cg,cb,a){return'#'+[cr*(1-a),cg*(1-a),cb*(1-a)].map(function(v){return Math.round(v).toString(16).padStart(2,'0')}).join('')}var s=r.style;if(d){s.setProperty('--p50',mx(pr,pg,pb,.95));s.setProperty('--p100',mx(pr,pg,pb,.88));s.setProperty('--p200',mx(pr,pg,pb,.75));s.setProperty('--p300',mx(pr,pg,pb,.55));s.setProperty('--p400',mx(pr,pg,pb,.35));s.setProperty('--p500',o.primary);s.setProperty('--p600',dk(pr,pg,pb,.2));s.setProperty('--p700',dk(pr,pg,pb,.45));s.setProperty('--p800',dk(pr,pg,pb,.6));s.setProperty('--p900',dk(pr,pg,pb,.75));s.setProperty('--accent',mx(pr,pg,pb,.55));s.setProperty('--accent-2',mx(pr,pg,pb,.35))}else{s.setProperty('--p50',dk(pr,pg,pb,.7));s.setProperty('--p100',dk(pr,pg,pb,.55));s.setProperty('--p200',dk(pr,pg,pb,.35));s.setProperty('--p300',dk(pr,pg,pb,.15));s.setProperty('--p400',o.primary);s.setProperty('--p500',o.primary);s.setProperty('--p600',mx(pr,pg,pb,.35));s.setProperty('--p700',mx(pr,pg,pb,.88));s.setProperty('--p800',mx(pr,pg,pb,.92));s.setProperty('--p900',mx(pr,pg,pb,.96));s.setProperty('--accent',dk(pr,pg,pb,.15));s.setProperty('--accent-2',dk(pr,pg,pb,.3))}s.setProperty('--club-primary',o.primary);s.setProperty('--club-secondary',o.secondary);s.setProperty('--selection-bg',o.primary);s.setProperty('--ring-glow','rgba('+pr+','+pg+','+pb+',0.4)');s.setProperty('--border-strong',d?mx(pr,pg,pb,.35):dk(pr,pg,pb,.15));s.setProperty('--glass-border','rgba('+pr+','+pg+','+pb+',0.35)');r.classList.add('club-theme')}}}catch(e){}})()` }} />
      </head>
      <body
        className="min-h-full flex flex-col"
        // Reserves space for iOS home indicator and Android gesture bar so
        // bottom-anchored buttons (Sign in, Save, etc.) are reachable when
        // the app runs in standalone / PWA mode with viewport-fit: cover.
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
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
        <NotificationPrompt />
      </body>
    </html>
  );
}
