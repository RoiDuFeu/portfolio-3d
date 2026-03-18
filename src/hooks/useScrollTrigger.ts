import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useStore } from '../store/useStore'
import { getActiveSection } from '../data/cameraPath'

gsap.registerPlugin(ScrollTrigger)

export function useScrollTrigger(containerRef: React.RefObject<HTMLDivElement | null>) {
  const triggerRef = useRef<ScrollTrigger | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    triggerRef.current = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: (self) => {
        const progress = self.progress
        useStore.getState().setScrollProgress(progress)
        useStore.getState().setActiveSection(getActiveSection(progress))
      },
    })

    return () => {
      triggerRef.current?.kill()
    }
  }, [containerRef])
}
