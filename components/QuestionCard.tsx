import type { Question } from '@/lib/types'

export function QuestionCard({
  question,
  likable,
  liked,
  onLike,
}: {
  question: Question
  likable: boolean
  liked: boolean
  onLike: () => void
}) {
  return (
    <div className="glass-panel flex items-center justify-between gap-4 rounded-lg p-4">
      <p className="flex-1 font-question text-[26px] font-medium leading-snug text-white">{question.content}</p>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-body text-[26px] font-bold tabular-nums text-brand-gold">{question.likeCount}</span>
        {likable && (
          <button
            type="button"
            aria-pressed={liked}
            disabled={liked}
            onClick={onLike}
            className="text-xl disabled:opacity-50"
          >
            ❤️
          </button>
        )}
      </div>
    </div>
  )
}
