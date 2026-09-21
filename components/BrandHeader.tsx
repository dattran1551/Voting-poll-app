import { copy } from '@/lib/copy'

export function BrandHeader() {
  return (
    <header className="relative flex items-center justify-center px-4 py-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/vnggameson-logo.png"
        alt={copy.shared.logoAlt}
        className="absolute left-4 top-1/2 h-5 -translate-y-1/2 sm:h-6"
      />
      <p className="text-center font-display text-xs font-extrabold uppercase tracking-wide text-white sm:text-sm">
        {copy.shared.headerTitle}
      </p>
    </header>
  )
}
