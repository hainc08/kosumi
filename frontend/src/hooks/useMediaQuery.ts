import { useEffect, useState } from 'react'

/** Theo dõi một media query, trả về true khi khớp. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** Viewport cỡ điện thoại (≤ 768px). */
export const useIsMobile = () => useMediaQuery('(max-width: 768px)')
