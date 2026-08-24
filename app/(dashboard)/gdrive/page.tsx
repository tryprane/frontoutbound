'use client'

import { Suspense } from 'react'
import { GDriveWorkspace } from '@/components/gdrive/GDriveWorkspace'

export default function GDrivePage() {
  return (
    <Suspense fallback={<div className="animate-fade-in">Loading...</div>}>
      <GDriveWorkspace />
    </Suspense>
  )
}
