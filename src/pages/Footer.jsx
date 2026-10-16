import React from 'react'
import { Link } from 'react-router-dom'

const ORG_NAME = 'DYC'

const Footer = () => {
  return (
    <footer className='relative z-10 w-full bg-black text-white px-8 md:px-16 py-16'>
      <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10'>

        <div>
          <h3 className='font-[font6] text-2xl mb-4 tracking-wide'>{ORG_NAME}</h3>
          <p className='text-gray-400 text-sm leading-relaxed'>
            Department of Youth Capital — Empowering students through innovation,
            creativity, and collaborative experiences under the Aegis of
            Division of Youth Affairs, Student Welfare Wing, LPU.
          </p>
        </div>

        <div>
          <h4 className='uppercase text-sm tracking-widest text-gray-500 mb-4'>About</h4>
          <ul className='space-y-2 text-gray-300 text-sm'>
            <li><Link to="/our-story" className='hover:text-white'>Our Story</Link></li>
            <li><Link to="/team" className='hover:text-white'>Team</Link></li>
            <li><Link to="/join" className='hover:text-white'>Join Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className='uppercase text-sm tracking-widest text-gray-500 mb-4'>Events</h4>
          <ul className='space-y-2 text-gray-300 text-sm'>
            <li><Link to="/magnitude" className='hover:text-white'>Magnitude</Link></li>
            <li><Link to="/youthvibe" className='hover:text-white'>Youthvibe</Link></li>
            <li><Link to="/concoction" className='hover:text-white'>Concoction</Link></li>
            <li><Link to="/fts" className='hover:text-white'>FTS</Link></li>
          </ul>
        </div>

        <div>
          <h4 className='uppercase text-sm tracking-widest text-gray-500 mb-4'>Support</h4>
          <ul className='space-y-2 text-gray-300 text-sm'>
            <li><Link to="/contact" className='hover:text-white'>Contact Us</Link></li>
            <li><Link to="/help" className='hover:text-white'>Help & FAQ</Link></li>
            <li><Link to="/feedback" className='hover:text-white'>Feedback</Link></li>
          </ul>
        </div>

      </div>

      <div className='max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mt-16 pt-8 border-t border-gray-800 text-gray-500 text-sm gap-4'>
        <p>© 2026 {ORG_NAME}. All rights reserved.</p>
        <div className='flex gap-6'>
          <Link to="/privacy" className='hover:text-white'>Privacy Policy</Link>
          <Link to="/terms" className='hover:text-white'>Terms of Service</Link>
          <Link to="/contact" className="hover:text-white">
            Support
          </Link>
        </div>
      </div>

      <div className='max-w-6xl mx-auto text-center mt-8 text-gray-500 text-sm'>
        <p>Made with ❤️ by DYC Team</p>
      </div>
    </footer>
  )
}

export default Footer