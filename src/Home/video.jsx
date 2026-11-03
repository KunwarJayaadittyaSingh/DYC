import React, { useRef, useEffect } from 'react'
import HomeHerotext from './HomeHerotext'
import HomeBottomtext from './HomeBottomtext'

const Video = () => {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.play().catch((err) => console.log('Autoplay blocked:', err))

    // Pause when the hero is off screen, resume when it comes back.
    // Saves CPU/GPU/battery while the user scrolls through the rest of the page.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.05 }
    )
    io.observe(video)

    return () => io.disconnect()
  }, [])

  return (
    <div className='relative h-screen w-screen'>
      <video
        ref={videoRef}
        className='absolute inset-0 h-full w-full object-cover object-[center_40%] z-0'
        autoPlay
        loop
        muted
        playsInline
        preload='auto'
        poster='/images/hero-poster.jpg'
        disablePictureInPicture
        src="/videos/IMG_6966.mp4"
      />

      <div className='absolute inset-0 z-10 flex flex-col justify-between p-8'>
        <HomeHerotext />
        <HomeBottomtext />
      </div>
    </div>
  )
}

export default Video