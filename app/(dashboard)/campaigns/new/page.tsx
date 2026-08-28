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
      {/* Top Floating Actions Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-[#121316] shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-95 ml-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Campaigns</span>
        </Link>
      </div>

      <CampaignWizard initialMode={initialMode} />
    </div>
  )
}

