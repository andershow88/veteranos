import {
  BookOpen,
  Rocket,
  Users,
  CalendarDays,
  CheckCircle2,
  Wallet,
  UserCircle,
  KeyRound,
  Smartphone,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
  Trophy,
  Lock,
  Camera,
  Link as LinkIcon,
  AlertTriangle,
  Send,
  X,
  Check,
  ListPlus,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Handout · Veteranos",
};

type TocItem = { id: string; label: string; icon: React.ReactNode };

const TOC: TocItem[] = [
  { id: "quick-start", label: "Quick start", icon: <Rocket className="h-3.5 w-3.5" /> },
  { id: "player-types", label: "Player types", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "browsing-matches", label: "Browsing matches", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { id: "signing-up", label: "Signing up", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { id: "replacements-payments", label: "Replacements & payments", icon: <Wallet className="h-3.5 w-3.5" /> },
  { id: "your-profile", label: "Your profile", icon: <UserCircle className="h-3.5 w-3.5" /> },
  { id: "forgot-password", label: "Forgot password", icon: <KeyRound className="h-3.5 w-3.5" /> },
  { id: "install-app", label: "Install as app", icon: <Smartphone className="h-3.5 w-3.5" /> },
  { id: "admin", label: "Admin features", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: "tips", label: "Tips & gotchas", icon: <Lightbulb className="h-3.5 w-3.5" /> },
];

export default function HandoutPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-12">
      <header className="mb-6 sm:mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-pitch-300">
          <BookOpen className="h-4 w-4" /> User Guide
        </div>
        <h1 className="font-display text-3xl sm:text-5xl tracking-wide mt-2">Handout</h1>
        <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
          Everything Veteranos can do, how to use it, and the few non-obvious things worth
          knowing.
        </p>
      </header>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-auto scrollbar-thin -mx-4 sm:mx-0">
          <div className="lg:rounded-2xl lg:border lg:border-border-strong/60 lg:bg-surface/40 lg:p-4">
            <div className="hidden lg:block text-[11px] font-bold uppercase tracking-[0.25em] text-pitch-300 px-1.5 mb-2">
              Contents
            </div>
            <nav className="flex lg:flex-col gap-1.5 lg:gap-1 overflow-x-auto lg:overflow-visible scrollbar-thin px-4 sm:px-0">
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm font-medium text-foreground/80 hover:text-foreground bg-surface/60 lg:bg-transparent border border-border/50 lg:border-0 hover:bg-surface-2 transition shrink-0"
                >
                  <span className="text-pitch-300">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-10 sm:space-y-12 min-w-0">
          <Section
            id="quick-start"
            icon={<Rocket className="h-5 w-5" />}
            title="Quick start"
            subtitle="What Veteranos is and how to get going in two minutes."
          >
            <p>
              Veteranos is the place where the team organises every kick-around: who&apos;s
              playing, who can&apos;t make it, who&apos;s on the waitlist, and (when there are
              enough players) automatically generated balanced teams.
            </p>
            <Steps>
              <Step n={1}>
                <strong>Get an invitation.</strong> An admin shares a link such as{" "}
                <code className="inline-block max-w-full break-all rounded bg-surface-2 px-1.5 py-0.5 text-xs">
                  https://veteranos.club/register?invite=…
                </code>
                . Without that link the registration page won&apos;t accept you.
              </Step>
              <Step n={2}>
                <strong>Register.</strong> Fill in first name, last name, email, password, and
                pick whether you join as <em>Subscriber</em> or <em>Waitlist</em>. The other fields
                are optional.
              </Step>
              <Step n={3}>
                <strong>You&apos;re in.</strong> Open the homepage to see all upcoming matches
                and confirm or decline.
              </Step>
            </Steps>
            <Callout tone="info" icon={<Lightbulb className="h-4 w-4" />}>
              Skills, position, rank and admin notes are <strong>set by an admin</strong> after you
              register — players can&apos;t edit those themselves.
            </Callout>
          </Section>

          <Section
            id="player-types"
            icon={<Users className="h-5 w-5" />}
            title="Player types"
            subtitle="Two kinds of players, with very different sign-up rules."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <FeatureCard
                title="Subscriber"
                badge={<Badge tone="success">Fixed slot</Badge>}
                points={[
                  "Has a guaranteed seat in every match by default.",
                  "Per match they confirm In or Can't make it.",
                  "If they decline, a waitlist player can step into their spot.",
                  "PayPal info on the profile lets the replacement pay them back.",
                ]}
              />
              <FeatureCard
                title="Waitlist"
                badge={<Badge tone="info">Per-match opt-in</Badge>}
                points={[
                  "No fixed seat. Has to actively join the waitlist of each match.",
                  "When an abo declines, the first waitlist player on the list steps in.",
                  "Owes the abo for the slot — payment workflow takes care of tracking it.",
                  "Multiple waitlisters: they fill in declines in order (1st replaces 1st out, …).",
                ]}
              />
            </div>
            <p>
              Admins can flip you from Subscriber to Waitlist (or back) any time on the player edit
              screen. The role you picked at registration is just the starting point.
            </p>
          </Section>

          <Section
            id="browsing-matches"
            icon={<CalendarDays className="h-5 w-5" />}
            title="Browsing matches"
            subtitle="What the homepage shows and how to read it."
          >
            <p>
              The homepage lists every upcoming match as a card. Each card has up to five
              sections, all with player counts:
            </p>
            <Table
              rows={[
                ["Confirmed", "Subscribers who said In and are playing.", <Badge tone="success" key="c">In</Badge>],
                ["Declined", "Subscribers who said they can't make it.", <Badge tone="danger" key="d">Out</Badge>],
                ["Replacements", "Pairs of (subscriber who declined) → (waitlist player stepping in).", <Badge tone="info" key="r">→</Badge>],
                ["Waitlist", "Everyone who signed up via the waitlist, in order.", <Badge tone="default" key="w">Queue</Badge>],
              ]}
            />
            <p>
              Tap <strong>Match details &rarr;</strong> at the bottom of a card to open the full
              match page. There you also see the <strong>generated teams</strong> once an admin has
              created them.
            </p>
            <Callout tone="info" icon={<Trophy className="h-4 w-4" />}>
              The match-detail page only shows the back link — the &ldquo;Match details&rdquo; link is hidden
              when you&apos;re already on it.
            </Callout>
          </Section>

          <Section
            id="signing-up"
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Signing up for a match"
            subtitle="Two-tap confirm or decline, depending on your role."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <FeatureCard
                title="As a Subscriber"
                points={[
                  <span key="in"><Check className="inline h-3.5 w-3.5 text-pitch-300" /> <strong>I&apos;m in</strong> &mdash; confirms your slot.</span>,
                  <span key="out"><X className="inline h-3.5 w-3.5 text-danger-ink" /> <strong>Can&apos;t make it</strong> &mdash; frees your slot for the waitlist.</span>,
                  "You can flip your answer until the admin locks the match.",
                ]}
              />
              <FeatureCard
                title="As Waitlist"
                points={[
                  <span key="join"><ListPlus className="inline h-3.5 w-3.5 text-pitch-300" /> <strong>Join waitlist</strong> &mdash; queues you for that match.</span>,
                  "Your position in the queue follows the order you signed up in.",
                  "If an abo declines and you're high enough, you step in automatically.",
                  "You can Leave the waitlist as long as the match isn't locked.",
                ]}
              />
            </div>
            <Callout tone="warn" icon={<Lock className="h-4 w-4" />}>
              When the admin <strong>locks</strong> a match, sign-ups freeze. Subscribers can no longer change
              their mind, and waitlisters can&apos;t join or leave.
            </Callout>
          </Section>

          <Section
            id="replacements-payments"
            icon={<Wallet className="h-5 w-5" />}
            title="Replacements & payments"
            subtitle="How a waitlist player pays the abo whose slot they took."
          >
            <p>
              When an abo declines and a waitlist player steps in, that&apos;s a <strong>replacement
              pair</strong>. The waitlist player owes the abo for the slot. Veteranos tracks the
              payment in four states:
            </p>
            <Table
              rows={[
                [<Badge tone="default" key="n">No payment</Badge>, "No money is owed (e.g. nobody declined)."],
                [<Badge tone="warn" key="p">Payment pending</Badge>, "Waitlist player still has to pay."],
                [<Badge tone="info" key="c">Awaiting confirmation</Badge>, "Waitlist player marked it as paid; abo hasn't confirmed yet."],
                [<Badge tone="success" key="ok">Paid</Badge>, "Subscriber confirmed receipt. Done."],
              ]}
            />
            <Steps>
              <Step n={1}>
                <strong>Waitlist player</strong> pays the abo using the <em>PayPal</em> link or any
                other channel. If the abo has no PayPal info, just coordinate directly.
              </Step>
              <Step n={2}>
                Tap <strong>Mark as paid</strong> in the replacement row. Status flips to{" "}
                <em>Awaiting confirmation</em>.
              </Step>
              <Step n={3}>
                <strong>Subscriber</strong> sees the same row with <strong>Confirm received</strong> /{" "}
                <strong>Not received</strong> buttons. Tapping confirm flips it to <em>Paid</em>.
              </Step>
            </Steps>
            <Callout tone="info" icon={<Wallet className="h-4 w-4" />}>
              Payment info (status, PayPal link, action buttons) is <strong>only visible to the
              two players involved</strong>. Other players see a clean replacement row without
              any financial detail.
            </Callout>
            <p>
              Your <strong>Profile page</strong> has a Payments card with two lists: <em>You owe</em>{" "}
              and <em>Owed to you</em>. Each entry is clickable and jumps straight to that
              match.
            </p>
          </Section>

          <Section
            id="your-profile"
            icon={<UserCircle className="h-5 w-5" />}
            title="Your profile"
            subtitle="What you can change yourself, and what stays in admin hands."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <FeatureCard
                title="You can edit"
                points={[
                  "First name, last name, nickname.",
                  "Phone, PayPal name, PayPal link.",
                  "Profile photo (Camera icon → choose image → crop / zoom → save).",
                  "Password.",
                ]}
              />
              <FeatureCard
                title="Admin only"
                points={[
                  "Player type (Subscriber / Waitlist).",
                  "Order / rank inside the list.",
                  "Position (goalkeeper, defender, midfielder, striker).",
                  "Skills (overall, technique, speed, stamina, defense, offense, passing, shooting, goalkeeping).",
                  "Active flag and admin notes.",
                ]}
              />
            </div>
            <Callout tone="info" icon={<Camera className="h-4 w-4" />}>
              The avatar uploader lets you <strong>pan and zoom</strong> a picture inside the circular
              crop. Saved at 256×256 JPEG, so it stays small.
            </Callout>
          </Section>

          <Section
            id="forgot-password"
            icon={<KeyRound className="h-5 w-5" />}
            title="Forgot password"
            subtitle="Self-service in two steps; admin can also help."
          >
            <Steps>
              <Step n={1}>
                Open <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">/forgot-password</code> (link is on the login screen).
              </Step>
              <Step n={2}>
                Type your <strong>first name + last name</strong>. If they uniquely match a
                player, you immediately get a <strong>Set new password</strong> button to set a fresh
                password.
              </Step>
            </Steps>
            <Callout tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
              If your name doesn&apos;t match (or matches more than one player), the form asks you
              to contact an admin. Admins can <strong>generate a one-hour reset link</strong> for any
              user in <em>Admin → Players → [name]</em>.
            </Callout>
          </Section>

          <Section
            id="install-app"
            icon={<Smartphone className="h-5 w-5" />}
            title="Install as app"
            subtitle="Veteranos is a PWA, so it installs straight from the browser."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <FeatureCard
                title="iPhone (Safari)"
                points={[
                  "Open the site in Safari.",
                  "Tap the Share button (square with up-arrow) in the toolbar.",
                  "Choose Add to Home Screen.",
                  "Veteranos opens in full-screen mode like a native app.",
                ]}
              />
              <FeatureCard
                title="Android (Chrome)"
                points={[
                  "Open the site in Chrome.",
                  "Either tap the Install pill in the bottom-right of the screen,",
                  "or open the Chrome menu → Install app / Add to Home screen.",
                ]}
              />
            </div>
            <Callout tone="info" icon={<Smartphone className="h-4 w-4" />}>
              No app store. Updates roll out automatically — next time you open the app it
              fetches the latest version.
            </Callout>
          </Section>

          <Section
            id="admin"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Admin features"
            subtitle="Everything an admin can do that regular players can't."
          >
            <SubSection title="Players" icon={<Users className="h-4 w-4" />}>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Create / edit / delete players (with or without a login account).</li>
                <li>Edit skills (overall, technique, speed, stamina, defense, offense, passing, shooting, goalkeeping) and preferred position.</li>
                <li>Switch a player between Subscriber and Waitlist, or set them inactive.</li>
                <li>Promote a player to admin or demote them back. Self-demotion and demoting the last admin are blocked.</li>
                <li>Generate a one-hour password reset link for any player.</li>
              </ul>
            </SubSection>

            <SubSection title="Matches" icon={<CalendarDays className="h-4 w-4" />}>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Create matches with date, time, duration, location, team count (2–4) and notes.</li>
                <li>New matches start with an <strong>empty sign-up list</strong> — every player has to actively confirm or decline.</li>
                <li>Lock / unlock a match&apos;s sign-up list.</li>
                <li>Manually add, decline, waitlist or remove a player on a specific match.</li>
                <li>Cycle a payment status manually (Pending → Awaiting confirmation → Paid → Pending).</li>
                <li>Delete a match (with confirmation).</li>
              </ul>
            </SubSection>

            <SubSection title="Team generator" icon={<Trophy className="h-4 w-4" />}>
              <p className="text-sm">
                Builds balanced teams with a <strong>snake draft</strong> followed by ~800 random
                swap attempts that only stick if they reduce the spread between teams.
              </p>
              <Table
                rows={[
                  ["Default size", "5 players per team. So 10 / 15 / 20 for 2 / 3 / 4 teams."],
                  ["Priority", "All IN abos first (by player rank), then waitlist signups (by waitlist rank)."],
                  ["Override", "Use all signed-up players — extras stretch teams (e.g. 6 vs 6 vs 6)."],
                  ["Exclude list", "Tick off individual players to leave them out of this draft."],
                ]}
              />
              <Callout tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
                Generate teams <em>after</em> locking the match — otherwise sign-ups can still
                shift the player pool.
              </Callout>
            </SubSection>

            <SubSection title="Invitations" icon={<LinkIcon className="h-4 w-4" />}>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Create invite links with optional label, max-uses limit, expiry in days.</li>
                <li>Copy the link and share it however you like (group chat, email, …).</li>
                <li>Revoke a link to stop new sign-ups against it; delete to remove the entry.</li>
                <li>Used count is tracked atomically, so two people racing the last slot can&apos;t both register.</li>
              </ul>
            </SubSection>
          </Section>

          <Section
            id="tips"
            icon={<Lightbulb className="h-5 w-5" />}
            title="Tips & gotchas"
            subtitle="Small things that save a lot of confusion."
          >
            <ul className="space-y-2.5 text-sm">
              <Tip icon={<Lock className="h-4 w-4" />}>
                <strong>Lock the match</strong> before generating teams. The lock freezes signups so
                the pool is stable.
              </Tip>
              <Tip icon={<Send className="h-4 w-4" />}>
                <strong>Mark as paid</strong> is on the waitlist player&apos;s side. The abo only sees{" "}
                <em>Confirm received</em> after that.
              </Tip>
              <Tip icon={<ArrowRight className="h-4 w-4" />}>
                Replacement order is <strong>strict</strong>: 1st waitlister fills the 1st declined
                abo, 2nd fills 2nd, etc. Even when admin moves people around manually, the
                pairing stays rank-aligned.
              </Tip>
              <Tip icon={<Users className="h-4 w-4" />}>
                Skills don&apos;t affect sign-ups, only the team generator. So newcomers without
                ratings can still play — admin can fill in skills later.
              </Tip>
              <Tip icon={<Smartphone className="h-4 w-4" />}>
                After installing the app, refresh once to make sure the latest service worker
                is active. The app updates itself silently afterwards.
              </Tip>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers (kept colocated for readability) ---------- */

function Section({
  id,
  icon,
  title,
  subtitle,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 sm:scroll-mt-24 min-w-0">
      <div className="flex items-start gap-3 mb-4">
        <span className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-pitch-700/30 text-pitch-200">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-3xl tracking-wide leading-tight wrap-break-word">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4 text-sm sm:text-base text-foreground/90 leading-relaxed wrap-break-word">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-4 sm:p-5 space-y-3 mt-4">
      <h3 className="font-display text-lg tracking-wide flex items-center gap-2 text-pitch-100">
        <span className="text-pitch-300">{icon}</span>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-2.5">{children}</ol>;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-pitch-700/40 text-pitch-200 text-xs font-bold number-pill">
        {n}
      </span>
      <div className="min-w-0 flex-1 text-sm">{children}</div>
    </li>
  );
}

function Callout({
  tone,
  icon,
  children,
}: {
  tone: "info" | "warn";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls =
    tone === "warn"
      ? "border-warning-line bg-warning-surface text-warning-ink"
      : "border-pitch-600/40 bg-pitch-700/15 text-pitch-100";
  return (
    <div className={`flex items-start gap-3 rounded-xl border ${cls} px-3 py-2.5 text-sm`}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Tip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface/50 px-3 py-2">
      <span className="shrink-0 mt-0.5 text-pitch-300">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

function FeatureCard({
  title,
  badge,
  points,
}: {
  title: string;
  badge?: React.ReactNode;
  points: React.ReactNode[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-xl tracking-wide">{title}</h3>
          {badge}
        </div>
      </CardHeader>
      <CardBody>
        <ul className="space-y-1.5 text-sm">
          {points.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-pitch-300 shrink-0">·</span>
              <span className="min-w-0 flex-1">{p}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function Table({ rows }: { rows: React.ReactNode[][] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[20rem] text-xs sm:text-sm">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border/40 last:border-b-0">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-2.5 sm:px-3 py-2 align-top wrap-break-word ${
                      j === 0 ? "font-semibold text-foreground w-32 sm:w-auto sm:whitespace-nowrap" : "text-muted"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
