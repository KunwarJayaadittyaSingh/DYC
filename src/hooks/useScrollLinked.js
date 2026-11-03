import { useEffect, useRef } from 'react'

// Runs `update(rect, viewportHeight)` inside requestAnimationFrame while the
// element is near the screen. No React state, so scrolling never re-renders.
export default function useScrollLinked(ref, update) {
  const fn = useRef(update)
  useEffect(() => { fn.current = update })

  useEffect(() => {
    const node = ref.current
    if (!node) return
    let ticking = false
    let active = true

    const run = () => {
      ticking = false
      fn.current(node.getBoundingClientRect(), window.innerHeight)
    }
    const schedule = () => {
      if (active && !ticking) {
        ticking = true
        requestAnimationFrame(run)
      }
    }

    const io = new IntersectionObserver(
      ([e]) => { active = e.isIntersecting; if (active) schedule() },
      { rootMargin: '100% 0px 100% 0px' }
    )
    io.observe(node)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    run()

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ref])
}