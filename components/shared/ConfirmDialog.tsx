'use client'

import { useEffect, type ReactNode } from 'react'
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string | ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  icon?: 'trash' | 'warning' | 'none'
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon = 'trash',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#121316]/55 backdrop-blur-md transition-all duration-200"
      onClick={() => {
        if (!isLoading) onClose()
      }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[26px] border border-[#121316]/10 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] transition-all duration-200 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#121316]/08 text-[#62605c] hover:bg-[#faf8f4] hover:text-[#121316] transition-colors disabled:opacity-40 cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-start gap-4 mb-3">
          {icon !== 'none' && (
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs ${
                variant === 'danger'
                  ? 'bg-[#ee382b]/10 text-[#ee382b]'
                  : variant === 'warning'
                  ? 'bg-[#b7791f]/15 text-[#b7791f]'
                  : 'bg-[#121316]/08 text-[#121316]'
              }`}
            >
              {icon === 'trash' ? (
                <Trash2 className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
          )}

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="zoho-puvi-headline text-lg sm:text-xl font-bold text-[#121316] tracking-tight">
              {title}
            </h3>
          </div>
        </div>

        {/* Description Body */}
        <div className="text-xs sm:text-sm text-[#62605c] leading-relaxed pl-0 sm:pl-16">
          {typeof description === 'string' ? <p>{description}</p> : description}
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-[#121316]/06">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-[#121316]/12 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#121316] transition-all hover:bg-[#faf8f4] hover:shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
              variant === 'danger'
                ? 'bg-[#ee382b] shadow-[0_4px_16px_rgba(238,56,43,0.28)] hover:bg-[#d92b1f] hover:shadow-[0_8px_24px_rgba(238,56,43,0.38)]'
                : variant === 'warning'
                ? 'bg-[#b7791f] shadow-[0_4px_16px_rgba(183,121,31,0.28)] hover:bg-[#975a16]'
                : 'bg-[#121316] hover:bg-[#25272c]'
            }`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
