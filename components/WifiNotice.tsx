import { copy } from '@/lib/copy'

// Same size as the English headline line in BrandHeader (text-sm / sm:text-lg / lg:text-xl).
export function WifiNotice() {
  return (
    <p className="text-center font-display text-sm font-bold text-white sm:text-lg lg:text-xl">
      {copy.shared.wifiNotice}
    </p>
  )
}
