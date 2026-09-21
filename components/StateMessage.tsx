type StateMessageKind = 'loading' | 'empty' | 'error'

export function StateMessage({
  kind,
  text,
  bright = false,
}: {
  kind: StateMessageKind
  text: string
  /** Full-brightness text for Display/Employee. Defaults to false so Admin keeps its existing muted look. */
  bright?: boolean
}) {
  const mutedTextColor = bright ? 'text-white' : 'text-white/60'

  if (kind === 'error') {
    return (
      <p role="alert" className="text-center font-body text-sm text-brand-pink py-8">
        {text}
      </p>
    )
  }

  if (kind === 'loading') {
    return (
      <p role="status" className={`text-center font-body text-sm ${mutedTextColor} py-8`}>
        {text}
      </p>
    )
  }

  return <p className={`text-center font-body text-sm ${mutedTextColor} py-8`}>{text}</p>
}
