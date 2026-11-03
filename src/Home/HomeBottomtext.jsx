import React from 'react'
import { Link } from 'react-router-dom'
import LazyVideo from './LazyVideo'

const HomeBottomtext = () => {
  return (
    <>
      <div>
        <Link to="/projects">Projects</Link>
        <Link to="/sponsors">Sponsors</Link>
      </div>

      <div className='absolute bottom-2 right-3 w-[16vw] h-[8vw] rounded-full overflow-hidden'>
        <LazyVideo
          className='w-full h-full object-cover'
          src="/videos/dyc-video-logo.mp4"
        />
      </div>
    </>
  )
}

export default HomeBottomtext