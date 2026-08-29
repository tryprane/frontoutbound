'use client'

import Image from 'next/image'
import Link from 'next/link'

interface BrandLogoProps {
  variant?: 'full' | 'horizontal' | 'icon-only'
  theme?: 'light' | 'dark' | 'auto'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  className?: string
  href?: string
  priority?: boolean
}

export function BrandIcon({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizeMap = {
    sm: { w: 28, h: 28, svgSize: 'w-7 h-7' },
    md: { w: 36, h: 36, svgSize: 'w-9 h-9' },
    lg: { w: 44, h: 44, svgSize: 'w-11 h-11' },
    xl: { w: 56, h: 56, svgSize: 'w-14 h-14' },
  }

  const { w, h, svgSize } = sizeMap[size] || sizeMap.md

  return (
    <div className={`relative shrink-0 flex items-center justify-center ${svgSize} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <defs>
          <linearGradient id="outreachBlueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0052FF" />
            <stop offset="100%" stopColor="#0038D1" />
          </linearGradient>
        </defs>

        {/* Outer C shape */}
        <path
          d="M 68 28
             C 68 28, 62 14, 44 14
             C 24 14, 12 28, 12 50
             C 12 72, 24 86, 44 86
             C 62 86, 68 72, 68 72
             L 54 72
             C 54 72, 48 78, 44 78
             C 30 78, 22 68, 22 50
             C 22 32, 30 22, 44 22
             C 48 22, 54 28, 54 28
             Z"
          fill="url(#outreachBlueGrad)"
        />

        {/* Arrow shaft & head */}
        <path
          d="M 36 44
             L 60 44
             L 60 36
             L 86 50
             L 60 64
             L 60 56
             L 36 56
             Z"
          fill="url(#outreachBlueGrad)"
        />
      </svg>
    </div>
  )
}

export function BrandLogo({
  variant = 'horizontal',
  theme = 'light',
  size = 'md',
  showTagline = false,
  className = '',
  href,
  priority = false,
}: BrandLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* High-res / Vector Icon */}
      <BrandIcon size={size} />

      {/* Typography Lockup */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight uppercase ${
                size === 'sm'
                  ? 'text-base sm:text-lg'
                  : size === 'lg'
                  ? 'text-2xl sm:text-3xl'
                  : size === 'xl'
                  ? 'text-3xl sm:text-4xl'
                  : 'text-lg sm:text-xl'
              } ${theme === 'dark' ? 'text-white' : 'text-[#0B0F19]'}`}
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.03em' }}
            >
              OUTREACH
            </span>
            <span
              className={`font-black tracking-tight uppercase text-[#0052FF] ${
                size === 'sm'
                  ? 'text-base sm:text-lg'
                  : size === 'lg'
                  ? 'text-2xl sm:text-3xl'
                  : size === 'xl'
                  ? 'text-3xl sm:text-4xl'
                  : 'text-lg sm:text-xl'
              }`}
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.03em' }}
            >
              OS
            </span>
          </div>

          {showTagline && (
            <span
              className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.22em] mt-0.5 ${
                theme === 'dark' ? 'text-gray-400' : 'text-[#64748B]'
              }`}
            >
              The Operating System for Outbound
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block focus:outline-none">
        {content}
      </Link>
    )
  }

  return content
}

export default BrandLogo
