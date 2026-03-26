import { useState, useEffect } from 'react'

/** Detects touch-primary devices (phones/tablets). Updates on resize. */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => check(breakpoint))

  useEffect(() => {
    const onResize = () => setIsMobile(check(breakpoint))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])

  return isMobile
}

function check(bp: number): boolean {
  // Primary check: coarse pointer (touch screen)
  const touch = window.matchMedia('(pointer: coarse)').matches
  // Fallback: narrow viewport
  const narrow = window.innerWidth <= bp
  return touch || narrow
}
