type StateMessageKind = 'loading' | 'empty' | 'error'

export function StateMessage({ kind, text }: { kind: StateMessageKind; text: string }) {
  if (kind === 'error') {
    return (
      <p role="alert" className="text-center font-body text-sm text-brand-pink py-8">
        {text}
      </p>
    )
  }

  if (kind === 'loading') {
    return (
      <p role="status" className="text-center font-body text-sm text-white/60 py-8">
        {text}
      </p>
    )
  }

  return <p className="text-center font-body text-sm text-white/60 py-8">{text}</p>
}
