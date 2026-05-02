import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, CheckCircle2, Clock, Shield, Star, Zap,
  Camera, Utensils, Music, Mic2, Flower2, Radio, Tent,
  Lock, Car, Palette, ShieldCheck, Tv, ChevronRight,
} from "lucide-react";

const CATEGORIES = [
  { icon: Utensils, label: "Catering", desc: "Full-service catering for any event size" },
  { icon: Camera, label: "Photography", desc: "Professional event photography" },
  { icon: Tv, label: "Videography", desc: "Cinematic event videos" },
  { icon: Mic2, label: "MC / Emcee", desc: "Experienced master of ceremonies" },
  { icon: Flower2, label: "Floristry", desc: "Floral arrangements & décor" },
  { icon: Radio, label: "AV & Technical", desc: "Sound, lighting, and staging" },
  { icon: Tent, label: "Tent & Furniture", desc: "Marquees, tables, chairs" },
  { icon: ShieldCheck, label: "Security", desc: "Event security personnel" },
  { icon: Music, label: "Entertainment", desc: "Live bands, DJs, performers" },
  { icon: Palette, label: "Décor", desc: "Themed décor and styling" },
  { icon: Car, label: "Transportation", desc: "Guest transfers and logistics" },
  { icon: Lock, label: "And More", desc: "Hundreds of vetted specialists" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Submit your event brief",
    desc: "Tell us about your event — date, venue, guest count, and which services you need. Takes under 5 minutes.",
    color: "bg-primary",
  },
  {
    step: "02",
    title: "Receive 3 competing quotes",
    desc: "Up to 3 vetted vendors per service submit structured, itemised quotes within 4 hours — guaranteed.",
    color: "bg-emerald-600",
  },
  {
    step: "03",
    title: "Book and pay securely",
    desc: "Compare side-by-side, accept the best quote, and pay through our escrow system. Funds release on delivery.",
    color: "bg-violet-600",
  },
];

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Vetted vendors only",
    desc: "Every vendor on the platform is individually reviewed and approved by our team before they can receive a single quote request.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Zap,
    title: "4-hour quote guarantee",
    desc: "No more chasing vendors for days. Our platform enforces a 4-hour response window — or the request goes to the next vendor.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Escrow-protected payments",
    desc: "Your money is held securely in escrow and only released to the vendor after you confirm the service was delivered as promised.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
];

const TESTIMONIALS = [
  {
    quote: "We used to spend a week getting quotes for our annual conference. Now it takes an afternoon. The quality of vendors is exceptional.",
    author: "Wanjiru M.",
    role: "Events Manager, Safaricom PLC",
    initials: "WM",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    quote: "The structured quoting format means we can actually compare apples to apples. No more guessing what's included.",
    author: "David K.",
    role: "Corporate Affairs, KCB Group",
    initials: "DK",
    color: "bg-blue-100 text-blue-800",
  },
  {
    quote: "As a catering vendor, this platform has tripled our corporate bookings. The escrow payment gives us confidence too.",
    author: "Amina A.",
    role: "Owner, Savanna Catering Co.",
    initials: "AA",
    color: "bg-amber-100 text-amber-800",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground antialiased">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="px-6 lg:px-12 h-18 py-4 flex items-center justify-between border-b border-border/40 sticky top-0 bg-background/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-base shadow-sm">N</div>
          <span className="text-lg font-bold tracking-tight">Nairobi Events</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-medium text-muted-foreground hover:text-foreground">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-semibold shadow-sm gap-1">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-background to-orange-50/30 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent pointer-events-none" />
          <div className="container px-4 md:px-8 mx-auto text-center max-w-5xl relative">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-semibold border-primary/30 text-primary bg-primary/5 gap-1.5">
              <Zap className="h-3 w-3" /> 3 vetted quotes · 4 hours guaranteed
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.05] mb-6">
              Nairobi's corporate events,<br />
              <span className="text-primary">done properly.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Replace 15 WhatsApp threads with one platform. Discover vetted vendors, receive structured quotes within 4 hours, and pay securely through escrow.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-10 text-base font-semibold w-full sm:w-auto shadow-lg gap-2">
                  Start Planning Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="lg" variant="outline" className="h-14 px-10 text-base font-semibold w-full sm:w-auto bg-background gap-2">
                  Join as a Vendor
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg mx-auto">
              {[
                { value: "200+", label: "Vetted Vendors" },
                { value: "< 4hrs", label: "Quote Response" },
                { value: "47", label: "Cities Covered" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl font-black text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social Proof Strip ─────────────────────────────────────────────── */}
        <div className="border-y border-border/50 bg-muted/20 py-4">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground font-medium">
            {[
              { icon: CheckCircle2, text: "No setup fees" },
              { icon: CheckCircle2, text: "Quotes in writing, not WhatsApp" },
              { icon: CheckCircle2, text: "Pay only after delivery" },
              { icon: CheckCircle2, text: "Every vendor individually vetted" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── How It Works ───────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">How it works</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              From idea to booked vendor in a single afternoon.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, color }) => (
              <div key={step} className="relative">
                <div className={`${color} text-white w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black mb-5 shadow-sm`}>
                  {step}
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Value Props ────────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-muted/20 border-y border-border/40">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Built for serious event planners</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Every feature designed around the real problems of corporate event planning in Kenya.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {VALUE_PROPS.map(({ icon: Icon, title, desc, color, bg }) => (
                <div key={title} className="bg-card border border-border rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`${bg} w-12 h-12 rounded-xl flex items-center justify-center mb-5`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Categories ─────────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Every service, one platform</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              From catering to AV, floristry to transportation — find vetted specialists for every aspect of your event.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="group border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md hover:bg-primary/3 transition-all cursor-default"
              >
                <div className="bg-muted group-hover:bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors">
                  <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ───────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-muted/20 border-y border-border/40">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Trusted by Nairobi's top organisations</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ quote, author, role, initials, color }) => (
                <div key={author} className="bg-card border border-border rounded-2xl p-7 shadow-sm flex flex-col">
                  <div className="flex gap-1 mb-5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed flex-1 mb-6">"{quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`${color} w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{author}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vendor CTA ─────────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-10 md:p-16 text-center">
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5 text-xs font-semibold">
              For Vendors
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Grow your events business
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
              Get matched with qualified corporate event planners, submit structured quotes, and receive secure payments through escrow. Apply once, get vetted, start winning.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-13 px-8 font-semibold gap-2 shadow-sm">
                  Apply as a Vendor
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
              {["Free to join", "No monthly fees", "Secure escrow payments"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────────────── */}
        <section className="bg-foreground text-background py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Ready to plan your next event?
            </h2>
            <p className="text-lg opacity-70 max-w-lg mx-auto mb-10 leading-relaxed">
              Join hundreds of event planners who have replaced chaotic WhatsApp threads with structured, professional event management.
            </p>
            <Link href="/sign-up">
              <Button
                size="lg"
                className="h-14 px-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg"
              >
                Get Started — It's Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-5 text-xs opacity-40">No credit card required · Setup in minutes</p>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10">
        <div className="container px-4 md:px-8 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-black text-sm">N</div>
            <span className="font-bold text-sm">Nairobi Events Marketplace</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="/sign-up"><span className="hover:text-foreground transition-colors cursor-pointer">For Planners</span></Link>
            <Link href="/sign-up"><span className="hover:text-foreground transition-colors cursor-pointer">For Vendors</span></Link>
            <Link href="/sign-in"><span className="hover:text-foreground transition-colors cursor-pointer">Sign In</span></Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nairobi Events Marketplace
          </p>
        </div>
      </footer>
    </div>
  );
}
