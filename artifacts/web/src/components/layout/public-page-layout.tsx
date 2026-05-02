import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface PublicPageLayoutProps {
  children: React.ReactNode;
}

export function PublicPageLayout({ children }: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground antialiased">
      <header className="px-6 lg:px-12 h-18 py-4 flex items-center justify-between border-b border-border/40 sticky top-0 bg-background/90 backdrop-blur-md z-50">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-base shadow-sm">N</div>
            <span className="text-lg font-bold tracking-tight">Nairobi Events</span>
          </div>
        </Link>
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
        {children}
      </main>

      <footer className="border-t border-border py-10">
        <div className="container px-4 md:px-8 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-black text-sm">N</div>
            <span className="font-bold text-sm">Nairobi Events Marketplace</span>
          </div>
          <div className="flex items-center flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/sign-up"><span className="hover:text-foreground transition-colors cursor-pointer">For Planners</span></Link>
            <Link href="/sign-up"><span className="hover:text-foreground transition-colors cursor-pointer">For Vendors</span></Link>
            <Link href="/faq"><span className="hover:text-foreground transition-colors cursor-pointer">FAQ</span></Link>
            <Link href="/terms"><span className="hover:text-foreground transition-colors cursor-pointer">Terms</span></Link>
            <Link href="/privacy"><span className="hover:text-foreground transition-colors cursor-pointer">Privacy</span></Link>
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
