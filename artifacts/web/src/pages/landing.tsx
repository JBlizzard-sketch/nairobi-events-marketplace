import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-xl">N</div>
          <span className="text-xl font-bold tracking-tight text-foreground">Nairobi Events</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/login">
            <Button variant="ghost" className="font-semibold">Sign In</Button>
          </Link>
          <Link href="/login">
            <Button className="font-semibold shadow-sm">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                Nairobi's corporate events, <br/>
                <span className="text-primary">structured and clear.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Replace 15 WhatsApp threads with one single platform. Discover vetted vendors, receive structured quotes within 4 hours, and manage payments securely.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto shadow-md">
                    Start Planning
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto bg-background">
                    Join as Vendor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/20 rounded text-primary flex items-center justify-center font-bold text-xs">N</div>
            <span className="font-semibold text-muted-foreground">Nairobi Events Marketplace</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
