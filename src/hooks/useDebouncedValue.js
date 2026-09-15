import { useEffect, useState } from 'react'

/**
 * `value`, once it has stopped changing for `delay` ms. For search boxes, so a
 * list is asked once per typing pause rather than once per keystroke.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
