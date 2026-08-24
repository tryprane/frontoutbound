'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Activity, Building2, ClipboardList, Gauge, HardDrive, KeyRound, LayoutDashboard, Rocket, Sparkles, Ticket, TriangleAlert, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navItems = [
  { label: 'Overview', href: '/prane', icon: LayoutDashboard },
  { label: 'Users', href: '/prane/users', icon: Users },
  { label: 'Organizations', href: '/prane/organizations', icon: Building2 },
  { label: 'Access Codes', href: '/prane/access-codes', icon: Ticket },
  { label: 'Warmup Pool', href: '/prane/warmup-pool', icon: Sparkles },
  { label: 'Mail Proxy', href: '/prane/mail-proxy', icon: KeyRound },
  { label: 'Servers', href: '/prane/servers', icon: HardDrive },
  { label: 'Queue Health', href: '/prane/queues', icon: Activity },
  { label: 'Deployments', href: '/prane/deployments', icon: Rocket },
  { label: 'Scaling Actions', href: '/prane/scaling-actions', icon: Gauge },
  { label: 'Alerts', href: '/prane/alerts', icon: TriangleAlert },
  { label: 'Audit Log', href: '/prane/audit-log', icon: ClipboardList },
]

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || 'PA'
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function PraneSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const logoutCallbackUrl =
    typeof window === 'undefined' ? '/login' : `${window.location.origin}/login`

  return (
    <aside className="page-shell sticky top-3 z-30 flex max-h-[calc(100svh-1.5rem)] min-w-0 flex-col rounded-[24px] border border-white/60 px-3 py-3 shadow-[0_18px_48px_rgba(60,45,25,0.08)] xl:top-6 xl:h-[calc(100vh-3rem)] xl:w-[250px] xl:shrink-0 xl:rounded-[30px] xl:px-4 xl:py-5">
      <div className="mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#182234,#36506d)] text-sm font-semibold text-white shadow-[0_16px_38px_rgba(24,34,52,0.22)]">
            PR
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Prane Control</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Platform admin</div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/prane' ? pathname === '/prane' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition',
                isActive
                  ? 'bg-[var(--text-primary)] text-white shadow-[0_18px_34px_rgba(31,37,45,0.18)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/70 hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-5 rounded-[24px] border border-black/8 bg-white/80 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border-black/10">
            {session?.user?.image ? (
              <AvatarImage src={session.user.image} alt={session?.user?.name ?? 'Super admin'} />
            ) : null}
            <AvatarFallback>{getInitials(session?.user?.name, session?.user?.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[var(--text-primary)]">
              {session?.user?.name || 'Prane Admin'}
            </div>
            <div className="truncate text-xs text-[var(--text-muted)]">
              {session?.user?.email || 'Internal control plane'}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link href="/" className="btn-ghost flex-1 justify-center text-xs">
            Workspace
          </Link>
          <button
            type="button"
            className="btn-ghost flex-1 justify-center text-xs"
            onClick={() => signOut({ callbackUrl: logoutCallbackUrl })}
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  )
}
