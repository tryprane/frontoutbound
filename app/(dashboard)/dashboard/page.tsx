'use client'

import Link from 'next/link'
import { Megaphone, AtSign, FileText, Send, Flame, ShieldCheck } from 'lucide-react'
import { OnboardingStepper } from '@/components/dashboard/OnboardingStepper'
import { OutboundVelocityChart } from '@/components/dashboard/OutboundVelocityChart'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { DashboardActionCards } from '@/components/dashboard/DashboardActionCards'
import { MailboxWarmupFleet } from '@/components/dashboard/MailboxWarmupFleet'
import { useApiResource } from '@/lib/hooks'
import type { DashboardStats } from '@/lib/types'

const EMPTY_STATS: DashboardStats = {
  campaigns: 0,
  mailAccounts: 0,
  activeMailAccounts: 0,
  warmingAccounts: 0,
  warmedAccounts: 0,
  csvFiles: 0,
  sentToday: 0,
  warmupSentToday: 0,
  totalSentToday: 0,
  activeCampaigns: 0,
  dailyData: [],
  totalSentWeek: 0,
  totalWarmupWeek: 0,
  activities: [],
  mailboxWarmupList: [],
  showOnboarding: false,
}

export default function DashboardPage() {
  // Fetch dashboard stats from backend proxy. Include reload handler for Retry button on failure.
  const { data, loading, error, reload } = useApiResource<DashboardStats>('/api/dashboard/stats')

  if (loading && !data) {
    return (
      <div className="animate-fade-in py-20 text-center text-sm text-[#62605c]">
        Loading workspace overview...
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="animate-fade-in py-20 text-center">
        <div className="text-sm font-semibold text-[#ee382b]">Could not load the dashboard</div>
        <div className="mt-1 text-sm text-[#62605c]">{error}</div>
        <button
          onClick={reload}
          className="mt-4 px-4 py-2 text-xs font-semibold text-[#121316] bg-[#121316]/08 hover:bg-[#121316]/14 rounded-xl transition-colors inline-flex items-center gap-1.5"
        >
          Retry
        </button>
      </div>
    )
  }

  const stats = data ?? EMPTY_STATS
  const showOnboarding = stats.showOnboarding
  const activeAccounts = stats.activeMailAccounts ?? stats.mailAccounts
  const warmedAccounts = stats.warmedAccounts ?? 0
  const warmingAccounts = stats.warmingAccounts ?? 0
  const warmupSentToday = stats.warmupSentToday ?? 0
  const totalSentToday = stats.totalSentToday ?? (stats.sentToday + warmupSentToday)

  return (
    <div className="animate-fade-in space-y-8 pb-10">

      {/* ── Page Header / Eyebrow ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
            WORKSPACE OVERVIEW
          </span>
          <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
            Outbound Mission Control
          </h1>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="batch-pill">
            <span className="batch-pill-dot" />
            <span className="text-xs font-semibold">Delivery Engine Live</span>
          </div>
        </div>
      </div>

      {/* ── Top Metrics Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {/* 1. Campaigns */}
        <Link href="/campaigns" className="group">
          <div className="uneevo-card relative overflow-hidden p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#121316]/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
            <div className="absolute top-0 right-0 h-28 w-28 bg-black/[0.02] rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
            
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#121316] text-white shadow-xs transition-transform duration-300 group-hover:scale-105">
                <Megaphone className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-1 rounded-full border border-[#0f8a5f]/20">
                {stats.activeCampaigns} active
              </span>
            </div>

            <div className="relative z-10">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold leading-none tracking-tight text-[#121316] tabular-nums">
                {stats.campaigns}
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#62605c]">
                Campaigns
              </div>
            </div>
          </div>
        </Link>

        {/* 2. Mail Accounts (Active & Warmed Breakdown) */}
        <Link href="/mail-accounts" className="group">
          <div className="uneevo-card relative overflow-hidden p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#121316]/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
            <div className="absolute top-0 right-0 h-28 w-28 bg-[#fde9b0]/25 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#fde9b0] text-[#5c4211] shadow-xs transition-transform duration-300 group-hover:scale-105">
                <AtSign className="h-4.5 w-4.5" />
              </div>
              {warmedAccounts > 0 && warmingAccounts > 0 ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-1 rounded-full border border-[#0f8a5f]/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {warmedAccounts} warmed • {warmingAccounts} warming
                </span>
              ) : warmedAccounts > 0 ? (
                <span className="flex items-center gap-1 text-xs font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-1 rounded-full border border-[#0f8a5f]/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {warmedAccounts} warmed
                </span>
              ) : warmingAccounts > 0 ? (
                <span className="flex items-center gap-1 text-xs font-bold text-[#8a5c0a] bg-[#fde9b0] px-2.5 py-1 rounded-full animate-pulse border border-[#b7791f]/20">
                  <Flame className="h-3.5 w-3.5" />
                  {warmingAccounts} warming
                </span>
              ) : (
                <span className="text-xs font-semibold text-[#62605c] bg-[#121316]/06 px-2.5 py-1 rounded-full">
                  {activeAccounts} active
                </span>
              )}
            </div>

            <div className="relative z-10">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold leading-none tracking-tight text-[#121316] tabular-nums">
                {stats.mailAccounts}
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#62605c]">
                Mail Accounts ({activeAccounts} active)
              </div>
            </div>
          </div>
        </Link>

        {/* 3. CSV Files */}
        <Link href="/csv" className="group">
          <div className="uneevo-card relative overflow-hidden p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#121316]/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
            <div className="absolute top-0 right-0 h-28 w-28 bg-black/[0.02] rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f5f3ef] text-[#121316] shadow-xs transition-transform duration-300 group-hover:scale-105">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-semibold text-[#62605c] bg-[#121316]/06 px-2.5 py-1 rounded-full">
                Ready for import
              </span>
            </div>

            <div className="relative z-10">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold leading-none tracking-tight text-[#121316] tabular-nums">
                {stats.csvFiles}
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#62605c]">
                CSV Files
              </div>
            </div>
          </div>
        </Link>

        {/* 4. Sent Today (Campaigns + Warmup Dispatches) */}
        <Link href="/sent" className="group">
          <div className="uneevo-card relative overflow-hidden p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#121316]/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
            <div className="absolute top-0 right-0 h-28 w-28 bg-[#0f8a5f]/05 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#0f8a5f]/10 text-[#0f8a5f] shadow-xs transition-transform duration-300 group-hover:scale-105">
                <Send className="h-4.5 w-4.5" />
              </div>
              <span className="text-[11px] font-semibold text-[#0f8a5f] bg-[#0f8a5f]/08 px-2.5 py-1 rounded-full border border-[#0f8a5f]/15">
                {stats.sentToday} outbound • {warmupSentToday} warmup
              </span>
            </div>

            <div className="relative z-10">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold leading-none tracking-tight text-[#121316] tabular-nums">
                {totalSentToday}
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#62605c]">
                Dispatched Today
              </div>
            </div>
          </div>
        </Link>

      </div>

      {/* ── Onboarding Stepper (shown if setup incomplete) ──────── */}
      {showOnboarding && (
        <OnboardingStepper
          hasMailAccounts={stats.mailAccounts > 0}
          hasCsvFiles={stats.csvFiles > 0}
          hasCampaigns={stats.campaigns > 0}
        />
      )}

      {/* ── Quick Actions with Drag & Drop ─────────────────────── */}
      <DashboardActionCards />

      {/* ── Active & Warmed Mailbox Fleet Section ──────────────── */}
      <MailboxWarmupFleet
        mailboxes={stats.mailboxWarmupList ?? []}
        totalAccounts={stats.mailAccounts}
        activeAccounts={activeAccounts}
        warmingAccounts={warmingAccounts}
        warmedAccounts={warmedAccounts}
        warmupSentToday={warmupSentToday}
      />

      {/* ── Analytics & Live Activity Grid ─────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <OutboundVelocityChart
          dailyData={stats.dailyData}
          totalSentWeek={stats.totalSentWeek}
          totalWarmupWeek={stats.totalWarmupWeek}
        />
        <RecentActivityFeed activities={stats.activities} />
      </div>

    </div>
  )
}
