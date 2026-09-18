type StateMessageKind = 'loading' | 'empty' | 'error'

export function StateMessage({ kind, text }: { kind: StateMessageKind; text: string }) {
  if (kind === 'error') {
    return (
      <p role="alert" className="text-center text-sm text-neutral-500 py-8">
        {text}
      </p>
    )
  }

  if (kind === 'loading') {
    return (
      <p role="status" className="text-center text-sm text-neutral-400 py-8">
        {text}
      </p>
    )
  }

  return <p className="text-center text-sm text-neutral-400 py-8">{text}</p>
}
