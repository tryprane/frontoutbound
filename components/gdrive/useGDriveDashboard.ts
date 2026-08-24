'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export type DriveConnectionStatus = 'connected' | 'reauth_required' | 'error'

export type DriveAccount = {
  id: string
  email: string
  displayName: string | null
  dailyLimit: number
  sentToday: number
  remainingToday: number
  connectionStatus: DriveConnectionStatus
  connectionError: string | null
  lastShareSentAt: string | null
  isActive: boolean
  createdAt: string
}

export type DriveSummary = {
  connected: number
  total: number
  totalDailyCapacity: number
  sentToday: number
  orgDailyCap: number
  orgAccountCeiling: number
  orgSentToday: number
  orgRemainingToday: number
}

export type DriveAsset = {
  id: string
  driveAccountId: string
  driveFileId: string
  name: string
  mimeType: string | null
  sizeBytes: number | null
  webViewLink: string | null
  createdAt: string
}

export type GDriveAccountsResponse = {
  accounts: DriveAccount[]
  summary: DriveSummary
}

async function readJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data as T
  } catch {
    return fallback
  }
}

// Shown until /api/gdrive/accounts answers, and as the fallback when it fails.
// The org numbers mirror the schema defaults on Organization.
const EMPTY_RESPONSE: GDriveAccountsResponse = {
  accounts: [],
  summary: {
    connected: 0,
    total: 0,
    totalDailyCapacity: 0,
    sentToday: 0,
    orgDailyCap: 500,
    orgAccountCeiling: 50,
    orgSentToday: 0,
    orgRemainingToday: 500,
  },
}

export function useGDriveDashboard() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<GDriveAccountsResponse>(EMPTY_RESPONSE)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [pendingDailyLimits, setPendingDailyLimits] = useState<Record<string, string>>({})
  const [savingDailyLimit, setSavingDailyLimit] = useState<Record<string, boolean>>({})
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [assets, setAssets] = useState<DriveAsset[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [removingAsset, setRemovingAsset] = useState<Record<string, boolean>>({})

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 5000)
  }, [])

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success) showToast('success', decodeURIComponent(success))
    if (error) showToast('error', decodeURIComponent(error))
  }, [searchParams, showToast])

  const loadAll = useCallback(async (background = false) => {
    if (!background) setLoading(true)
    const [result, assetResult] = await Promise.all([
      readJson<GDriveAccountsResponse>('/api/gdrive/accounts', EMPTY_RESPONSE),
      readJson<{ assets: DriveAsset[] }>('/api/gdrive/assets', { assets: [] }),
    ])
    setData(result)
    setAssets(Array.isArray(assetResult.assets) ? assetResult.assets : [])
    if (!background) setLoading(false)
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  // Seed the inline daily-limit editors from server values; keep whatever the
  // user has already typed for an account.
  useEffect(() => {
    setPendingDailyLimits((prev) => {
      const next: Record<string, string> = {}
      for (const account of data.accounts) {
        next[account.id] = prev[account.id] ?? String(account.dailyLimit)
      }
      return next
    })
  }, [data.accounts])

  const handleConnect = useCallback(() => {
    window.location.href = '/api/gdrive/connect'
  }, [])

  const handleReconnect = useCallback(() => {
    window.location.href = '/api/gdrive/connect'
  }, [])

  const handleUpdateDailyLimit = useCallback(async (id: string) => {
    const rawValue = pendingDailyLimits[id]
    const dailyLimit = Math.max(1, Math.min(200, Math.round(Number(rawValue || 1))))
    setSavingDailyLimit((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch('/api/gdrive/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, dailyLimit }),
      })
      const data = await res.json().catch(() => ({ error: 'Update failed' }))
      if (!res.ok) {
        showToast('error', data.error || 'Update failed')
        return false
      }
      showToast('success', 'Daily send limit updated')
      void loadAll(true)
      return true
    } finally {
      setSavingDailyLimit((prev) => ({ ...prev, [id]: false }))
    }
  }, [loadAll, pendingDailyLimits, showToast])

  const handleToggleActive = useCallback(async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/gdrive/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current }),
      })
      const data = await res.json().catch(() => ({ error: 'Update failed' }))
      if (!res.ok) {
        showToast('error', data.error || 'Update failed')
        return
      }
      showToast('success', current ? 'Account paused' : 'Account activated')
      void loadAll(true)
    } catch {
      showToast('error', 'Update failed')
    }
  }, [loadAll, showToast])

  const handleDisconnect = useCallback(async (id: string, email: string) => {
    if (!confirm(`Disconnect ${email} from GDrive sending? Its campaign assignments and share history will be removed.`)) return
    setDeleting((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/gdrive/accounts?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({ error: 'Disconnect failed' }))
      if (!res.ok) {
        showToast('error', data.error || 'Disconnect failed')
        return
      }
      showToast('success', `${email} disconnected`)
      void loadAll(true)
    } finally {
      setDeleting((prev) => ({ ...prev, [id]: false }))
    }
  }, [loadAll, showToast])

  /**
   * Streams a file to Drive through our upload route.
   *
   * XHR rather than fetch because only XHR reports upload progress, and a video
   * on a slow connection is a long silent wait otherwise.
   */
  const handleUpload = useCallback(
    (accountId: string, file: File) =>
      new Promise<boolean>((resolve) => {
        const params = new URLSearchParams({
          accountId,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
        })
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `/api/gdrive/upload?${params.toString()}`)

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return
          setUploadProgress((prev) => ({
            ...prev,
            [accountId]: Math.round((event.loaded / event.total) * 100),
          }))
        }

        const finish = (ok: boolean, message: string) => {
          setUploadProgress((prev) => {
            const next = { ...prev }
            delete next[accountId]
            return next
          })
          showToast(ok ? 'success' : 'error', message)
          if (ok) void loadAll(true)
          resolve(ok)
        }

        xhr.onload = () => {
          let payload: { error?: string; asset?: { name?: string } } = {}
          try {
            payload = JSON.parse(xhr.responseText)
          } catch {
            // Fall through to the status-based message below.
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            finish(true, `${payload.asset?.name || file.name} uploaded`)
          } else {
            finish(false, payload.error || `Upload failed (${xhr.status})`)
          }
        }
        xhr.onerror = () => finish(false, 'Upload failed — check your connection and try again')
        xhr.onabort = () => finish(false, 'Upload cancelled')

        setUploadProgress((prev) => ({ ...prev, [accountId]: 0 }))
        xhr.send(file)
      }),
    [loadAll, showToast]
  )

  const handleRemoveAsset = useCallback(async (assetId: string, name: string) => {
    if (!confirm(`Remove "${name}" from the campaign file list? The file stays in your Google Drive.`)) return
    setRemovingAsset((prev) => ({ ...prev, [assetId]: true }))
    try {
      const res = await fetch(`/api/gdrive/assets?id=${encodeURIComponent(assetId)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({ error: 'Remove failed' }))
      if (!res.ok) {
        showToast('error', data.error || 'Remove failed')
        return
      }
      showToast('success', `${name} removed`)
      void loadAll(true)
    } finally {
      setRemovingAsset((prev) => ({ ...prev, [assetId]: false }))
    }
  }, [loadAll, showToast])

  return {
    accounts: data.accounts,
    summary: data.summary,
    assets,
    loading,
    toast,
    pendingDailyLimits,
    setPendingDailyLimits,
    savingDailyLimit,
    deleting,
    uploadProgress,
    removingAsset,
    handleConnect,
    handleReconnect,
    handleUpdateDailyLimit,
    handleToggleActive,
    handleDisconnect,
    handleUpload,
    handleRemoveAsset,
    showToast,
  }
}
