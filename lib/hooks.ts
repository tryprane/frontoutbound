'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import type { CurrentUser } from '@/lib/types'

type GateState = 'loading' | 'ready' | 'denied'

/**
 * Client-side equivalent of the backend's `requireActiveOrganization` /
 * `requireSuperAdmin` guards. The backend still enforces access on every
 * endpoint — this only decides what to render while that happens, and turns
 * the AccessError codes into the same redirects the server pages used to do.
 */
export function useAccessGate(options?: { requireSuperAdmin?: boolean }) {
  const requireSuperAdmin = options?.requireSuperAdmin ?? false
  const router = useRouter()
  const [state, setState] = useState<GateState>('loading')
  const [me, setMe] = useState<CurrentUser | null>(null)

  useEffect(() => {
    let cancelled = false

    api
      .get<CurrentUser>('/api/me')
      .then((data) => {
        if (cancelled) return
        if (requireSuperAdmin && !data.user.isSuperAdmin) {
          setState('denied')
          router.replace('/dashboard')
          return
        }
        setMe(data)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState('denied')

        if (error instanceof ApiError) {
          if (error.code === 'HOST_REQUIRED') {
            const target = (error.payload as { redirectTo?: string } | null)?.redirectTo
            if (target) {
              window.location.href = target
              return
            }
          }
          if (error.code === 'NOT_PROVISIONED') {
            router.replace('/not-provisioned')
            return
          }
          if (error.code === 'FORBIDDEN' || error.code === 'CUSTOM_DOMAIN_DISABLED') {
            router.replace('/dashboard')
            return
          }
        }
        router.replace('/login')
      })

    return () => {
      cancelled = true
    }
  }, [requireSuperAdmin, router])

  return { state, me }
}

interface ResourceState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Fetch a JSON endpoint on mount, with a `reload()` for refresh buttons.
 * Access errors are left to `useAccessGate`, which runs in the layout.
 */
export function useApiResource<T>(path: string | null): ResourceState<T> & {
  reload: () => void
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(path !== null)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const load = useCallback(() => {
    if (!path) {
      setData(null)
      setLoading(false)
      return
    }

    const id = ++requestId.current
    setLoading(true)
    setError(null)

    api
      .get<T>(path)
      .then((payload) => {
        if (id !== requestId.current) return
        setData(payload)
        setLoading(false)
      })
      .catch((caught: unknown) => {
        if (id !== requestId.current) return
        setError(caught instanceof Error ? caught.message : 'Request failed')
        setLoading(false)
      })
  }, [path])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
