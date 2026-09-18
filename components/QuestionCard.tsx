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
    <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4">
      <p className="flex-1 text-base">{question.content}</p>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm tabular-nums">{question.likeCount}</span>
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
