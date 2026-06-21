import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { NotificationPrompt } from "@/components/pwa/notification-prompt";
import { BottomNav } from "@/components/bottom-nav";
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
    <html lang="en" className={`${inter.variable} ${bebas.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: [
          "(function(){try{",
          "var r=document.documentElement,t=localStorage.getItem('theme')||'light',d=t==='dark'||(t==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);",
          "r.classList.toggle('dark',d);",
          "var c=localStorage.getItem('club-theme');",
          "if(!c)return;",
          "var o=JSON.parse(c);",
          "if(!o.slug||o.slug==='none')return;",
          // Helpers
          "function hx(v){return Math.round(v).toString(16).padStart(2,'0')}",
          "function mx(cr,cg,cb,w){return'#'+hx(cr+(255-cr)*w)+hx(cg+(255-cg)*w)+hx(cb+(255-cb)*w)}",
          "function dk(cr,cg,cb,a){return'#'+hx(cr*(1-a))+hx(cg*(1-a))+hx(cb*(1-a))}",
          "function ra(cr,cg,cb,a){return'rgba('+cr+','+cg+','+cb+','+a+')'}",
          // Parse primary
          "var h=o.primary.replace('#',''),pr=parseInt(h.slice(0,2),16),pg=parseInt(h.slice(2,4),16),pb=parseInt(h.slice(4,6),16);",
          // Luminance check — swap to secondary if primary is too light
          "var lum=0.2126*(pr/255)+0.7152*(pg/255)+0.0722*(pb/255);",
          "if(lum>0.7&&o.secondary){var sh=o.secondary.replace('#',''),sr=parseInt(sh.slice(0,2),16),sg=parseInt(sh.slice(2,4),16),sb=parseInt(sh.slice(4,6),16);var sl=0.2126*(sr/255)+0.7152*(sg/255)+0.0722*(sb/255);if(sl<0.7){pr=sr;pg=sg;pb=sb;lum=sl}}",
          "var ph='#'+hx(pr)+hx(pg)+hx(pb);",
          "var s=r.style;",
          // Palette
          "if(d){",
          "s.setProperty('--p50',mx(pr,pg,pb,.95));s.setProperty('--p100',mx(pr,pg,pb,.88));s.setProperty('--p200',mx(pr,pg,pb,.75));s.setProperty('--p300',mx(pr,pg,pb,.55));s.setProperty('--p400',mx(pr,pg,pb,.35));s.setProperty('--p500',ph);s.setProperty('--p600',dk(pr,pg,pb,.2));s.setProperty('--p700',dk(pr,pg,pb,.45));s.setProperty('--p800',dk(pr,pg,pb,.6));s.setProperty('--p900',dk(pr,pg,pb,.75));",
          "s.setProperty('--accent',mx(pr,pg,pb,.55));s.setProperty('--accent-2',mx(pr,pg,pb,.35));",
          "s.setProperty('--body-gradient-a',ra(pr,pg,pb,0.1));s.setProperty('--body-gradient-b',ra(pr,pg,pb,0.12));",
          "var dr=Math.round(pr*0.25),dg=Math.round(pg*0.25),db=Math.round(pb*0.25);",
          "s.setProperty('--surface',mx(dr,dg,db,.7));s.setProperty('--surface-2',mx(dr,dg,db,.6));",
          "s.setProperty('--border',mx(pr,pg,pb,.78));",
          "s.setProperty('--glass-from',ra(Math.round(pr*0.3),Math.round(pg*0.3),Math.round(pb*0.3),0.6));",
          "s.setProperty('--glass-to',ra(Math.round(pr*0.2),Math.round(pg*0.2),Math.round(pb*0.2),0.7));",
          "s.setProperty('--stripe-a',ra(pr,pg,pb,0.03));s.setProperty('--stripe-b',ra(pr,pg,pb,0.06));",
          "}else{",
          "s.setProperty('--p50',dk(pr,pg,pb,.65));s.setProperty('--p100',dk(pr,pg,pb,.45));s.setProperty('--p200',dk(pr,pg,pb,.25));s.setProperty('--p300',ph);s.setProperty('--p400',ph);s.setProperty('--p500',ph);s.setProperty('--p600',mx(pr,pg,pb,.25));s.setProperty('--p700',mx(pr,pg,pb,.82));s.setProperty('--p800',mx(pr,pg,pb,.88));s.setProperty('--p900',mx(pr,pg,pb,.93));",
          "s.setProperty('--accent',dk(pr,pg,pb,.1));s.setProperty('--accent-2',dk(pr,pg,pb,.25));",
          "s.setProperty('--body-gradient-a',ra(pr,pg,pb,0.1));s.setProperty('--body-gradient-b',ra(pr,pg,pb,0.07));",
          "s.setProperty('--surface',mx(pr,pg,pb,.85));s.setProperty('--surface-2',mx(pr,pg,pb,.78));",
          "s.setProperty('--border',mx(pr,pg,pb,.75));",
          "s.setProperty('--glass-from',ra(Math.round(pr+(255-pr)*0.92),Math.round(pg+(255-pg)*0.92),Math.round(pb+(255-pb)*0.92),0.82));",
          "s.setProperty('--glass-to',ra(Math.round(pr+(255-pr)*0.95),Math.round(pg+(255-pg)*0.95),Math.round(pb+(255-pb)*0.95),0.9));",
          "s.setProperty('--stripe-a',ra(pr,pg,pb,0.03));s.setProperty('--stripe-b',ra(pr,pg,pb,0.05));",
          "}",
          // Common
          "s.setProperty('--club-primary',ph);s.setProperty('--club-primary-raw',pr+','+pg+','+pb);",
          "s.setProperty('--club-secondary',o.secondary);",
          "s.setProperty('--selection-bg',ph);",
          "s.setProperty('--ring-glow',ra(pr,pg,pb,0.4));",
          "s.setProperty('--border-strong',d?mx(pr,pg,pb,.35):dk(pr,pg,pb,.15));",
          "s.setProperty('--glass-border',ra(pr,pg,pb,0.35));",
          "s.setProperty('--btn-primary-text',lum>0.4?'#0a0a0a':'#ffffff');",
          "if(o.tertiary){s.setProperty('--club-tertiary',o.tertiary);r.classList.add('club-tricolor')}",
          "r.classList.add('club-theme');",
          "}catch(e){}})();"
        ].join("") }} />
      </head>
      <body
        className="min-h-full flex flex-col"
        // Reserves space for iOS home indicator and Android gesture bar so
        // bottom-anchored buttons (Sign in, Save, etc.) are reachable when
        // the app runs in standalone / PWA mode with viewport-fit: cover.
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[1100] focus:rounded-lg focus:bg-bg-elevated focus:px-4 focus:py-2 focus:text-foreground focus:ring-2 focus:ring-pitch-500"
        >
          Skip to content
        </a>
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
        <main
          id="main"
          tabIndex={-1}
          className={`flex-1 w-full focus:outline-none ${user ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0" : ""}`}
        >
          {children}
        </main>
        <footer className="mt-16 border-t border-border/60 py-8 text-center text-xs text-subtle">
          <span className="font-display tracking-widest text-pitch-400">VETERANOS</span> · Built with Next.js, Prisma & love for the game
        </footer>
        {user && <BottomNav isAdmin={user.role === "ADMIN"} />}
        <ServiceWorkerRegister />
        <InstallPrompt />
        <NotificationPrompt />
      </body>
    </html>
  );
}
