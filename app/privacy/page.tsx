import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How OutreachOS collects, uses, stores, and shares personal data, including data accessed through Google APIs.',
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="6 August 2026">
      <p>
        This policy explains what personal data OutreachOS (&ldquo;we&rdquo;, &ldquo;the
        Service&rdquo;) collects, why we collect it, how long we keep it, and who it is shared
        with. It applies to <Link href="/">prane.one</Link> and all associated subdomains and
        APIs.
      </p>
      <p>
        OutreachOS is a business-to-business outbound email platform. Our customers are
        organizations who connect their own mailboxes, upload their own contact lists, and send
        their own campaigns. For the personal data inside those contact lists and mailboxes, the
        customer is the data controller and we act as a data processor on their instructions.
        For account and billing data about the customer themselves, we are the controller.
      </p>

      <h2>1. Who we are</h2>
      <p>
        <strong>Femur</strong>, Bilaspur, Chhattisgarh, India. Privacy enquiries:{' '}
        <a href="mailto:privacy@prane.one">privacy@prane.one</a>.
      </p>

      <h2>2. Data we collect</h2>
      <h3>2.1 Account data</h3>
      <p>
        Your name, email address, hashed password, organization name, role and membership, invite
        records, and authentication sessions. We never store your password in readable form.
      </p>

      <h3>2.2 Connected mailbox and Drive credentials</h3>
      <p>
        When you connect a Google, Microsoft, Zoho, or generic IMAP/SMTP account, we store the
        OAuth access token, refresh token, token expiry, granted scopes, and the account&rsquo;s
        email address and display name. For IMAP/SMTP accounts we store the host, port, username,
        and password. Tokens and passwords are encrypted at rest. We hold these credentials for
        as long as the account is connected and delete them when you disconnect it.
      </p>

      <h3>2.3 Mailbox content</h3>
      <p>
        To show campaign replies and thread history, we synchronize message headers and bodies
        from your connected mailboxes and store them. This includes sender and recipient
        addresses, subjects, message bodies, timestamps, thread and message identifiers, and
        delivery or bounce notifications. This content may contain personal data about third
        parties who email you.
      </p>

      <h3>2.4 Contact lists you upload</h3>
      <p>
        CSV files you upload and the rows parsed from them. These typically contain recipient
        email addresses, names, company names, and any custom fields you include. We store this
        data to run your campaigns and to deduplicate and suppress recipients.
      </p>

      <h3>2.5 Campaign and delivery records</h3>
      <p>
        Records of every message the Service sends on your behalf: recipient address, sending
        account, subject and body as rendered, send time, delivery status, error messages,
        bounces, complaints, unsubscribe events, and reply detection. Where you enable open
        tracking, we record that a tracking pixel was loaded, how many times, and when. Open
        tracking is optional and off for plain-text sends.
      </p>

      <h3>2.6 Operational data</h3>
      <p>
        Server logs, IP addresses, audit logs of administrative actions, queue and worker
        telemetry, and performance metrics. We use these to run, secure, and debug the Service.
      </p>

      <h2>3. How we use Google user data</h2>
      <p>
        OutreachOS requests the following Google OAuth scopes. Each is used only for the purpose
        stated:
      </p>
      <ul>
        <li>
          <code>gmail.send</code> &mdash; to send campaign and reply messages from the Gmail
          account you connected.
        </li>
        <li>
          <code>gmail.modify</code> &mdash; to read message headers and bodies in order to detect
          replies and bounces to your campaigns, to thread follow-ups correctly, and to apply
          labels and read state to messages the Service sends or processes.
        </li>
        <li>
          <code>drive.file</code> &mdash; where you use the Google Drive channel, to upload the
          file you choose into your own Drive, and to grant read access on that file to the
          recipients you specify. This scope is limited to files created through OutreachOS: we
          cannot see, list, or access anything else in your Drive.
        </li>
        <li>
          <code>userinfo.email</code>, <code>userinfo.profile</code> &mdash; to identify which
          account you connected and display it in the interface.
        </li>
      </ul>
      <p>
        <strong>Limited Use disclosure.</strong> OutreachOS&rsquo;s use and transfer of
        information received from Google APIs to any other app adheres to the{' '}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. Specifically: we do not use Google user data
        for advertising; we do not sell it; we do not transfer it except as necessary to provide
        the Service, to comply with law, or as part of a merger or acquisition with notice; and
        we do not allow humans to read it except with your explicit consent, to resolve a support
        issue you have raised, for security purposes, or where required by law.
      </p>
      <p>
        We do not use Google user data to train generalized artificial intelligence or machine
        learning models.
      </p>

      <h2>4. Why we process your data</h2>
      <p>
        We process account data to provide and secure the Service under our contract with you.
        We process mailbox content, contact lists, and delivery records on your instructions to
        deliver the functionality you have asked for. We process operational data under our
        legitimate interest in keeping the Service running, secure, and free of abuse. Where a
        law such as the GDPR applies to recipients in your contact lists, the lawful basis for
        contacting them is yours to establish, not ours.
      </p>

      <h2>5. Who we share data with</h2>
      <p>We do not sell personal data. We share it only with:</p>
      <ul>
        <li>
          <strong>Infrastructure providers</strong> hosting our servers, database, and queues.
        </li>
        <li>
          <strong>Email and API providers</strong> you connect &mdash; Google, Microsoft, Zoho, or
          your own SMTP host &mdash; which necessarily receive the messages you send through them.
        </li>
        <li>
          <strong>Law enforcement or regulators</strong> where we are legally compelled, and only
          to the extent required.
        </li>
      </ul>
      <p>
        A current list of subprocessors is available on request from{' '}
        <a href="mailto:privacy@prane.one">privacy@prane.one</a>.
      </p>

      <h2>6. Retention</h2>
      <p>
        Account data is retained while your organization is active and deleted within 30 days of
        account closure. OAuth tokens and mailbox passwords are deleted immediately when you
        disconnect an account. Synced mailbox content, uploaded contact lists, and delivery
        records are retained while your organization is active or until you delete them, and are
        purged within 30 days of account closure. Operational logs are retained for up to 12
        months. Suppression and unsubscribe records are retained indefinitely, because deleting
        them would cause us to re-contact someone who asked not to be.
      </p>

      <h2>7. Security</h2>
      <p>
        Mailbox credentials and OAuth tokens are encrypted at rest. Access to production systems
        is restricted to personnel who need it and is logged. Data is transmitted over TLS. No
        system is perfectly secure, and we cannot guarantee absolute security; if we become aware
        of a breach affecting your data we will notify you without undue delay and, where
        required, within 72 hours.
      </p>

      <h2>8. International transfers</h2>
      <p>
        Our infrastructure may process data outside your country of residence. Where personal
        data is transferred out of the EEA or UK, we rely on Standard Contractual Clauses or
        another lawful transfer mechanism.
      </p>

      <h2>9. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, delete, port, or
        restrict processing of your personal data, and to object to processing or withdraw
        consent. You can exercise most of these directly in the application, or by writing to{' '}
        <a href="mailto:privacy@prane.one">privacy@prane.one</a>. We respond within 30 days. You
        may also complain to your local data protection authority.
      </p>
      <p>
        We are established in India, so the Digital Personal Data Protection Act, 2023 applies to
        our processing. If you are in India you may access, correct, complete, update, or erase
        your personal data, nominate another person to exercise your rights, and raise a
        grievance with us before escalating to the Data Protection Board of India. Grievances go
        to <a href="mailto:privacy@prane.one">privacy@prane.one</a> and are acknowledged within
        seven days.
      </p>
      <p>
        If you are a recipient of a message sent through OutreachOS and want your data removed,
        contact the sender named in that message &mdash; they control that list. If you cannot
        reach them, write to us and we will route your request and add you to our global
        suppression list.
      </p>
      <p>
        You can revoke OutreachOS&rsquo;s access to your Google account at any time at{' '}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
          myaccount.google.com/permissions
        </a>
        .
      </p>

      <h2>10. Children</h2>
      <p>
        The Service is for business use and is not directed at anyone under 18. We do not
        knowingly collect data from children.
      </p>

      <h2>11. Changes</h2>
      <p>
        We will post any change to this policy on this page and update the effective date. For
        material changes affecting how we handle Google user data or mailbox content, we will
        notify account owners by email at least 14 days before the change takes effect.
      </p>

      <h2>12. Contact</h2>
      <p>
        <a href="mailto:privacy@prane.one">privacy@prane.one</a> &middot; Femur, Bilaspur,
        Chhattisgarh, India
      </p>
    </LegalPage>
  )
}
