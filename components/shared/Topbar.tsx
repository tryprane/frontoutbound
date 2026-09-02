'use client'

import { Search, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || 'OO'
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function Topbar() {
  const { data: session } = useSession()

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  return (
    <header className="page-shell sticky top-2 sm:top-3 md:top-4 lg:top-6 z-20 mb-4 md:mb-6 xl:mb-8 flex flex-col gap-3 rounded-[22px] md:rounded-[28px] border border-white/60 px-3 py-3 md:px-5 md:py-3.5 shadow-[0_16px_44px_rgba(60,45,25,0.06)] md:shadow-[0_20px_50px_rgba(60,45,25,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <button
        type="button"
        onClick={handleOpenSearch}
        className="group flex min-w-0 flex-1 items-center justify-between gap-3 rounded-full border border-[#121316]/10 bg-white/90 px-4 py-2.5 text-left transition hover:border-[#121316]/20 hover:bg-white hover:shadow-xs"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Search className="h-4 w-4 text-[#62605c] group-hover:text-[#121316] transition-colors" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#121316]">Search workspace...</div>
            <div className="truncate text-xs text-[#62605c]">Campaigns, accounts, sent mail, inbox threads</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono font-bold text-[#62605c] bg-[#121316]/06 px-2.5 py-1 rounded-md border border-[#121316]/08 group-hover:bg-[#121316]/10 transition-colors">
          <span className="text-[10px]">⌘</span>K
        </div>
      </button>

      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="batch-pill hidden sm:inline-flex">
          <span className="batch-pill-dot" />
          <span className="text-xs font-semibold">Live</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#b7791f]/20 bg-[#fde9b0]/40 px-3 py-1 text-xs font-bold text-[#8a5c0a] hidden md:inline-flex">
          <Sparkles className="h-3.5 w-3.5 text-[#b7791f]" />
          Warmup Ready
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-full border border-[#121316]/10 bg-white/90 px-3 py-1.5 shadow-xs">
          <Avatar className="h-9 w-9 border border-[#121316]/10">
            <AvatarImage src={session?.user?.image ?? ''} alt={session?.user?.name ?? 'User'} />
            <AvatarFallback className="bg-[#121316] text-white text-xs font-bold">{getInitials(session?.user?.name, session?.user?.email)}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block pr-2">
            <div className="text-sm font-bold text-[#121316] leading-tight">
              {session?.user?.name || 'Outreach Admin'}
            </div>
            <div className="text-[11px] text-[#62605c]">
              {session?.user?.email || 'Operations workspace'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
