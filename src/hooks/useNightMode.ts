import { useCallback, useEffect, useState } from 'react'

const LS_KEY = 'night-mode'

export function useNightMode() {
  const [nightMode, setNightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (nightMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem(LS_KEY, String(nightMode))
    } catch {
      // ignore
    }
  }, [nightMode])

  const toggle = useCallback(() => {
    setNightMode(prev => !prev)
  }, [])

  return { nightMode, toggle }
}
