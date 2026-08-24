export default function NotProvisionedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="page-shell w-full max-w-xl rounded-[28px] border border-white/60 px-8 py-10 text-center shadow-[0_28px_80px_rgba(60,45,25,0.08)]">
        <div className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Access pending</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          This account is not assigned to a workspace yet.
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
          Ask a platform admin to assign your user to an organization in the `/prane` admin area.
        </p>
      </div>
    </div>
  )
}
