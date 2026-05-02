import { PublicPageLayout } from "@/components/layout/public-page-layout";
import { Link } from "wouter";

const LAST_UPDATED = "1 May 2025";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-3 text-foreground">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function Privacy() {
  return (
    <PublicPageLayout>
      <div className="bg-gradient-to-br from-amber-50 via-background to-orange-50/30 py-14 border-b border-border/40">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-3xl py-12 md:py-16">

        <Section title="1. Introduction">
          <p>
            Nairobi Events Ltd (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the Nairobi Events Marketplace platform (&quot;the Platform&quot;). This Privacy Policy explains how we collect, use, store, and share information about you when you use our Platform.
          </p>
          <p>
            By using the Platform, you agree to the collection and use of information as described in this Policy. If you disagree, please do not use the Platform.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p><strong className="text-foreground">Account information.</strong> When you register, we collect your name, email address, and role (planner or vendor). You may also provide a phone number and, for vendors, your business name, category, description, and portfolio links.</p>
          <p><strong className="text-foreground">Event briefs and quotes.</strong> When planners submit briefs or vendors submit quotes, we store the content of those briefs and quotes, including event details, dates, service requirements, and pricing.</p>
          <p><strong className="text-foreground">Booking and payment records.</strong> We store records of confirmed bookings and the status of escrow transactions. We do not store full card numbers or M-Pesa credentials — only a tokenised reference provided by our payment processor.</p>
          <p><strong className="text-foreground">Reviews and communications.</strong> Reviews you submit and any communications sent through the Platform are stored and associated with your account.</p>
          <p><strong className="text-foreground">Usage data.</strong> We automatically collect standard server logs including IP addresses, browser type, pages visited, and timestamps. This data is used for security monitoring and platform improvements.</p>
        </Section>

        <Section title="3. How we use your information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Operate and improve the Platform, including matching planners to appropriate vendors;</li>
            <li>Process and record bookings and escrow transactions;</li>
            <li>Send you transactional notifications (quote received, booking confirmed, payment released);</li>
            <li>Verify vendor applications and enforce our vetting standards;</li>
            <li>Resolve disputes between planners and vendors;</li>
            <li>Comply with legal obligations under Kenyan law;</li>
            <li>Detect and prevent fraud, abuse, and security incidents.</li>
          </ul>
          <p>We do not use your data to train AI models or sell it to third-party data brokers.</p>
        </Section>

        <Section title="4. Sharing your information">
          <p><strong className="text-foreground">With vendors.</strong> When a planner submits an event brief, the brief details are shared with matched vendors so they can prepare quotes. Your name and contact details are shared with a vendor only after a booking is confirmed.</p>
          <p><strong className="text-foreground">With planners.</strong> When a vendor submits a quote, the vendor's business name, category, and profile information are visible to the planner. Personal contact details are shared only after booking confirmation.</p>
          <p><strong className="text-foreground">Payment processors.</strong> Payment data is shared with our PCI-compliant payment partners (M-Pesa / card networks) solely for transaction processing. We receive only a tokenised reference in return.</p>
          <p><strong className="text-foreground">Authentication provider.</strong> We use Clerk for identity management. Your email address and authentication state are processed by Clerk under their own privacy policy.</p>
          <p><strong className="text-foreground">Legal requirements.</strong> We may disclose information when required to do so by Kenyan law, court order, or a legitimate request from a law enforcement authority.</p>
          <p>We do not sell, rent, or trade your personal data with any other third party.</p>
        </Section>

        <Section title="5. Data storage and security">
          <p>Your data is stored on servers in the European Union (EU) or United States, operated by cloud providers who comply with internationally recognised security standards. We apply encryption in transit (TLS) and at rest for sensitive records.</p>
          <p>Despite our efforts, no internet transmission is completely secure. We cannot guarantee the absolute security of data transmitted to or from the Platform.</p>
        </Section>

        <Section title="6. Cookies and local storage">
          <p>The Platform uses browser local storage to remember your preferences such as dark mode, saved quote templates, and dismissed banners. No personally identifiable data is stored in local storage.</p>
          <p>We use session cookies for authentication state management. We do not use third-party advertising or tracking cookies.</p>
        </Section>

        <Section title="7. Data retention">
          <p>We retain your account data for as long as your account is active. If you request account deletion, we remove your personal data within 90 days, except where retention is required by law (for example, financial transaction records).</p>
          <p>Booking and payment records are retained for seven years to comply with Kenyan tax and financial regulations.</p>
        </Section>

        <Section title="8. Your rights">
          <p>Under the Kenya Data Protection Act 2019, you have the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Access the personal data we hold about you;</li>
            <li>Correct inaccurate data;</li>
            <li>Request deletion of your data (subject to legal retention requirements);</li>
            <li>Object to or restrict certain processing activities;</li>
            <li>Lodge a complaint with the Office of the Data Protection Commissioner (ODPC).</li>
          </ul>
          <p>To exercise any of these rights, email us at <a href="mailto:privacy@nairobievents.co.ke" className="text-primary hover:underline">privacy@nairobievents.co.ke</a>. We will respond within 30 days.</p>
        </Section>

        <Section title="9. Children's privacy">
          <p>The Platform is not directed at persons under 18 years of age. We do not knowingly collect personal data from children. If we discover that we have collected data from a person under 18 without verified parental consent, we will delete it promptly.</p>
        </Section>

        <Section title="10. Changes to this Policy">
          <p>We may update this Privacy Policy from time to time. We will notify registered users by email or in-platform notification at least 14 days before material changes take effect. Continued use of the Platform after the effective date constitutes acceptance of the updated Policy.</p>
        </Section>

        <Section title="11. Contact us">
          <p>For privacy-related questions or requests, contact our Data Protection Officer at <a href="mailto:privacy@nairobievents.co.ke" className="text-primary hover:underline">privacy@nairobievents.co.ke</a>.</p>
          <p>Nairobi Events Ltd, Nairobi, Kenya.</p>
        </Section>

        <div className="border-t border-border pt-8 mt-4 flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
          <Link href="/terms"><span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service →</span></Link>
          <Link href="/faq"><span className="hover:text-foreground transition-colors cursor-pointer">FAQ →</span></Link>
        </div>
      </div>
    </PublicPageLayout>
  );
}
