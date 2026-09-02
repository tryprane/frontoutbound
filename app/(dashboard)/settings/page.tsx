'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { PaginationControls } from '@/components/ui/pagination-controls'
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  Loader2,
  Lock,
  Mail,
  Plus,
  Save,
  Search,
  Send,
  ShieldBan,
  Sliders,
  Trash2,
  User,
  Webhook,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface UnsubscribeEntry {
  id: string
  email: string
  createdAt: string
}

interface SettingsPayload {
  profile: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  } | null
  organizationRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | null
  workspace: {
    defaultPageSize: number
    inboxPageSize: number
    includeWarmupInInbox: boolean
    emailReplyWebhookUrl: string
    replyWebhookSecret: string
  }
  emailDefaults?: {
    defaultSendFormat: string
    defaultOpenTrackingEnabled: boolean
  }
  campaignScheduler?: {
    firstMessagePercent: number
    followUpPercent: number
    apiReservePercent: number
    campaignMinPercentWhenApiBorrows: number
  }
}

type SettingCategory =
  | 'profile'
  | 'password'
  | 'workspace'
  | 'email-defaults'
  | 'scheduler'
  | 'webhooks'
  | 'unsubscribe'

function clampPercent(value: string | number, fallback = 0) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(100, Math.max(0, Math.round(numeric)))
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') as SettingCategory | null

  const [activeCategory, setActiveCategory] = useState<SettingCategory | null>(currentTab)
  const [entries, setEntries] = useState<UnsubscribeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [settings, setSettings] = useState<SettingsPayload>({
    profile: null,
    organizationRole: null,
    workspace: {
      defaultPageSize: 25,
      inboxPageSize: 25,
      includeWarmupInInbox: false,
      emailReplyWebhookUrl: '',
      replyWebhookSecret: '',
    },
    emailDefaults: {
      defaultSendFormat: 'html',
      defaultOpenTrackingEnabled: true,
    },
    campaignScheduler: {
      firstMessagePercent: 50,
      followUpPercent: 50,
      apiReservePercent: 10,
      campaignMinPercentWhenApiBorrows: 50,
    },
  })

  const [newEmail, setNewEmail] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)

  // Sync state with URL parameter if present
  useEffect(() => {
    if (currentTab) {
      setActiveCategory(currentTab)
    } else {
      setActiveCategory(null)
    }
  }, [currentTab])

  const selectCategory = (category: SettingCategory | null) => {
    setActiveCategory(category)
    if (category) {
      router.push(`/settings?tab=${category}`)
    } else {
      router.push('/settings')
    }
  }

  const fetchList = async (p = 1, search = searchQuery) => {
    try {
      setLoading(true)
      const queryParam = search.trim() ? `&q=${encodeURIComponent(search.trim())}` : ''
      const res = await fetch(`/api/unsubscribe?page=${p}&limit=50${queryParam}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setEntries(data.list || [])
      setPage(p)
      setTotalPages(data.pages || 1)
      setTotalEntries(data.total || 0)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.workspace) {
          setSettings({
            profile: data.profile ?? null,
            organizationRole: data.organizationRole ?? null,
            workspace: data.workspace,
            emailDefaults: data.emailDefaults ?? {
              defaultSendFormat: 'html',
              defaultOpenTrackingEnabled: true,
            },
            campaignScheduler: data.campaignScheduler ?? {
              firstMessagePercent: 50,
              followUpPercent: 50,
              apiReservePercent: 10,
              campaignMinPercentWhenApiBorrows: 50,
            },
          })
        }
      })
      .catch(() => {})
  }, [])

  const handleSaveSettings = async (includeScheduler = false) => {
    try {
      setSavingSettings(true)
      const { campaignScheduler, ...baseSettings } = settings
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(includeScheduler ? settings : baseSettings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')
      setSettings((current) => ({
        profile: data.profile ?? current.profile,
        organizationRole: data.organizationRole ?? current.organizationRole,
        workspace: data.workspace ?? current.workspace,
        emailDefaults: data.emailDefaults ?? current.emailDefaults,
        campaignScheduler: data.campaignScheduler ?? current.campaignScheduler,
      }))
      toast.success('Settings updated successfully')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleTestWebhook = async () => {
    const url = settings.workspace.emailReplyWebhookUrl.trim()
    const secret = settings.workspace.replyWebhookSecret.trim()
    if (!url || !secret) {
      toast.error('Enter the webhook URL and signing secret first')
      return
    }

    try {
      setTestingWebhook(true)
      const res = await fetch('/api/settings/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, secret }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to send test webhook')
      const source = data.synthetic ? 'sample thread' : `${data.threadMessageCount || 0}-message thread`
      toast.success(`Test webhook delivered (${source})`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setTestingWebhook(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = newEmail.trim()
    if (!email) return

    try {
      setAdding(true)
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to add email')
      }
      const data = await res.json().catch(() => ({}))
      const count = data?.count || 1
      toast.success(count > 1 ? `Added ${count} emails to suppression list` : 'Added to suppression list')
      setNewEmail('')
      fetchList(1, searchQuery)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAdding(false)
    }
  }

  const isOrganizationOwner = settings.organizationRole === 'OWNER'

  const handleRemove = async (email: string) => {
    try {
      setRemoveId(email)
      const res = await fetch(`/api/unsubscribe?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove email')
      toast.success('Removed from suppression list')
      fetchList(page, searchQuery)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRemoveId(null)
    }
  }

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setSavingPassword(true)
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to update password')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      toast.success('Password updated successfully')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  // Categories configuration for the Hub view
  const categories = [
    {
      id: 'profile' as SettingCategory,
      title: 'Profile Settings',
      eyebrow: 'USER IDENTITY',
      desc: 'Display name, avatar URL, and sign-in email address.',
      icon: <User className="h-6 w-6 text-[#121316]" />,
      iconBg: 'bg-[#faf8f4] border-[#121316]/10 group-hover:border-[#121316]/25 group-hover:bg-[#121316]/05',
      badge: settings.profile?.name || 'Configured',
    },
    {
      id: 'password' as SettingCategory,
      title: 'Security & Password',
      eyebrow: 'AUTHENTICATION',
      desc: 'Change your workspace password and security credentials.',
      icon: <Lock className="h-6 w-6 text-[#121316]" />,
      iconBg: 'bg-[#faf8f4] border-[#121316]/10 group-hover:border-[#121316]/25 group-hover:bg-[#121316]/05',
      badge: 'Protected',
    },
    {
      id: 'workspace' as SettingCategory,
      title: 'Workspace Preferences',
      eyebrow: 'GENERAL DEFAULTS',
      desc: 'List row density, email inbox page size, and warmup filters.',
      icon: <Sliders className="h-6 w-6 text-[#121316]" />,
      iconBg: 'bg-[#faf8f4] border-[#121316]/10 group-hover:border-[#121316]/25 group-hover:bg-[#121316]/05',
      badge: `${settings.workspace.defaultPageSize} items/page`,
    },
    {
      id: 'email-defaults' as SettingCategory,
      title: 'Email Send Defaults',
      eyebrow: 'DELIVERY FORMAT',
      desc: 'HTML vs plain text delivery format and open tracking defaults.',
      icon: <Mail className="h-6 w-6 text-[#121316]" />,
      iconBg: 'bg-[#faf8f4] border-[#121316]/10 group-hover:border-[#121316]/25 group-hover:bg-[#121316]/05',
      badge: settings.emailDefaults?.defaultSendFormat === 'text_only' ? 'Plain Text' : 'Rich HTML',
    },
    {
      id: 'scheduler' as SettingCategory,
      title: 'Campaign Scheduler',
      eyebrow: 'CAPACITY ALLOCATION',
      desc: 'First messages vs follow-up step quotas and API reserve capacity.',
      icon: <Clock className="h-6 w-6 text-[#121316]" />,
      iconBg: 'bg-[#faf8f4] border-[#121316]/10 group-hover:border-[#121316]/25 group-hover:bg-[#121316]/05',
      badge: `${settings.campaignScheduler?.firstMessagePercent ?? 50}% / ${settings.campaignScheduler?.followUpPercent ?? 50}%`,
    },
    {
      id: 'webhooks' as SettingCategory,
      title: 'Reply Webhooks',
      eyebrow: 'INTEGRATIONS',
      desc: 'Automated webhook endpoints and signature signing secret.',
      icon: <Webhook className="h-6 w-6 text-[#121316]" />,
      iconBg: 'bg-[#faf8f4] border-[#121316]/10 group-hover:border-[#121316]/25 group-hover:bg-[#121316]/05',
      badge: settings.workspace.emailReplyWebhookUrl ? 'Connected' : 'Not configured',
    },
    {
      id: 'unsubscribe' as SettingCategory,
      title: 'Global Suppression List',
      eyebrow: 'SAFETY & COMPLIANCE',
      desc: 'Emails blocked from receiving dispatches across all campaigns.',
      icon: <ShieldBan className="h-6 w-6 text-[#121316]" />,
      iconBg: 'bg-[#faf8f4] border-[#121316]/10 group-hover:border-[#121316]/25 group-hover:bg-[#121316]/05',
      badge: `${totalEntries} suppressed`,
    },
  ]

  // Render Hub (Main view showing all options in single column with generous border spacing)
  if (!activeCategory) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8 space-y-4 sm:space-y-5 animate-fade-in">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => selectCategory(cat.id)}
            className="uneevo-card p-6 sm:p-7 rounded-[26px] border border-[#121316]/08 bg-white hover:bg-[#faf8f4]/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.06)] text-left transition-all duration-200 group cursor-pointer flex items-center justify-between gap-5 w-full"
          >
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border ${cat.iconBg} transition-colors`}>
                {cat.icon}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ee382b] block mb-1">
                  {cat.eyebrow}
                </span>
                <h3 className="zoho-puvi-headline text-base sm:text-lg font-bold text-[#121316] group-hover:text-[#ee382b] transition-colors truncate">
                  {cat.title}
                </h3>
                <p className="text-xs text-[#62605c] mt-0.5 hidden sm:block truncate">
                  {cat.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 shrink-0">
              <span className="hidden md:inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#121316]/05 text-[#62605c] border border-[#121316]/06">
                {cat.badge}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#faf8f4] border border-[#121316]/08 group-hover:border-[#ee382b] group-hover:bg-[#ee382b] text-[#121316] group-hover:text-white transition-all shadow-2xs">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </button>
        ))}
      </div>
    )
  }

  // Category Sub-view Header helper
  const renderCategoryHeader = (title: string, eyebrow: string, description: string) => (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 mb-6">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => selectCategory(null)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-[#121316] shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-95 cursor-pointer"
          title="Back to all settings"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs font-bold text-[#121316] truncate">
          {title}
        </span>
      </div>

      <button
        type="button"
        onClick={() => selectCategory(null)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md text-xs font-bold text-[#121316] hover:bg-white hover:shadow-md active:scale-95 transition cursor-pointer shadow-sm ml-auto"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>All Settings</span>
      </button>
    </div>
  )

  // 1. Profile Setting Subpage
  if (activeCategory === 'profile') {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8 space-y-6 animate-fade-in">
        {renderCategoryHeader(
          'Profile Settings',
          'USER IDENTITY',
          'Manage your signed-in profile details and identity across workspace.'
        )}

        <div className="uneevo-card p-6 md:p-8 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
          <div className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">
                Email Address (Signed-in Account)
              </label>
              <input
                value={settings.profile?.email || ''}
                disabled
                className="w-full rounded-[14px] border border-[#121316]/08 bg-[#faf8f4] px-4 py-3 text-sm text-[#62605c] cursor-not-allowed font-medium"
              />
              <p className="text-[11px] text-[#8a8780]">Email address is managed by workspace authentication.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                Display Name
              </label>
              <input
                value={settings.profile?.name || ''}
                placeholder="e.g. Alex Morgan"
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    profile: current.profile
                      ? { ...current.profile, name: e.target.value }
                      : current.profile,
                  }))
                }
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                Avatar Image URL
              </label>
              <input
                value={settings.profile?.image || ''}
                placeholder="https://example.com/avatar.jpg"
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    profile: current.profile
                      ? { ...current.profile, image: e.target.value }
                      : current.profile,
                  }))
                }
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#121316]/08 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={savingSettings}
              className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)] disabled:opacity-50 cursor-pointer"
            >
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{savingSettings ? 'Saving Profile...' : 'Save Profile Details'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Security & Password Subpage
  if (activeCategory === 'password') {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8 space-y-6 animate-fade-in">
        {renderCategoryHeader(
          'Security & Password',
          'AUTHENTICATION',
          'Change your sign-in password and manage workspace access security.'
        )}

        <div className="uneevo-card p-6 md:p-8 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((current) => ({ ...current, currentPassword: e.target.value }))}
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))}
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))}
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="pt-4 border-t border-[#121316]/08 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-[#62605c]">
                Must be at least 8 characters with a mix of letters and numbers.
              </p>
              <button
                type="submit"
                disabled={
                  savingPassword ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
                className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)] disabled:opacity-40 shrink-0 cursor-pointer"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // 3. Workspace Basics Subpage
  if (activeCategory === 'workspace') {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8 space-y-6 animate-fade-in">
        {renderCategoryHeader(
          'Workspace Preferences',
          'GENERAL DEFAULTS',
          'Configure list density, inbox pagination, and warmup visibility.'
        )}

        <div className="uneevo-card p-6 md:p-8 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                Default Page Density
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={settings.workspace.defaultPageSize}
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    workspace: {
                      ...current.workspace,
                      defaultPageSize: Math.max(10, Number(e.target.value || 10)),
                    },
                  }))
                }
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] font-mono focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
              />
              <p className="text-[11px] text-[#8a8780]">Number of rows shown in standard workspace tables (10–100).</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                Email Inbox Page Size
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={settings.workspace.inboxPageSize}
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    workspace: {
                      ...current.workspace,
                      inboxPageSize: Math.max(10, Number(e.target.value || 10)),
                    },
                  }))
                }
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] font-mono focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
              />
              <p className="text-[11px] text-[#8a8780]">Threads per page displayed inside unified inbox.</p>
            </div>

            <div className="sm:col-span-2 pt-2">
              <label className="flex items-center gap-3 p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/08 cursor-pointer hover:bg-[#faf8f4]/80">
                <input
                  type="checkbox"
                  checked={settings.workspace.includeWarmupInInbox}
                  onChange={(e) =>
                    setSettings((current) => ({
                      ...current,
                      workspace: {
                        ...current.workspace,
                        includeWarmupInInbox: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded text-[#ee382b] focus:ring-[#ee382b]"
                />
                <span className="text-xs font-semibold text-[#121316]">
                  Include peer-to-peer warmup emails by default in inbox views
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#121316]/08">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={savingSettings}
              className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)] disabled:opacity-50 cursor-pointer"
            >
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{savingSettings ? 'Saving...' : 'Save Workspace Preferences'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 4. Email Send Defaults Subpage
  if (activeCategory === 'email-defaults') {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8 space-y-6 animate-fade-in">
        {renderCategoryHeader(
          'Email Send Defaults',
          'DELIVERY FORMAT',
          'Configure rich HTML vs clean plain-text delivery and default open tracking behavior.'
        )}

        <div className="uneevo-card p-6 md:p-8 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                Default Outbound Delivery Format
              </label>
              <select
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] font-medium focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
                value={settings.emailDefaults?.defaultSendFormat || 'html'}
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    emailDefaults: {
                      defaultSendFormat: e.target.value,
                      defaultOpenTrackingEnabled:
                        e.target.value === 'text_only'
                          ? false
                          : current.emailDefaults?.defaultOpenTrackingEnabled ?? true,
                    },
                  }))
                }
              >
                <option value="html">Rich HTML Format (Supports styled text & open tracking)</option>
                <option value="text_only">Plain Text Format (Strictly plain text, no tracking pixels)</option>
              </select>
            </div>

            {settings.emailDefaults?.defaultSendFormat !== 'text_only' ? (
              <label className="flex items-center gap-3 p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/08 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailDefaults?.defaultOpenTrackingEnabled ?? true}
                  onChange={(e) =>
                    setSettings((current) => ({
                      ...current,
                      emailDefaults: {
                        defaultSendFormat: current.emailDefaults?.defaultSendFormat || 'html',
                        defaultOpenTrackingEnabled: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded text-[#ee382b] focus:ring-[#ee382b]"
                />
                <span className="text-xs font-semibold text-[#121316]">
                  Embed invisible open-tracking pixel by default on HTML campaigns
                </span>
              </label>
            ) : (
              <div className="p-4 rounded-[16px] bg-[#b7791f]/10 border border-[#b7791f]/20 text-xs text-[#b7791f] leading-relaxed">
                Plain text format completely disables tracking pixels to maximize deliverability with strict corporate filters.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#121316]/08">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={savingSettings}
              className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)] disabled:opacity-50 cursor-pointer"
            >
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{savingSettings ? 'Saving...' : 'Save Email Defaults'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 5. Campaign Scheduler Subpage
  if (activeCategory === 'scheduler') {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8 space-y-6 animate-fade-in">
        {renderCategoryHeader(
          'Campaign Scheduler',
          'CAPACITY ALLOCATION',
          'Control capacity sharing between first cold messages, follow-up cadences, and API requests.'
        )}

        <div className="uneevo-card p-6 md:p-8 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
          <div className="space-y-5 max-w-2xl">
            <div className="p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/08 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                  Initial vs Follow-up Split
                </label>
                <span className="text-xs font-mono font-bold text-[#ee382b]">
                  {settings.campaignScheduler?.firstMessagePercent ?? 50}% First /{' '}
                  {settings.campaignScheduler?.followUpPercent ?? 50}% Follow-up
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.campaignScheduler?.firstMessagePercent ?? 50}
                onChange={(e) => {
                  if (!isOrganizationOwner) return
                  const firstMessagePercent = clampPercent(
                    e.target.value,
                    settings.campaignScheduler?.firstMessagePercent ?? 50
                  )
                  setSettings((current) => ({
                    ...current,
                    campaignScheduler: {
                      firstMessagePercent,
                      followUpPercent: 100 - firstMessagePercent,
                      apiReservePercent: current.campaignScheduler?.apiReservePercent ?? 10,
                      campaignMinPercentWhenApiBorrows:
                        current.campaignScheduler?.campaignMinPercentWhenApiBorrows ?? 50,
                    },
                  }))
                }}
                className="w-full accent-[#ee382b]"
                disabled={!isOrganizationOwner}
              />
              <p className="text-[11px] text-[#8a8780]">
                Target split percentage. If one queue has no pending demand, unused slots automatically roll over.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                  API Reserve Allocation (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.campaignScheduler?.apiReservePercent ?? 10}
                  onChange={(e) => {
                    if (!isOrganizationOwner) return
                    const apiReservePercent = clampPercent(
                      e.target.value,
                      settings.campaignScheduler?.apiReservePercent ?? 10
                    )
                    setSettings((current) => ({
                      ...current,
                      campaignScheduler: {
                        firstMessagePercent: current.campaignScheduler?.firstMessagePercent ?? 50,
                        followUpPercent: current.campaignScheduler?.followUpPercent ?? 50,
                        apiReservePercent,
                        campaignMinPercentWhenApiBorrows:
                          current.campaignScheduler?.campaignMinPercentWhenApiBorrows ?? 50,
                      },
                    }))
                  }}
                  disabled={!isOrganizationOwner}
                  className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] font-mono focus:border-[#ee382b] focus:bg-white focus:outline-hidden disabled:opacity-60"
                />
                <p className="text-[11px] text-[#8a8780]">Reserved mailbox capacity for API triggered single-sends.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                  Campaign Floor Level (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.campaignScheduler?.campaignMinPercentWhenApiBorrows ?? 50}
                  onChange={(e) => {
                    if (!isOrganizationOwner) return
                    const campaignMinPercentWhenApiBorrows = clampPercent(
                      e.target.value,
                      settings.campaignScheduler?.campaignMinPercentWhenApiBorrows ?? 50
                    )
                    setSettings((current) => ({
                      ...current,
                      campaignScheduler: {
                        firstMessagePercent: current.campaignScheduler?.firstMessagePercent ?? 50,
                        followUpPercent: current.campaignScheduler?.followUpPercent ?? 50,
                        apiReservePercent: current.campaignScheduler?.apiReservePercent ?? 10,
                        campaignMinPercentWhenApiBorrows,
                      },
                    }))
                  }}
                  disabled={!isOrganizationOwner}
                  className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] font-mono focus:border-[#ee382b] focus:bg-white focus:outline-hidden disabled:opacity-60"
                />
                <p className="text-[11px] text-[#8a8780]">Guaranteed campaign floor to prevent API spikes from starving active campaigns.</p>
              </div>
            </div>

            {!isOrganizationOwner && (
              <div className="p-3.5 rounded-[12px] bg-[#b7791f]/10 border border-[#b7791f]/20 text-xs text-[#b7791f]">
                Only workspace owners have permissions to modify scheduler allocation percentages.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#121316]/08">
            <button
              type="button"
              onClick={() => handleSaveSettings(true)}
              disabled={savingSettings || !isOrganizationOwner}
              className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)] disabled:opacity-40 cursor-pointer"
            >
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{savingSettings ? 'Saving...' : 'Save Scheduler Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 6. Webhooks Subpage
  if (activeCategory === 'webhooks') {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8 space-y-6 animate-fade-in">
        {renderCategoryHeader(
          'Reply Webhooks',
          'INTEGRATIONS',
          'Send signed webhook notifications to external platforms whenever a prospect replies.'
        )}

        <div className="uneevo-card p-6 md:p-8 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                Email Reply Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://your-crm.com/api/webhooks/replies"
                value={settings.workspace.emailReplyWebhookUrl}
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    workspace: {
                      ...current.workspace,
                      emailReplyWebhookUrl: e.target.value,
                    },
                  }))
                }
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] font-mono focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
              />
              <p className="text-[11px] text-[#8a8780]">Outbound OS will POST HTTP payloads upon newly detected reply events.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316]">
                Webhook Signing Secret
              </label>
              <input
                type="password"
                placeholder="whsec_••••••••••••••••"
                value={settings.workspace.replyWebhookSecret}
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    workspace: {
                      ...current.workspace,
                      replyWebhookSecret: e.target.value,
                    },
                  }))
                }
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] font-mono focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
              />
              <p className="text-[11px] text-[#8a8780]">Used to verify HMAC signatures sent in webhook headers.</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#121316]/08">
            <p className="text-[11px] text-[#8a8780]">
              Webhooks only fire for replies tied back to outbound activity created by this system. The test uses your latest tracked reply thread when available and otherwise sends a complete sample thread.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={savingSettings || testingWebhook}
                className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)] disabled:opacity-50 cursor-pointer"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{savingSettings ? 'Saving...' : 'Save Webhook Configuration'}</span>
              </button>
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={savingSettings || testingWebhook || !settings.workspace.emailReplyWebhookUrl.trim() || !settings.workspace.replyWebhookSecret.trim()}
                className="inline-flex items-center gap-2 rounded-full border border-[#121316]/12 bg-white px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#121316] transition-all hover:bg-[#faf8f4] disabled:opacity-40 cursor-pointer"
              >
                {testingWebhook ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>{testingWebhook ? 'Sending...' : 'Send Test Webhook'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 7. Global Suppression List Subpage
  if (activeCategory === 'unsubscribe') {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8 space-y-6 animate-fade-in">
        {renderCategoryHeader(
          'Global Suppression List',
          'SAFETY & COMPLIANCE',
          'Emails blocked from receiving dispatches across all campaigns.'
        )}

        <div className="uneevo-card p-6 md:p-8 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#121316]/08">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#faf8f4] border border-[#121316]/10 text-[#ee382b]">
                  <ShieldBan className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-[#121316]">Global Suppression List</h2>
              </div>
              <p className="text-xs text-[#62605c]">
                Emails listed here are globally excluded from receiving cold outreach and follow-up sequence steps.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#121316]/05 text-[#121316] border border-[#121316]/08">
                {totalEntries} suppressed
              </span>
            </div>
          </div>

          <form onSubmit={handleAdd} className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#121316] block">
              Add Email to Suppression
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              <Input
                type="text"
                placeholder="name@example.com (or comma/newline separated)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-2.5 text-xs text-[#121316] focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
                required
              />
              <button
                type="submit"
                disabled={adding || !newEmail.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#121316] px-5 py-2.5 text-xs font-bold text-white hover:bg-black disabled:opacity-50 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{adding ? 'Adding...' : 'Add to Suppression'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#8a8780]">
              Enter an email address or paste multiple addresses separated by commas or new lines.
            </p>
          </form>

          {/* Search bar */}
          <div className="flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8780]" />
              <input
                type="text"
                placeholder="Search suppressed emails..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value
                  setSearchQuery(val)
                  fetchList(1, val)
                }}
                className="w-full rounded-[14px] border border-[#121316]/10 bg-[#faf8f4] pl-10 pr-9 py-2.5 text-xs text-[#121316] placeholder-[#8a8780] focus:border-[#ee382b] focus:bg-white focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    fetchList(1, '')
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8780] hover:text-[#121316] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Table / List */}
          <div className="rounded-[18px] border border-[#121316]/08 bg-white overflow-hidden shadow-2xs">
            {loading ? (
              <div className="flex h-36 items-center justify-center text-xs text-[#8a8780]">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-[#ee382b]" />
                Loading suppression list...
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faf8f4] border border-[#121316]/08 text-[#8a8780] mb-3">
                  <ShieldBan className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-[#121316]">
                  {searchQuery ? 'No matching suppressed emails' : 'No emails in the suppression list'}
                </p>
                <p className="text-xs text-[#8a8780] mt-1 max-w-xs">
                  {searchQuery
                    ? `No records found for "${searchQuery}". Try a different search term.`
                    : 'Any emails added here or opt-out recipients will automatically appear in this list.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#121316]/06">
                {entries.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-[#faf8f4]/80 transition-colors group"
                  >
                    <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <span className="font-mono text-xs font-bold text-[#121316] truncate">{e.email}</span>
                      {e.createdAt && (
                        <span className="text-[11px] text-[#8a8780]">
                          Added {new Date(e.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(e.email)}
                      disabled={removeId === e.email}
                      className="p-2 rounded-xl text-[#c2414c] hover:bg-[#c2414c]/10 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      title="Remove from suppression"
                    >
                      {removeId === e.email ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && totalPages > 1 && (
            <PaginationControls
              page={page}
              pages={totalPages}
              total={totalEntries}
              limit={50}
              onPageChange={(p) => fetchList(p, searchQuery)}
              label="suppressed emails"
            />
          )}
        </div>
      </div>
    )
  }

  return null
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#8a8780]" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}
