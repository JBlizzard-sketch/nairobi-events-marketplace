import { useState } from "react";
import { PublicPageLayout } from "@/components/layout/public-page-layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  id: string;
  label: string;
  color: string;
  items: FaqItem[];
}

const SECTIONS: FaqSection[] = [
  {
    id: "planners",
    label: "For Event Planners",
    color: "bg-primary/10 text-primary border-primary/20",
    items: [
      {
        q: "How does Nairobi Events work?",
        a: "Submit an event brief describing what you need — date, venue, guest count, and which services you're looking for. Up to three vetted vendors per service category will respond with structured, itemised quotes within four hours. You compare them side-by-side, accept the best quote, and pay securely through our escrow system.",
      },
      {
        q: "Is it free to use as a planner?",
        a: "Yes. Creating an account, submitting briefs, and receiving quotes are all completely free for event planners. A small platform fee is applied only when you confirm a booking and funds are placed in escrow.",
      },
      {
        q: "What if I don't receive three quotes within four hours?",
        a: "Our system automatically escalates the request to additional vendors in the category. If fewer than three quotes arrive, you still see every quote that came in and can proceed at your discretion. Our support team monitors all open requests and will follow up personally if needed.",
      },
      {
        q: "Can I submit a brief for multiple service categories at once?",
        a: "Absolutely. A single event can cover catering, photography, AV, décor, and any other category simultaneously. Each category is matched to relevant vendors independently, so you receive specialist quotes in parallel.",
      },
      {
        q: "How do I compare quotes?",
        a: "The quote comparison view shows all quotes for an event side-by-side. Each quote is itemised so you can see exactly what is and isn't included — no hidden extras. You can view individual line items, the vendor's profile, and their ratings before deciding.",
      },
      {
        q: "What happens after I accept a quote?",
        a: "Once you accept, the booking is confirmed and you are directed to place payment into escrow. The vendor is notified and can begin preparation. Funds are held securely and only released once you confirm the service was delivered as agreed.",
      },
      {
        q: "Can I cancel a booking?",
        a: "Cancellation policies vary by vendor and are disclosed before you confirm. For cancellations before the event, the escrow funds are released according to the agreed policy. Disputes are handled by the Nairobi Events team, and our admin can arbitrate if necessary.",
      },
      {
        q: "How do I leave a review?",
        a: "After a booking is marked completed, you will see a 'Leave Review' button on the booking detail page. You can rate the vendor on overall quality, punctuality, and value for money, and leave a written comment.",
      },
    ],
  },
  {
    id: "vendors",
    label: "For Vendors",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
    items: [
      {
        q: "How do I join as a vendor?",
        a: "Sign up and select 'Vendor' as your role. Complete your profile — business name, category, description, location, and portfolio links. Submit for vetting. Our team reviews every application, typically within one to two business days. Once approved, you start receiving quote requests immediately.",
      },
      {
        q: "Is there a fee to join?",
        a: "Joining and maintaining your profile are free. A small commission is deducted from confirmed bookings. You can find the current commission rate in your vendor dashboard under Account Settings.",
      },
      {
        q: "How are quote requests distributed?",
        a: "When a planner submits a brief, the platform matches it against vendor categories and availability. You receive a notification and have a window to submit a quote. If you decline or do not respond in time, the request moves to the next matched vendor.",
      },
      {
        q: "Can I save quote templates?",
        a: "Yes. When composing a quote you can save line-item sets as reusable templates. Load a template as a starting point and customise the values for each new request. Templates are stored locally on your device.",
      },
      {
        q: "How does payment work for vendors?",
        a: "Once a booking is confirmed by the planner and funds are in escrow, you deliver the service. The planner confirms delivery, which releases the escrowed funds to you, minus the platform commission. In disputed cases, our admin team mediates.",
      },
      {
        q: "How do I manage my availability?",
        a: "Your vendor dashboard has an Availability section where you can block dates you are unavailable. Planners' briefs are only sent to you for dates you have marked as free.",
      },
      {
        q: "What happens if a planner files a dispute?",
        a: "Our admin team investigates disputes by reviewing the booking details, communications, and any evidence provided. Both parties are contacted. We aim to resolve disputes within three business days.",
      },
      {
        q: "Will I see reviews clients leave about me?",
        a: "Yes. All reviews appear on your public vendor profile and in the 'My Reviews' section of your dashboard. You cannot edit or delete reviews, but you may submit a factual response visible to future planners.",
      },
    ],
  },
  {
    id: "payments",
    label: "Payments & Escrow",
    color: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/50",
    items: [
      {
        q: "What is escrow and why do you use it?",
        a: "Escrow means your payment is held by a neutral third party — us — until both sides confirm the service was delivered as agreed. This protects planners from paying for a no-show, and protects vendors from non-payment after delivery.",
      },
      {
        q: "When are funds released to the vendor?",
        a: "Funds are released when you (the planner) mark the booking as completed, or automatically after the agreed period has passed without a dispute. If you raise a dispute, funds are held until the case is resolved.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept M-Pesa, Visa, and Mastercard. Additional payment options may be available depending on your account region. All transactions are processed over encrypted connections.",
      },
      {
        q: "Is my payment information stored?",
        a: "No. We do not store card numbers or M-Pesa credentials. All payment processing is handled by our PCI-compliant payment partner. Only a tokenised reference is retained to link your payment to your booking.",
      },
      {
        q: "What is the platform fee?",
        a: "Planners pay a small percentage of the confirmed booking value as a platform fee, disclosed clearly before you confirm. Vendors pay a commission on each completed booking. Exact rates are shown at checkout and in your dashboard settings.",
      },
      {
        q: "Can I get a refund if the vendor cancels?",
        a: "Yes. If a vendor cancels a confirmed booking, the full escrowed amount is returned to you. We will also prioritise finding an alternative vendor for your event date.",
      },
      {
        q: "How do I get a booking receipt?",
        a: "Open any confirmed booking from your Bookings page and click 'Print Receipt'. A printer-friendly receipt will open, which you can save as a PDF for expense claims.",
      },
    ],
  },
  {
    id: "platform",
    label: "Platform & Account",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
    items: [
      {
        q: "How are vendors vetted?",
        a: "Every vendor application is manually reviewed by our team. We verify business registration, check references where provided, review portfolio samples, and assess response quality. Vendors who consistently receive poor reviews or no-show flags may be suspended.",
      },
      {
        q: "Can I have both a planner and a vendor account?",
        a: "Currently accounts have a single role. If you need to operate as both, please contact support — we can help you set up the appropriate account configuration.",
      },
      {
        q: "How do I update my profile or account details?",
        a: "Your name and phone number can be updated in Account Settings, accessible from the bottom of your sidebar. Email address changes are managed through your Clerk account portal for security reasons.",
      },
      {
        q: "How do I delete my account?",
        a: "To delete your account, contact our support team. We will confirm any outstanding bookings are resolved before processing the deletion. Account data is retained for 90 days before being permanently removed.",
      },
      {
        q: "Is my data shared with third parties?",
        a: "We do not sell your data. Information is shared only with vendors when you submit a quote request, with our payment processor for transaction handling, and as required by Kenyan law. See our Privacy Policy for full details.",
      },
    ],
  },
];

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left hover:text-primary transition-colors"
      >
        <span className="font-medium text-sm leading-relaxed">{item.q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
        }
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed pr-8">{item.a}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const normalised = query.toLowerCase().trim();

  const filtered: FaqSection[] = SECTIONS
    .filter(s => !activeSection || s.id === activeSection)
    .map(section => ({
      ...section,
      items: normalised
        ? section.items.filter(
            item =>
              item.q.toLowerCase().includes(normalised) ||
              item.a.toLowerCase().includes(normalised),
          )
        : section.items,
    }))
    .filter(s => s.items.length > 0);

  const totalMatches = filtered.reduce((n, s) => n + s.items.length, 0);

  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 via-background to-orange-50/30 py-16 md:py-24 border-b border-border/40">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Frequently asked questions
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Everything you need to know about planning events and working with vendors on our platform.
          </p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 h-11 text-sm"
            />
          </div>
          {normalised && (
            <p className="mt-3 text-sm text-muted-foreground">
              {totalMatches === 0
                ? "No results found."
                : `${totalMatches} result${totalMatches !== 1 ? "s" : ""} found`}
            </p>
          )}
        </div>
      </section>

      {/* Section filter pills */}
      <div className="border-b border-border/40 bg-muted/20 sticky top-[73px] z-30">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl py-3 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSection(null)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              activeSection === null
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
            }`}
          >
            All topics
          </button>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(prev => prev === s.id ? null : s.id)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                activeSection === s.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ content */}
      <div className="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No matching questions</p>
            <p className="text-sm">Try a different search term or browse all topics.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {filtered.map(section => (
              <div key={section.id}>
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="outline" className={`text-xs font-semibold px-3 py-1 ${section.color}`}>
                    {section.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{section.items.length} question{section.items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="bg-card border border-border rounded-xl px-6 divide-y-0">
                  {section.items.map((item, i) => (
                    <AccordionItem key={i} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still need help CTA */}
        <div className="mt-16 bg-muted/40 border border-border rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Our support team is based in Nairobi and responds within one business day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:support@nairobievents.co.ke">
              <Button variant="outline" className="w-full sm:w-auto font-medium">Email support</Button>
            </a>
            <Link href="/sign-up">
              <Button className="w-full sm:w-auto font-semibold">Get started free</Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
