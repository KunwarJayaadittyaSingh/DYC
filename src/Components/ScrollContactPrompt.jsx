import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const ScrollContactPrompt = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.85)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <Link
      to="/contact"
      className="fixed bottom-8 right-8 z-50 bg-red-600 text-white font-bold uppercase text-sm px-7 py-4 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:bg-red-500 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      Contact Us
    </Link>
  )
}

export default ScrollContactPrompt