'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileSpreadsheet, Upload, Trash2, ArrowRight, Layers, Calendar, CheckCircle2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface CsvFileRecord {
  id: string
  originalName: string
  rowCount: number
  uploadedAt: string
  _count: { campaigns: number }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function CsvListPage() {
  const [files, setFiles] = useState<CsvFileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CsvFileRecord | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/csv/upload')
      .then((r) => r.json())
      .then((data) => {
        setFiles(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const executeDelete = async () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeletingId(id)
    setDeleteError(null)
    try {
      const response = await fetch(`/api/csv/${id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setDeleteError(data.error || 'Failed to delete CSV file.')
        return
      }
      setFiles((prev) => prev.filter((f) => f.id !== id))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete CSV file.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Floating Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#121316] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#121316]/08 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#0f8a5f]" />
            <span>{files.length} Lead Dataset{files.length !== 1 ? 's' : ''}</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <Link
            href="/csv/upload"
            className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_16px_rgba(238,56,43,0.28)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_8px_24px_rgba(238,56,43,0.38)] active:scale-95"
          >
            <Upload className="h-4 w-4" />
            <span>Upload CSV</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="uneevo-card rounded-[28px] p-16 text-center text-[#62605c] font-medium shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          Loading datasets...
        </div>
      ) : files.length === 0 ? (
        <div className="uneevo-card rounded-[28px] border border-[#121316]/08 bg-white p-12 sm:p-16 text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#121316] text-white shadow-xs mx-auto mb-4">
            <Upload className="h-7 w-7" />
          </div>
          <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
            EMPTY REPOSITORY
          </span>
          <h2 className="zoho-puvi-headline text-xl sm:text-2xl font-bold text-[#121316] mb-2">
            No CSV Files Uploaded Yet
          </h2>
          <p className="text-xs sm:text-sm text-[#62605c] max-w-md mx-auto mb-8">
            Upload your first contact dataset to auto-map company names, emails, and custom attributes.
          </p>
          <Link
            href="/csv/upload"
            className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-7 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)]"
          >
            <Upload className="h-4 w-4" />
            <span>Upload your first CSV</span>
          </Link>
        </div>
      ) : (
        <div className="uneevo-card overflow-hidden rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#121316]/08 bg-[#faf8f4] text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
                  <th className="px-6 py-4">Dataset Name</th>
                  <th className="px-6 py-4">Total Rows</th>
                  <th className="px-6 py-4">Campaigns</th>
                  <th className="px-6 py-4">Uploaded</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#121316]/06">
                {files.map((file) => (
                  <tr
                    key={file.id}
                    className="transition-colors hover:bg-[#faf8f4]/60"
                  >
                    <td className="px-6 py-4 font-semibold text-[#121316]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#121316]/06 text-[#121316] shrink-0">
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                        <span className="truncate max-w-xs">{file.originalName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-[#121316] tabular-nums">
                        {file.rowCount.toLocaleString()}
                      </span>
                      <span className="text-[#62605c] ml-1">prospects</span>
                    </td>
                    <td className="px-6 py-4 text-[#62605c]">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Layers className="h-3.5 w-3.5 text-[#8a8780]" />
                        {file._count.campaigns} campaign{file._count.campaigns !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#62605c]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#8a8780]" />
                        {formatDate(file.uploadedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/csv/${file.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-[#121316]/12 bg-white px-4 py-1.5 text-xs font-semibold text-[#121316] transition-all hover:bg-[#faf8f4] hover:shadow-xs"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(file)}
                          disabled={deletingId === file.id}
                          className="inline-flex items-center justify-center rounded-full border border-[#ee382b]/20 bg-[#ee382b]/08 px-3 py-1.5 text-xs font-semibold text-[#ee382b] transition-all hover:bg-[#ee382b]/15 disabled:opacity-50 cursor-pointer"
                          title="Delete dataset"
                        >
                          {deletingId === file.id ? '...' : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Dataset"
        description={
          deleteTarget ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to delete <span className="font-bold text-[#121316]">&ldquo;{deleteTarget.originalName}&rdquo;</span>?
              </p>
              <p className="text-xs text-[#8a8780]">
                All {deleteTarget.rowCount.toLocaleString()} contact prospects in this dataset will be permanently removed. This action cannot be undone.
              </p>
              {deleteError && (
                <div className="rounded-xl border border-[#ee382b]/20 bg-[#ee382b]/08 p-2.5 text-xs text-[#ee382b] font-medium">
                  {deleteError}
                </div>
              )}
            </div>
          ) : ''
        }
        confirmLabel="Delete Dataset"
        cancelLabel="Keep Dataset"
        variant="danger"
        icon="trash"
        isLoading={Boolean(deletingId)}
        onConfirm={executeDelete}
        onClose={() => {
          if (!deletingId) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
      />
    </div>
  )
}
