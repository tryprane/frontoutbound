import type { MailAccount } from './types'

export function MailboxHealthExplanation({ account }: { account: MailAccount }) {
  const snapshot = account.warmupHealthSnapshots?.[0]
  const percent = (rate: number) => `${Math.round(rate * 100)}%`
  return (
    <section className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4" aria-label="Mailbox health explanation">
      <h5 className="text-sm font-semibold text-gray-900">Why this health score?</h5>
      <p className="mt-1 text-xs text-gray-600">
        Health reflects the last seven days of observed warmup delivery and engagement. It does not automatically increase with time or sending volume.
        External warmup messages filtered from the app are not included in these observations.
      </p>
      {snapshot ? (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            {[
              ['Inbox placement', snapshot.inboxRate],
              ['Spam placement', snapshot.spamRate],
              ['Read', snapshot.readRate],
              ['Replied', snapshot.replyRate],
            ].map(([label, rate]) => (
              <div key={String(label)}><dt className="text-gray-500">{label}</dt><dd className="mt-1 font-semibold text-gray-900">{percent(Number(rate))}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-gray-700">{snapshot.notes || 'No explanation was recorded for this measurement.'}</p>
          <p className="mt-2 text-xs text-gray-500">Measured {new Date(snapshot.periodEnd).toLocaleString()}. A small sample can change sharply when new observations arrive.</p>
        </>
      ) : <p className="mt-3 text-xs text-gray-700">No health measurement is available yet. Sync the mailbox and allow recipient-side warmup observations to accumulate.</p>}
      <h5 className="mt-4 text-sm font-semibold text-gray-900">Warmup stage {account.warmupStage}</h5>
      <p className="mt-1 text-xs text-gray-600">
        Stage controls sending pace and is evaluated separately each day. High spam placement or delivery failures can lower it; insufficient delivery or placement evidence holds it steady. Progress requires enough successful sends and healthy inbox placement.
      </p>
      {account.mailboxSyncError && <p className="mt-2 text-xs text-red-700">Sync issue: {account.mailboxSyncError}</p>}
    </section>
  )
}
