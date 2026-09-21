'use client'

import { useSyncExternalStore } from 'react'
import { useQuestionList } from '@/lib/useQuestionList'
import { QuestionCard } from '@/components/QuestionCard'
import { StateMessage } from '@/components/StateMessage'
import { BrandHeader } from '@/components/BrandHeader'
import { copy } from '@/lib/copy'

// The employee URL depends on window.location, which only exists in the browser.
// useSyncExternalStore lets us return '' during server prerendering (getServerSnapshot)
// and the real URL once mounted on the client (getSnapshot), without shipping a stale
// value baked into the prerendered HTML.
function subscribeNoop() {
  return () => {}
}

function getEmployeeUrlSnapshot() {
  return `${window.location.origin}/employee`
}

function getEmployeeUrlServerSnapshot() {
  return ''
}

export default function DisplayPage() {
  const { questions, state } = useQuestionList()
  const employeeUrl = useSyncExternalStore(subscribeNoop, getEmployeeUrlSnapshot, getEmployeeUrlServerSnapshot)

  return (
    <div className="flex h-screen flex-col bg-brand-bg">
      <BrandHeader />
      <main className="flex flex-1 overflow-hidden">
        <aside className="flex w-1/3 flex-col items-center justify-center gap-4 border-r border-brand-border/20 p-8">
          {employeeUrl && (
            <img
              src={`/api/qr?url=${encodeURIComponent(employeeUrl)}`}
              alt="QR code"
              width={300}
              height={300}
              className="rounded-lg bg-white p-3"
            />
          )}
          <p className="text-center font-body text-lg text-white">{copy.display.qrHint}</p>
        </aside>
        <section className="flex-1 overflow-y-auto p-8">
          {state === 'loading' ? (
            <StateMessage kind="loading" text={copy.shared.loading} bright />
          ) : questions.length === 0 ? (
            <StateMessage kind="empty" text={copy.display.empty} bright />
          ) : (
            <div className="flex flex-col gap-4">
              {questions.map((question) => (
                <QuestionCard key={question.id} question={question} likable={false} liked={false} onLike={() => {}} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
