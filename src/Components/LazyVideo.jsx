import React, { useEffect, useRef, useState } from 'react'

// Asks Cloudinary for a smaller, cheaper encode of a video.
export const slimCloudinary = (url, width = 720) =>
  typeof url === 'string' && url.includes('/upload/q_auto,f_auto/')
    ? url.replace('/upload/q_auto,f_auto/', `/upload/q_auto:eco,f_auto,w_${width},c_limit/`)
    : url

// A muted looping video that only downloads and plays while it is near the screen.
const LazyVideo = ({ src, className, poster, eager = false, onError, ...rest }) => {
  const ref = useRef(null)
  const [near, setNear] = useState(eager)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setNear(true); node.play?.().catch(() => {}) }
      else node.pause?.()
    }, { rootMargin: '200px' })
    io.observe(node)
    return () => io.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      poster={poster}
      className={className}
      preload={eager ? 'auto' : 'metadata'}
      autoPlay
      loop
      muted
      playsInline
      onError={onError}
      {...rest}
    />
  )
}

export default LazyVideo