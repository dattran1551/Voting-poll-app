'use client'

import { use, useState } from 'react'
import { toast } from 'sonner'
import { useAdminQuestions } from '@/lib/useAdminQuestions'
import { StateMessage } from '@/components/StateMessage'
import { copy } from '@/lib/copy'

export default function AdminPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')
  const { questions, state, act } = useAdminQuestions(token, tab)

  async function handleAct(id: string, status: 'approved' | 'rejected' | 'answered') {
    const success = await act(id, status)
    if (!success) {
      toast.error(copy.admin.actionFailure)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={tab === 'pending' ? 'font-bold' : ''}
          >
            {copy.admin.pendingTab}
          </button>
          <button
            type="button"
            onClick={() => setTab('approved')}
            className={tab === 'approved' ? 'font-bold' : ''}
          >
            {copy.admin.approvedTab}
          </button>
        </div>
        <a href={`/api/admin/${token}/export`}>
          <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1">
            {copy.admin.exportButton}
          </button>
        </a>
      </div>

      {state === 'loading' ? (
        <StateMessage kind="loading" text={copy.shared.loading} />
      ) : questions.length === 0 ? (
        <StateMessage kind="empty" text={tab === 'pending' ? copy.admin.pendingEmpty : copy.admin.approvedEmpty} />
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((question) => (
            <div key={question.id} className="rounded-lg border border-neutral-200 p-4">
              <p>{question.content}</p>
              {tab === 'approved' && <p className="text-xs text-neutral-400">❤️ {question.likeCount}</p>}
              <div className="mt-2 flex gap-2">
                {tab === 'pending' ? (
                  <>
                    <button type="button" onClick={() => handleAct(question.id, 'approved')}>
                      {copy.admin.approve}
                    </button>
                    <button type="button" onClick={() => handleAct(question.id, 'rejected')}>
                      {copy.admin.reject}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => handleAct(question.id, 'answered')}>
                    {copy.admin.markAnswered}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
