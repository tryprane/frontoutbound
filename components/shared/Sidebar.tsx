'use client'

import { useState } from 'react'
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
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { BrandIcon, BrandLogo } from './BrandLogo'

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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const logoutCallbackUrl =
    typeof window === 'undefined' ? '/login' : `${window.location.origin}/login`

  return (
    <>
      {/* 📱 MOBILE TOP HEADER BAR (Replaces horizontal scrolling bar on small screens) */}
      <header className="sticky top-2 z-40 flex items-center justify-between rounded-2xl border border-white/60 bg-white/90 backdrop-blur-md px-4 py-3 shadow-[0_10px_30px_rgba(60,45,25,0.06)] xl:hidden mb-3">
        <BrandLogo href="/dashboard" size="sm" showTagline={false} />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#121316]/10 bg-white text-[#121316] hover:bg-gray-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5 text-gray-800" />
        </button>
      </header>

      {/* 📱 MOBILE DRAWER SLIDE-OVER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-out Menu */}
          <div className="fixed top-0 bottom-0 left-0 w-[290px] sm:w-[320px] bg-[#f8f6f0] border-r border-[#121316]/10 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300 z-50">
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#121316]/08 mb-4">
                <BrandLogo href="/dashboard" size="md" showTagline={false} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#121316] hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Close Navigation Menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Categorized nav list */}
              <nav className="space-y-4">
                {navGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#62605c]">
                      {group.label}
                    </div>
                    <div className="space-y-1 pt-1">
                      {group.items.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        const Icon = item.icon

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={[
                              'flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm transition-all font-medium',
                              isActive
                                ? 'bg-[#121316] text-white font-semibold shadow-xs'
                                : 'text-[#52504b] hover:bg-white/80 hover:text-[#121316]',
                            ].join(' ')}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Profile footer in mobile drawer */}
            <div className="mt-6 pt-4 border-t border-[#121316]/08">
              <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/70 border border-[#121316]/06">
                <Avatar className="h-9 w-9 border border-[#121316]/10">
                  {session?.user?.image ? (
                    <AvatarImage src={session.user.image} alt={session?.user?.name ?? 'User'} />
                  ) : null}
                  <AvatarFallback className="bg-[#121316] text-white text-xs font-bold">
                    {getInitials(session?.user?.name, session?.user?.email)}
                  </AvatarFallback>
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
                className="w-full flex items-center justify-center gap-2 rounded-full border border-[#121316]/12 bg-white px-3 py-2 text-xs font-semibold text-[#52504b] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer"
                onClick={() => signOut({ callbackUrl: logoutCallbackUrl })}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💻 DESKTOP HOVER-EXPANDABLE SIDEBAR */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={[
          'group/sidebar page-shell sticky top-6 z-30 hidden xl:flex h-[calc(100vh-3rem)] flex-col rounded-[30px] border border-white/60 shadow-[0_20px_50px_rgba(60,45,25,0.06)]',
          'transition-all duration-300 ease-in-out select-none overflow-hidden shrink-0',
          isHovered ? 'w-[230px] px-4 py-5 shadow-2xl' : 'w-[68px] px-2 py-5 items-center',
        ].join(' ')}
      >
        {/* Brand Logo Header */}
        <div className="mb-6 flex items-center justify-center shrink-0 w-full overflow-hidden">
          {isHovered ? (
            <div className="w-full flex items-center px-1 animate-in fade-in duration-200">
              <BrandLogo href="/dashboard" size="md" showTagline={false} />
            </div>
          ) : (
            <Link href="/dashboard" className="flex items-center justify-center p-1" title="Outreach OS">
              <BrandIcon size="md" />
            </Link>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col space-y-4 overflow-y-auto overflow-x-hidden w-full pr-0.5">
          {navGroups.map((group) => (
            <div key={group.label} className="w-full">
              {isHovered ? (
                <div className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#62605c] animate-in fade-in duration-200">
                  {group.label}
                </div>
              ) : (
                <div className="my-1.5 mx-auto h-[1px] w-6 bg-[#121316]/08" />
              )}

              <div className="mt-1.5 space-y-1 w-full">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!isHovered ? item.label : undefined}
                      className={[
                        'flex items-center rounded-full transition-all text-sm font-medium',
                        isHovered
                          ? 'gap-3 px-3.5 py-2 w-full whitespace-nowrap'
                          : 'h-10 w-10 mx-auto justify-center p-0',
                        isActive
                          ? 'bg-[#121316] text-white font-semibold shadow-xs'
                          : 'text-[#52504b] hover:bg-white/80 hover:text-[#121316]',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {isHovered && <span className="truncate animate-in fade-in duration-200">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="mt-4 shrink-0 w-full pt-2">
          {isHovered ? (
            <div className="rounded-[20px] border border-[#121316]/08 bg-white/90 p-3 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9 border border-[#121316]/10 shrink-0">
                  {session?.user?.image ? (
                    <AvatarImage src={session.user.image} alt={session?.user?.name ?? 'User'} />
                  ) : null}
                  <AvatarFallback className="bg-[#121316] text-white text-xs font-bold">
                    {getInitials(session?.user?.name, session?.user?.email)}
                  </AvatarFallback>
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
                className="mt-2.5 w-full rounded-full border border-[#121316]/12 bg-white px-3 py-1.5 text-xs font-semibold text-[#52504b] transition-all hover:bg-[#f5f3ef] hover:text-[#121316] cursor-pointer"
                onClick={() => signOut({ callbackUrl: logoutCallbackUrl })}
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex justify-center" title={`${session?.user?.name || 'User'} (${session?.user?.email || ''})`}>
              <Avatar className="h-10 w-10 border border-[#121316]/10 cursor-pointer shadow-2xs">
                {session?.user?.image ? (
                  <AvatarImage src={session.user.image} alt={session?.user?.name ?? 'User'} />
                ) : null}
                <AvatarFallback className="bg-[#121316] text-white text-xs font-bold">
                  {getInitials(session?.user?.name, session?.user?.email)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
