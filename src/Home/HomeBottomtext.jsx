import React from 'react'
import { Link } from 'react-router-dom'

const HomeBottomtext = () => {
  return (
    <>
      <div>
        <Link to="/projects">Projects</Link>
        <Link to="/sponsors">Sponsors</Link>
      </div>

      <div className='absolute bottom-2 right-3 w-[16vw] h-[8vw] rounded-full overflow-hidden'>
        <video
          className='w-full h-full object-cover'
          src="https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/dyc-video-logo.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
    </>
  )
}

export default HomeBottomtext