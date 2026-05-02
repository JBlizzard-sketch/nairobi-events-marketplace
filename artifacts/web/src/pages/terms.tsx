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

export default function Terms() {
  return (
    <PublicPageLayout>
      <div className="bg-gradient-to-br from-amber-50 via-background to-orange-50/30 py-14 border-b border-border/40">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-3xl py-12 md:py-16">

        <Section title="1. Acceptance of terms">
          <p>
            By creating an account or otherwise accessing Nairobi Events Marketplace (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;), operated by Nairobi Events Ltd, a company incorporated in Kenya, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use the Platform.
          </p>
          <p>
            We may update these Terms from time to time. Continued use after changes are posted constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least 18 years old and legally capable of entering into binding contracts under Kenyan law to register on the Platform. By registering, you represent that you meet these requirements.</p>
          <p>Businesses must be lawfully registered in Kenya or another jurisdiction and must have the authority to engage vendors and enter into contracts on behalf of that business.</p>
        </Section>

        <Section title="3. Account registration">
          <p>You are responsible for maintaining the confidentiality of your login credentials. You must not share your account with others or create multiple accounts for the same individual. Notify us immediately at support@nairobievents.co.ke if you suspect unauthorised access to your account.</p>
          <p>We reserve the right to suspend or terminate accounts that violate these Terms, are found to be fraudulent, or are inactive for an extended period.</p>
        </Section>

        <Section title="4. Platform roles">
          <p><strong className="text-foreground">Event Planners</strong> may submit event briefs, receive quotes from vendors, and make bookings through the Platform. Planners are responsible for the accuracy of their brief information.</p>
          <p><strong className="text-foreground">Vendors</strong> may list their services and submit quotes in response to event briefs. Vendors must be individually vetted and approved before receiving quote requests. Vendors are solely responsible for the quality and delivery of the services they quote for and provide.</p>
          <p><strong className="text-foreground">Administrators</strong> manage the Platform, approve vendor applications, and may mediate disputes.</p>
        </Section>

        <Section title="5. Vendor vetting and conduct">
          <p>All vendors undergo a manual vetting process before being approved. Approval is at our sole discretion and may be revoked at any time if a vendor breaches these Terms or demonstrates conduct that is harmful to planners or the Platform's reputation.</p>
          <p>Vendors must honour confirmed bookings. Repeated cancellations, no-shows, or failure to deliver services as quoted may result in account suspension and withholding of escrowed funds pending resolution.</p>
        </Section>

        <Section title="6. Quotes and bookings">
          <p>Quotes submitted by vendors are binding offers. Once a planner accepts a quote and places funds in escrow, a binding contract exists between the planner and the vendor for the services described in the quote. The Platform facilitates this contract but is not a party to it.</p>
          <p>Neither party may unilaterally alter the agreed scope or price after escrow is funded without mutual written consent.</p>
        </Section>

        <Section title="7. Payments and escrow">
          <p>All payments for bookings are processed through our escrow service. Funds are held securely and released to the vendor only upon confirmation of service delivery by the planner, or after the dispute resolution period has elapsed without an active dispute.</p>
          <p>Platform fees and vendor commissions are non-refundable once a booking is confirmed, except in cases of vendor cancellation or a successful dispute finding in the planner's favour.</p>
          <p>We use third-party payment processors (including M-Pesa and card networks). By making a payment, you agree to their terms of service and acknowledge that we are not responsible for errors or failures on their part, although we will assist in resolving such issues.</p>
        </Section>

        <Section title="8. Disputes">
          <p>If a dispute arises between a planner and a vendor, either party may escalate it to the Platform by contacting support within 72 hours of the agreed service date. We will investigate and make a reasonable determination, which may include partial or full refund to the planner or release of funds to the vendor.</p>
          <p>Our dispute resolution decisions are final within the Platform, but do not limit either party's right to seek legal remedies through Kenyan courts.</p>
        </Section>

        <Section title="9. Reviews and content">
          <p>Planners may leave reviews for vendors after a completed booking. Reviews must be honest and based on first-hand experience. We reserve the right to remove reviews that are defamatory, fraudulent, or in violation of these Terms.</p>
          <p>By submitting any content (reviews, profile descriptions, portfolio links) to the Platform, you grant us a worldwide, royalty-free licence to display and use that content on the Platform and in promotional materials.</p>
        </Section>

        <Section title="10. Prohibited conduct">
          <p>You may not use the Platform to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Solicit or accept payments outside the Platform's escrow system to avoid fees;</li>
            <li>Post false, misleading, or fraudulent information;</li>
            <li>Harass, threaten, or discriminate against other users;</li>
            <li>Attempt to circumvent our vetting or verification processes;</li>
            <li>Upload malicious code or attempt to gain unauthorised access to our systems;</li>
            <li>Violate any applicable Kenyan or international law.</li>
          </ul>
        </Section>

        <Section title="11. Limitation of liability">
          <p>The Platform is a marketplace that connects planners and vendors. We do not deliver event services ourselves and are not liable for the quality, safety, or legality of services provided by vendors.</p>
          <p>To the fullest extent permitted by law, our total liability to you for any claim arising from your use of the Platform shall not exceed the greater of (a) the fees you paid to us in the six months preceding the claim, or (b) KES 10,000.</p>
        </Section>

        <Section title="12. Governing law">
          <p>These Terms are governed by the laws of Kenya. Any disputes arising under these Terms that are not resolved through our internal process shall be subject to the exclusive jurisdiction of the courts of Nairobi, Kenya.</p>
        </Section>

        <Section title="13. Contact">
          <p>For questions about these Terms, contact us at <a href="mailto:legal@nairobievents.co.ke" className="text-primary hover:underline">legal@nairobievents.co.ke</a>.</p>
        </Section>

        <div className="border-t border-border pt-8 mt-4 flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
          <Link href="/privacy"><span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy →</span></Link>
          <Link href="/faq"><span className="hover:text-foreground transition-colors cursor-pointer">FAQ →</span></Link>
        </div>
      </div>
    </PublicPageLayout>
  );
}
