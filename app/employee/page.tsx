'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useCapacityGate } from '@/lib/useCapacityGate'
import { useQuestionList } from '@/lib/useQuestionList'
import { getDeviceId } from '@/lib/device-id'
import { QuestionCard } from '@/components/QuestionCard'
import { StateMessage } from '@/components/StateMessage'
import { copy } from '@/lib/copy'

const MAX_LENGTH = 300

export default function EmployeePage() {
  const gateState = useCapacityGate()
  const { questions, state } = useQuestionList()
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (gateState !== 'admitted') {
    return (
      <main className="flex h-screen items-center justify-center p-8">
        <StateMessage kind="loading" text={copy.employee.waiting} />
      </main>
    )
  }

  async function handleLike(questionId: string) {
    setLikedIds((prev) => new Set(prev).add(questionId))
    try {
      const response = await fetch(`/api/questions/${questionId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: getDeviceId() }),
      })
      if (!response.ok) throw new Error('like_failed')
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  async function handleSubmit() {
    const content = draft.trim()
    if (!content) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) throw new Error('submit_failed')
      toast.success(copy.employee.submitSuccess)
      setDraft('')
    } catch {
      toast.error(copy.employee.submitFailure)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex h-screen flex-col">
      <section className="flex-1 overflow-y-auto p-4">
        {state === 'loading' ? (
          <StateMessage kind="loading" text={copy.shared.loading} />
        ) : questions.length === 0 ? (
          <StateMessage kind="empty" text={copy.employee.empty} />
        ) : (
          <div className="flex flex-col gap-3">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                likable
                liked={likedIds.has(question.id)}
                onLike={() => handleLike(question.id)}
              />
            ))}
          </div>
        )}
      </section>
      <section className="border-t border-neutral-200 p-4">
        <textarea
          value={draft}
          maxLength={MAX_LENGTH}
          placeholder={copy.employee.submitPlaceholder}
          onChange={(event) => setDraft(event.target.value)}
          className="w-full resize-none rounded-lg border border-neutral-300 p-2"
          rows={3}
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-neutral-400">{MAX_LENGTH - draft.length}</span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !draft.trim()}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {copy.employee.submitButton}
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-400">{copy.employee.moderationNotice}</p>
      </section>
    </main>
  )
}
