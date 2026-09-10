import { useRef } from 'react'

import { cn } from '@/lib/utils'

/**
 * A segmented one-time-code input: one box per digit.
 *
 * The behaviour lives here rather than in the form so that restyling the
 * boxes cannot break the keyboard handling. Pass `className` for the row and
 * `boxClassName` for each box -- the look is yours, the behaviour is not.
 *
 *   length        Number of boxes. Six, for this API. See the note below.
 *   value         The code so far, as a plain string. May be shorter than
 *                 `length`; boxes past its end render empty.
 *   onChange      Called with the whole string, never with one digit.
 *   hasError      Styling hook, and sets aria-invalid.
 *   disabled / autoFocus
 *
 * WHY SIX, AND WHY DIGITS
 * The backend generates the code as
 * `crypto.randomInt(100000, 1000000).toString()` -- an integer from 100000 to
 * 999999, so always exactly six digits and never a leading zero. It is then
 * compared with `!==`, a strict string match with no trimming and no
 * normalisation, so what is assembled here has to be those six characters and
 * nothing else. Read from the backend source, not assumed: BACKEND.md
 * documents the code's lifetime and attempt limit but not its shape.
 *
 * Six separate inputs mean OS-level one-time-code autofill can only ever fill
 * the first box. That is acceptable here because this code arrives by EMAIL,
 * not SMS, so the realistic flow is copy-and-paste -- which is handled below,
 * from any box, ignoring the spaces and dashes a mail client may add.
 */
export function OtpInput({
  length = 6,
  value = '',
  onChange,
  hasError = false,
  disabled = false,
  autoFocus = false,
  className,
  boxClassName,
}) {
  const inputsRef = useRef([])

  const digits = String(value ?? '').slice(0, length).split('')

  const focusBox = (index) => {
    const box = inputsRef.current[Math.max(0, Math.min(index, length - 1))]
    box?.focus()
    box?.select()
  }

  /** Rebuild the whole string with one position replaced. */
  const setDigitAt = (index, digit) => {
    const next = Array.from({ length }, (_, i) => digits[i] ?? '')
    next[index] = digit
    // Trailing empties are trimmed so a partial code is a short string rather
    // than one padded with spaces -- zod checks the length, and " 12345" is
    // not six digits.
    onChange(next.join('').replace(/\s+$/, ''))
  }

  const handleChange = (index) => (event) => {
    const typed = event.target.value.replace(/\D/g, '')
    if (!typed) {
      setDigitAt(index, '')
      return
    }

    // A box holds one digit, but a fast typist or an autofill can deliver
    // several at once. Spread them forward from here rather than dropping them.
    const next = Array.from({ length }, (_, i) => digits[i] ?? '')
    for (let offset = 0; offset < typed.length && index + offset < length; offset += 1) {
      next[index + offset] = typed[offset]
    }
    onChange(next.join('').replace(/\s+$/, ''))
    focusBox(index + typed.length)
  }

  const handleKeyDown = (index) => (event) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        // Clear this box and stay -- the usual expectation.
        setDigitAt(index, '')
        return
      }
      // Already empty: step back and clear that one, in one keypress.
      event.preventDefault()
      if (index > 0) {
        setDigitAt(index - 1, '')
        focusBox(index - 1)
      }
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusBox(index - 1)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusBox(index + 1)
    }
  }

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '')
    if (!pasted) return

    // Pasting always fills from the first box: a code copied out of an email
    // is the whole code, wherever the caret happened to be.
    event.preventDefault()
    const next = pasted.slice(0, length)
    onChange(next)
    focusBox(next.length)
  }

  return (
    <div className={cn('flex items-center gap-2', className)} onPaste={handlePaste}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node
          }}
          value={digits[index] ?? ''}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onFocus={(event) => event.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          // inputMode brings up the numeric keypad on mobile; type stays
          // "text" so maxLength is honoured and no spinner appears.
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={hasError || undefined}
          className={cn(
            'text-center focus:outline-none focus:ring-0 disabled:opacity-50',
            boxClassName,
          )}
        />
      ))}
    </div>
  )
}
