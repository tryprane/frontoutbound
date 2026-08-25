import { CampaignWizard } from '@/components/campaigns/CampaignWizard'
import Link from 'next/link'
import { ArrowLeft, Megaphone, Sparkles } from 'lucide-react'

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const initialMode = resolvedSearchParams?.mode === 'gdrive' ? 'gdrive' : 'email'

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header Card */}
      <header className="uneevo-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#121316] text-white shadow-xs">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/campaigns"
                className="text-xs font-bold text-[#62605c] hover:text-[#121316] uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                CAMPAIGNS
              </Link>
              <span className="text-[#8a8780]">/</span>
              <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase">
                SEQUENCE BUILDER
              </span>
            </div>
            <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
              {initialMode === 'gdrive' ? 'Create GDrive Campaign' : 'Create Outbound Campaign'}
            </h1>
            <p className="text-xs sm:text-sm text-[#62605c] mt-0.5">
              {initialMode === 'gdrive'
                ? 'Share a Drive file with each lead and attach your personalised message as the share note.'
                : 'Configure sequence cadences, select sender account pools, and schedule automatic follow-ups.'}
            </p>
          </div>
        </div>

        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-4 py-2 text-xs font-semibold text-[#121316] transition-all hover:bg-[#faf8f4]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Campaigns</span>
        </Link>
      </header>

      <CampaignWizard initialMode={initialMode} />
    </div>
  )
}

