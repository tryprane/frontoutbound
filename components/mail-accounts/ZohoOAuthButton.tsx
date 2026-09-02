'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function ZohoOAuthButton() {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = () => {
    setConnecting(true)
    window.location.href = '/api/mail-accounts/zoho/connect'
  }

  return (
    <div className="flex items-center justify-between gap-5 p-5 rounded-2xl border border-[#2563eb]/20 bg-[#2563eb]/04 flex-wrap">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
          Z
        </div>
        <div>
          <div className="font-bold text-sm text-[#121316]">
            Add Zoho API to the same mailbox
          </div>
          <div className="text-xs text-[#62605c] mt-0.5 max-w-xl leading-relaxed">
            This does not create a second sender. If you connect the same email you saved with SMTP, the app upgrades that same mailbox with inbox sync, spam rescue, and reply actions through Zoho API.
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={connecting}
        onClick={handleConnect}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#121316] text-xs font-bold text-white shadow-sm hover:bg-black disabled:opacity-50 transition-all cursor-pointer shrink-0"
      >
        {connecting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Redirecting...</span>
          </>
        ) : (
          <span>Connect Same Mailbox</span>
        )}
      </button>
    </div>
  )
}
