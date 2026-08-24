'use client'

import { PraneAccessCodesClient } from '@/components/prane/PraneAccessCodesClient'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'
import type { PraneAccessCode } from '@/lib/types'

export default function PraneAccessCodesPage() {
  const { data, loading, error } = useApiResource<PraneAccessCode[]>('/api/prane/access-codes')

  if (loading) return <PraneLoading label="Loading access codes..." />
  if (error || !data) return <PraneError message={error} />

  return (
    <PraneAccessCodesClient
      initialCodes={data.map((code) => ({
        id: code.id,
        codePrefix: code.codePrefix,
        createdAt: code.createdAt,
        usedAt: code.usedAt,
        usedByEmail: code.usedByUser?.email ?? null,
      }))}
    />
  )
}
