import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  onComplete: () => void
  durationMs?: number
  idleLabel: string
  activeLabel: string
  className?: string
}

/**
 * Press-and-hold confirmation button. The action fires only after the pointer
 * is held down for `durationMs` (default 1.5s) — a fill bar shows the progress —
 * so it can't be triggered by an accidental tap. Releasing early cancels it.
 * Used for the destructive "remove this card from training" action.
 */
export default function HoldButton({
  onComplete,
  durationMs = 1500,
  idleLabel,
  activeLabel,
  className = '',
}: Props) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  // Belt-and-braces: never leak a pending timer if the card unmounts mid-hold.
  useEffect(() => clear, [clear])

  function start() {
    if (timer.current !== null) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      setHolding(false)
      onComplete()
    }, durationMs)
  }

  function cancel() {
    clear()
    setHolding(false)
  }

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      className={`relative overflow-hidden select-none touch-none ${className}`}
      aria-label={idleLabel}
    >
      {/* progress fill — animates to full width over the hold duration */}
      <span
        className="absolute inset-y-0 left-0 bg-red-600/50 pointer-events-none"
        style={{
          width: holding ? '100%' : '0%',
          transition: holding ? `width ${durationMs}ms linear` : 'width 150ms ease-out',
        }}
      />
      <span className="relative z-10">{holding ? activeLabel : idleLabel}</span>
    </button>
  )
}
