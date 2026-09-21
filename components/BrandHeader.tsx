import { copy } from '@/lib/copy'

export function BrandHeader() {
  return (
    <header className="flex flex-col gap-3 px-4 pt-4 pb-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/vnggameson-logo.png" alt={copy.shared.logoAlt} className="h-5 self-start sm:h-6" />
      <div className="flex flex-col items-center gap-1">
        <p className="text-center font-display text-xl font-extrabold uppercase leading-tight tracking-wide text-white sm:text-3xl lg:text-4xl">
          {copy.shared.headerTitleVi}
        </p>
        <p className="text-center font-display text-sm font-bold uppercase tracking-wide text-white sm:text-lg lg:text-xl">
          {copy.shared.headerTitleEn}
        </p>
      </div>
    </header>
  )
}
