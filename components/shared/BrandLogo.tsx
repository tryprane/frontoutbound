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
  priority = false,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  priority?: boolean
}) {
  const sizeMap = {
    sm: { px: 26, cls: 'w-[26px] h-[26px]' },
    md: { px: 34, cls: 'w-[34px] h-[34px]' },
    lg: { px: 42, cls: 'w-[42px] h-[42px]' },
    xl: { px: 52, cls: 'w-[52px] h-[52px]' },
  }

  const { px, cls } = sizeMap[size] || sizeMap.md

  return (
    <div className={`relative shrink-0 inline-flex items-center justify-center ${cls} ${className}`}>
      <Image
        src="/brand/logo-icon.png"
        alt="OutboundOS"
        width={px}
        height={px}
        className="w-full h-full object-contain drop-shadow-2xs select-none"
        priority={priority}
      />
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
  const sizeMap = {
    sm: { h: 24, w: 100 },
    md: { h: 30, w: 125 },
    lg: { h: 38, w: 159 },
    xl: { h: 48, w: 200 },
  }

  const { h, w } = sizeMap[size] || sizeMap.md
  const isDark = theme === 'dark'

  const content = (
    <div className={`inline-flex items-center group select-none ${className}`}>
      {variant === 'icon-only' ? (
        <BrandIcon size={size} priority={priority} />
      ) : (
        <div className="flex flex-col">
          <Image
            src={isDark ? '/brand/logo-full-dark.png' : '/brand/logo-full.png'}
            alt="OutboundOS"
            width={w}
            height={h}
            className="h-auto w-auto object-contain max-h-[56px] select-none"
            priority={priority}
          />
          {showTagline && (
            <span
              className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.22em] mt-0.5 ${
                isDark ? 'text-gray-400' : 'text-[#64748B]'
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
