'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, HardDrive, RefreshCw, AlertCircle } from 'lucide-react'

/**
 * Files offered here are the ones uploaded on the GDrive page, not everything in
 * the user's Drive. The app holds the `drive.file` scope, so it can only see —
 * and only share — files it uploaded itself.
 */

export interface DriveAccountOption {
  id: string
  email: string
  dailyLimit: number
  sentToday: number
  remainingToday: number
  connectionStatus: string
  isActive: boolean
}

export interface DriveFileOption {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string | null
}

export interface DriveAccountSelection {
  driveFileId: string
  driveFileName: string
  driveFileMimeType: string
}

interface GDriveAccountSelectorProps {
  selections: Record<string, DriveAccountSelection>
  onChange: (next: Record<string, DriveAccountSelection>) => void
}

function friendlyType(mimeType: string) {
  if (mimeType.startsWith('video/')) return 'Video'
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType.startsWith('audio/')) return 'Audio'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.startsWith('application/vnd.google-apps.')) {
    return `Google ${mimeType.replace('application/vnd.google-apps.', '')}`
  }
  return 'File'
}

export function GDriveAccountSelector({ selections, onChange }: GDriveAccountSelectorProps) {
  const [accounts, setAccounts] = useState<DriveAccountOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filesByAccount, setFilesByAccount] = useState<Record<string, DriveFileOption[]>>({})
  const [filesLoading, setFilesLoading] = useState(true)
  const [filesError, setFilesError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/gdrive/accounts')
      .then((res) => res.json())
      .then((data) => {
        setAccounts(Array.isArray(data?.accounts) ? data.accounts : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const loadFiles = useCallback(async () => {
    setFilesLoading(true)
    setFilesError(null)
    try {
      const res = await fetch('/api/gdrive/assets')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load uploaded files')
      const grouped: Record<string, DriveFileOption[]> = {}
      for (const asset of (data.assets || []) as Array<{
        driveAccountId: string
        driveFileId: string
        name: string
        mimeType: string | null
      }>) {
        const bucket = grouped[asset.driveAccountId] || (grouped[asset.driveAccountId] = [])
        bucket.push({
          id: asset.driveFileId,
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
        })
      }
      setFilesByAccount(grouped)
    } catch (err) {
      setFilesError(err instanceof Error ? err.message : 'Failed to load uploaded files')
    } finally {
      setFilesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFiles()
  }, [loadFiles])

  const toggleAccount = (account: DriveAccountOption, checked: boolean) => {
    const next = { ...selections }
    if (checked) {
      const available = filesByAccount[account.id] || []
      next[account.id] =
        available.length === 1
          ? {
              driveFileId: available[0].id,
              driveFileName: available[0].name,
              driveFileMimeType: available[0].mimeType,
            }
          : { driveFileId: '', driveFileName: '', driveFileMimeType: '' }
    } else {
      delete next[account.id]
    }
    onChange(next)
  }

  const selectFile = (accountId: string, fileId: string) => {
    const file = (filesByAccount[accountId] || []).find((entry) => entry.id === fileId)
    onChange({
      ...selections,
      [accountId]: {
        driveFileId: fileId,
        driveFileName: file?.name || '',
        driveFileMimeType: file?.mimeType || '',
      },
    })
  }

  const usableAccounts = accounts.filter(
    (account) => account.isActive && account.connectionStatus === 'connected'
  )
  const blockedAccounts = accounts.filter(
    (account) => !account.isActive || account.connectionStatus !== 'connected'
  )
  const selectedCount = Object.keys(selections).length
  const dailyCapacity = usableAccounts
  const activeDailyCapacity = usableAccounts
    .filter((account) => selections[account.id])
    .reduce((sum, account) => sum + account.dailyLimit, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b]">
          GOOGLE DRIVE SENDER ACCOUNTS
        </label>
        {selectedCount > 0 && (
          <span className="text-xs font-mono text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-0.5 rounded-full font-bold">
            {selectedCount} selected · {activeDailyCapacity} shares/day
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs text-[#62605c] bg-[#faf8f4] rounded-[20px] border border-[#121316]/08">
          Loading Drive accounts...
        </div>
      ) : usableAccounts.length === 0 ? (
        <div className="p-6 bg-[#ee382b]/05 border border-dashed border-[#ee382b]/30 rounded-[20px] text-[#ee382b] text-xs leading-relaxed flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-[#ee382b]" />
          <div>
            No connected Drive account is available.{' '}
            <Link href="/gdrive" className="text-[#121316] underline font-bold hover:text-[#ee382b]">
              Connect one on the GDrive page
            </Link>{' '}
            first.
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {usableAccounts.map((account) => {
            const selection = selections[account.id]
            const checked = Boolean(selection)
            const files = filesByAccount[account.id] || []
            return (
              <div
                key={account.id}
                className={`p-5 rounded-[20px] border transition-all duration-200 ${
                  checked
                    ? 'border-[#ee382b] bg-white shadow-[0_8px_24px_rgba(238,56,43,0.06)] ring-1 ring-[#ee382b]/30'
                    : 'border-[#121316]/08 bg-[#faf8f4] hover:bg-white hover:border-[#121316]/16'
                }`}
              >
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => toggleAccount(account, event.target.checked)}
                    className="h-4 w-4 rounded text-[#ee382b] focus:ring-[#ee382b]"
                  />
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white border border-[#121316]/08 text-[#121316]">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#121316]">{account.email}</span>
                    <div className="text-xs text-[#62605c] mt-0.5">
                      <span className="font-mono font-bold text-[#121316]">{account.remainingToday}</span> of {account.dailyLimit} shares left today
                    </div>
                  </div>

                  <span
                    className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
                      files.length === 0
                        ? 'bg-[#b7791f]/10 text-[#b7791f] border border-[#b7791f]/20'
                        : 'bg-[#121316]/06 text-[#62605c]'
                    }`}
                  >
                    {filesLoading ? '...' : `${files.length} file${files.length !== 1 ? 's' : ''} uploaded`}
                  </span>
                </label>

                {checked && (
                  <div className="mt-4 pt-4 border-t border-[#121316]/08 grid gap-3">
                    <div className="flex gap-2 items-center">
                      <select
                        value={selection?.driveFileId || ''}
                        onChange={(event) => selectFile(account.id, event.target.value)}
                        disabled={filesLoading || files.length === 0}
                        className="flex-1 px-3.5 py-2.5 rounded-[12px] border border-[#121316]/12 bg-white text-xs text-[#121316] focus:border-[#ee382b] focus:outline-none"
                      >
                        <option value="" disabled>
                          {filesLoading ? 'Loading files...' : 'Select the file to share...'}
                        </option>
                        {files.map((file) => (
                          <option key={file.id} value={file.id}>
                            {file.name} ({friendlyType(file.mimeType)})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void loadFiles()}
                        disabled={filesLoading}
                        title="Refresh file list"
                        className="p-2.5 rounded-[12px] border border-[#121316]/12 bg-white text-[#62605c] hover:text-[#121316] hover:bg-[#faf8f4] transition-colors"
                      >
                        <RefreshCw className={`h-4 w-4 ${filesLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {filesError && (
                      <div className="text-xs text-[#c2414c]">
                        {filesError}{' '}
                        <Link href="/gdrive" className="underline font-bold">Fix on GDrive page</Link>
                      </div>
                    )}

                    {!filesLoading && !filesError && files.length === 0 && (
                      <div className="text-xs text-[#b7791f]">
                        No files uploaded for this account yet.{' '}
                        <Link href="/gdrive" className="underline font-bold">
                          Upload one on GDrive page
                        </Link>{' '}
                        first.
                      </div>
                    )}

                    {files.length > 0 && !selection?.driveFileId && (
                      <div className="text-xs text-[#b7791f]">
                        Pick a file — every selected account needs one attached.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {blockedAccounts.length > 0 && (
        <div className="text-xs text-[#62605c]">
          {blockedAccounts.length} account{blockedAccounts.length !== 1 ? 's are' : ' is'} paused or needs
          reconnecting.{' '}
          <Link href="/gdrive" className="text-[#ee382b] font-semibold hover:underline">
            Manage on GDrive page
          </Link>
        </div>
      )}
    </div>
  )
}

