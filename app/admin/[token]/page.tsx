'use client'

import { use, useState } from 'react'
import { toast } from 'sonner'
import { useAdminQuestions } from '@/lib/useAdminQuestions'
import { StateMessage } from '@/components/StateMessage'
import { copy } from '@/lib/copy'

export default function AdminPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')
  const [exporting, setExporting] = useState(false)
  const { questions, state, act } = useAdminQuestions(token, tab)

  async function handleAct(id: string, status: 'approved' | 'rejected' | 'answered') {
    const success = await act(id, status)
    if (!success) {
      toast.error(copy.admin.actionFailure)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const response = await fetch(`/api/admin/${token}/export`)
      if (!response.ok) throw new Error('export_failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'audience-qa-export.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      toast.error(copy.admin.exportFailure)
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-brand-bg p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`rounded-full px-3 py-1 font-display text-sm uppercase tracking-wide ${
              tab === 'pending' ? 'bg-brand-primary text-white' : 'text-white/60'
            }`}
          >
            {copy.admin.pendingTab}
          </button>
          <button
            type="button"
            onClick={() => setTab('approved')}
            className={`rounded-full px-3 py-1 font-display text-sm uppercase tracking-wide ${
              tab === 'approved' ? 'bg-brand-primary text-white' : 'text-white/60'
            }`}
          >
            {copy.admin.approvedTab}
          </button>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="rounded-lg border border-brand-border/20 px-3 py-1 font-body text-white hover:bg-white/5 disabled:opacity-50"
        >
          {exporting ? copy.admin.exportGenerating : copy.admin.exportButton}
        </button>
      </div>

      {state === 'loading' ? (
        <StateMessage kind="loading" text={copy.shared.loading} />
      ) : state === 'error' ? (
        <StateMessage kind="error" text={copy.admin.loadFailure} />
      ) : questions.length === 0 ? (
        <StateMessage kind="empty" text={tab === 'pending' ? copy.admin.pendingEmpty : copy.admin.approvedEmpty} />
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((question) => (
            <div key={question.id} className="rounded-lg border border-brand-border/20 bg-white/5 p-4">
              <p className="font-body text-white">{question.content}</p>
              {tab === 'approved' && (
                <p className="font-body text-xs text-brand-gold">❤️ {question.likeCount}</p>
              )}
              <div className="mt-2 flex gap-2">
                {tab === 'pending' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAct(question.id, 'approved')}
                      className="rounded-full bg-brand-primary px-3 py-1 font-display text-xs uppercase tracking-wide text-white hover:bg-brand-primary-dark"
                    >
                      {copy.admin.approve}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAct(question.id, 'rejected')}
                      className="rounded-full border border-brand-border/20 px-3 py-1 font-display text-xs uppercase tracking-wide text-white/70 hover:bg-white/5"
                    >
                      {copy.admin.reject}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAct(question.id, 'answered')}
                    className="rounded-full bg-brand-primary px-3 py-1 font-display text-xs uppercase tracking-wide text-white hover:bg-brand-primary-dark"
                  >
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
