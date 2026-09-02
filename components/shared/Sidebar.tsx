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
      {/* 📱 MOBILE TOP HEADER BAR (Small screen viewports) */}
      <header className="sticky top-2 z-40 flex items-center justify-between rounded-2xl border border-white/60 bg-white/90 backdrop-blur-md px-4 py-3 shadow-[0_10px_30px_rgba(60,45,25,0.06)] md:hidden mb-3">
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
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-out Menu */}
          <div className="fixed top-0 bottom-0 left-0 w-[290px] sm:w-[320px] bg-[#f8f6f0] border-r border-[#121316]/10 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto no-scrollbar animate-in slide-in-from-left duration-300 z-50">
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
              <nav className="space-y-4 no-scrollbar">
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
                            <Icon className="h-4 w-4 shrink-0" />
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
          'group/sidebar page-shell sticky top-4 lg:top-6 z-30 hidden md:flex h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] flex-col rounded-[28px] border border-white/60 px-4 py-4 select-none overflow-hidden shrink-0',
          'transition-[width,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width]',
          isHovered
            ? 'w-[240px] bg-white/95 shadow-[0_25px_60px_rgba(60,45,25,0.12)]'
            : 'w-[72px] bg-white/90 shadow-[0_20px_50px_rgba(60,45,25,0.06)]',
        ].join(' ')}
      >
        {/* Brand Logo Header (Smoothly anchored badge + sliding brand typography) */}
        <div className="mb-4 h-11 w-full shrink-0 flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center h-10 w-full rounded-2xl transition-colors duration-200 hover:bg-[#121316]/05 overflow-hidden"
            title="Outreach OS"
          >
            {/* Outreach OS Brand Logo Badge (40px x 40px centered anchor) */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0052FF] text-white shadow-sm shadow-[#0052FF]/25">
              <svg
                viewBox="0 0 100 100"
                className="h-5.5 w-5.5 text-white"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Outer C shape */}
                <path
                  d="M 68 28 C 68 28, 62 14, 44 14 C 24 14, 12 28, 12 50 C 12 72, 24 86, 44 86 C 62 86, 68 72, 68 72 L 54 72 C 54 72, 48 78, 44 78 C 30 78, 22 68, 22 50 C 22 32, 30 22, 44 22 C 48 22, 54 28, 54 28 Z"
                  fill="currentColor"
                />
                {/* Arrow shaft & head */}
                <path
                  d="M 36 44 L 60 44 L 60 36 L 86 50 L 60 64 L 60 56 L 36 56 Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {/* Brand Text Lockup (Continuous interpolation) */}
            <div
              className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isHovered
                  ? 'opacity-100 max-w-[160px] translate-x-0 ml-2.5'
                  : 'opacity-0 max-w-0 -translate-x-3 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-1 leading-none">
                <span className="font-extrabold tracking-tight uppercase text-base text-[#0B0F19]" style={{ letterSpacing: '-0.03em' }}>
                  OUTREACH
                </span>
                <span className="font-extrabold tracking-tight uppercase text-base text-[#0052FF]" style={{ letterSpacing: '-0.03em' }}>
                  OS
                </span>
              </div>
              <span className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#64748B] mt-0.5">
                Outbound suite
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items (Smooth continuous width scaling from circle to full pill) */}
        <nav className="flex flex-1 flex-col space-y-2.5 overflow-y-auto overflow-x-hidden no-scrollbar w-full overscroll-contain">
          {navGroups.map((group) => (
            <div key={group.label} className="w-full">
              {/* Group Header Label / Divider Line */}
              <div className="w-full overflow-hidden">
                <div
                  className={`text-[10px] font-bold uppercase tracking-[0.2em] text-[#62605c] px-2.5 whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isHovered
                      ? 'max-h-5 opacity-100 mb-1'
                      : 'max-h-0 opacity-0 mb-0 pointer-events-none'
                  }`}
                >
                  {group.label}
                </div>
                <div
                  className={`mx-auto h-[1px] bg-[#121316]/08 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isHovered ? 'w-0 opacity-0 my-0' : 'w-6 opacity-100 my-1'
                  }`}
                />
              </div>

              {/* Group Nav Items */}
              <div className="space-y-1 w-full">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!isHovered ? item.label : undefined}
                      className={[
                        'group/item relative flex items-center h-10 w-full rounded-full transition-colors duration-200 overflow-hidden',
                        isActive
                          ? 'bg-[#121316] text-white font-semibold shadow-md'
                          : 'text-[#52504b] hover:bg-[#121316]/06 hover:text-[#121316]',
                      ].join(' ')}
                    >
                      {/* Fixed Centered Icon Anchor (40px x 40px) */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                        <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/item:scale-110" />
                      </div>

                      {/* Smooth Sliding Label (Continuous width & opacity transition) */}
                      <span
                        className={[
                          'whitespace-nowrap text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden',
                          isHovered
                            ? 'opacity-100 max-w-[150px] translate-x-0 ml-1'
                            : 'opacity-0 max-w-0 -translate-x-3 pointer-events-none',
                        ].join(' ')}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer (Smooth expansion from avatar circle to card) */}
        <div className="mt-auto shrink-0 w-full pt-2">
          <div
            className={`w-full rounded-[22px] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
              isHovered
                ? 'border border-[#121316]/08 bg-white/95 p-2.5 shadow-xs'
                : 'border-transparent bg-transparent p-0'
            }`}
          >
            <div
              className="flex items-center w-full"
              title={!isHovered ? `${session?.user?.name || 'User'} (${session?.user?.email || ''})` : undefined}
            >
              <Avatar className="h-10 w-10 border border-[#121316]/10 shrink-0 cursor-pointer shadow-2xs">
                {session?.user?.image ? (
                  <AvatarImage src={session.user.image} alt={session?.user?.name ?? 'User'} />
                ) : null}
                <AvatarFallback className="bg-[#121316] text-white text-xs font-bold">
                  {getInitials(session?.user?.name, session?.user?.email)}
                </AvatarFallback>
              </Avatar>

              <div
                className={`flex flex-col min-w-0 whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isHovered
                    ? 'opacity-100 max-w-[140px] translate-x-0 ml-2.5'
                    : 'opacity-0 max-w-0 -translate-x-3 pointer-events-none'
                }`}
              >
                <div className="truncate text-xs font-bold text-[#121316]">
                  {session?.user?.name || 'Outreach Admin'}
                </div>
                <div className="truncate text-[10px] text-[#62605c]">
                  {session?.user?.email || 'Internal workspace'}
                </div>
              </div>
            </div>

            {/* Expandable Logout Button */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isHovered
                  ? 'max-h-12 opacity-100 mt-2.5 translate-y-0'
                  : 'max-h-0 opacity-0 mt-0 -translate-y-2 pointer-events-none'
              }`}
            >
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-3 py-1.5 text-xs font-semibold text-[#52504b] transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer shadow-2xs"
                onClick={() => signOut({ callbackUrl: logoutCallbackUrl })}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

