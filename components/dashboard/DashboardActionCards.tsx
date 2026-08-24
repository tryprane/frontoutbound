'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Rocket, Upload, Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function DashboardActionCards() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid .csv file')
      return
    }

    try {
      setIsUploading(true)
      toast.loading(`Importing ${file.name}...`, { id: 'csv-drop-upload' })
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/csv/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload CSV')
      }

      toast.success(`Successfully uploaded ${file.name} (${data.totalRows || 0} rows)`, {
        id: 'csv-drop-upload',
      })
      router.push('/csv')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error uploading CSV', { id: 'csv-drop-upload' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleUploadFile(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  return (
    <div>
      <div className="mb-6">
        <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
          QUICK ACTIONS
        </span>
        <div className="flex items-center gap-6">
          <h2 className="zoho-puvi-headline whitespace-nowrap text-xl sm:text-2xl font-bold text-[#121316]">
            Keep the workspace moving
          </h2>
          <div className="h-px flex-1 bg-[#121316]/10" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Start a Campaign */}
        <Link
          href="/campaigns/new"
          className="uneevo-card group relative flex flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#121316]/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#121316] text-white shadow-xs transition-transform duration-300 group-hover:scale-105">
                <Rocket className="h-5 w-5" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#121316]/06 text-[#62605c] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:bg-[#ee382b] group-hover:text-white shadow-xs">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 text-base font-bold text-[#121316]">
              Start a campaign
            </div>
            <p className="mt-1.5 text-xs text-[#52504b] leading-relaxed">
              Configure sequences, cadence, and activate outbound momentum.
            </p>
          </div>
        </Link>

        {/* Card 2: Upload a CSV with Drag & Drop */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (!isUploading) {
              router.push('/csv')
            }
          }}
          className={`uneevo-card group relative flex flex-col justify-between p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] ${
            isDragging
              ? 'border-[#0f8a5f] bg-[#0f8a5f]/06 ring-2 ring-[#0f8a5f]/20'
              : 'hover:border-[#121316]/15'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUploadFile(e.target.files[0])
              }
            }}
          />

          <div>
            <div className="flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-[14px] shadow-xs transition-all duration-300 ${
                  isDragging
                    ? 'bg-[#0f8a5f] text-white scale-110'
                    : 'bg-[#f5f3ef] text-[#121316] group-hover:bg-[#ebe8e1] group-hover:scale-105'
                }`}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isDragging ? (
                  <span className="text-xs font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-0.5 rounded-full border border-[#0f8a5f]/20 animate-bounce">
                    Drop to upload
                  </span>
                ) : (
                  <span className="hidden group-hover:inline-block text-[11px] font-mono font-semibold text-[#62605c] bg-[#121316]/06 px-2.5 py-0.5 rounded-full">
                    Drop CSV here
                  </span>
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#121316]/06 text-[#62605c] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:bg-[#ee382b] group-hover:text-white shadow-xs">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="mt-5 text-base font-bold text-[#121316] flex items-center gap-2">
              <span>Upload a CSV</span>
              {isDragging && <CheckCircle2 className="h-4 w-4 text-[#0f8a5f]" />}
            </div>
            <p className="mt-1.5 text-xs text-[#52504b] leading-relaxed">
              {isDragging
                ? 'Release mouse to immediately process and map lead columns.'
                : 'Import fresh leads or drag & drop contact files directly onto this card.'}
            </p>
          </div>
        </div>

        {/* Card 3: Add Mail Accounts */}
        <Link
          href="/mail-accounts"
          className="uneevo-card group relative flex flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#121316]/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#fde9b0] text-[#5c4211] shadow-xs transition-transform duration-300 group-hover:scale-105">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#121316]/06 text-[#62605c] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:bg-[#ee382b] group-hover:text-white shadow-xs">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 text-base font-bold text-[#121316]">
              Add mail accounts
            </div>
            <p className="mt-1.5 text-xs text-[#52504b] leading-relaxed">
              Expand sender inventory, connect Gmail / Zoho / SMTP, and balance volume.
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
