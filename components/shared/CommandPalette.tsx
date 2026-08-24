'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  LayoutDashboard,
  Megaphone,
  FileSpreadsheet,
  Mail,
  Flame,
  Send,
  Inbox,
  Reply,
  Cloud,
  KeyRound,
  Settings,
  PlusCircle,
  Upload,
  ArrowRight,
} from 'lucide-react'

type PaletteItem = {
  id: string
  title: string
  subtitle?: string
  icon: any
  href: string
  category: 'Actions' | 'Navigation' | 'Channels' | 'System'
  badge?: string
}

const ITEMS: PaletteItem[] = [
  // Actions
  {
    id: 'act-new-campaign',
    title: 'Create new campaign',
    subtitle: 'Build sequences and assign sender accounts',
    icon: PlusCircle,
    href: '/campaigns/new',
    category: 'Actions',
    badge: 'Quick Action',
  },
  {
    id: 'act-upload-csv',
    title: 'Upload lead CSV',
    subtitle: 'Import prospects and map contact columns',
    icon: Upload,
    href: '/csv',
    category: 'Actions',
    badge: 'Import',
  },
  {
    id: 'act-add-mailbox',
    title: 'Connect mail account',
    subtitle: 'Add Gmail, Zoho, Outlook or SMTP mailbox',
    icon: Mail,
    href: '/mail-accounts',
    category: 'Actions',
    badge: 'Mailbox',
  },
  // Navigation
  {
    id: 'nav-dashboard',
    title: 'Dashboard',
    subtitle: 'Workspace metrics, pulse, and recent activity',
    icon: LayoutDashboard,
    href: '/dashboard',
    category: 'Navigation',
  },
  {
    id: 'nav-campaigns',
    title: 'Campaigns',
    subtitle: 'Active sequences, delivery pacing, and performance',
    icon: Megaphone,
    href: '/campaigns',
    category: 'Navigation',
  },
  {
    id: 'nav-csv',
    title: 'CSV Files',
    subtitle: 'Uploaded contact lists and prospect data',
    icon: FileSpreadsheet,
    href: '/csv',
    category: 'Navigation',
  },
  // Channels
  {
    id: 'nav-mail-accounts',
    title: 'Mail Accounts',
    subtitle: 'Mailbox inventory, connection health, and send limits',
    icon: Mail,
    href: '/mail-accounts',
    category: 'Channels',
  },
  {
    id: 'nav-warmup',
    title: 'Email Warmup',
    subtitle: 'Reputation building, ramp schedules, and deliverability',
    icon: Flame,
    href: '/warmup',
    category: 'Channels',
    badge: 'Auto Warmup',
  },
  {
    id: 'nav-send-mail',
    title: 'Send Mail',
    subtitle: 'Direct test mailer and single recipient dispatch',
    icon: Send,
    href: '/send-mail',
    category: 'Channels',
  },
  {
    id: 'nav-inbox',
    title: 'Inbox',
    subtitle: 'Unified incoming messages and mailbox synchronization',
    icon: Inbox,
    href: '/inbox',
    category: 'Channels',
  },
  {
    id: 'nav-sent',
    title: 'Sent Messages',
    subtitle: 'Outbound dispatch logs and delivery status',
    icon: ArrowRight,
    href: '/sent',
    category: 'Channels',
  },
  {
    id: 'nav-responses',
    title: 'Responses',
    subtitle: 'Lead replies, classification, and follow-up threads',
    icon: Reply,
    href: '/responses',
    category: 'Channels',
  },
  {
    id: 'nav-gdrive',
    title: 'GDrive Integration',
    subtitle: 'Cloud asset storage and file-based outreach',
    icon: Cloud,
    href: '/gdrive',
    category: 'Channels',
  },
  // System
  {
    id: 'nav-api',
    title: 'API Management',
    subtitle: 'API keys, webhooks, and programmatic dispatch queue',
    icon: KeyRound,
    href: '/api-management',
    category: 'System',
  },
  {
    id: 'nav-settings',
    title: 'Workspace Settings',
    subtitle: 'Domain configuration, team members, and limits',
    icon: Settings,
    href: '/settings',
    category: 'System',
  },
]

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Global shortcut & custom event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setIsOpen(false)
      }
    }

    const handleCustomOpen = () => {
      setQuery('')
      setSelectedIndex(0)
      setIsOpen(true)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleCustomOpen)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleCustomOpen)
    }
  }, [isOpen])

  // Filter items efficiently
  const filtered = useMemo(() => {
    if (!query.trim()) return ITEMS
    const q = query.toLowerCase().trim()
    return ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
      )
    })
  }, [query])

  // Reset selection index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll active item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [selectedIndex])

  // Keyboard navigation within list
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      handleSelect(filtered[selectedIndex].href)
    }
  }

  const handleSelect = (href: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(href)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#121316]/50 backdrop-blur-md p-4 pt-[10vh] sm:pt-[14vh] transition-all duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-[26px] border border-[#121316]/12 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] transition-all duration-150 ease-out"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleListKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[#121316]/08 px-5 py-4 bg-white">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ee382b]/10 text-[#ee382b] mr-3.5">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns, mail accounts, actions..."
            autoFocus
            className="w-full bg-transparent text-[15px] font-semibold text-[#121316] placeholder:text-[#8a8780] focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-[11px] font-bold text-[#62605c] hover:text-[#121316] px-2 py-1 rounded-lg bg-[#121316]/06 transition-colors"
            >
              Clear
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center rounded-md border border-[#121316]/10 bg-[#faf8f4] px-2 py-0.5 text-[10px] font-mono font-bold text-[#62605c]">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2.5 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121316]/06 text-[#62605c] mx-auto mb-3">
                <Search className="h-5 w-5" />
              </div>
              <div className="text-sm font-bold text-[#121316]">
                No matching results
              </div>
              <p className="text-xs text-[#62605c] mt-1 max-w-[260px] mx-auto">
                Could not find anything matching &ldquo;{query}&rdquo;. Try searching for campaigns, warmup, or settings.
              </p>
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon
              const isSelected = index === selectedIndex

              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group flex w-full items-center justify-between rounded-[18px] px-3.5 py-2.5 text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#121316] text-white shadow-md'
                      : 'text-[#121316] hover:bg-[#faf8f4]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-white/15 text-white'
                          : 'bg-[#faf8f4] text-[#121316] border border-[#121316]/08'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold truncate flex items-center gap-2">
                        <span className={isSelected ? 'text-white' : 'text-[#121316]'}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#fde9b0] text-[#8a5c0a]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div
                          className={`text-[12px] truncate mt-0.5 ${
                            isSelected ? 'text-white/75' : 'text-[#62605c]'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'text-white/70 bg-white/10'
                          : 'text-[#62605c] bg-[#121316]/06'
                      }`}
                    >
                      {item.category}
                    </span>
                    <ArrowRight
                      className={`h-4 w-4 transition-all duration-150 ${
                        isSelected
                          ? 'text-[#ee382b] translate-x-0.5 opacity-100'
                          : 'text-transparent opacity-0 -translate-x-1'
                      }`}
                    />
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Polished Footer Bar */}
        <div className="flex items-center justify-between border-t border-[#121316]/08 bg-[#faf8f4] px-4 py-2.5 text-[11px] text-[#62605c]">
          <div className="flex items-center gap-3.5 font-medium">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-md border border-[#121316]/10 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-xs">
                ↑
              </kbd>
              <kbd className="rounded-md border border-[#121316]/10 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-xs">
                ↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-md border border-[#121316]/10 bg-white px-2 py-0.5 font-mono text-[10px] font-bold shadow-xs flex items-center gap-0.5">
                ↵ Enter
              </kbd>
              <span>select</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold text-[#121316]">
              {filtered.length}
            </span>
            <span>results</span>
          </div>
        </div>
      </div>
    </div>
  )
}
