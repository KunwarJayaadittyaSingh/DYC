import { useEffect, useRef, useState } from 'react'

// Fires once when the element scrolls into view.
export default function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  const threshold = options.threshold ?? 0.2

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); o.disconnect() }
    }, { threshold })
    o.observe(node)
    return () => o.disconnect()
  }, [threshold])

  return [ref, inView]
}