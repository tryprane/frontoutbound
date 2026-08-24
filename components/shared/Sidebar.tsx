'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  Flame,
  FolderKanban,
  HardDrive,
  Home,
  Inbox,
  KeySquare,
  Mail,
  MailPlus,
  MessageSquareText,
  MessagesSquare,
  Send,
  Settings,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const navGroups = [
  {
    label: 'Dashboards',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: Home }],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Campaigns', href: '/campaigns', icon: FolderKanban },
      { label: 'CSV Files', href: '/csv', icon: MessageSquareText },
    ],
  },
  {
    label: 'Channels',
    items: [
      { label: 'Mail Accounts', href: '/mail-accounts', icon: Mail },
      { label: 'GDrive', href: '/gdrive', icon: HardDrive },
      { label: 'Email Warmup', href: '/warmup', icon: Flame },
      { label: 'Send Mail', href: '/send-mail', icon: MailPlus },
      { label: 'Inbox', href: '/inbox', icon: Inbox },
      { label: 'Sent', href: '/sent', icon: Send },
      { label: 'Responses', href: '/responses', icon: MessagesSquare },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'API Management', href: '/api-management', icon: KeySquare },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || 'OO'
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const logoutCallbackUrl =
    typeof window === 'undefined' ? '/login' : `${window.location.origin}/login`

  return (
    <aside className="page-shell sticky top-3 z-30 flex max-h-[calc(100svh-1.5rem)] min-w-0 flex-col rounded-[24px] border border-white/60 px-3 py-3 shadow-[0_18px_48px_rgba(60,45,25,0.06)] xl:top-6 xl:h-[calc(100vh-3rem)] xl:w-[220px] xl:shrink-0 xl:rounded-[30px] xl:px-4 xl:py-5 xl:shadow-[0_20px_50px_rgba(60,45,25,0.06)]">
      <div className="mb-3 px-1 xl:mb-6 xl:px-2">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#121316] text-sm font-bold text-white shadow-xs xl:h-11 xl:w-11 xl:rounded-[14px]">
            OS
          </div>
          <div className="min-w-0">
            <div className="zoho-puvi-headline text-base font-bold tracking-tight text-[#121316]">OutreachOS</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ee382b]">Outbound suite</div>
          </div>
        </Link>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1 xl:flex-1 xl:flex-col xl:space-y-4 xl:overflow-y-auto xl:overflow-x-hidden xl:pb-0 xl:pr-1">
        {navGroups.map((group) => (
          <div key={group.label} className="flex shrink-0 gap-2 xl:block xl:shrink">
            <div className="hidden px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#62605c] xl:block">
              {group.label}
            </div>
            <div className="flex gap-1.5 xl:mt-1.5 xl:block xl:space-y-1">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm transition-all xl:gap-3',
                      isActive
                        ? 'bg-[#121316] text-white font-semibold shadow-xs'
                        : 'text-[#52504b] hover:bg-white/80 hover:text-[#121316] font-medium',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <Separator className="mt-4 hidden bg-[#121316]/06 xl:block" />
          </div>
        ))}
      </nav>

      <div className="mt-4 hidden rounded-[20px] border border-[#121316]/08 bg-white/90 p-3 xl:block shadow-xs">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 border border-[#121316]/10">
            {session?.user?.image ? (
              <AvatarImage src={session.user.image} alt={session?.user?.name ?? 'User'} />
            ) : null}
            <AvatarFallback className="bg-[#121316] text-white text-xs font-bold">{getInitials(session?.user?.name, session?.user?.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-[#121316]">
              {session?.user?.name || 'Outreach Admin'}
            </div>
            <div className="truncate text-[10px] text-[#62605c]">
              {session?.user?.email || 'Internal workspace'}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="mt-2.5 w-full rounded-full border border-[#121316]/12 bg-white px-3 py-1.5 text-xs font-semibold text-[#52504b] transition-all hover:bg-[#f5f3ef] hover:text-[#121316]"
          onClick={() => signOut({ callbackUrl: logoutCallbackUrl })}
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
