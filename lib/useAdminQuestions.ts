import { useCallback, useEffect, useState } from 'react'
import type { Question, QuestionStatus } from './types'

const POLL_INTERVAL_MS = 4000

export function useAdminQuestions(token: string, tab: 'pending' | 'approved') {
  const [questions, setQuestions] = useState<Question[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/admin/${token}/questions?status=${tab}`)
        if (!response.ok) throw new Error('load_failed')
        const body = await response.json()
        setQuestions(body.questions)
        setState('ready')
      } catch {
        setState('error')
      }
    }

    load()
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [token, tab])

  const act = useCallback(
    async (id: string, status: QuestionStatus): Promise<boolean> => {
      try {
        const response = await fetch(`/api/admin/${token}/questions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!response.ok) return false
        setQuestions((prev) => prev.filter((q) => q.id !== id))
        return true
      } catch {
        return false
      }
    },
    [token]
  )

  return { questions, state, act }
}
