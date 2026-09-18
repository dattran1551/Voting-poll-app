import { useEffect, useRef, useState } from 'react'
import type { Question } from './types'

const POLL_INTERVAL_MS = 4000

export function useQuestionList(): { questions: Question[]; state: 'loading' | 'ready' | 'error' } {
  const [questions, setQuestions] = useState<Question[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const response = await fetch('/api/questions')
        if (!response.ok) {
          throw new Error('request_failed')
        }
        const body = await response.json()
        if (cancelled) return
        setQuestions(body.questions)
        setState('ready')
        hasLoadedOnce.current = true
      } catch {
        if (cancelled) return
        if (!hasLoadedOnce.current) {
          setState('error')
        }
      }
    }

    poll()
    const timer = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return { questions, state }
}
