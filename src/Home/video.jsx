import React, { useRef, useEffect } from 'react'
import HomeHerotext from './HomeHerotext'
import HomeBottomtext from './HomeBottomtext'

const Video = () => {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true
      videoRef.current.play().catch(err => console.log("Autoplay blocked:", err))
    }
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