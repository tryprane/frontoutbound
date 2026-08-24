'use client'

import { Search } from 'lucide-react'

export function FloatingSearchButton() {
  const handleOpen = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="fixed bottom-7 right-7 z-40 group flex h-14 w-14 hover:w-56 items-center justify-start overflow-hidden rounded-full bg-[#ee382b] text-white shadow-[0_16px_36px_rgba(238,56,43,0.32)] border border-white/25 hover:bg-[#d92b1f] hover:shadow-[0_20px_48px_rgba(238,56,43,0.44)] transition-all duration-300 ease-out cursor-pointer p-0"
      title="Search workspace (⌘K / Ctrl+K)"
      aria-label="Open command search palette"
    >
      {/* Icon centered in circular default state */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center">
        <Search className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
      </div>

      {/* Expanded content on hover */}
      <div className="flex items-center gap-2.5 pr-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap overflow-hidden">
        <span className="text-sm font-bold tracking-wide text-white">Search</span>
        <span className="flex items-center gap-0.5 text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-md text-white border border-white/20 shadow-xs">
          <span className="text-[10px]">⌘</span>K
        </span>
      </div>
    </button>
  )
}
