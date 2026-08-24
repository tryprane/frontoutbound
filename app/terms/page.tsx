import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The agreement governing use of the OutreachOS outbound email platform, including acceptable use and customer obligations.',
}

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="6 August 2026">
      <p>
        These terms form a binding agreement between <strong>Femur</strong> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;) and the organization that registers for OutreachOS
        (&ldquo;you&rdquo;). By creating an account or using the Service you accept them. If you
        are accepting on behalf of a company, you confirm you have authority to bind it.
      </p>

      <h2>1. The Service</h2>
      <p>
        OutreachOS is a hosted platform for running outbound email campaigns from mailboxes you
        connect and own. It provides campaign scheduling, sender rotation, mailbox warmup, reply
        and bounce handling, and delivery reporting. We may change, add, or remove features; we
        will not materially degrade a paid feature during a paid term without notice.
      </p>
      <p>Access is currently invite-only. We may decline or revoke access at our discretion.</p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for the accuracy of your registration details, for the security of
        your credentials, and for everything done under your account. Notify us promptly at{' '}
        <a href="mailto:security@prane.one">security@prane.one</a> if you suspect unauthorized
        access. You must be at least 18 and using the Service for business purposes.
      </p>

      <h2>3. Your data and your mailboxes</h2>
      <p>
        You retain all rights to the contact lists you upload, the message content you write, and
        the mailbox data we sync on your behalf (&ldquo;Customer Data&rdquo;). You grant us a
        limited licence to host, process, and transmit Customer Data solely to provide the
        Service to you.
      </p>
      <p>
        You are solely responsible for having a lawful basis to contact every recipient you
        upload, and for the accuracy and provenance of your lists. We do not supply, sell, or
        verify contact data.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You must not use the Service to:</p>
      <ul>
        <li>
          send unsolicited bulk email in breach of the CAN-SPAM Act, CASL, the GDPR and ePrivacy
          rules, or any other law applicable to you or your recipients;
        </li>
        <li>
          omit a functioning unsubscribe mechanism, ignore an unsubscribe request, or falsify
          header, sender, or reply-to information;
        </li>
        <li>
          send content that is unlawful, deceptive, fraudulent, defamatory, harassing, malicious,
          or infringing, or that promotes malware or phishing;
        </li>
        <li>
          upload lists scraped, purchased, or otherwise obtained without a lawful basis to
          contact the people on them;
        </li>
        <li>
          circumvent, or attempt to circumvent, the sending limits, rate controls, or provider
          policies of any email or API provider, including using a provider&rsquo;s notification
          or sharing systems as a substitute delivery channel for bulk messaging;
        </li>
        <li>
          connect a mailbox or account you do not own or lack authority to use, or share your
          account with a third party;
        </li>
        <li>
          probe, load-test, reverse engineer, or interfere with the Service or its
          infrastructure, or resell it without our written consent.
        </li>
      </ul>
      <p>
        You must also comply with the terms of every third-party provider whose account you
        connect, including the Google API Services User Data Policy, Gmail&rsquo;s bulk sender
        guidelines, and Google Drive&rsquo;s abuse policies. Breach of a provider&rsquo;s terms is
        a breach of these terms.
      </p>
      <p>
        We may suspend sending, throttle an account, or terminate access immediately where we
        reasonably believe this section has been breached, where a provider requires it, or where
        complaint and bounce rates threaten the Service or other customers. Where practical we
        will tell you first.
      </p>

      <h2>5. Third-party services</h2>
      <p>
        The Service integrates with Google, Microsoft, Zoho, and SMTP and IMAP hosts. Those
        services are governed by their own terms, are outside our control, and may change,
        rate-limit, suspend, or reject your account independently of us. We are not liable for
        their acts, outages, or decisions, including suspension of a mailbox or revocation of API
        access.
      </p>

      <h2>6. Fees</h2>
      <p>
        Fees, billing period, and included volumes are those shown on your plan at the time of
        purchase. Fees are payable in advance and are non-refundable except where required by
        law. We may change pricing on 30 days&rsquo; notice, effective at your next renewal.
        Overdue accounts may be suspended.
      </p>

      <h2>7. Term and termination</h2>
      <p>
        Either party may terminate at any time. You may cancel from your account settings; your
        subscription runs to the end of the paid period. We may terminate for material breach, or
        for any reason on 30 days&rsquo; notice. On termination we stop processing, and Customer
        Data is deleted per the retention terms in our{' '}
        <Link href="/privacy">Privacy Policy</Link>. Export your data before you cancel.
      </p>

      <h2>8. Warranties and disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo;. To the maximum extent permitted by law we
        disclaim all implied warranties, including merchantability, fitness for a particular
        purpose, and non-infringement. We do not warrant that the Service will be uninterrupted
        or error-free, that messages will reach any inbox, that a mailbox will avoid suspension
        or reputation damage, or that any particular deliverability, open, or reply rate will be
        achieved. Email deliverability depends on factors outside our control.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, neither party is liable for indirect, incidental,
        special, consequential, or punitive damages, or for lost profits, revenue, goodwill, or
        data. Our total aggregate liability arising out of or relating to this agreement is
        limited to the fees you paid us in the 12 months preceding the event giving rise to the
        claim. Nothing here limits liability that cannot lawfully be limited.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You will indemnify and hold us harmless against claims, damages, penalties, and
        reasonable legal costs arising from your Customer Data, your messages, your use of the
        Service in breach of section 4, or your breach of a third-party provider&rsquo;s terms.
      </p>

      <h2>11. Confidentiality</h2>
      <p>
        Each party will protect the other&rsquo;s non-public information with at least reasonable
        care and use it only to perform this agreement. This does not apply to information that
        is public, independently developed, or lawfully received from a third party.
      </p>

      <h2>12. Changes to these terms</h2>
      <p>
        We may update these terms. Material changes take effect 30 days after we post them here
        and notify account owners by email. Continued use after that date is acceptance.
      </p>

      <h2>13. General</h2>
      <p>
        This agreement is governed by the laws of India, and the courts of Bilaspur,
        Chhattisgarh have exclusive jurisdiction. If a provision is unenforceable, the rest
        stands. Neither party may assign without the other&rsquo;s consent, except in a merger or
        sale of substantially all assets. These terms and the{' '}
        <Link href="/privacy">Privacy Policy</Link> are the entire agreement between us.
      </p>

      <h2>14. Contact</h2>
      <p>
        <a href="mailto:legal@prane.one">legal@prane.one</a> &middot; Femur, Bilaspur,
        Chhattisgarh, India
      </p>
    </LegalPage>
  )
}
