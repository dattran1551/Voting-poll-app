'use client'

import { useQuestionList } from '@/lib/useQuestionList'
import { QuestionCard } from '@/components/QuestionCard'
import { StateMessage } from '@/components/StateMessage'
import { copy } from '@/lib/copy'

const EMPLOYEE_URL = typeof window !== 'undefined' ? `${window.location.origin}/employee` : ''

export default function DisplayPage() {
  const { questions, state } = useQuestionList()

  return (
    <main className="flex h-screen bg-brand-bg">
      <aside className="flex w-1/3 flex-col items-center justify-center gap-4 border-r border-brand-border/20 p-8">
        <img
          src={`/api/qr?url=${encodeURIComponent(EMPLOYEE_URL)}`}
          alt="QR code"
          width={300}
          height={300}
          className="rounded-lg bg-white p-3"
        />
        <p className="text-center font-body text-lg text-white/70">{copy.display.qrHint}</p>
      </aside>
      <section className="flex-1 overflow-y-auto p-8">
        {state === 'loading' ? (
          <StateMessage kind="loading" text={copy.shared.loading} />
        ) : questions.length === 0 ? (
          <StateMessage kind="empty" text={copy.display.empty} />
        ) : (
          <div className="flex flex-col gap-4">
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} likable={false} liked={false} onLike={() => {}} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
