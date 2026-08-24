'use client'

import { Mail } from 'lucide-react'

export function MicrosoftOAuthButton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-secondary)', flexWrap: 'wrap' }}>
      <div style={{ width: '44px', height: '44px', display: 'grid', placeItems: 'center', background: '#0078d4', color: 'white', borderRadius: '6px', flexShrink: 0 }}>
        <Mail size={22} aria-hidden="true" />
      </div>
      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Microsoft Graph OAuth</div>
        <div style={{ marginTop: '4px', fontSize: '12px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          Connect an Outlook.com, Hotmail, Live, or Microsoft 365 mailbox for sending, sync, replies, importance, and spam rescue.
        </div>
      </div>
      <button className="btn-primary" type="button" onClick={() => { window.location.href = '/api/mail-accounts/outlook' }}>
        <Mail size={16} aria-hidden="true" />
        Connect Microsoft
      </button>
    </div>
  )
}
