'use client'

import { StatusBadge } from '@/components/shared/StatusBadge'

export const panelStyle: React.CSSProperties = {
  padding: '24px',
  borderRadius: '24px',
  border: '1px solid rgba(18, 19, 22, 0.08)',
  background: '#ffffff',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
}

export const surfaceCardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '20px',
  border: '1px solid rgba(18, 19, 22, 0.08)',
  background: '#faf8f4',
}

export function StatCard({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div style={surfaceCardStyle}>
      <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'monospace', color }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#62605c', marginTop: '4px' }}>{label}</div>
    </div>
  )
}

export function MetricPair({ label, value, tone = '#121316' }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#62605c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: tone, marginTop: '3px', lineHeight: 1.45 }}>{value}</div>
    </div>
  )
}

export function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, Math.round((value / Math.max(1, max)) * 100)))
  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ height: '8px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(18, 19, 22, 0.06)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: color, transition: 'width 400ms ease' }} />
      </div>
    </div>
  )
}

export function AccountHeader(props: {
  title: string
  providerLabel: string
  statusLabel: string
  secondaryStatus?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      <div style={{ fontSize: '17px', fontWeight: 700, color: '#121316' }}>{props.title}</div>
      <StatusBadge status={props.providerLabel.toLowerCase()} />
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#121316]/06 text-[#121316] border border-[#121316]/08">
        {props.statusLabel}
      </span>
      {props.secondaryStatus ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#faf8f4] text-[#62605c] border border-[#121316]/06">
          {props.secondaryStatus}
        </span>
      ) : null}
    </div>
  )
}

export function ActionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-2.5 sm:grid-cols-2">{children}</div>
}

