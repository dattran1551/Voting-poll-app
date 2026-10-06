import type { Question } from '@/lib/types'

// "stage" is the projected Display screen: ~30% smaller than the default 26px so more
// questions fit. The like count always matches the question text size.
const TEXT_SIZE = {
  default: 'text-lg sm:text-[26px]',
  stage: 'text-[18px]',
}

export function QuestionCard({
  question,
  likable,
  liked,
  onLike,
  variant = 'default',
}: {
  question: Question
  likable: boolean
  liked: boolean
  onLike: () => void
  variant?: keyof typeof TEXT_SIZE
}) {
  const textSize = TEXT_SIZE[variant]

  return (
    <div className="glass-panel flex items-center justify-between gap-4 rounded-lg p-4">
      <p className={`flex-1 font-question ${textSize} font-medium leading-snug text-white`}>{question.content}</p>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-body ${textSize} font-bold tabular-nums text-brand-gold`}>{question.likeCount}</span>
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
