'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Save, Tag } from 'lucide-react'
import {
  ColumnMapping,
  ColumnMappingEntry,
  PredefinedVariable,
  PREDEFINED_VARIABLE_LABELS,
  describeColumnMapping,
  getMappedPredefinedField,
  sanitizeVariableName,
} from '@/lib/csv-parser/column-detector'

interface ColumnMapperProps {
  csvFileId: string
  headers: string[]
  currentMapping: ColumnMapping
  preview: Record<string, string>[]
  onMappingSaved: () => void
}

type MappingOption = PredefinedVariable | 'custom' | 'ignore'

const PREDEFINED_FIELDS: PredefinedVariable[] = [
  'email',
  'firstName',
  'lastName',
  'companyName',
  'jobTitle',
  'personalization',
  'phone',
  'website',
  'location',
  'linkedin',
]

const FIELD_COLORS: Record<string, string> = {
  email: '#ee382b',
  firstName: '#3b82f6',
  lastName: '#60a5fa',
  companyName: '#6366f1',
  jobTitle: '#14b8a6',
  personalization: '#ec4899',
  phone: '#0f8a5f',
  website: '#10b981',
  location: '#f97316',
  linkedin: '#0ea5e9',
  custom: '#8b5cf6',
  ignore: '#8a8780',
}

function getOptionValue(entry: ColumnMappingEntry | undefined): MappingOption {
  if (!entry || entry.type === 'ignore') return 'ignore'
  if (entry.type === 'custom') return 'custom'
  return entry.field || 'ignore'
}

export function ColumnMapper({
  csvFileId,
  headers,
  currentMapping,
  preview,
  onMappingSaved,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(currentMapping)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const variableNames = useMemo(
    () =>
      Object.fromEntries(
        headers.map((header) => [
          header,
          sanitizeVariableName(mapping[header]?.variableName || header),
        ])
      ) as Record<string, string>,
    [headers, mapping]
  )

  const handleTypeChange = (header: string, nextValue: MappingOption) => {
    setMapping((prev) => {
      const next = { ...prev }

      if (nextValue === 'ignore') {
        next[header] = { type: 'ignore' }
        return next
      }

      if (nextValue === 'custom') {
        next[header] = {
          type: 'custom',
          variableName: sanitizeVariableName(prev[header]?.variableName || header),
        }
        return next
      }

      for (const [otherHeader, entry] of Object.entries(next)) {
        if (otherHeader !== header && entry.type === 'predefined' && entry.field === nextValue) {
          next[otherHeader] = { type: 'ignore' }
        }
      }

      next[header] = { type: 'predefined', field: nextValue }
      return next
    })
  }

  const handleVariableNameChange = (header: string, nextValue: string) => {
    setMapping((prev) => ({
      ...prev,
      [header]: {
        type: 'custom',
        variableName: sanitizeVariableName(nextValue || header),
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSavedMsg('')

    try {
      const res = await fetch('/api/csv/map-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: csvFileId, columnMap: mapping }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSavedMsg('Column mapping saved. Lead variables are ready for campaigns.')
      setTimeout(onMappingSaved, 1200)
    } catch {
      setSavedMsg('Failed to save mapping. Please review the fields and try again.')
    } finally {
      setSaving(false)
    }
  }

  const emailHeader = getMappedPredefinedField(mapping, 'email')
  const phoneHeader = getMappedPredefinedField(mapping, 'phone')
  const hasCampaignIdentifier = Boolean(emailHeader || phoneHeader)
  const mappedCount = Object.values(mapping).filter((entry) => entry.type !== 'ignore').length

  return (
    <div className="space-y-6">
      <div>
        <h3 className="zoho-puvi-headline text-lg font-bold text-[#121316]">
          Map CSV Columns to Lead Schema
        </h3>
        <p className="text-xs sm:text-sm text-[#62605c] mt-0.5">
          Match each column to standard contact attributes or custom template variables.
        </p>
      </div>

      <div className="space-y-3">
        {headers.map((header) => {
          const entry = mapping[header] || { type: 'custom', variableName: header }
          const optionValue = getOptionValue(entry)
          const sampleValues = preview
            .map((row) => row[header])
            .filter(Boolean)
            .slice(0, 3)
          const colorKey = entry.type === 'predefined' ? entry.field || 'ignore' : entry.type
          const isIgnored = entry.type === 'ignore'

          return (
            <div
              key={header}
              className={`uneevo-card p-4 sm:p-5 rounded-[20px] border transition-all duration-200 ${
                isIgnored
                  ? 'border-[#121316]/06 bg-[#faf8f4]/60 opacity-60'
                  : 'border-[#121316]/08 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.02)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: FIELD_COLORS[colorKey] || FIELD_COLORS.ignore }}
                    />
                    <span className="font-bold text-sm text-[#121316] truncate">{header}</span>
                  </div>
                  <div className="text-[11px] text-[#8a8780] truncate mt-1">
                    Sample:{' '}
                    <span className="font-mono text-[#62605c]">
                      {sampleValues.join(' · ') || 'No sample data'}
                    </span>
                  </div>
                </div>

                <select
                  value={optionValue}
                  onChange={(event) => handleTypeChange(header, event.target.value as MappingOption)}
                  className="rounded-[12px] border border-[#121316]/12 bg-[#faf8f4] px-3.5 py-2 text-xs font-semibold text-[#121316] transition focus:border-[#ee382b] focus:bg-white focus:outline-none min-w-[200px]"
                >
                  {PREDEFINED_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {PREDEFINED_VARIABLE_LABELS[field]}
                    </option>
                  ))}
                  <option value="custom">Custom Variable</option>
                  <option value="ignore">Do Not Import</option>
                </select>
              </div>

              {entry.type === 'custom' && (
                <div className="flex items-center gap-3 pt-3 mt-3 border-t border-[#121316]/06 flex-wrap">
                  <label className="text-xs font-bold text-[#8a8780]">Variable tag:</label>
                  <input
                    type="text"
                    value={variableNames[header]}
                    onChange={(event) => handleVariableNameChange(header, event.target.value)}
                    className="rounded-[10px] border border-[#121316]/12 bg-[#faf8f4] px-3 py-1.5 text-xs text-[#121316] font-mono focus:border-[#ee382b] focus:bg-white focus:outline-none"
                  />
                  <span className="text-[11px] font-mono text-[#8a8780]">
                    Available in template as: <strong className="text-[#ee382b]">{`{{${variableNames[header]}}}`}</strong>
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mapped Variable Badges */}
      <div className="flex flex-wrap gap-2 pt-2">
        {headers
          .filter((header) => mapping[header]?.type !== 'ignore')
          .map((header) => {
            const entry = mapping[header]
            if (!entry) return null
            const colorKey = entry.type === 'predefined' ? entry.field || 'ignore' : entry.type
            return (
              <span
                key={header}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#faf8f4] border border-[#121316]/08 text-[#121316]"
              >
                <Tag className="h-3 w-3 text-[#ee382b]" />
                <span>{header}</span>
                <span className="text-[#8a8780]">→</span>
                <span className="font-mono text-[#ee382b]">{describeColumnMapping(entry, header)}</span>
              </span>
            )
          })}
      </div>

      {/* Save Action Row */}
      <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-[#121316]/08">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasCampaignIdentifier}
          className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)] disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving Schema...' : 'Save Column Mapping'}</span>
        </button>

        {!hasCampaignIdentifier && (
          <div className="flex items-center gap-1.5 text-xs text-[#b7791f]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Map at least Email or Phone so this CSV can be used in campaigns.</span>
          </div>
        )}

        {savedMsg && (
          <div
            className={`text-xs font-semibold ${
              savedMsg.startsWith('Failed') ? 'text-[#c2414c]' : 'text-[#0f8a5f]'
            }`}
          >
            {savedMsg}
          </div>
        )}
      </div>
    </div>
  )
}

